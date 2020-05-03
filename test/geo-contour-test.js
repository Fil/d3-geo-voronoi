var fs = require('fs');
var path = require('path');
var tape = require("tape");
var geoVoronoi = require("../");
var d3 = require("d3-geo");

tape("geoContour() returns a contour generator.", function(test) {
  test.equal(typeof geoVoronoi, 'object');
  test.equal(typeof geoVoronoi.geoContour, 'function');
  test.end();
});

tape("geoContour() computes something.", function(test) {
  var sites = [[0,0,0], [10,0,1], [0,10,2], [30,90,3]];
  var u = geoVoronoi.geoContour()(sites);
  test.ok(u);
  test.end();
});

tape("geoContour() computes something 2.", function(test) {
  var sites = Array.from({ length: 500 }, (_,i) => [
    180 * Math.sin(i),
    90 * Math.cos(i * 7/11),
    i
  ]);
  var u = geoVoronoi.geoContour()(sites);
  test.ok(u);
  var areas = u.map(d => Math.round(100 * d3.geoArea(d)) / 100);
  test.deepEqual(areas, [ 0, 12.36, 11.41, 9.58, 7.57, 5.78, 4.18, 2.93, 1.8, 0.39, 0 ]);
  test.end();
});
