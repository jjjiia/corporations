console.log("corporations.js")

//utility functions
//capitalize
function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}
//declare global variables
var NYC_ZOOM = .95;
var WORLD_ZOOM = .95;
var NYC_MAP_CENTER = [-71.123625,42.372115];
var WORLD_MAP_CENTER = [300.123625,42.372115];
var PROJECTION = d3.geo.mercator();
var PATH = d3.geo.path().projection(PROJECTION); 

var svgWorldMap;
var svgNYCMap;
var svgTimeline;

function setProjectionNYC() {
	PROJECTION.scale(1)
		.translate([0, 0]);
	width = $("#svgContainer1").width();
	height = $("#svgContainer1").height();
	// console.log(width,height);
	var b = PATH.bounds(nycJSON),
		s = NYC_ZOOM / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
		t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
	PROJECTION.scale(s).translate(t);
	PROJECTION(NYC_MAP_CENTER);
}

function setProjectionWorld() {
	PROJECTION.scale(1)
		.translate([0, 0]);
	width = $("#svgContainer2").width();
	height = $("#svgContainer2").height();
	var b = PATH.bounds(worldJSON),
		s = WORLD_ZOOM / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
		t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
	PROJECTION.scale(s).translate(t);
}

//load data
$(window).load(function() {

//	bindHandlers();
	queue()
		.defer(d3.json, 'data/processed/nyc-zip-codes.geojson')
		.defer(d3.json, 'data/processed/world.geojson')
		.defer(d3.csv, 'data/processed/newyorkcity.csv')
		.await(initializeData);
});

function initializeData(error, nycjson, worldjson, DATA){
  nycJSON = nycjson; 
  worldJSON = worldjson;
  data = DATA;
  setProjectionNYC(); 
  drawNYC();
  setProjectionWorld();
  drawWorld();
  drawTimeline();
  //initializeController();
}

//3 views

// process data for nyc
function dataNYC(data){
	console.log(data);
	//find count for each zipcode
	//
}
// process data for world

// process data for timeline

//render text

//draw nyc
function drawNYC(){
	dataNYC(data);
	svgNYCMap.selectAll("path").attr("class","unmarked").attr("fill","#eee").transition().duration(600);
	
	data['regions'].forEach(function(d){
		jurisdiction = d.split(" ").join("_");
		if (jurisdiction == "COTE_D'IVOIRE"){
			jurisdiction="COTE DIVOIRE"
			//console.log("TODO fix cote divoire!!")
		}
		
		if (jurisdiction.length !=0 && jurisdiction !=undefined){
			var max = data['maxJurisdiction']
			var currentRegionD = data['jurisdiction'][d]
			var color = getCountryColor(max, currentRegionD);
			svg2.select("#"+jurisdiction).attr("class","marked").attr("fill", color).attr("stroke",color).transition().duration(600);
			//  $("#currentSelection").html("Companies in "+ zipcode + " are from > ");
		} else{
			svg2.select("#"+jurisdiction).attr("class","marked").attr("fill", "red").attr("stroke",color).transition().duration(600);
		}
	});
}
//draw world
function drawWorld(){
	
}
//draw timeline
function drawTimeline(){
	drawHistogram();
	drawSlider();
}
function drawHistogram(){}
function drawSlider(){}