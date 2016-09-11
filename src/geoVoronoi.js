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



    var voro = function (s) {
        sites = s;
        pos = s.map(function (site) {
            return [x(site), y(site)];
        });
        DT = FindDelaunayTriangulation(pos.map(cartesian));

        // fill in diagram.cells and diagram.edges to match the API
        diagram.cells = DT.indices.map(function (i) {
            var cell = {
              site: sites[i],
              halfedges: DT.edges.map(
                function (j,k) {
                  if (j.verts[0] == i || j.verts[1] == i) return k;
                })
              .filter(function(e){
                return !!e;
              })
            };
            cell.site.index = i;
            return cell;
          });
          diagram.edges = DT.edges.map(function (i) {
                return {
                    left: sites[i.verts[0]],
                    right: sites[i.verts[1]]
                };
            });
        return diagram;
    };

    diagram.links = voro.links = function (s) {
        if (s) voro(s);
        return DT.edges.map(function (i) {
            return {
                source: spherical(DT.positions[i.verts[0]]),
                target: spherical(DT.positions[i.verts[1]])
            };
        });
    };

    diagram.triangles = voro.triangles = function (s) {
        if (s) voro(s);

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

        return {
            type: "FeatureCollection",
            features: features
        };

    };

    diagram.polygons = voro.polygons = function (s) {
        if (s) voro(s);

        var features = DT.indices.map(function (i) {
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
                site: diagram.sites[i]
            }
            return geojson;
        });
        
        return {
            type: "FeatureCollection",
            features: features
        };
    };


    diagram.urquhart = voro.urquhart = function (s) {
        if (s) voro(s);

        var urquhart = map();
        DT.edges.forEach(function (i) {
            var v = extent(i.verts);
            urquhart.set(v, {
                source: spherical(DT.positions[v[0]]),
                target: spherical(DT.positions[v[1]])
            });
        });
        urquhart._remove = [];
        DT.triangles
            .forEach(function (t) {
                var l = 0,
                    length = 0,
                    i, v;
                for (var j = 0; j < 3; j++) {
                    v = extent([t.verts[j], t.verts[(j + 1) % 3]]);
                    length = geoLength({
                        type: 'LineString',
                        coordinates: [urquhart.get(v).source, urquhart.get(v).target]
                    });
                    if (length > l) {
                        l = length;
                        i = v;
                    }
                }
                urquhart._remove.push(i);
            });
        urquhart._remove.forEach(function (i) {
            if (urquhart.has(i)) urquhart.remove(i);
        });

        return urquhart.values();

    };

    diagram.hull = voro.hull = function (s) {
        if (s) voro(s);

        if (!DT.hull.length) {
            return null; // What is a null GeoJSON?
        }
        
        DT.hull.map(function(i) {
            return sites[i];
        })
        .reverse(); // seems that DT.hull is always clockwise
    }

    diagram.find = function(x, y, radius){
        // optimization: start from most recent result
        var i, next = diagram.find.found || 0,
            cell = diagram.cells[next],
            dist = geoLength({
                type: 'LineString',
                coordinates: [[x,y],cell.site]
            });

        do {
            cell = diagram.cells[i=next];
            next = null;
            cell.halfedges.forEach(function(e) {
                var edge = diagram.edges[e];
                var ea = edge.left;
                if (ea === cell.site || !ea) {
                    ea = edge.right;
                }
                if (ea) {
                    var ndist = d3.geoLength({
                        type: 'LineString',
                        coordinates: [[x,y], ea]
                    });
                    if (ndist < dist) {
                        dist = ndist;
                        next = ea.index;
                        return;
                    }
                }
            });
        } while (next !== null);

        diagram.find.found = i;
        if (!radius || dist < radius * radius) return cell.site;
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