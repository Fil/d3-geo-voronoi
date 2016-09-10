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
  test.end();
});


var sites = [[0,0], [10,0]];

tape("geoVoronoi.polygons(sites) returns polygons.", function(test) {
  //var u = geoVoronoi.geoVoronoi().polygons(sites)[0][0], v = [ 5, 4.981069 ];
  //test.ok( (Math.abs(u[0]-v[0]) < 1e-6) && (Math.abs(u[1]-v[1]) < 1e-6) );
  test.end();
});

var sites = [[0,0], [10,0], [0,10]];

tape("geoVoronoi.links(sites) returns links.", function(test) {
  test.deepEqual(geoVoronoi.geoVoronoi().links(sites), [ { source: [ 0, 0 ], target: [ 10, 0 ] }, { source: [ 10, 0 ], target: [ 0, 10 ] }, { source: [ 0, 10 ], target: [ 0, 0 ] } ]);
  test.end();
});
tape("geoVoronoi.triangles(sites) returns geojson.", function(test) {
  //test.deepEqual(geoVoronoi.geoVoronoi().triangles(sites), [ [ [ 0, 10 ], [ 10, 0 ], [ 0, 0 ] ] ]);
  test.end();
});
tape("geoVoronoi.urquhart(sites) returns urquhart graph.", function(test) {
  test.deepEqual(geoVoronoi.geoVoronoi().urquhart(sites), [ { source: [ 0, 0 ], target: [ 10, 0 ] }, { source: [ 0, 0 ], target: [ 0, 10 ] } ]);
  test.end();
});
tape("geoVoronoi.triangles(sites) returns circumcenters.", function(test) {
    var u = geoVoronoi.geoVoronoi().triangles(sites)[0].properties.circumcenter, v = [ 5, 4.981069 ];
  test.ok( (Math.abs(u[0]-v[0]) < 1e-6) && (Math.abs(u[1]-v[1]) < 1e-6) );
  test.end();
});
