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
	svg3.call(tip);
	svg3.selectAll("rect")
		.data(histogramdata)
		.enter()
		.append("rect")
	    .attr("x", function(d){
			//console.log(yearscale(d[0]))
			return yearscale(d[0])})
	    .attr("y", function(d){return height-20- yscale(d[1])})
	    .attr("width",barwidth)
		.attr("id", function(d){return d[0]})
		.attr("fill", function(d){
			return "#aaa"
		})
		.transition()
		.duration(1000)
		.attr("height", function(d){return yscale(d[1])});
	
	svg3.selectAll("rect")
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
			//for updating the text outputs only
			var year = d[0]
			var companiesCount = time_region_zip[year].sum
			var zipCount = time_region_zip[year].regions.length
			var regionCount = time_region_zip[year].zipcodes.length
			var active = Math.round(time_region_zip[year].active*100.00/companiesCount)
			$("#currentSelection").html("In <span style='color:#ECAB23'>"+year +"</span>, there were " +companiesCount + " new companies in "+ zipCount + " zipcodes from "+ regionCount + " countries <br/>"+active+"% are active.");
			//set current
			d3.select("#svgContainer3 svg").remove();
			drawHistogram(histogramData());
			d3.selectAll("rect").attr("fill", "#aaa")
			var header = "<table style=\"width:800px\"><tr><td>Company Name</td><td>Zipcode</td><td>Jurisdiction</td></tr>"
			var formattedCompanyText =  header+formatCompanyList(time_region_zip[year]["companies"])
			d3.selectAll("#companyList").html("<br/><br/>Companies Registered in the Year <span style='color:#ECAB23'>"+ year + "</span><br/><br/>"+ formattedCompanyText)
			d3.selectAll("#detailMore").html("Show Companies")
			var numCompaniesZip = function(d){
			if(zip_region_counts[d.properties.postalCode]){
				var values = zip_region_counts[d.properties.postalCode].values
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

			id = $(this).attr("id");
			var year = id
			var data = time_region_zip[id]
			// Removes all of the country highlights
			svg2.selectAll("path").attr("class","unmarked").attr("fill","#eee").transition().duration(200);
			// Adds highlights back to the countries
			data['regions'].forEach(function(d){
				jurisdiction = d.split(" ").join("_");
			
				if (jurisdiction.length !=0 && jurisdiction !=undefined){
					var max = time_region_zip[year]['maxJurisdiction']
					var currentRegionD = time_region_zip[year]['jurisdiction'][d]
					var color = getCountryColor(max, currentRegionD);
					svg2.select("#"+jurisdiction).attr("class","marked").transition().duration(200).attr("fill", color).attr("stroke",color);
					//  $("#currentSelection").html("Companies in "+ zipcode + " are from > ");
				} else{
					svg2.select("#"+jurisdiction).attr("class","marked").transition().duration(200).attr("fill", "red").attr("stroke",color);
				}
			});

			// Unhighlight all of the zip codes
			var marked_zipcodes = svg1.selectAll(".marked");
			if (marked_zipcodes.length > 0){
				marked_zipcodes.each(function(d,i){
					d3.select(this).attr("class","unmarked").attr("fill","#eee").transition().duration(200);
				});
			}
			// Update the highlights of the zip codes
			data['zipcodes'].forEach(function(d){
				zipcode = d
				var max = time_region_zip[year]['maxZip']
				var color = getZipcodeColor(max, time_region_zip[year]['values'][zipcode]);
				svg1.select("#zip_"+d).attr("class","marked").transition().duration(200).attr("fill",color).attr("stroke", color);
			})
			
			//for coloring histogram itself
			svg3.selectAll("rect")
			.attr("fill", function(d){ 
				if(d[0]==id){
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
        .attr("transform", "translate(" + width + ",0)")
        .call(yAxis);	
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
				//console.log("id "+id);
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
							
							console.log(companyNameString)
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
      var colorScale = d3.scale.log().range(["#fffefe", "#ff2222"]); 
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
