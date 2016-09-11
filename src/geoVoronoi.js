//
// (c) 2016 Philippe Riviere
//
// https://github.com/Fil/
//
// This software is distributed under the terms of the MIT License

import {ascending,extent} from "d3-array";
import {map} from "d3-collection";
import {geoArea,geoLength} from "d3-geo";
import {voronoi} from "d3-voronoi";
import {FindDelaunayTriangulation} from "../lpetrich/delaunayTriangles";

export default function() {
    var radians = Math.PI / 180;

    var cartesian = function (spherical) {
        var lambda = spherical[0] * radians,
            phi = spherical[1] * radians,
            cosphi = Math.cos(phi);
        return [
    cosphi * Math.cos(lambda),
    cosphi * Math.sin(lambda),
    Math.sin(phi)
  ];
    }

    var spherical = function (cartesian) {
        var r = Math.sqrt(cartesian[0] * cartesian[0] + cartesian[1] * cartesian[1]),
            lat = Math.atan2(cartesian[2], r),
            lng = Math.atan2(cartesian[1], cartesian[0]);
        return [lng / radians, lat / radians];
    }

    var mapline = function (Positions, Verts) {
        return Verts
            .map(function (v) {
                return spherical(Positions[v]);
            });
    }


    var diagram = voronoi()([]);

    var DT = diagram.DT = null,
        sites = diagram.sites = [],
        pos = diagram.pos = [],
        x = function (d) {
            return d[0];
        },
        y = function (d) {
            return d[1];
        };


    var voro = function (data) {
        diagram._hull = diagram._polygons = diagram._links = diagram._triangles = null;
        sites = data.map(function(site, i) {
            site.index = i;
            return site;
        });
        pos = data.map(function (site) {
            return [x(site), y(site)];
        });
        DT = FindDelaunayTriangulation(pos.map(cartesian));
        return diagram;
    }

    diagram.links = voro.links = function (s) {
        if (s) voro(s);
        if (diagram._links) return diagram._links;

        var _index = map();

        var features = DT.edges.map(function (i, n) {

            _index.set(extent(i.verts), n);

            var properties = {
                source: sites[i.verts[0]],
                target: sites[i.verts[1]],
                urquhart: true, // will be changed to false later
                length: geoLength({
                    type: 'LineString',
                    coordinates: [ pos[i.verts[0]], pos[i.verts[1]] ]
                })
            }

            // add left and right sites (?)
            
            // make GeoJSON
            return {
                type: 'LineString',
                coordinates: [ spherical(DT.positions[i.verts[0]]), spherical(DT.positions[i.verts[1]]) ],
                properties: properties
            };
        });
        
        // Urquhart Graph? tag longer link from each triangle
        DT.triangles.forEach(function (t) {
            var l = 0,
                length = 0,
                remove, v;
            for (var j = 0; j < 3; j++) {
                v = extent([t.verts[j], t.verts[(j + 1) % 3]]);
                var n = _index.get(v);
                length = features[n].properties.length;
                if (length > l) {
                    l = length;
                    remove = n;
                }
            }
            features[remove].properties.urquhart = false;
        });

        return diagram._links = {
            type: "FeatureCollection",
            features: features
        };
    };

    diagram.triangles = voro.triangles = function (s) {
        if (s) voro(s);
        if (diagram._triangles) return diagram._triangles;

        var features = DT.triangles
            .map(function (t) {
                t.spherical = t.verts.map(function (v) {
                        return DT.positions[v];
                    })
                    .map(spherical);

                // correct winding order
                if (t.ccdsq < 0) {
                    t.spherical = t.spherical.reverse();
                    t.ccdsq *= -1;
                }

                return t;
            })

            // make geojson
            .map(function (t) {
                return {
                    type: "Polygon",
                    coordinates: [t.spherical .concat( [ t.spherical[0] ] ) ],
                    properties: {
                        sites: t.verts.map(function(i) {
                            return sites[i];
                        }),
                        area: t.vol, // steradians
                        circumcenter: spherical(t.ccdir),
                        circumradius: Math.sqrt(t.ccdsq)
                    }
                }
            });

        return diagram._triangles = {
            type: "FeatureCollection",
            features: features
        };

    };

    diagram.polygons = voro.polygons = function (s) {
        if (s) voro(s);
        if (diagram._polygons) return diagram._polygons;

        var features = DT.indices.map(function (i,n) {
            var geojson = {};
            var vor_poly = DT.vor_polygons[DT.indices[i]];

            if (vor_poly == undefined) {
                geojson.type = "Sphere";
            } else {
                var line = mapline(DT.vor_positions,
                    vor_poly.boundary.concat([ vor_poly.boundary[0] ])
                );

                // correct winding order
                var b = {
                    type: "Polygon",
                    coordinates: [[ sites[i], line[0], line[1], sites[i] ]]
                };
                if (geoArea(b) > 2 * Math.PI + 1e-10) {
                    line = line.reverse();
                }

                geojson.type = "Polygon";
                geojson.coordinates = [ line ];
            }

            geojson.properties = {
                site: sites[i],
                sitecoordinates: pos[i],
                neighbours: vor_poly.edges.map(function(e) {
                    return e.verts.filter(function(j) {
                        return j!==i;
                    })[0];
                })
            }
            return geojson;
        });
        
        return diagram._polygons = {
            type: "FeatureCollection",
            features: features
        };
    };

    diagram.hull = voro.hull = function (s) {
        if (s) voro(s);
        if (diagram._hull) return diagram._hull;

        if (!DT.hull.length) {
            return null; // What is a null GeoJSON?
        }

        // seems that DT.hull is always clockwise
        var hull = DT.hull.reverse();

        // make GeoJSON
        return diagram._hull = {
            type: "Polygon",
            coordinates: [ hull.concat([ hull[0] ]).map(function(i) {
                return pos[i];
            }) ],
            properties: {
                sites: hull.map(function(i) {
                    return sites[i];
                })
            }
        };
    }


    diagram.find = function (x, y, radius) {
        var features = diagram.polygons().features;

        // optimization: start from most recent result
        var i, next = diagram.find.found || 0;
        var cell = features[next] || features[next = 0];

        var dist = d3.geoLength({
            type: 'LineString',
            coordinates: [ [x, y], cell.properties.sitecoordinates ]
        });
        do {
            cell = features[i = next];
            next = null;
            cell.properties.neighbours.forEach(function (e) {
                var ndist = d3.geoLength({
                    type: 'LineString',
                    coordinates: [[x, y], features[e].properties.sitecoordinates]
                });
                if (ndist < dist) {
                    dist = ndist;
                    next = e;
                    return;
                }
            });

        } while (next !== null);
        diagram.find.found = i;
        if (!radius || dist < radius * radius) return cell.properties.site;
    }

    voro.x = function (f) {
        if (!f) return x;
        x = f;
        return voro;
    }
    voro.y = function (f) {
        if (!f) return y;
        y = f;
        return voro;
    }
    voro.extent = function (f) {
        if (!f) return null;
        return voro;
    }
    voro.size = function (f) {
        if (!f) return null;
        return voro;
    }

    return voro;

}