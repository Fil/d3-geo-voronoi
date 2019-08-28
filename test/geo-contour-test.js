var fs = require('fs');
var path = require('path');
var tape = require("tape");
var geoVoronoi = require("../");

tape("geoContour() returns a contour generator.", function(test) {
  test.equal(typeof geoVoronoi, 'object');
  test.equal(typeof geoVoronoi.geoContour, 'function');
  test.end();
});


var sites = [[0,0,0], [10,0,1], [0,10,2], [30,90,3]];

tape("geoContour() computes something.", function(test) {
  var u = geoVoronoi.geoContour()(sites);
  console.warn(u);
  test.ok(u);
  test.end();
});

sites = Array.from({ length: 500 }, () => [
  360 * Math.random() - 180,
  90 * (Math.random() - Math.random()),
  Math.random()
]);

tape("geoContour() computes something 2.", function(test) {
  var u = geoVoronoi.geoContour()(sites);
  console.warn(u);
  test.ok(u);
  test.end();
});
