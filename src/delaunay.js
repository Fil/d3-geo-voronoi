//
// (c) 2018 Philippe Riviere
//
// https://github.com/Fil/
//
// This software is distributed under the terms of the MIT License

import { Delaunay } from "d3-delaunay";
import { geoArea, geoDistance, geoRotation, geoStereographic } from "d3-geo";
import { extent } from "d3-array";
import { cos, degrees, pi, radians, sign, sin, sqrt, tau } from "./math.js";
import {
  cartesianNormalize as normalize,
  cartesianCross as cross,
  cartesianDot as dot,
  cartesianAdd
} from "./cartesian.js";

// Converts 3D Cartesian to spherical coordinates (degrees).
function spherical(cartesian) {
  return [
    Math.atan2(cartesian[1], cartesian[0]) * degrees,
    Math.asin(Math.max(-1, Math.min(1, cartesian[2]))) * degrees
  ];
}

// Converts spherical coordinates (degrees) to 3D Cartesian.
function cartesian(coordinates) {
  var lambda = coordinates[0] * radians,
    phi = coordinates[1] * radians,
    cosphi = Math.cos(phi);
  return [cosphi * Math.cos(lambda), cosphi * Math.sin(lambda), Math.sin(phi)];
}

export function geoDelaunay(points) {
  const delaunay = geo_delaunay_from(points),
    edges = geo_edges(delaunay, points.length),
    triangles = geo_triangles(delaunay, points.length),
    neighbors = geo_neighbors(triangles, points.length),
    find = geo_find(neighbors, points),
    // Voronoi ; could take a center function as an argument
    circumcenters = geo_circumcenters(triangles, points),
    { polygons, centers } = geo_polygons(circumcenters, triangles, points),
    mesh = geo_mesh(polygons),
    hull = geo_hull(triangles,points),
    // Urquhart ; returns a function that takes a distance array as argument.
    urquhart = geo_urquhart(edges, triangles);
  return {
    delaunay,
    edges,
    triangles,
    centers,
    neighbors,
    polygons,
    mesh,
    hull,
    urquhart,
    find
  };
}

function geo_find(neighbors, points) {
  return function find(x, y, next) {
    let cell,
      dist,
      found = 0;
    if (next === undefined) next = 0;

    do {
      cell = next;
      next = null;
      dist = geoDistance([x, y], points[cell]);
      neighbors[cell].forEach(i => {
        let ndist = geoDistance([x, y], points[i]);
        if (ndist < dist) {
          dist = ndist;
          next = i;
          found = i;
          return;
        }
      });
    } while (next !== null);

    return found;
  };
}

function geo_delaunay_from(points) {
  if (points.length < 2) return {};

  const r = geoRotation(points[0]),
    projection = geoStereographic()
      .translate([0, 0])
      .scale(1)
      .rotate(r.invert([180, 0]));
  points = points.map(projection);

  const zeros = [0];
  let max2 = 1;
  for (let i = 1, n = points.length; i < n; i++) {
    let m = points[i][0] * points[i][0] + points[i][1] * points[i][1];
    if (isNaN(m)) zeros.push(i);
    if (m > max2) max2 = m;
  }
  const FAR = 1e6 * sqrt(max2);

  zeros.forEach((_, i) => (points[i] = [FAR / 2, 0]));

  // infinite horizon points
  for (let i = 0; i < 4; i++) {
    points.push([FAR * cos((i / 2) * pi), FAR * sin((i / 2) * pi)]);
  }

  const delaunay = Delaunay.from(points);
  delaunay.projection = projection;

  return delaunay;
}

function geo_edges(delaunay, npoints) {
  const geo_edges = [],
    halfedges = delaunay.halfedges,
    triangles = delaunay.triangles,
    seen = {};

  if (!halfedges) return geo_edges;

  for (let i = 0, n = halfedges.length; i < n; ++i) {
    const j = halfedges[i];
    if (j < i) continue;
    let [a, b] = extent([triangles[i], triangles[j]]);
    if (b >= npoints && a < npoints) (b = a), (a = 0);
    if (b > 0 && b < npoints && (a > 0 || (!seen[b]++ && (seen[b] = true))))
      geo_edges.push([a, b]);
  }
  return geo_edges;
}

function geo_triangles(delaunay, npoints) {
  if (!delaunay.triangles) return [];

  const triangles = delaunay.triangles.slice().map(d => (d >= npoints ? 0 : d));
  const geo_triangles = [];
  for (let i = 0, n = triangles.length / 3; i < n; i++) {
    const a = triangles[3 * i],
      b = triangles[3 * i + 1],
      c = triangles[3 * i + 2];
    if (a !== b && b !== c && c !== a) {
      geo_triangles.push([a, c, b]);
    }
  }
  return geo_triangles;
}

function geo_circumcenters(triangles, points) {
  // if (!use_centroids) {
  return triangles.map(tri => {
    const c = tri.map(i => points[i]).map(cartesian),
      V = cartesianAdd(
        cartesianAdd(cross(c[1], c[0]), cross(c[2], c[1])),
        cross(c[0], c[2])
      );
    return spherical(normalize(V));
  });
  /*} else {
    return triangles.map(tri => {
      return d3.geoCentroid({
        type: "MultiPoint",
        coordinates: tri.map(i => points[i])
      });
    });
  }*/
}

function geo_neighbors(triangles, npoints) {
  const neighbors = [];
  triangles.forEach((tri, i) => {
    for (let j = 0; j < 3; j++) {
      const a = tri[j],
        b = tri[(j + 1) % 3],
        c = tri[(j + 2) % 3];
      neighbors[a] = neighbors[a] || [];
      neighbors[a].push(b);
    }
  });

  // degenerate cases
  if (triangles.length === 0) {
    if (npoints === 2) (neighbors[0] = [1]), (neighbors[1] = [0]);
    else if (npoints === 1) neighbors[0] = [];
  }

  return neighbors;
}

function geo_polygons(circumcenters, triangles, points) {
  const polygons = [];

  const centers = circumcenters.slice();

  // supplementary centers for degenerate cases like n = 1,2,3
  const supplements = [];

  if (triangles.length === 0) {
    if (points.length < 2) return { polygons, centers };
    if (points.length === 2) {
      // two hemispheres
      const a = cartesian(points[0]),
        b = cartesian(points[1]),
        m = normalize(cartesianAdd(a, b)),
        d = normalize(cross(a, b)),
        c = cross(m, d);
      const poly = [
        m,
        cross(m, c),
        cross(cross(m, c), c),
        cross(cross(cross(m, c), c), c)
      ]
        .map(spherical)
        .map(supplement);
      return (
        polygons.push(poly),
        polygons.push(poly.slice().reverse()),
        { polygons, centers }
      );
    }
  }

  triangles.forEach((tri, t) => {
    for (let j = 0; j < 3; j++) {
      const a = tri[j],
        b = tri[(j + 1) % 3],
        c = tri[(j + 2) % 3];
      polygons[a] = polygons[a] || [];
      polygons[a].push([b, c, t, [a, b, c]]);
    }
  });

  // reorder each polygon
  const reordered = polygons.map(poly => {
    const p = [poly[0][2]]; // t
    let k = poly[0][1]; // k = c
    for (let i = 1; i < poly.length; i++) {
      // look for b = k
      for (let j = 0; j < poly.length; j++) {
        if (poly[j][0] == k) {
          k = poly[j][1];
          p.push(poly[j][2]);
          break;
        }
      }
    }

    if (p.length > 2) {
      return p;
    } else if (p.length == 2) {
      const R0 = o_midpoint(
          points[poly[0][3][0]],
          points[poly[0][3][1]],
          centers[p[0]]
        ),
        R1 = o_midpoint(
          points[poly[0][3][2]],
          points[poly[0][3][0]],
          centers[p[0]]
        );
      const i0 = supplement(R0),
        i1 = supplement(R1);
      return [p[0], i1, p[1], i0];
    } else {
      // I don't think we'll ever reach this(?)
      console && console.warn({ here: "unreachable", poly });
    }
  });

  function supplement(point) {
    let f = -1;
    centers.slice(triangles.length, Infinity).forEach((p, i) => {
      if (p[0] === point[0] && p[1] === point[1]) f = i + triangles.length;
    });
    if (f < 0) (f = centers.length), centers.push(point);
    return f;
  }

  return { polygons: reordered, centers };
}

function o_midpoint(a, b, c) {
  a = cartesian(a);
  b = cartesian(b);
  c = cartesian(c);
  const s = sign(dot(cross(b, a), c));
  return spherical(normalize(cartesianAdd(a, b)).map(d => s * d));
}

function geo_mesh(polygons) {
  const mesh = [];
  polygons.forEach(poly => {
    if (!poly) return;
    let p = poly[poly.length - 1];
    for (let q of poly) {
      if (q > p) mesh.push([p, q]);
      p = q;
    }
  });
  return mesh;
}

function geo_urquhart(edges, triangles) {
  return function(distances) {
    const _lengths = {},
      _urquhart = {};
    edges.forEach((edge, i) => {
      const u = edge.join("-");
      _lengths[u] = distances[i];
      _urquhart[u] = true;
    });

    triangles.forEach(tri => {
      let l = 0,
        remove = -1;
      for (var j = 0; j < 3; j++) {
        let u = extent([tri[j], tri[(j + 1) % 3]]).join("-");
        if (_lengths[u] > l) {
          l = _lengths[u];
          remove = u;
        }
      }
      _urquhart[remove] = false;
    });

    return edges.map(edge => _urquhart[edge.join("-")]);
  };
}


function geo_hull(triangles, points) {
  const _hull = {},
    hull = [];
  triangles.map(tri => {
    const p = {
      type: "Polygon",
      coordinates: [
        [points[tri[0]], points[tri[1]], points[tri[2]], points[tri[0]]]
      ]
    };

    if (geoArea(p) > tau) return;
    for (let i = 0; i < 3; i++) {
      let e = [tri[i], tri[(i + 1) % 3]],
        code = `${e[1]}-${e[0]}`;
      if (_hull[code]) delete _hull[code];
      else _hull[e.join("-")] = true;
    }
  });

  const _index = {};
  let start;
  Object.keys(_hull).forEach(e => {
    e = e.split("-").map(Number);
    _index[e[0]] = e[1];
    start = e[0];
  });

  if (start === undefined) return hull;

  let next = start;
  do {
    hull.push(next);
    next = _index[next];
  } while (next !== start);

  return hull;
}