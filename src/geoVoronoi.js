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
        var λ = spherical[0] * radians,
            φ = spherical[1] * radians,
            cosφ = Math.cos(φ);
        return [
    cosφ * Math.cos(λ),
    cosφ * Math.sin(λ),
    Math.sin(φ)
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
        x = function (d) {
            return d[0];
        },
        y = function (d) {
            return d[1];
        };



    var voro = function (s) {
        sites = s.map(function (site) {
            return [x(site), y(site)];
        });
        DT = FindDelaunayTriangulation(sites.map(cartesian));

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

        return DT.triangles
            .sort(function (a, b) {
                return ascending(a.ccdsq, b.ccdsq);
            })
            .map(function (i) {
                return i.verts.map(function (v) {
                        return DT.positions[v];
                    })
                    .map(spherical);
            })
            .map(function (t) {
                // check winding order
                var closed = t.slice();
                closed.push(t[0]);
                var b = {
                    type: "Polygon",
                    coordinates: [closed]
                };
                if (geoArea(b) > 2 * Math.PI + 1e-10) t = t.reverse();
                return t;
            });
    };

    diagram.polygons = voro.polygons = function (s) {
        if (s) voro(s);

        return DT.indices.map(function (i) {
                var vor_poly = DT.vor_polygons[DT.indices[i]];
                if (vor_poly == undefined) return;
                var poly = vor_poly.boundary;

                // what is this for? I don't know
                if (poly[0] < 0) {
                    poly = poly.slice(1, poly.length - 1);
                } else
                    poly.push(poly[0]);
                var line = mapline(DT.vor_positions, poly);

                // check winding order
                var b = {
                    type: "Polygon",
                    coordinates: [[ sites[i], line[0], line[1], sites[i] ]]
                };
                if (geoArea(b) > 2 * Math.PI + 1e-10) line = line.reverse();
                return line;
            })
            .filter(function (p) {
                return !!p;
            });
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

    diagram.circumcenters = voro.circumcenters = function (s) {
        if (s) voro(s);
        return DT.triangles.map(function (i) {
                return i.ccdir;
            })
            .map(spherical);

    }

    diagram.hull = voro.hull = function (s) {
        if (s) voro(s);

        return !DT.hull.length ? null : DT.hull.map(function(i) {
            return sites[i];
        })
        .reverse(); // seems that DT.hull is always counter-clockwise
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
        } while (next);

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