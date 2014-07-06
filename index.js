
var config = {
	zoom: 0.95
}

var utils = {
	range: function(start, end) {
		var data = []

		for (var i = start; i < end; i++) {
			data.push(i)
		}

		return data
	}
}

var table = {
	group: function(rows, fields) {
		var view = {}
		var pointer = null

		for(var i in rows) {
			var row = rows[i]

			pointer = view
			for(var j = 0; j < fields.length; j++) {
				var field = fields[j]

				if(!pointer[row[field]]) {
					if(j == fields.length - 1) {
						pointer[row[field]] = []
					} else {
						pointer[row[field]] = {}
					}
				}

				pointer = pointer[row[field]]
			}

			pointer.push(row)
		}

		return view
	},

	maxCount: function(view) {
		var largestName = null
		var largestCount = null

		for(var i in view) {
			var list = view[i]

			if(!largestName) {
				largestName = i
				largestCount = list.length
			} else {
				if(list.length > largestCount) {
					largestName = i
					largestCount = list.length
				}
			}
		}

		return {
			name: largestName,
			count: largestCount
		}
	}
}

function renderMap(data, selector) {
	// TODO: Move to CSS
	var width = 500
	var height = 500

	var projection = d3.geo.mercator().scale(1).translate([0, 0])
	var path = d3.geo.path().projection(projection);

	var b = path.bounds(data)
	var s = config.zoom / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height)
	var t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2]

	projection.scale(s).translate(t);

	var svg = d3.select(selector).append("svg")
		.attr('height', width)
		.attr('width', height);

	var map = svg.selectAll(".map")
		.data(data.features)
		.enter().append("path")
		.attr("d", path)
		.attr("cursor", "pointer");

	return map
}

function renderNycMap(paths, data) {
	var map = renderMap(paths, "#svg-nyc-map")

	var companiesByZipcode = table.group(data, ["zipcode"])
	var largest = table.maxCount(companiesByZipcode)

	var colorScale = function(d) {
		var scale = d3.scale.sqrt().domain([0, largest.count]).range(["#eee", "#ff2222"]); 
		var x = companiesByZipcode[d.properties.postalCode]
		if(!x) {
			x = []
		}
		return scale(x.length)
	}

	map
		.attr("stroke-opacity", 0)
		.attr("stroke", colorScale)
		.attr("fill-opacity", 1)
		.attr("fill", colorScale)

	return map
}

function renderWorldMap(paths, data) {
	var map = renderMap(paths, "#svg-world-map")

	var companiesByJurisdiction = table.group(data, ["jurisdiction"])
	var largest = table.maxCount(companiesByJurisdiction)

	var colorScale = function(d) {
		var scale = d3.scale.sqrt().domain([0, largest.count]).range(["#eee", "#2DA1B3"]);
		var x = companiesByJurisdiction[d.properties.name.toUpperCase()]
		if(!x) {
			x = []
		}
		return scale(x.length)
	}

	map
		.attr("stroke-opacity", 0)
		.attr("stroke", colorScale)
		.attr("fill-opacity", 1)
		.attr("fill", colorScale)

	return map
}

function renderTimeline(data) {
	// TODO: Move this into CSS just like above
	var height = 150
	var width = 1100 - 100

	var timeline = d3.select("#svg-timeline").append("svg");


	// Render the Axes for the timeline
	var xScale = d3.scale.linear().domain([1880,2014]).range([20,width]);
	var yScale = d3.scale.log().domain([1,1050]).range([height-20,4]);
	var yScaleFlipped = d3.scale.log().domain([1,1050]).range([4, height-20]);

	var xAxis = d3.svg.axis().scale(xScale).tickSize(1).ticks(16).tickFormat(d3.format("d"))
	var yAxis = d3.svg.axis().scale(yScale).tickSize(1).orient("right").tickFormat(d3.format("d")).tickValues([1, 10, 100,1000]);

	timeline.append("g")
		.attr("transform", "translate(0," + (height-20) + ")")
		.call(xAxis);

	timeline.append("g")
		.attr("transform", "translate(" + (width) + ",0)")
		.call(yAxis);


	// Render the actual bars
	var companiesByYear = table.group(data, ["birthyear"])


	timeline.selectAll("rect")
		.data(utils.range(1880, 2014))
		.enter()
		.append("rect")
	    .attr("x", function(d) {
			return xScale(d)
		})
	    .attr("y", function(d) {
			var a = companiesByYear[d]
			if(!a) {
				return 0
			} else {
				return height - 20 - yScaleFlipped(a.length)
			}
		})
		// TODO: Fix the widths...
		.attr("width", 5)
		.attr("fill", function(d) {
			// return "#ECAB23"
			return "#AAA"
		})
		.attr("height", function(d) {
			var a = companiesByYear[d]
			if(!a) {
				return 0;
			} else {
				return yScaleFlipped(a.length)
			}
		});
}

function dataDidLoad(error, nycPaths, worldPaths, data) {
	window.data = data
	var nycMap = renderNycMap(nycPaths, data)
	var worldMap = renderWorldMap(worldPaths, data)
	var timeline = renderTimeline(data)
}

$(function() {
	// Window has loaded

	queue()
		.defer(d3.json, 'data/processed/nyc-zip-codes.geojson')
		.defer(d3.json, 'data/processed/world.geojson')
		.defer(d3.csv, 'data/processed/newyorkcity.csv')
		.await(dataDidLoad);
})