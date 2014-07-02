var nycZoom = .95;
var worldZoom = .95;
var mapCenter = [-71.123625,42.372115];
var mapCenter2 = [300.123625,42.372115];

var svg1;
var svg2;
var svg3;

var g;
var projection = d3.geo.mercator();
var path = d3.geo.path().projection(projection); 
var nycJSON;
var worldJSON;
var marked_countries = [];
var zip_region_counts;
var region_zip_counts;
var lightBoxShown = false;
function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function bindHandlers(){
	$('#data-source').click(function(){
	    lightBoxShown = true;
	    $('#data-lightbox').animate({
	        'opacity':1.0}, 1500
	    );
	   });

	  $('#svgContainer1').click(function(){
	      closeLightBox();
	  });
	  $('#svgContainer2').click(function(){
	      closeLightBox();
	  });
	  $('#lightbox-close').click(function(){
	    closeLightBox();
	});
}
	
	function closeLightBox(){
	  if (lightBoxShown){
	      $('#data-lightbox').animate({
	        'opacity':0.0}, 'fast'
	      );

	      $('#mapSVG').animate({'opacity':1.0},'slow');
	      lightBoxShown = false;
	    };
	}
	
	$(window).load(function() {

		bindHandlers();


		queue()
			.defer(d3.json, 'nyc-zip-codes.geojson')
			.defer(d3.json, 'world.geojson')
			.defer(d3.json, 'z2r_06232014_b.json')
			.defer(d3.json, 'r2z_06232014_b.json')
			.defer(d3.json, 't2rz_06232014_b.json')
			.defer(d3.csv, 'nyc_world_06232014.csv')

		.await(initializeData);
	});


    function initializeData(error,nycjson, worldjson, zipregioncounts, regionzipcounts, timeregionzip, worldcsv){
      nycJSON = nycjson; 
      worldJSON = worldjson;
      zip_region_counts = zipregioncounts;
      region_zip_counts = regionzipcounts;
	  time_region_zip = timeregionzip;
	  world_csv = worldcsv;
      setProjection1(); 
      drawNYC();
      setProjection2();
      drawWorld();
	  drawHistogram(histogramData());
      initializeController();
	  
	  
	 // renderMultipleYears(2010, 2010)
	  
    }

	function setProjection1() {
		projection.scale(1)
			.translate([0, 0]);
		width = $("#svgContainer1").width();
		height = $("#svgContainer1").height();
		// console.log(width,height);
		var b = path.bounds(nycJSON),
			s = nycZoom / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
			t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
		projection.scale(s).translate(t);
		projection(mapCenter);
	}

	function setProjection2() {
		projection.scale(1)
			.translate([0, 0]);
		width = $("#svgContainer2").width();
		height = $("#svgContainer2").height();
		var b = path.bounds(worldJSON),
			s = worldZoom / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
			t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
		projection.scale(s).translate(t);
	}


//    function getColor(value){
//      var color = d3.scale.linear().domain([0, 1]).range(["rgb(255,255,0)", "rgb(255,0,0)"]);
//      return color(value);
//    }
function histogramData() {
	var years = []
	var timelinedata = []
	for (var year = 1880; year < 2014; year++) {
		years.push(year)
		if (time_region_zip[year]) {
			var sum = time_region_zip[year].sum
			var active = time_region_zip[year].active
			timelinedata.push([year, sum])
		}
	}
	return timelinedata
}

var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended);

function dragstarted(d) {
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed("dragging", true);
}

function dragged(d, e) {
  var handle = d3.select(this)
  var x = parseFloat(handle.attr("drag-x")) + d3.event.dx
  var snapOffset = parseFloat(handle.attr("snap-offset"))
  if(x >= handle.attr("drag-start") && x <= handle.attr("drag-end")){
	  handle.attr("drag-x", x)
	  var snappedX = Math.floor(handle.attr("drag-x")/snapOffset)*snapOffset
	  handle.attr("x", snappedX);
  }
  d3.select(this).property("dragging-callback").run.apply(this)
  
}

function dragended(d) {
  d3.select(this).classed("dragging", false);
}


function drawHistogram(histogramdata){
	var width = 1000
	var height = 120
	var barwidth = width/(2014-1880)-2
	var yearscale = d3.scale.linear().domain([1880,2014]).range([20,width]);
	var yscale = d3.scale.log().domain([1,1050]).range([0,height-20]);
	var y = d3.scale.log().domain([1,1050]).range([height-20,4]);
	var barColorScale = d3.scale.linear().domain([0, height]).range(["#aaa", "#E1883B"]); 
	var tip = d3.tip()
	  .attr('class', 'd3-tip')
	  .offset([-10, 0])
    svg3 = d3.select("#svgContainer3").append("svg");

	var slider = null
	var leftHandle = null
	var rightHandle = null

	slider = svg3.append("rect")
		.attr("x", 20)
		.attr("y", 0)
		.attr("width", width-20)
		.attr("height", height-20)
		.attr("fill", "#E1883B")
		.attr("opacity", 0.1)
		
	leftHandle = svg3.append("rect")
		.attr("x", 20)
		.attr("y", 0)
		.attr("width", barwidth)
		.attr("drag-x", 20)
		.attr("drag-start", 20)
		.attr("drag-end", width)
		.attr("snap-offset", barwidth+2)
		.attr("height", height-20)
		.attr("fill", "red")
		.property("dragging-callback", {
			run: function(){
				var leftX = d3.select(this).attr("x")
				var rightX = rightHandle.attr("x")
				slider.attr("x", leftX)
				slider.attr("width", rightX - leftX)
				rightHandle.attr("drag-start", leftX+100)
				var yearStart = Math.floor(yearscale.invert(leftX))
				var yearEnd = Math.floor(yearscale.invert(rightX))
				var data = renderMultipleYears(yearStart,yearEnd)
				renderWorldMap(data)
				renderUSMap(data)
			}
		})
		.call(drag);
		
	rightHandle =svg3.append("rect")
		.attr("x", width)
		.attr("y", 0)
		.attr("drag-x", width)
		
		.attr("drag-start", 20)
		.attr("drag-end", width)
		.attr("snap-offset", barwidth+2)
		.attr("width", barwidth)
		.attr("height", height-20)
		.attr("fill", "red")
		.property("dragging-callback", {
			run: function(){
				var rightX = d3.select(this).attr("x")
				var leftX = leftHandle.attr("x")
				slider.attr("x", leftX)
				slider.attr("width",rightX - leftX)
				leftHandle.attr("drag-end", rightX)
				var yearStart = Math.floor(yearscale.invert(leftX))
				var yearEnd = Math.floor(yearscale.invert(rightX))
				var data = renderMultipleYears(yearStart,yearEnd)
				renderWorldMap(data)
				renderUSMap(data)
			}
		})
		.call(drag);
		
	svg3.call(tip);
	
	svg3.selectAll("rect")
		.data(histogramdata)
		.enter()
		.append("rect")
		.attr("class", "histoRects")
	    .attr("x", function(d){
			//console.log(yearscale(d[0]))
			return yearscale(d[0])})
	    .attr("y", function(d){return height-20- yscale(d[1])})
	    .attr("width",barwidth)
		.attr("id", function(d){return d[0]})
		.attr("fill", function(d){
			return "#aaa"
		})
		.attr("height", function(d){return yscale(d[1])});

		
	svg3.selectAll("rect.histoRects")
		.on('mouseover', function(d){
			id = $(this).attr("id");
			tip.html(function(d){return id})
			tip.show()
			d3.select(this).attr("stroke", "#ECAB23").attr("stroke-opacity", 1).attr("stroke-width", 1)
		})
		.on('mouseout', function(d){
			tip.hide()
			d3.select(this).attr("stroke-opacity", 0)
		})
		.on("click", function(d){
			id = $(this).attr("id");
			
			var yearStart = id
			var yearEnd = parseInt(id)
			
			var data = renderMultipleYears(yearStart,yearEnd)
			if(yearStart == yearEnd){
				var year = yearStart
			}else{
				var year = yearStart + " - " + yearEnd
			}
			
			//for updating the text outputs only
			var companiesCount = data.sum
			var zipCount = data.zipcodes.length
			var regionCount = data.regions.length
			var active = Math.round(data.active*100.00/companiesCount)
			$("#currentSelection").html("In <span style='color:#ECAB23'>"+year +"</span>, there were " +companiesCount + " new companies in "+ zipCount + " zipcodes from "+ regionCount + " countries <br/>"+active+"% are active.");
			//set current
			d3.select("#svgContainer3 svg").remove();
			drawHistogram(histogramData());
			d3.selectAll("rect.histoRects").attr("fill", "#aaa")
			var header = "<table style=\"width:800px\"><tr><td>Company Name</td><td>Zipcode</td><td>Jurisdiction</td></tr>"
			var formattedCompanyText =  header+formatCompanyList(data["companies"])
			d3.selectAll("#companyList").html("<br/><br/>Companies Registered in the Year <span style='color:#ECAB23'>"+ year + "</span><br/><br/>"+ formattedCompanyText)
			d3.selectAll("#detailMore").html("Show Companies")
			var numCompaniesZip = function(d){
			if(data[d.properties.postalCode]){
				var values = data[d.properties.postalCode].values
				var count = 0;
				for(var key in values) {
					count += values[key]
				}
				return count
			} else {
				return 0;
			}
			}
			var colorScale = d3.scale.sqrt().domain([0, d3.max(nycJSON.features, numCompaniesZip)]).range(["#eee", "#ff2222"]); 
			
			// Removes all of the country highlights
			// Adds highlights back to the countries			
			renderWorldMap(data)
			

			// Unhighlight all of the zip codes
			// Update the highlights of the zip codes
			renderUSMap(data)
			
			//for coloring histogram itself
			svg3.selectAll("rect.histoRects")
			.attr("fill", function(d){ 
				if(d[0]>=yearStart && d[0]<=yearEnd){
					return "#ECAB23";
				}else{
					return "#aaa"
				}
			});
		})
		

		
	var xAxis = d3.svg.axis().scale(yearscale).tickSize(1).ticks(16).tickFormat(d3.format("d"))
	svg3.append("g")
		.attr("class", "x axis")
	    .attr("transform", "translate(0," + (height-20) + ")")
	    .call(xAxis);
		
	var yAxis = d3.svg.axis().scale(y).tickSize(4).orient("right").tickFormat(d3.format("d")).tickValues([1, 10, 100,1000]);
	
    svg3.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (width+8) + ",0)")
        .call(yAxis);	
}
function renderWorldMap(data){
	svg2.selectAll("path").attr("class","unmarked").attr("fill","#eee").transition().duration(200);
	
	data['regions'].forEach(function(d){
		jurisdiction = d.split(" ").join("_");
		if (jurisdiction == "COTE_D'IVOIRE"){
			jurisdiction="COTE DIVOIRE"
			console.log("TODO fix cote divoire!!")
		}
		
		if (jurisdiction.length !=0 && jurisdiction !=undefined){
			var max = data['maxJurisdiction']
			var currentRegionD = data['jurisdiction'][d]
			var color = getCountryColor(max, currentRegionD);
			svg2.select("#"+jurisdiction).attr("class","marked").transition().duration(200).attr("fill", color).attr("stroke",color);
			//  $("#currentSelection").html("Companies in "+ zipcode + " are from > ");
		} else{
			svg2.select("#"+jurisdiction).attr("class","marked").transition().duration(200).attr("fill", "red").attr("stroke",color);
		}
	});
}
function renderUSMap(data){
	svg1.selectAll("path").attr("fill","#eee");
	data['zipcodes'].forEach(function(d){
		zipcode = d
		var max = data['maxZip']
		var color = getZipcodeColor(1000, data['values'][zipcode]);
		svg1.select("#zip_"+d).attr("class","marked").transition().duration(200).attr("fill",color).attr("stroke", color);
	})
}
//histogram click handler for svg2-world
function renderMultipleYears(yearStart, yearEnd){
	yearStart = parseInt(yearStart)
	yearEnd = parseInt(yearEnd)
	console.log("hello", yearStart, yearEnd)
	
	// tally all years
	var data = {}
	data.zipcodes = []
	data.regions = []
	data.companies = []
	data.maxJurisdiction = 0
	data.maxZip = 0
	data.sum = 0
	data.active = 0
	data["Not For Profit"]=0
	data.values = {}
	data.jurisdiction = {}
	
	for(var year = yearStart; year <= yearEnd; year++){
		
		if(time_region_zip[year]){
			
			var currentYearDataJurisdiction = time_region_zip[year]["jurisdiction"];
			for(var jurisdiction in currentYearDataJurisdiction){
				if(currentYearDataJurisdiction[jurisdiction]> data.maxJurisdiction){
					data.maxJurisdiction = currentYearDataJurisdiction[jurisdiction]
				}

				if(data.regions.indexOf(jurisdiction)<0){
					data.regions.push(jurisdiction)
				}

				if(data.jurisdiction[jurisdiction]){
					data.jurisdiction[jurisdiction]=data.jurisdiction[jurisdiction]+currentYearDataJurisdiction[jurisdiction]
					//console.log(jurisdiction)
					//console.log(before,currentYearData[jurisdiction], data[jurisdiction])
				}else{
					data.jurisdiction[jurisdiction]= currentYearDataJurisdiction[jurisdiction]
					//console.log(data[jurisdiction])
				}
			}
		
		
			var currentYearDataZip = time_region_zip[year]["values"];
			//console.log(currentYearData)
			for(var zipcode in currentYearDataZip){
			
				if(currentYearDataZip[zipcode]> data.maxZip){
					data.maxZip = currentYearDataZip[zipcode]
				}
				
				if(data.zipcodes.indexOf(zipcode)<0){
					data.zipcodes.push(zipcode)
				}
			
				if(data.values[zipcode]){
					data.values[zipcode]=data.values[zipcode]+currentYearDataZip[zipcode]
					//console.log(jurisdiction)
					//console.log(before,currentYearData[jurisdiction], data[jurisdiction])
				}else{
					data.values[zipcode]= currentYearDataZip[zipcode]
					//console.log(data[jurisdiction])
				}
			}
		
		
			data["Not For Profit"] = data["Not For Profit"] + time_region_zip[year]["Not For Profit"]
			data.active = data.active + time_region_zip[year].active
		
			data.sum = data.sum + time_region_zip[year].sum
			for(var company in time_region_zip[year].companies){
				data.companies.push(time_region_zip[year].companies[company])
			
			}
		
		}
	}
	return data
	//render on map
	
}



    function drawNYC(){
		var numCompanies = function(d){
			//console.log(zip_region_counts[d.properties.postalCode])
			if(zip_region_counts[d.properties.postalCode]){
				var values = zip_region_counts[d.properties.postalCode].values
				var count = 0;
				for(var key in values) {
					count += values[key]
				}
				//console.log(name, count)
				return count
			} else {
				return 0;
			}
		}
		var colorScale = d3.scale.sqrt().domain([0, d3.max(nycJSON.features, numCompanies)]).range(["#eee", "#ff2222"]); 
		svg1 = d3.select("#svgContainer1").append("svg")
			.attr('height',$('#svgContainer1').height())
			.attr('width', $('#svgContainer1').width());
		var tip = d3.tip()
		  .attr('class', 'd3-tip-nyc')
		  .offset([-5, 0])
		svg1.call(tip);
		var map1 = svg1.selectAll(".map1")
			.data(nycJSON.features)
			.enter().append("path")
			.attr("d", path)
			.attr("class", "marked")
			.attr("id", function(d){ 
				id = "zip_" + d.properties.postalCode.toString();
				return id;
			})
			.attr("stroke-opacity", 0)
			.attr("stroke", function(d){
				return colorScale(numCompanies(d));
			})
			.attr("fill-opacity", 1)
			.attr("fill", function(d){
				return colorScale(numCompanies(d));
			})
			.attr("cursor", "pointer")
			.on("click", function(d){

				// Removes all of the country highlights
				svg2.selectAll("path").attr("class","unmarked").attr("fill","#eee").transition().duration(200);

				// Resets all of the zip code highlights
				d3.selectAll("#svgContainer1 path").attr("fill",function(d){
					return colorScale(numCompanies(d));
				})

				// Print Messages
				id = $(this).attr("id");
				zipcode = id.split("_")[1];
				var data = zip_region_counts[zipcode.toString()];
				var header = "<table style=\"width:800px\"><tr><td>Company Name</td><td>Jurisdiction</td><td>Year</td></tr>"
				if(zip_region_counts[zipcode.toString()]){
					
					
					// Adds highlights back to the countries
					data['regions'].forEach(function(d){
						//jurisdiction = d;
						jurisdiction = d.split(" ").join("_");
				
						if (jurisdiction.length !=0 && jurisdiction !=undefined){
							var color = getCountryColor(zip_region_counts[zipcode]['max'], zip_region_counts[zipcode]['values'][d]);
							svg2.select("#"+jurisdiction).attr("class","marked").transition().duration(200).attr("fill", color).attr("stroke",color);
							//  $("#currentSelection").html("Companies in "+ zipcode + " are from > ");
						} else{
							svg2.select("#"+jurisdiction).attr("class","marked").transition().duration(200).attr("fill", "red").attr("stroke",color);
						}
					});
					var capName = d.properties.postalCode.toUpperCase();
					var histogramdata = formatTimeData(zip_region_counts[capName].timeline);
					//console.log(histogramdata);
					d3.select("#svgContainer3 svg").remove();
					drawHistogram(histogramdata);
					d3.select(this).attr("fill", "black").attr("class","marked");
					
					var formattedCompanyText =  header+formatCompanyList(zip_region_counts[zipcode.toString()]["companies"])

					d3.selectAll("#companyList").html("<br/><br/>New Companies Registered in zipcode "+"<span style = 'color:#ff2222'>"+ zipcode + "</span><br/><br/>"+ formattedCompanyText)
					d3.selectAll("#detailMore").html("Show Companies")
					var sum = zip_region_counts[d.properties.postalCode]["sum"]
					var regionCount = zip_region_counts[d.properties.postalCode]["regions"].length
					var active = Math.round(zip_region_counts[d.properties.postalCode]["active"]*100.0/sum)
					var companies = zip_region_counts[d.properties.postalCode]["companies"]
					$("#currentSelection").html(sum+" companies "+ " from "+ regionCount+" countries are registered in "+"<span style = 'color:#ff2222'>"+d.properties.postalCode+" "+d.properties.PO_NAME+"</span> <br/>"+active+"% are currently active.<br/>");
					if(sum == 1){
						var companyName = zip_region_counts[d.properties.postalCode]["companies"]
						var companyNameString = "<span style = 'font-size:11px'><br/>"+ toTitleCase(companyName[0][0])+"<br/> Registered: "+ companyName[0][2]+"</span"
						var regionName = zip_region_counts[d.properties.postalCode]["regions"]
						$("#currentSelection").html(sum+" company "+ " from "+ toTitleCase(String(regionName))+" is registered in zipcode "+"<span style = 'color:#ff2222'>"+d.properties.postalCode+" "+d.properties.PO_NAME+"</span><br/>"+companyNameString);
						d3.selectAll("#detailMore").html("")
						
						
					}
				}
				else{
					d3.selectAll("#detailMore").html("")
					$("#currentSelection").html("There are no companies with foreign jurisdiction registered in <span style = 'color:#ff2222'>"+d.properties.postalCode+" "+d.properties.PO_NAME+"</span>");
					d3.select("#svgContainer3 svg").remove();
					drawHistogram(histogramData());
				}
					
			})			
			.on('mouseover', function(d){
				tip.html("Zipcode:" +d.properties.postalCode)
				tip.show()
				d3.select(this).attr("stroke", "#ff2222").attr("stroke-opacity", 1).attr("stroke-width", 1)
				// $("#countryName").html(d.properties.name);
			})
			.on('mouseout', function(d){
				tip.hide()
				d3.select(this).attr("stroke-opacity", 0)
				//		$("#countryName").html("");
			});
			
	}

	function drawWorld(){
		var companyName = function(d) {
			var name = d.properties.name.toUpperCase();
			name = name.split(" ").join("_");		
			return name
		}

		var numCompanies = function(d, i) { 
			name = d.properties.name.toUpperCase()
			if(region_zip_counts[name]) {
				var values = region_zip_counts[name].values

				var count = 0;
				for(var key in values) {
					count += values[key]
				}

				//console.log(name, count)

				return count		
			} else {
				return 0;
			}
		};

		var colorScaleCount = function(d) {
			var name = d.properties.name
			if(name == "DELAWARE") {
				return 0;
			} else {
				return numCompanies(d)
			}
		}

		//var colorScale = d3.scale.sqrt().domain([0, d3.max(worldJSON.features, colorScaleCount)]).range(["#fff", "#2DA1B3"]);
		var colorScale = d3.scale.sqrt().domain([0, d3.max(worldJSON.features, colorScaleCount)]).range(["#eee", "#2DA1B3"]);
		
		svg2 = d3.select("#svgContainer2").append("svg")
			.attr('height',$('#svgContainer2').height())
			.attr('width', $('#svgContainer2').width());
			
		var tip = d3.tip()
		  .attr('class', 'd3-tip-world')
		  .offset([-10, 0])	
		svg2.call(tip)
		
		svg2.selectAll("path")
			.data(worldJSON.features)
			.enter().append("path")
			.attr("d", path)
			.attr("class","unmarked")
			.attr("id", function(d){
				var id = d.properties.name;
				if (id != undefined){
					id = id.toUpperCase();
				}
				return id.split(" ").join("_");
			})
			.attr("stroke-opacity", 0)
			.attr("stroke", "#fff")
			//.attr("fill", "#F6F0EE")
	 		.attr("fill", function(d){
				return colorScale(numCompanies(d));
			})
			.on("click", function(d){

				// Re-set the color of each country
				d3.selectAll("#svgContainer2 path").attr("fill",function(d){
					return colorScale(numCompanies(d));
				})
				
				// Unhighlight all of the zip codes

				svg1.selectAll("path").attr("class","unmarked").attr("fill","#eee").transition().duration(200);

				var marked_zipcodes = svg1.selectAll(".marked");
	  
				if (marked_zipcodes.length > 0){
					marked_zipcodes.each(function(d,i){
						d3.select(this).attr("class","unmarked").attr("fill","#eee").transition().duration(200);
					});
				}
				d3.select(this).attr("fill", "black")
		
				// Update the print messages
				region = $(this).attr("id");
				countryName = region.split("_").join(" ");
				var data = region_zip_counts[countryName];
				var header = "<table style=\"width:800px\"><tr><td>Company Name</td><td>Zipcode</td><td>Year</td></tr>"
				
				if (region_zip_counts[countryName]){
					var formattedCompanyText = header + formatCompanyList(region_zip_counts[countryName]["companies"])

					d3.selectAll("#companyList").html("<br/><br/>Companies Registered from <span style='color:#2DA1B3'>"+ toTitleCase(countryName) + "</span><br/>"+ formattedCompanyText)
					d3.selectAll("#detailMore").html("Show Companies")	
	  
				// Update the highlights of the zip codes
					data['zipcodes'].forEach(function(d){						
						var color = getZipcodeColor(region_zip_counts[countryName]['max'], region_zip_counts[countryName]['values'][d]);
						svg1.select("#zip_"+d).attr("class","marked").transition().duration(200).attr("fill",color).attr("stroke", color);
						var sum = region_zip_counts[countryName]['sum'] 
						$("#currentSelection").html(sum +" Companies from <span style='color:#2DA1B3'>"+ toTitleCase(countryName) +"</span> are registered in "+region_zip_counts[countryName]['regionLength'] +" zipcodes");
						if (sum == 1){
							var zipcode = region_zip_counts[countryName]["zipcodes"]
							
							var companyName = region_zip_counts[countryName]["companies"]
							
							var companyNameString = "<span style = 'font-size:11px'><br/>"+ toTitleCase(companyName[0][0])+"<br/> Registered: "+ companyName[0][2]+"</span"
							
							$("#currentSelection").html(sum +" Company from <span style='color:#2DA1B3'>"+ toTitleCase(countryName) +"</span> is registered in New York City - zipcode "+zipcode+"<br/>"+companyNameString);
							
							d3.selectAll("#detailMore").html("")	
							
						}
					})
				
					
				
				
				var capName = d.properties.name.toUpperCase();
				var histogramdata = formatTimeData(region_zip_counts[capName].timeline);
				//console.log(histogramdata);
				d3.select("#svgContainer3 svg").remove();
				drawHistogram(histogramdata);
			}else{
				d3.select("#svgContainer3 svg").remove();
				drawHistogram(histogramData());
				d3.selectAll("#detailMore").html("")
				$("#currentSelection").html("There are no companies from <span style='color:#2DA1B3'>"+ toTitleCase(countryName) +"</span> are registered in New York City");
				if (countryName == "UNITED STATES"){
					$("#currentSelection").html("This visualization does not include companies with jurisdiction in the <span style='color:#2DA1B3'>United States</span>.");
				}
			}
		})
		.on('mouseover', function(d){
			tip.html(d.properties.name)
			tip.show()
			d3.select(this).attr("stroke", "#000").attr("stroke-opacity", 1).attr("stroke-width", 1)
			// $("#countryName").html(d.properties.name);
		})
		.on('mouseout', function(d){
			tip.hide()
			d3.select(this).attr("stroke-opacity", 0)
			//		$("#countryName").html("");
		})
		.attr("cursor", "pointer");
    }

	function formatTimeData(data){
		//console.log(data)
		var formated = []
		for(item in data){
			formated.push([parseInt(item), data[item]])
		}
		return formated
	}



    function getCountryColor(max,d){
      var tempScale = d3.scale.sqrt().domain([0, max]).range([1,10]);
      var colorScale = d3.scale.log().range(["#fefefe", "#2DA1B3"]);
      return colorScale(tempScale(d));
    }

    function getZipcodeColor(max,d){
      var tempScale = d3.scale.sqrt().domain([0, max]).range([1,10]);
      var colorScale = d3.scale.log().range(["#fefefe", "#ff2222"]); 
      return colorScale(tempScale(d));
    }

    function initializeController(){
      $('#svgContainer1 path').click(function(){
        // First clear any marked countries.
//        var marked_countries = svg2.selectAll(".marked");
//		//d3.selectAll("path").attr("fill", "#EEEEEE");
//		//d3.select(this).attr("fill", "red");
//		$("#countryName").html("");
//        if (marked_countries.length >0){
//          marked_countries.each(function(d){
//            d3.select(this).attr("class","unmarked").attr("fill","#eee").transition().duration(200);
//          });
//        }

		return
		svg2.selectAll("path").attr("class", "unmarked").attr("fill", "#eee").transition().duration(200);


		id = $(this).attr("id");
		zipcode = id.split("_")[1];
		var data = zip_region_counts[zipcode.toString()];
		var header = "<table style=\"width:800px\"><tr><td>Company Name</td><td>Jurisdiction</td><td>Year</td></tr>"
		var formattedCompanyText = header + formatCompanyList(zip_region_counts[zipcode.toString()]["companies"])

		d3.selectAll("#companyList").html("<br/><br/>New Companies Registered in zipcode " + zipcode + "<br/><br/>" + formattedCompanyText)
		d3.selectAll("#detailMore").html("Show Companies")

		data['regions'].forEach(function(d) {
			jurisdiction = d;
			if (jurisdiction.length != 0 && jurisdiction != undefined) {
				var color = getCountryColor(zip_region_counts[zipcode]['max'], zip_region_counts[zipcode]['values'][jurisdiction]);
				svg2.select("#" + jurisdiction).attr("class", "marked").transition().duration(200).attr("fill", color).attr("stroke", color);
				//  $("#currentSelection").html("Companies in "+ zipcode + " are from > ");
			} else {
				svg2.select("#" + jurisdiction).attr("class", "marked").transition().duration(200).attr("fill", "red").attr("stroke", color);
			}
		});

    });
  
    $('#svgContainer2 path').click(function(){

		return

		var marked_zipcodes = svg1.selectAll(".marked");

		if (marked_zipcodes.length > 0) {
			marked_zipcodes.each(function(d, i) {
				d3.select(this).attr("class", "unmarked").attr("fill", "#eee").transition().duration(200);
			});
		}
		region = $(this).attr("id");
		countryName = region.split("_").join(" ");
		var data = region_zip_counts[countryName];
		var header = "<table style=\"width:800px\"><tr><td>Company Name</td><td>Zipcode</td><td>Year</td></tr>"

		var formattedCompanyText = header + formatCompanyList(region_zip_counts[countryName]["companies"])

		d3.selectAll("#companyList").html("<br/><br/>New Companies Registered from " + countryName + "<br/>" + formattedCompanyText)
		d3.selectAll("#detailMore").html("Show Companies")

		if (data == undefined) {
			$("#currentSelection").html(countryName + ' has no registered companies in New York City');
		} else {
			data['zipcodes'].forEach(function(d) {
				var color = getZipcodeColor(region_zip_counts[countryName]['max'], region_zip_counts[countryName]['values'][d]);
				svg1.select("#zip_" + d).attr("class", "marked").transition().duration(200).attr("fill", color).attr("stroke", color);
				$("#currentSelection").html(region_zip_counts[countryName]['sum'] + " Companies from " + countryName + " are registered in " + region_zip_counts[countryName]['regionLength'] + " zipcodes");
			})
		}

    });
  }


  function formatCompanyList(input){
	  var output = ""
	  for(row in input){
		  var rowstart = "<tr>"
		  var company = "<td>"+toTitleCase(input[row][0])+"</td>"
		  var zip = "<td>"+toTitleCase(input[row][1])+"</td>"
		  var date = "<td>"+toTitleCase(input[row][2])+"</td>"
		  var info = "<td>"+input[row][3]+"</td>"
		  if (info == "undefined"){
			  info = "currently active"
		  }else{
			  info = info.toLowerCase()
		  }
		  var rowend = "</tr>"
		  
		  var rowOutput = rowstart+company+zip+date+rowend
		  output = output+rowOutput
	  }
	  
	  var tableend = "</table>"
	  output = output+tableend
	  return output
  }

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
    $('#detailMore').click(function(e){
        e.preventDefault();
        essayBoxShown2 = !essayBoxShown2;
        if (essayBoxShown2) {
            $('#essayBox2').css('display', 'block');
            $('#essayBox2').animate({'opacity':1.0}, 500);
            $(this).text(' Hide Companies ');
        } else {
            closeEssayBox2();
            $(this).text(' Show Companies ');
        }
      })
      $('#essayBox-close2').click(function(){
   //	   console.log("close")
        closeEssayBox2();
        $('#detailMore').text(' See Companies ');
      });


     function closeEssayBox2(){
      $('#essayBox2').animate({'opacity':0.0}, 500, function () {
        $('#essayBox2').css('display', 'none');
      })
      essayBoxShown2 = false;
    }	
