import assert from "assert";
import { promises as fs } from "fs";
import * as path from "path";
import * as geoVoronoi from "../src/index.js";

const sites = [
  [0, 0],
  [10, 0],
  [0, 10],
];

it("geoVoronoi() returns a Diagram.", () => {
  assert.strictEqual(typeof geoVoronoi, "object");
  assert.strictEqual(typeof geoVoronoi.geoVoronoi, "function");
  assert.strictEqual(typeof geoVoronoi.geoVoronoi(), "function");
  assert.strictEqual(typeof geoVoronoi.geoVoronoi([]), "function");
  assert.strictEqual(typeof geoVoronoi.geoVoronoi().links, "function");
  assert.strictEqual(typeof geoVoronoi.geoVoronoi().links([]), "object");
  assert.strictEqual(typeof geoVoronoi.geoVoronoi().polygons, "function");
  assert.strictEqual(typeof geoVoronoi.geoVoronoi().polygons([]), "object");
  assert.strictEqual(typeof geoVoronoi.geoVoronoi().triangles, "function");
  assert.strictEqual(typeof geoVoronoi.geoVoronoi().triangles([]), "object");
});

it("geoVoronoi.polygons(sites) hemisphere test", () => {
  const two_sites = [
    [-20, -20],
    [20, 20],
  ];
  const polygons = geoVoronoi.geoVoronoi(two_sites).polygons();
  assert.deepStrictEqual(polygons.features[0].geometry, {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [90, -43.21917889371418],
        [180, -0],
        [-90, 43.21917889371418],
        [0, 0],
      ],
    ],
  });

  assert.deepStrictEqual(polygons.features[1].geometry, {
    type: "Polygon",
    coordinates: [
      [
        [-90, 43.21917889371418],
        [180, -0],
        [90, -43.21917889371418],
        [0, 0],
        [-90, 43.21917889371418],
      ],
    ],
  });
});

it("geoVoronoi.polygons(sites) returns polygons.", () => {
  const u = geoVoronoi.geoVoronoi(sites).polygons().features[0].geometry
      .coordinates[0][0],
    v = [-175, -4.981069];
  assert(Math.abs(u[0] - v[0]) < 1e-6 && Math.abs(u[1] - v[1]) < 1e-6);
});

it("geoVoronoi.polygons(sites) tolerates NaN.", () => {
  //const u = geoVoronoi.geoVoronoi().polygons(sites)[0][0], v = [ 5, 4.981069 ];
  //assert( (Math.abs(u[0]-v[0]) < 1e-6) && (Math.abs(u[1]-v[1]) < 1e-6) );
  const sites = [
    [0, 0],
    [2, 1],
    [NaN, -1],
    [4, NaN],
    [5, 10],
  ];
  const u = geoVoronoi.geoVoronoi(sites).polygons();
  assert(u);
});

it("geoVoronoi.polygons([no valid site]) returns an empty collection.", () => {
  const sites = [
    [NaN, -1],
    [4, NaN],
    [Infinity, 10],
  ];
  const u = geoVoronoi.geoVoronoi(sites).polygons();
  assert.deepStrictEqual(u.features, []);
});

it("geoVoronoi.polygons([1 site]) returns a Sphere.", () => {
  const sites = [
    [NaN, -1],
    [4, NaN],
    [5, 10],
  ];
  const u = geoVoronoi.geoVoronoi(sites).polygons();
  assert.strictEqual(u.features[0].type, "Feature");
  assert.strictEqual(u.features[0].geometry.type, "Sphere");
});

it("geoVoronoi.links() returns urquhart.", () => {
  assert.deepStrictEqual(
    geoVoronoi
      .geoVoronoi()
      .links(sites)
      .features.map(function (d) {
        return d.properties.urquhart;
      }),
    [false, true, true]
  );
});

it("geoVoronoi.x() changes accessor.", () => {
  const sites = [
    { lon: 10, lat: 0 },
    { lon: 3, lat: 5 },
    { lon: -2, lat: 5 },
  ];
  assert.deepStrictEqual(
    geoVoronoi
      .geoVoronoi()
      .x((d) => +d.lon)
      .y((d) => +d.lat)(sites).points,
    [
      [10, 0],
      [3, 5],
      [-2, 5],
    ]
  );
});

it("geoVoronoi.hull() computes the hull.", () => {
  const sites = [
    [10, 0],
    [10, 10],
    [3, 5],
    [-2, 5],
    [0, 0],
  ];
  assert.deepStrictEqual(geoVoronoi.geoVoronoi().hull(sites), {
    type: "Polygon",
    coordinates: [
      [
        [10, 0],
        [0, 0],
        [-2, 5],
        [10, 10],
        [10, 0],
      ],
    ],
  });
});

it("geoVoronoi.mesh() computes the Delaunay mesh.", () => {
  const sites = [
    [10, 0],
    [10, 10],
    [3, 5],
    [-2, 5],
    [0, 0],
  ];
  assert.deepStrictEqual(geoVoronoi.geoVoronoi().mesh(sites), {
    type: "MultiLineString",
    coordinates: [
      [
        [3, 5],
        [-2, 5],
      ],
      [
        [3, 5],
        [0, 0],
      ],
      [
        [-2, 5],
        [0, 0],
      ],
      [
        [10, 10],
        [-2, 5],
      ],
      [
        [10, 10],
        [3, 5],
      ],
      [
        [10, 0],
        [3, 5],
      ],
      [
        [10, 0],
        [0, 0],
      ],
      [
        [10, 0],
        [10, 10],
      ],
    ],
  });
});

it("geoVoronoi.cellMesh() computes the Polygons mesh.", () => {
  const sites = [
    [10, 0],
    [10, 10],
    [3, 5],
    [-2, 5],
    [0, 0],
  ];
  const cellMesh = geoVoronoi.geoVoronoi().cellMesh(sites),
    coords = cellMesh.coordinates
      .map((d) =>
        d
          .map((e) => e.map(Math.round).join(" "))
          .sort()
          .join("/")
      )
      .sort();
  assert.deepStrictEqual(coords, [
    "-175 -5/-175 -5",
    "-175 -5/0 3",
    "-175 -5/1 15",
    "-175 -5/5 0",
    "-175 -5/8 5",
    "0 3/1 15",
    "0 3/5 0",
    "1 15/8 5",
    "5 0/8 5",
  ]);
});

it("geoVoronoi.find() finds p", () => {
  const sites = [
      [10, 0],
      [10, 10],
      [3, 5],
      [-2, 5],
      [0, 0],
    ],
    voro = geoVoronoi.geoVoronoi(sites);
  assert.strictEqual(voro.find(1, 1), 4);
  assert.strictEqual(voro.find(1, 1, 4), 4);
});

it("geoVoronoi.links(sites) returns links.", () => {
  assert.deepStrictEqual(
    geoVoronoi
      .geoVoronoi()
      .links(sites)
      .features.map(function (d) {
        return d.properties.source[0];
      }),
    [10, 0, 0]
  );
});

it("geoVoronoi.triangles(sites) returns geojson.", () => {
  const tri = geoVoronoi.geoVoronoi().triangles(sites);
  assert.strictEqual(tri.type, "FeatureCollection");
  assert.strictEqual(tri.features.length, 1);
});

it("geoVoronoi.links(sites) returns urquhart graph.", () => {
  assert.deepStrictEqual(
    geoVoronoi
      .geoVoronoi()
      .links(sites)
      .features.map(function (d) {
        return d.properties.urquhart;
      }),
    [false, true, true]
  );
});

it("geoVoronoi.triangles(sites) returns circumcenters.", () => {
  const u = geoVoronoi.geoVoronoi().triangles(sites).features[0]
      .properties.circumcenter,
    v = [5, 4.981069],
    w = [-180 + v[0], -v[1]];
  assert(
    (Math.abs(u[0] - v[0]) < 1e-6 && Math.abs(u[1] - v[1]) < 1e-6) ||
      (Math.abs(u[0] - w[0]) < 1e-6 && Math.abs(u[1] - w[1]) < 1e-6)
  );
});

it("geoVoronoi’s delaunay does not list fake points in its triangles", () => {
  const u = geoVoronoi.geoVoronoi()(sites);
  assert.strictEqual(
    Math.max(...u.delaunay.delaunay.triangles),
    sites.length - 1
  );
});

it("geoVoronoi.hull does not break on difficult polygons", async () => {
  for (const t of [
    "poly1",
    "poly2",
    "poly3",
    "poly4",
    "poly5",
    "poly6",
    "poly7",
  ]) {
    const { points, hull } = JSON.parse(
      await fs.readFile(path.resolve("test/data", `${t}.json`), "utf8")
    );
    assert.deepStrictEqual(hull, geoVoronoi.geoVoronoi(points).hull());
  }
});
