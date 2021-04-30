import assert from "assert";
import * as geoVoronoi from "../src/index.js";
import * as d3 from "d3-geo";

it("geoContour() returns a contour generator.", () => {
  assert.strictEqual(typeof geoVoronoi, 'object');
  assert.strictEqual(typeof geoVoronoi.geoContour, 'function');
});

it("geoContour() computes something.", () => {
  const sites = [[0,0,0], [10,0,1], [0,10,2], [30,90,3]];
  const u = geoVoronoi.geoContour()(sites);
  assert(u);
});

it("geoContour() computes something 2.", () => {
  const sites = Array.from({ length: 500 }, (_,i) => [
    180 * Math.sin(i),
    90 * Math.cos(i * 7/11),
    i
  ]);
  const u = geoVoronoi.geoContour()(sites);
  assert(u);
  const areas = u.map(d => Math.round(100 * d3.geoArea(d)) / 100);
  assert.deepStrictEqual(areas, [ 0, 12.36, 11.41, 9.58, 7.57, 5.78, 4.18, 2.93, 1.8, 0.39, 0 ]);
});
