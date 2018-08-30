var fs = require('fs');
var path = require('path');
var tape = require("tape");
var geoVoronoi = require("../");

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
  test.end();
});


var sites = [[0,0], [10,0]];

tape("geoVoronoi.polygons(sites) returns polygons.", function(test) {
  //var u = geoVoronoi.geoVoronoi().polygons(sites)[0][0], v = [ 5, 4.981069 ];
  //test.ok( (Math.abs(u[0]-v[0]) < 1e-6) && (Math.abs(u[1]-v[1]) < 1e-6) );
  const sites = [[0, 0], [2, 1], [3, -1], [4, 0]];
  test.end();
});



var sites = [[0,0], [10,0], [0,10]];

tape("geoVoronoi.links() returns urquhart.", function(test) {
  test.deepEqual(geoVoronoi.geoVoronoi().links(sites).features.map(function(d) { return d.properties.urquhart; }), [ true, true, false ]);
  test.end();
});

tape("geoVoronoi.x() changes accessor.", function(test) {
  var sites = [{lon:10,lat:0}, {lon:3, lat:5}, {lon:-2, lat:5}];
  test.deepEqual(
  	geoVoronoi.geoVoronoi().x(d => +d.lon).y(d => +d.lat)
  		(sites).points,
  	[ [ 10, 0 ], [ 3, 5 ], [ -2, 5 ] ]
  );
  test.end();
});

tape("geoVoronoi.hull() compute the hull.", function(test) {
  var sites = [[10,0],[10,10],[3,5],[-2,5],[0,0]];
  test.deepEqual(
  	geoVoronoi.geoVoronoi().hull(sites),
  	{ type: 'Polygon', coordinates: [ [ [ 10, 10 ], [ 10, 0 ], [ 0, 0 ], [ -2, 5 ], [ 10, 10 ] ] ] }
  );
  test.end();
});


tape("geoVoronoi.links(sites) returns links.", function(test) {
  test.deepEqual(geoVoronoi.geoVoronoi().links(sites).features.map(function(d) { return d.properties.source[0]; }), [ 0, 0, 10 ]);
  test.end();
});
tape("geoVoronoi.triangles(sites) returns geojson.", function(test) {
  //test.deepEqual(geoVoronoi.geoVoronoi().triangles(sites), [ [ [ 0, 10 ], [ 10, 0 ], [ 0, 0 ] ] ]);
  test.end();
});
tape("geoVoronoi.links(sites) returns urquhart graph.", function(test) {
  test.deepEqual(geoVoronoi.geoVoronoi().links(sites).features.map(function(d) { return d.properties.urquhart; }), [ true, true, false ]);
  test.end();
});
tape("geoVoronoi.triangles(sites) returns circumcenters.", function(test) {
    var u = geoVoronoi.geoVoronoi().triangles(sites).features[0].properties.circumcenter, v = [ 5, 4.981069 ];
  test.ok( (Math.abs(u[0]-v[0]) < 1e-6) && (Math.abs(u[1]-v[1]) < 1e-6) );
  test.end();
});
