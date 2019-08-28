//
// (c) 2019 Philippe Riviere
//
// https://github.com/Fil/
//
// This software is distributed under the terms of the MIT License

import {geoDelaunay} from "./delaunay.js";
import {geoInterpolate} from "d3-geo";
import {tricontour} from "d3-tricontour";

export function geoContour() {
  let v;
  const contour = tricontour()
    .triangulate((data, x, y) => {
      v = geoDelaunay(data.map(d => [x(d), y(d)]));
      return v.delaunay;
    })
    .pointInterpolate((i, j, a) => {
      const { points, projection } = v.delaunay;
      const A = projection.invert([points[2 * i], points[2 * i + 1]]),
         B = projection.invert([points[2 * j], points[2 * j + 1]]);
      return geoInterpolate(A, B)(a);
    })
    .ringsort(rings => {
      // tricky thing: in isobands this function is called twice,
      // we want to reverse the polygons’s winding order only in tricontour()
      // not in isoband()
      if (rings.length && !rings[0].reversed) {
        rings.forEach(ring => ring.reverse());
        rings[0].reversed = true;
      }
      return [rings];
    });

  return contour;
}
