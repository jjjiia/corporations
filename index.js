//TODO: fix when zipcode or country has no companies

var config = {
	zoom: .95,
	timeline: {
		timer: null,
		width: 1100,
		barWidth: 5,
		// TODO: Update this and remove this "magic" constant for the width '1100'
		xScale: d3.scale.linear().domain([1880,2014]).range([20, 950])
	}
}





var global = {
	data: null,
	nycPaths: null,
	worldPaths: null,
	worldMapWidth: 550,
	worldMapHeight: 550,
	usMapWidth:375,
	usMapHeight:375
	
}

//put currentSelection in to global
var currentSelection = {
	zipcode: null,
	jurisdiction: null
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
	},

	filter: function(view, callback) {
		var data = []

		for(var i in view) {
			var list = view[i]
			if(callback(list, i)) {
				data = data.concat(list)
			}
		}

		return data
	}
}


function renderMap(data, selector,width,height) {

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
		.attr("class", "map-item")
		.attr("cursor", "pointer");

	return map
}

function initNycMap(paths, data) {
	var map = renderMap(paths, "#svg-nyc-map", global.usMapWidth,global.usMapHeight)
	renderNycMap(data)
}

function renderNycMap(data) {
	var map = d3.select("#svg-nyc-map").selectAll(".map-item")

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
		.on("click", function(d) {
			var companiesByZipcode = table.group(data, ["zipcode"])
			var zipcode = d.properties.postalCode
			
			currentSelection.zipcode = zipcode
			currentSelection.jurisdiction = null
			
			var newData = companiesByZipcode[zipcode]
			updateSliderRange(1880, 2014);
			updateMaps();
			
			renderNycMap(global.data)
			d3.select(this).attr("fill", "black")
			var newDataStartEndYears = dateRangeForSelection(newData)
			updateSliderRange(newDataStartEndYears[0],newDataStartEndYears[1])
			renderWorldMap(newData)
			renderTimeline(newData)
		})

	return map
}

function initWorldMap(paths, data) {
	var map = renderMap(paths, "#svg-world-map", global.worldMapWidth, global.worldMapHeight)
	renderWorldMap(data)
}

function renderWorldMap(data) {
	var map = d3.select("#svg-world-map").selectAll(".map-item")

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
		.on("click", function(d) {
			
			var companiesByJurisdiction = table.group(global.data, ["jurisdiction"])
			var jurisdiction = d.properties.name.toUpperCase()
			var newData = companiesByJurisdiction[jurisdiction]
			
			currentSelection.jurisdiction = jurisdiction
			currentSelection.zipcode = null
			
			updateSliderRange(1880, 2014);
			updateMaps();

			var newDataStartEndYears = dateRangeForSelection(newData)
			updateSliderRange(newDataStartEndYears[0],newDataStartEndYears[1])

			renderWorldMap(global.data)
			d3.select(this).attr("fill", "black")
			renderNycMap(newData)
			renderTimeline(newData)
		})
	return map
}

//determine daterange for map selection
function dateRangeForSelection(selectedData){
	var selectedDataByTime = table.group(selectedData, ["birthyear"])
	
	var toSort = []
	for(var items in selectedDataByTime){
		toSort.push([items])
	}
	var output = toSort.sort(function(a, b) {return a[0] - b[0]})
	return [parseInt(output[0]), parseInt(output[output.length-1])]
}

//reset all button
d3.select("#resetAll")
.on("click", function(){
	resetAll()})

function resetAll(){
	currentSelection.jurisdiction = null;
	currentSelection.zipcode = null;
	updateSliderRange(1880, 2014);
	updateMaps();
}

// TODO: Rename these functions so they are in some sort of "timeline" namespace

function leftHandlePosition() {
	return parseFloat(d3.select("#svg-timeline").select(".handle-left").attr("x"))
}

function rightHandlePosition() {
	return parseFloat(d3.select("#svg-timeline").select(".handle-right").attr("x"))
}

function updateSliderRange(startYear, endYear) {
	var xScale = config.timeline.xScale

	var startX = xScale(startYear)
	var endX = xScale(endYear)

	var slider = d3.select("#svg-timeline .slider")
	slider.attr("width", endX - startX)
	slider.attr("x", startX)

	updateHandleLocations()
}

function updateSliderLocation() {
	var startX = leftHandlePosition()
	var endX = rightHandlePosition()

	var slider = d3.select("#svg-timeline .slider")
	slider.attr("width", endX - startX)
	slider.attr("x", startX)
}

function updateHandleLocations() {
	var leftHandle = d3.select("#svg-timeline .handle-left")
	var rightHandle = d3.select("#svg-timeline .handle-right")

	var slider = d3.select("#svg-timeline .slider")
	var startX = parseFloat(slider.attr("x")) - config.timeline.barWidth
	var endX = parseFloat(slider.attr("x")) + parseFloat(slider.attr("width"))

	leftHandle.attr("x", startX)
	rightHandle.attr("x", endX)
}

function updateMaps() {
	
	var xScale = config.timeline.xScale

	var startYear = Math.floor(xScale.invert(leftHandlePosition()))
	var endYear = Math.floor(xScale.invert(rightHandlePosition()))
	
	var slider = d3.select("#svg-timeline .slider")
	slider.property("timeline-year-start", startYear)
	slider.property("timeline-year-end", endYear)

	var data = global.data
	
	if(currentSelection.zipcode != null){
		data = table.filter(table.group(data, ["zipcode"]), function(list, zipcode) {
			return (zipcode == currentSelection.zipcode)
		})
	}
	
	if(currentSelection.jurisdiction != null){
		data = table.filter(table.group(data, ["jurisdiction"]), function(list, jurisdiction) {
			return (jurisdiction == currentSelection.jurisdiction)
		})
	}
	
	
	var filteredData = table.filter(table.group(data, ["birthyear"]), function(list, year) {
		year = parseFloat(year)
		return (year >= startYear && year <= endYear)
	})
	
	if(currentSelection.zipcode != null){
		renderWorldMap(filteredData)
		
	} else if (currentSelection.jurisdiction != null){
			renderNycMap(filteredData)
	}else{
		renderWorldMap(filteredData)
		renderNycMap(filteredData)
		
	}
	
	formatCompanyList(filteredData)
	
	d3.select("#currentSelection").html(formatDisplayText(filteredData))
	
	d3.select("#companyList").html(formatCompanyList(filteredData))
	
	d3.select("#seeCompanyList").html("... See Companies")
	
	d3.select("#svg-timeline .selected-year").classed("selected-year", false)
	renderTimeline(data)
	
	
	d3.select("#specialCountries").html(formatSpecialCountries(filteredData))
	
	d3.select("#hongkong").on("click", function(){
		specialCountriesClickHandler("HONG KONG")
	})
	d3.select("#cayman").on("click", function(){
		specialCountriesClickHandler("CAYMAN ISLANDS")
	})
	d3.select("#antilles").on("click", function(){
		specialCountriesClickHandler("NETHERLANDS ANTILLES")
	})
	d3.select("#virgin").on("click", function(){
		specialCountriesClickHandler("BRITISH VIRGIN ISLANDS")
	})
}

function specialCountriesClickHandler(jurisdiction){
	var companiesByJurisdiction = table.group(global.data, ["jurisdiction"])
	var newData = companiesByJurisdiction[jurisdiction]
	
	currentSelection.jurisdiction = jurisdiction
	currentSelection.zipcode = null
	
	updateSliderRange(1880, 2014);
	updateMaps();

	var newDataStartEndYears = dateRangeForSelection(newData)
	updateSliderRange(newDataStartEndYears[0],newDataStartEndYears[1])

	renderWorldMap(global.data)
	d3.select(this).attr("fill", "black")
	renderNycMap(newData)
	renderTimeline(newData)
	d3.select("specialCountries").html("")
}

function formatDisplayText(data){
	var numberOfCompanies = data.length
	
	var jurisdictionList = []
	var zipcodeList = []
	var yearList = []
	
	for(var entry in data){
		dataEntry = data[entry]
		var jurisdiction = dataEntry.jurisdiction
		var zipcode = dataEntry.zipcode
		var year = dataEntry.birthyear
		
		if(yearList.indexOf(year) < 0){
			yearList.push(year)
		}
		if(jurisdictionList.indexOf(jurisdiction) < 0){
			jurisdictionList.push(jurisdiction)
		}
		if(zipcodeList.indexOf(zipcode) < 0){
			zipcodeList.push(zipcode)
		}
	}
	
	
	var numberOfYears = yearList.length
	var numberOfJurisdictions = jurisdictionList.length
	var numberOfZipcodes = zipcodeList.length
	var firstYear = yearList.sort()[0]
	var lastYear = yearList.sort()[yearList.length-1]
	//console.log(firstYear, lastYear)

	
	if(numberOfYears == 1){
		var yearString = "In <span style=\"color:#ff2222\">"+ yearList[0]+ "</span>"
	}else{
		var yearString = "Between <span style=\"color:#ff2222\">"+ firstYear + "</span> and <span style=\"color:#ff2222\">" + lastYear + "</span>, "
	}
	
	if(numberOfJurisdictions == 1){
		var jurisdictionString = " from <span style=\"color:#ff2222\">" + toTitleCase(jurisdictionList[0]) + "</span>"
	}else{
		var jurisdictionString = " from <span style=\"color:#ff2222\">" + numberOfJurisdictions + "</span> jurisdictions "
	}
	
	if(numberOfZipcodes == 1){
		var zipcodeString = " in <span style=\"color:#ff2222\">" + zipcodeList[0]+"</span>"
	}else{
		var zipcodeString = " in  <span style=\"color:#ff2222\">" + numberOfZipcodes + "</span> zipcodes"
		
	}
	
	
	if(numberOfCompanies == 1){
		var companyString = " there was <span style=\"color:#ff2222\">" + numberOfCompanies + "</span> company registrations"
	}else if (numberOfCompanies == 0){
		var companyString = " there were no companies"
	}else{
		var companyString = " there were <span style=\"color:#ff2222\">" + numberOfCompanies + "</span> company registrations"
	}
	
	var outputString = yearString+companyString+zipcodeString+jurisdictionString
	
	if(data.length == 0){
		var outputString = "There are no companies in current selection."
		d3.select("#selectionDetails #companyList").html("... See companies")
	}
	
	return  outputString
	
}

function formatSpecialCountries(data){
		var jurisdiction = table.group(data, ["jurisdiction"])
		if(jurisdiction["CAYMAN ISLANDS"]){
			var cayman ="<div id=\"cayman\">"+ "Cayman Islands "+jurisdiction["CAYMAN ISLANDS"].length+"</div>"
		}else{
			var cayman = ""
		}
		if(jurisdiction["BRITISH VIRGIN ISLANDS"]){
			var virgin ="<div id=\"virgin\">"+ "British Virgin Islands "+jurisdiction["BRITISH VIRGIN ISLANDS"].length+"</div>"
		}else{
			var virgin = ""
		}
		if(jurisdiction["NETHERLANDS ANTILLES"]){
			var antilles ="<div id=\"antilles\">"+ "Netherlands Antilles "+jurisdiction["NETHERLANDS ANTILLES"].length+"</div>"
		}else{
			var antilles = ""
		}
		if(jurisdiction["HONG KONG"]){
			var hongkong ="<div id=\"hongkong\">"+ "Hong Kong "+jurisdiction["HONG KONG"].length+"</div>"
		}else{
			var hongkong = ""
		}
		
		var outputString = cayman+virgin+antilles+hongkong
		return outputString
}

function formatCompanyList(data){
	
	console.log(data)
	var outputTable = "<table><col width = \"450px\" /><col width = \"100px\" /><col width = \"60px\" /><col width = \"100px\" />"
	var firstRow = "<tr><td><span style=\"color:#ff2222\">Company Name</span></td><td><span style=\"color:#ff2222\">Year</span></td><td><span style=\"color:#ff2222\">Zipcode</span></td><td><span style=\"color:#ff2222\">Jurisdiction</td></span></tr>"
	outputTable = outputTable+firstRow
	for(var i in data){
		var currentEntry = data[i]
		var year = currentEntry.birthyear
		var company = toTitleCase(currentEntry.name)
		var zipcode = currentEntry.zipcode
		var jurisdiction = toTitleCase(currentEntry.jurisdiction)
		
		var tableRow = "<tr><td>"+company+"</td><td>"+year+"</td><td>"+zipcode+"</td><td>"+jurisdiction+"</td></tr>"
		outputTable = outputTable+tableRow
	}
	outputTable = outputTable+"</table>"
	
	return outputTable
}

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}
//original function
//function updateMaps() {
//	var xScale = config.timeline.xScale
//
//	var startYear = Math.floor(xScale.invert(leftHandlePosition()))
//	var endYear = Math.floor(xScale.invert(rightHandlePosition()))
//
//	var slider = d3.select("#svg-timeline .slider")
//	slider.property("timeline-year-start", startYear)
//	slider.property("timeline-year-end", endYear)
//
//	var data = table.filter(table.group(global.data, ["birthyear"]), function(list, year) {
//		year = parseFloat(year)
//		return (year >= startYear && year <= endYear)
//	})
//	
//	renderNycMap(data)
//	renderWorldMap(data)
//	renderTimeline(global.data)
//}

function initTimeline(data) {
	
	var height = 100
	var width = 950
	var marginH = 20
	var marginW = 4
	
	var timeline = d3.select("#svg-timeline").append("svg");

	// Render the Axes for the timeline

	var xScale = config.timeline.xScale
	var yScale = d3.scale.log().domain([1, width+20]).range([height-marginH,marginW]);

	var xAxis = d3.svg.axis().scale(xScale).tickSize(1).ticks(16).tickFormat(d3.format("d"))
	var yAxis = d3.svg.axis().scale(yScale).tickSize(1).orient("right").tickFormat(d3.format("d")).tickValues([1, 10, 100,1000]);

	timeline.append("g")
		.attr("transform", "translate(0," + (height-marginH) + ")")
		.call(xAxis);

	timeline.append("g")
		.attr("transform", "translate(" + (width) + ",0)")
		.call(yAxis);



	// Add the sliders

	var barwidth = config.timeline.barWidth

	var slider = timeline.append("rect")
		.attr("class", "slider")
		.attr("x", 20)
		.attr("y", 0)
		.attr("width", width-20)
		.attr("height", height-marginH)
		.attr("fill", "#E1883B")
		.attr("opacity", 0.15)
		.call(d3.behavior.drag()
			.on("dragstart", function() {
				d3.event.sourceEvent.stopPropagation();
				d3.select(this).property("drag-offset-x", d3.event.sourceEvent.x - this.getBoundingClientRect().left)
			})
			.on("drag", function(d, e) {
				timelineControlStop()

				var x = d3.event.x - d3.select(this).property("drag-offset-x")
				var w = parseFloat(d3.select(this).attr("width"))

				if(x <= 20) {
					x = 20
				}

				if((x + w) >= width) {
					x = width - w
				}

				d3.select(this).attr("x", x)
				updateHandleLocations()
				updateMaps()
			})
		)

	var leftHandle = timeline.append("rect")
		.attr("class", "handle-left")
		.attr("x", 20)
		.attr("y", 0)
		.attr("width", barwidth)
		.attr("height", height-marginH)
		.attr("fill", "#E1883B")
		.attr("opacity", 0.3)
		.call(d3.behavior.drag()
			.on("dragstart", function() {
				d3.event.sourceEvent.stopPropagation();
			})
			.on("drag", function() {
				timelineControlStop()

				var x = d3.event.x - (d3.select(this).attr("width") / 2)
				
				if(x <= 20) {
					x = 20
				}

				if(x >= rightHandlePosition()) {
					x = rightHandlePosition()
				}
				

				d3.select(this).attr("x", x)
				updateSliderLocation()
				updateMaps()
			})
		)

	var rightHandle = timeline.append("rect")
		.attr("class", "handle-right")
		.attr("x", width)
		.attr("y", 0)
		.attr("width", barwidth)
		.attr("height", height-marginH)
		.attr("fill", "#E1883B")
		.attr("opacity", 0.3)
		.call(d3.behavior.drag()
			.on("dragstart", function() {
				d3.event.sourceEvent.stopPropagation();
			})
			.on("drag", function() {
				timelineControlStop()

				var x = d3.event.x - (d3.select(this).attr("width") / 2)

				if(x <= leftHandlePosition()) {
					x = leftHandlePosition()
				}

				if(x >= width) {
					x = width
				}

				d3.select(this).attr("x", x)
				updateSliderLocation()
				updateMaps()
			})
		)


	// Add all of the histogram vertical bars
	timeline.selectAll("rect")
		.data(utils.range(1880, 2014))
		.enter()
		.append("rect")
		.attr("class", "timeline-item")
	    .attr("x", function(d) {
			return xScale(d)
		})

	renderTimeline(data)
}

function renderTimeline(data) {
	// TODO: Move this into CSS just like above.
	var height = 100
	var width = 950

	var yScaleFlipped = d3.scale.log().domain([1,1000]).range([4, height-20]);

	// Render the actual bars
	var companiesByYear = table.group(data, ["birthyear"])

	var timeline = d3.select("#svg-timeline").selectAll(".timeline-item")

	timeline
	    .attr("y", function(d) {
			var a = companiesByYear[d]
			if(!a) {
				return 0
			} else {
				return height - 20 - yScaleFlipped(a.length)
			}
		})
		.attr("width", 5)
		.attr("fill", function(d) {
			var startYear = d3.select("#svg-timeline .slider").property("timeline-year-start")
			var endYear = d3.select("#svg-timeline .slider").property("timeline-year-end")

			if(d <= startYear || d >= endYear) {
				return "#AAA"
			} else {
				return "#ECAB23"
			}
		})
		.attr("height", function(d) {
			var a = companiesByYear[d]
			if(!a) {
				return 0;
			} else {
				return yScaleFlipped(a.length)
			}
		})
		.on("click", function(d) {
			d3.select("#svg-timeline .selected-year").classed("selected-year", false)
			d3.select(this).classed("selected-year", true)
			
			updateSliderRange(d,d+1);
			updateMaps();
			
			var companiesByYear = table.group(global.data, ["birthyear"])
			var newData = companiesByYear[d]
			renderNycMap(newData)
			renderWorldMap(newData)
		})
}

function timelineControlStop() {
	$("#timeline-controls .play").show()
	$("#timeline-controls .stop").hide()

	clearInterval(config.timeline.timer)
}

function dataDidLoad(error, nycPaths, worldPaths, data) {
	global.nycPaths = nycPaths
	global.worldPaths = worldPaths
	global.data = data
	
	var nycMap = initNycMap(nycPaths, data)
	var worldMap = initWorldMap(worldPaths, data)
	var timeline = initTimeline(data)

	$("#timeline-controls .play").click(function() {
		$("#timeline-controls .play").hide()
		$("#timeline-controls .stop").show()

		var direction = 1
		var sliderRange = 20
		var year = Math.floor(config.timeline.xScale.invert(leftHandlePosition()))
		config.timeline.timer = setInterval(function() {
			updateSliderRange(year, year + sliderRange)
			updateMaps()

			if(year + sliderRange == 2014 && direction == 1) {
				direction = -1
			}
				
			if(year == 1880 && direction == -1) {
				direction = 1
			}

			year = year + direction

		}, 100)
	})

	$("#timeline-controls .stop").click(timelineControlStop)
}

$(function() {
	// Window has loaded

	queue()
		.defer(d3.json, 'data/processed/nyc-zip-codes.geojson')
		.defer(d3.json, 'data/processed/world.geojson')
		.defer(d3.csv, csv)
		.await(dataDidLoad);
})


//var win = window,
//    doc = document,
//    e = doc.documentElement,
//    g = doc.getElementsByTagName('body')[0],
//    x = win.innerWidth || e.clientWidth || g.clientWidth,
//    y = win.innerHeight|| e.clientHeight|| g.clientHeight;
//	
//function updateWindow(){
//    x = win.innerWidth || e.clientWidth || g.clientWidth;
//    y = win.innerHeight|| e.clientHeight|| g.clientHeight;
//	usMapWidth = x/2
//    d3.select("#svg-world-map svg").attr("width", x).attr("height", y);
//	updateMaps()
//}
//window.onresize = updateWindow;

//ESSAY BOX DO NOT CHANGE
var essayBoxShown = false;
 $('#showMore').click(function(e){
     e.preventDefault();
     essayBoxShown = !essayBoxShown;
     if (essayBoxShown) {
         $('#essayBox').css('display', 'block');
         $('#essayBox').animate({'opacity':1.0}, 500);
         $(this).text(' ... view map ');
     } else {
         closeEssayBox();
         $(this).text(' ... more ');
     }
   })
   $('#essayBox-close').click(function(){
//	   console.log("close")
     closeEssayBox();
     $('#showMore').text(' ... more ');
   });


  function closeEssayBox(){
   $('#essayBox').animate({'opacity':0.0}, 500, function () {
     $('#essayBox').css('display', 'none');
   })
   essayBoxShown = false;
 }

 //ESSAY box 2
 var essayBoxShown2 = false;
  $('#seeCompanyList').click(function(e){
      e.preventDefault();
      essayBoxShown2 = !essayBoxShown2;
      if (essayBoxShown2) {
          $('#essayBox2').css('display', 'block');
          $('#essayBox2').animate({'opacity':1.0}, 500);
          $(this).text('... Hide Companies ');
      } else {
          closeEssayBox2();
          $(this).text('... See Companies ');
      }
    })
    $('#essayBox-close2').click(function(){
 //	   console.log("close")
      closeEssayBox2();
      $('#seeCompanyList').text('... See Companies ');
    });


   function closeEssayBox2(){
    $('#essayBox2').animate({'opacity':0.0}, 500, function () {
      $('#essayBox2').css('display', 'none');
    })
    essayBoxShown2 = false;
  }	