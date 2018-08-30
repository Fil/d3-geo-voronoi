//
// (c) 2018 Philippe Riviere
//
// https://github.com/Fil/
//
// This software is distributed under the terms of the MIT License

import { extent } from "d3-array";
import { geoArea, geoCentroid, geoDistance } from "d3-geo";
import { geoDelaunay } from "./delaunay.js";
import { tau } from "./math.js";

export function geoVoronoi(data) {
  const v = function(data) {
    v.delaunay = null;
    v._data = data;

    if (typeof v._data === "object" && v._data.type === "FeaturesCollection") {
      v._data = v._data.features;
    }
    if (typeof v._data === "object") {
      v.points = v._data.map(i => [v._vx(i), v._vy(i)]);
      v.delaunay = geoDelaunay(v.points);
    }
    return v;
  };

  v._vx = function(d) {
    if (typeof d == "object" && "type" in d) {
      return geoCentroid(d)[0];
    }
    if (0 in d) return d[0];
  };
  v._vy = function(d) {
    if (typeof d == "object" && "type" in d) {
      return geoCentroid(d)[1];
    }
    if (1 in d) return d[1];
  };

  v.x = function(f) {
    if (!f) return v._vx;
    v._vx = f;
    return v;
  };
  v.y = function(f) {
    if (!f) return v._vy;
    v._vy = f;
    return v;
  };

  v.polygons = function(data) {
    if (data !== undefined) {
      v(data);
    }
    if (!v.delaunay) return false;
    if (v._data.length === 0) return null;
    if (v._data.length === 1) return { type: "Sphere" };
    return {
      type: "FeaturesCollection",
      features: v.delaunay.polygons.map((poly, i) => ({
        type: "Feature",
        geometry: !poly
          ? null
          : {
              type: "Polygon",
              coordinates: [[...poly, poly[0]].map(i => v.delaunay.centers[i])]
            },
        properties: {
          site: v._data[i],
          sitecoordinates: v.points[i],
          neighbours: v.delaunay.neighbors[i] // not part of the public API
        }
      }))
    };
  };

  v.triangles = function(data) {
    if (data !== undefined) {
      v(data);
    }
    if (!v.delaunay) return false;

    return {
      type: "FeaturesCollection",
      features: v.delaunay.triangles
        .map((tri, i) => ({
          type: "Feature",
          properties: {
            circumcenter: v.delaunay.centers[i]
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                v.points[tri[0]],
                v.points[tri[1]],
                v.points[tri[2]],
                v.points[tri[0]]
              ]
            ]
          }
        }))
        .filter(d => geoArea(d) <= tau)
    };
  };

  v.links = function(data) {
    if (data !== undefined) {
      v(data);
    }
    if (!v.delaunay) return false;
    const _distances = v.delaunay.edges.map(e =>
        geoDistance(v.points[e[0]], v.points[e[1]])
      ),
      _urquart = v.delaunay.urquhart(_distances);
    return {
      type: "FeaturesCollection",
      features: v.delaunay.edges.map((e, i) => ({
        type: "Feature",
        properties: {
          source: v._data[e[0]],
          target: v._data[e[1]],
          length: _distances[i],
          urquhart: !!_urquart[i]
        },
        geometry: {
          type: "LineString",
          coordinates: [v.points[e[0]], v.points[e[1]]]
        }
      }))
    };
  };

  v._found = undefined;
  v.find = function(x, y, radius) {
    v._found = v.delaunay.find(x, y, v._found);
    if (!radius || geoDistance([x, y], v.points[v._found]) < radius)
      return v._found;
  };

  v.hull = function(data) {
    throw "hull not implemented";
  };

  return data ? v(data) : v;
}
