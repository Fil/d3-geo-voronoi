var tape = require("tape"),
    geoVoronoi = require("../");

tape("geoVoronoi() returns a Diagram.", function(test) {
  test.equal(typeof geoVoronoi, 'object');
  test.equal(typeof geoVoronoi.geoVoronoi, 'function');
  test.equal(typeof geoVoronoi.geoVoronoi(), 'function');
  test.equal(typeof geoVoronoi.geoVoronoi([]), 'function');
  test.equal(typeof geoVoronoi.geoVoronoi().links, 'function');
  test.equal(typeof geoVoronoi.geoVoronoi().links([]), 'object');
  test.equal(typeof geoVoronoi.geoVoronoi().polygons, 'function');
  test.equal(typeof geoVoronoi.geoVoronoi().polygons([]), 'object');
  test.equal(typeof geoVoronoi.geoVoronoi().triangles, 'function');
  test.equal(typeof geoVoronoi.geoVoronoi().triangles([]), 'object');
  test.equal(typeof geoVoronoi.geoVoronoi().urquhart, 'function');
  test.equal(typeof geoVoronoi.geoVoronoi().urquhart([]), 'object');
  test.equal(typeof geoVoronoi.geoVoronoi().circumcenters, 'function');
  test.equal(typeof geoVoronoi.geoVoronoi().circumcenters([]), 'object');
  test.end();
});
