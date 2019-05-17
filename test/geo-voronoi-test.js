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
  var u = geoVoronoi.geoVoronoi(sites).polygons()
            .features[0].geometry.coordinates[0][0],
      v = [ -175, -4.981069 ];
  test.ok( (Math.abs(u[0]-v[0]) < 1e-6) && (Math.abs(u[1]-v[1]) < 1e-6) );
  test.end();
});

tape("geoVoronoi.polygons(sites) tolerates NaN.", function(test) {
  //var u = geoVoronoi.geoVoronoi().polygons(sites)[0][0], v = [ 5, 4.981069 ];
  //test.ok( (Math.abs(u[0]-v[0]) < 1e-6) && (Math.abs(u[1]-v[1]) < 1e-6) );
  const sites = [[0, 0], [2, 1], [NaN, -1], [4, NaN], [5,10]];
  var u = geoVoronoi.geoVoronoi(sites).polygons()
  test.end();
});


var sites = [[0,0], [10,0], [0,10]];

tape("geoVoronoi.links() returns urquhart.", function(test) {
  test.deepEqual(geoVoronoi.geoVoronoi().links(sites).features.map(function(d) { return d.properties.urquhart; }), [ false, true, true ]);
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

tape("geoVoronoi.hull() computes the hull.", function(test) {
  var sites = [[10,0],[10,10],[3,5],[-2,5],[0,0]];
  test.deepEqual(
  	geoVoronoi.geoVoronoi().hull(sites),
  	{ type: 'Polygon', coordinates: [ [ [ 10, 10 ], [ 10, 0 ], [ 0, 0 ], [ -2, 5 ], [ 10, 10 ] ] ] }
  );
  test.end();
});

tape("geoVoronoi.mesh() computes the Delauney mesh.", function(test) {
  var sites = [[10,0],[10,10],[3,5],[-2,5],[0,0]];
  test.deepEqual(
  	geoVoronoi.geoVoronoi().mesh(sites),
  	{ type: 'MultiLineString', coordinates: [ [ [ 3, 5 ], [ -2, 5 ] ], [ [ 3, 5 ], [ 0, 0 ] ], [ [ -2, 5 ], [ 0, 0 ] ], [ [ 10, 10 ], [ -2, 5 ] ], [ [ 10, 10 ], [ 3, 5 ] ], [ [ 10, 0 ], [ 3, 5 ] ], [ [ 10, 0 ], [ 0, 0 ] ], [ [ 10, 0 ], [ 10, 10 ] ] ] }
  );
  test.end();
});

tape("geoVoronoi.cellMesh() computes the Polygons mesh.", function(test) {
  var sites = [[10,0],[10,10],[3,5],[-2,5],[0,0]];
  var cellMesh = geoVoronoi.geoVoronoi().cellMesh(sites);
  cellMesh.coordinates = cellMesh.coordinates.map(d => d.map(e => e.map(n => n|0)));
  test.deepEqual(
  	cellMesh,
  	{ type: 'MultiLineString', coordinates: [ [ [ 5, 0 ], [ 8, 4 ] ], [ [ 8, 4 ], [ -174, -4 ] ], [ [ 0, 15 ], [ -174, -4 ] ], [ [ -174, -4 ], [ -174, -4 ] ], [ [ 0, 3 ], [ 0, 15 ] ], [ [ 0, 15 ], [ 8, 4 ] ], [ [ 0, 3 ], [ -174, -4 ] ], [ [ 0, 3 ], [ 5, 0 ] ], [ [ 5, 0 ], [ -174, -4 ] ] ] }
  );
  test.end();
});

tape("geoVoronoi.find() finds p", function(test) {
  var sites = [[10,0],[10,10],[3,5],[-2,5],[0,0]],
      voro = geoVoronoi.geoVoronoi(sites);
  test.equal(voro.find(1,1),4);
  test.equal(voro.find(1,1,4),4);
  test.end();
});

tape("geoVoronoi.links(sites) returns links.", function(test) {
  test.deepEqual(geoVoronoi.geoVoronoi().links(sites).features.map(function(d) { return d.properties.source[0]; }), [ 10, 0, 0 ]);
  test.end();
});
tape("geoVoronoi.triangles(sites) returns geojson.", function(test) {
  //test.deepEqual(geoVoronoi.geoVoronoi().triangles(sites), [ [ [ 0, 10 ], [ 10, 0 ], [ 0, 0 ] ] ]);
  test.end();
});
tape("geoVoronoi.links(sites) returns urquhart graph.", function(test) {
  test.deepEqual(geoVoronoi.geoVoronoi().links(sites).features.map(function(d) { return d.properties.urquhart; }), [ false, true, true ]);
  test.end();
});
tape("geoVoronoi.triangles(sites) returns circumcenters.", function(test) {
    var u = geoVoronoi.geoVoronoi().triangles(sites).features[0].properties.circumcenter, v = [ 5, 4.981069 ];
  test.ok( (Math.abs(u[0]-v[0]) < 1e-6) && (Math.abs(u[1]-v[1]) < 1e-6) );
  test.end();
});
