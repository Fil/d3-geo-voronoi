var fs = require('fs');
var path = require('path');
var tape = require("tape");
var geoVoronoi = require("../");

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
  var sites = Array.from({ length: 500 }, () => [
    360 * Math.random() - 180,
    90 * (Math.random() - Math.random()),
    Math.random()
  ]);
  var u = geoVoronoi.geoContour()(sites);
  test.ok(u);
  test.end();
});
