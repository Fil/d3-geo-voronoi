# d3-geo-voronoi

This module wraps d3 around Loren Petrich's [Spherical Delaunay triangulation library](http://lpetrich.org/Science/GeometryDemo/GeometryDemo_GMap.html), following as closely as possible the API of the [d3-voronoi](https://github.com/d3/d3-voronoi/) module.

Given a set of points in spherical coordinates `[lon, lat]`, it computes the Delaunay triangulation and the Voronoi diagram.

In addition, you can retrieve the [Urquhart graph](https://en.wikipedia.org/wiki/Urquhart_graph) of the set sites, and the circumcenters of all Delaunay triangles.

## Installing

If you use NPM, `npm install d3-geo-voronoi`. Otherwise, download the [latest release](https://github.com/d3/d3-geo-voronoi/releases/latest).

## API Reference

<a href="#geo-voronoi" name="geo-voronoi">#</a> d3.<b>geoVoronoi</b>()
[<>](https://github.com/d3/d3-geo-voronoi/blob/master/src/geoVoronoi.js "Source")

Creates a new *spherical* Voronoi layout.

The following methods are similar to [d3-voronoi](https://github.com/d3/d3-voronoi/)'s methods:

- <i>voronoi</i>.<b>x</b>([<i>x</i>]) 

- <i>voronoi</i>.<b>y</b>([<i>y</i>])

- <i>voronoi</i>.<b>polygons</b>(<i>[data]</i>)

- <i>voronoi</i>.<b>triangles</b>(<i>[data]</i>)

- <i>voronoi</i>.<b>links</b>(<i>[data]</i>)

- <i>voronoi</i>.<b>extent</b>(<i>[extent]</i>) and <i>voronoi</i>.<b>size</b>(<i>[size]</i>) are not implemented


The following new methods are introduced:

<a name="geo_voronoi_urquhart" href="#geo_voronoi_urquhart">#</a> <i>voronoi</i>.<b>urquhart</b>(<i>data</i>)

Returns the Urquhart graph of the specified *data* array as an array of links. Each link is a `{ source: … , target: … }` object similar to <i>voronoi</i>.<b>links</b>(). Equivalent to:

```js
voronoi(data).urquhart();
```


<a name="geo_voronoi_circumcenters" href="#geo_voronoi_circumcenters">#</a> <i>voronoi</i>.<b>circumcenters</b>(<i>data</i>)

Returns the circumcenters of the Delaunay triangles of the specified *data* array, as an array of points. Equivalent to:

```js
voronoi(data).circumcenters();
```


### Voronoi Diagrams

Note the the underlying Voronoi Diagram does _not_ contain the usual *cells* and *edges* elements. It might change in the future.

