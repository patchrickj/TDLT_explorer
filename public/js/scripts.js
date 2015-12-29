var map;
var tdlt_lands_url = "http://services6.arcgis.com/132luy20shezhD2e/ArcGIS/rest/services/tdlt_lands/FeatureServer/0";
var tdlt_trails_url = "http://services6.arcgis.com/132luy20shezhD2e/ArcGis/rest/services/TDLT_trails/FeatureServer/0";
var tdlt_poi = "http://services6.arcgis.com/132luy20shezhD2e/ArcGis/rest/services/TDLT_POI/FeatureServer/0";

require([
	"esri/map",
	"esri/layers/FeatureLayer",
	"esri/Color",
	"esri/symbols/SimpleFillSymbol",
	"esri/symbols/SimpleLineSymbol",
	"esri/symbols/CartographicLineSymbol",
	"esri/renderers/Renderer",
	"esri/renderers/SimpleRenderer",
	"esri/renderers/UniqueValueRenderer",
	"esri/symbols/TextSymbol",
	"esri/layers/LabelClass",
	"esri/tasks/query",
	"esri/dijit/Scalebar",
	"esri/arcgis/utils",
	"esri/dijit/Legend",
	"dijit/form/RadioButton",
	"dijit/registry",
	"dijit/form/CheckBox",
	"esri/dijit/Popup",
	"dojo/dom-construct",
	"esri/dijit/PopupTemplate",
	"esri/InfoTemplate",
	"esri/symbols/PictureMarkerSymbol",
	"esri/symbols/Font",
	"esri/geometry/Point",
	"dojo/parser",
	"dijit/form/Button",


	"dojo/domReady!"
	], function(Map, 
		FeatureLayer,
		Color, 
		SimpleFillSymbol, 
		SimpleLineSymbol,
		CartographicLineSymbol,
		Renderer,
		SimpleRenderer,
		UniqueValueRenderer,
		TextSymbol,
		LabelClass,
		Query,
		Scalebar,
		arcgisUtils,
		Legend,
		RadioButton,
		registry,
		CheckBox,
		Popup,
		domConstruct,
		PopupTemplate,
		InfoTemplate,
		PictureMarkerSymbol,
		Font,
		Point,
		parser
		) {

	parser.parse();

	//Popup
	var popup = new Popup({
		highlight: false,
		offsetX: 15,
		offsetY: 25,
		anchor: "top-right"
	}, domConstruct.create("div"));
	popup.highlight = false;


  var landTemplate = new InfoTemplate({
  	title: null
  });
  landTemplate.setContent(landTextContent);

  function landTextContent(graphic) {
  	var attributes = graphic.attributes;
  	var name = attributes.NAME;
  	var acres = attributes.Acres2;
  	var type = attributes.TYPE;
  	return "<strong>" + name + "</strong>" + "<br>" + type + "<br>"  + acres + " Acres";
  }

  var trailTemplate = new InfoTemplate({
  	title: null,
  });
  trailTemplate.setContent(trailTextContent);

  function trailTextContent(graphic) {
  	var attributes = graphic.attributes;
  	var name = attributes.NAME;
  	var length = String(attributes.Mileage).slice(0,4);
  	var horse = "No";
  	var bike = "No";
  	if (attributes.HORSE === "TRUE") {
  		horse = "Yes"
  	};
  	if (attributes.MT_BIKE === "TRUE") {
  		bike = "Yes"
  	};
  	var uses = "Hiking: Yes<br>Biking: " + bike + "<br>Horses: " + horse;
  	return "<strong>" + name + "</strong>" + "<br>"  + length + " Miles" + "<br>" + uses;
  }
  //end popup work

  //symbolize POI

  var tdltPOI = new FeatureLayer(tdlt_poi, {
  	id: "tdltPOI",
  	mode: FeatureLayer.MODE_SNAPSHOT,
  	outFields: ["Type", "Label"],
  	minScale: 150000,
  	maxScale: 1000,
  	// infoTemplate: blackWallTemplate
 	});

 	var symbolSize = [16, 16]

  var climbingSymbol = new PictureMarkerSymbol('public/img/symbols/climbing.png', symbolSize[0], symbolSize[1]);
	var buildingSymbol = new PictureMarkerSymbol('public/img/symbols/building.png', symbolSize[0], symbolSize[1]);
	var parkingSymbol = new PictureMarkerSymbol('public/img/symbols/parking.png', symbolSize[0], symbolSize[1]);
	var peakSymbol = new PictureMarkerSymbol('public/img/symbols/peak.png', symbolSize[0], symbolSize[1]);
	var picnicSymbol = new PictureMarkerSymbol('public/img/symbols/picnic.png', symbolSize[0], symbolSize[1]);
	var poiSymbol = new PictureMarkerSymbol('public/img/symbols/poi.png', symbolSize[0], symbolSize[1]);
	var trailheadSymbol = new PictureMarkerSymbol('public/img/symbols/trailhead.png', symbolSize[0], symbolSize[1]);
	var viewpointSymbol = new PictureMarkerSymbol('public/img/symbols/viewpoint.png', symbolSize[0], symbolSize[1]);

	var poiRenderer = new UniqueValueRenderer(defaultSymbol, "Type");
	poiRenderer.addValue({
		value: "Trailhead",
		symbol: trailheadSymbol,
		label: "Trailhead"
	});
	poiRenderer.addValue({
		value: "Building",
		symbol: buildingSymbol,
		label: "Building"
	});
	poiRenderer.addValue({
		value: "Parking",
		symbol: parkingSymbol,
		label: "Parking"
	});
	poiRenderer.addValue({
		value: "Peak",
		symbol: peakSymbol,
		label: "Peak"
	});
	poiRenderer.addValue({
		value: "Picnic Area",
		symbol: picnicSymbol,
		label: "Picnic Area"
	});
	poiRenderer.addValue({
		value: "POI",
		symbol: poiSymbol,
		label: "Point of Interest"
	});
	poiRenderer.addValue({
		value: "Viewpoint",
		symbol: viewpointSymbol,
		label: "Viewpoint"
	});
	poiRenderer.addValue({
		value: "Climbing",
		symbol: climbingSymbol,
		label: "Climbing"
	});


	tdltPOI.setRenderer(poiRenderer);

  var tdltLands = new FeatureLayer(tdlt_lands_url, {
  	id: "tdltLands",
  	mode: FeatureLayer.MODE_SNAPSHOT,
  	outFields: ["NAME", "Acres2", "TYPE"],
  	infoTemplate: landTemplate

 	});

 	var tdltTrails = new FeatureLayer(tdlt_trails_url, {
 		id: "tdltTrails",
 		mode: FeatureLayer.MODE_SNAPSHOT,
 		outFields: ["NAME", "Status", "MT_BIKE", "HORSE", "Mileage", "InLine_FID"],
 		infoTemplate: trailTemplate	
 	});


  //Symbolize tdltLands
  var defaultSymbol = null;

  var tdltOutline = new SimpleLineSymbol(
  	SimpleLineSymbol.STYLE_SOLID,
  	new Color([38, 115, 0, 1]),
  	1
  );

  var tdltFillCE = new SimpleFillSymbol(
  	SimpleFillSymbol.STYLE_SOLID,
  	tdltOutline,
  	new Color([38, 115, 0, 0.25])
  );

  var tdltFillFEE = new SimpleFillSymbol(
  	SimpleFillSymbol.STYLE_SOLID,
  	tdltOutline,
  	new Color([85, 255, 0, 0.25])
  );

  var renderer = new UniqueValueRenderer(defaultSymbol, "TYPE");
  renderer.addValue("Fee Parcel", tdltFillFEE);
  renderer.addValue("Conservation Easement", tdltFillCE);
  tdltLands.setRenderer(renderer);

  //Symbolize tdltTrails
  var tdltTrailsLine = new CartographicLineSymbol(
		CartographicLineSymbol.STYLE_SHORTDASH,
		new Color([168, 56, 0, 1]),
		1.33,
		CartographicLineSymbol.CAP_ROUND,
		CartographicLineSymbol.JOIN_BEVEL,
		25
	);

  var trailsRenderer = new SimpleRenderer(tdltTrailsLine);
  tdltTrails.setRenderer(trailsRenderer);

  //Label land features
  var tdltLabel = new TextSymbol().setColor(new Color ([21, 64, 0 , 1]));
  tdltLabel.font.setSize("8pt");
  tdltLabel.font.setFamily("arial");

  var landsJSON = {
  	"labelExpressionInfo": {"value": "{NAME}"}
  };

  var tdltlabelClass = new LabelClass(landsJSON);
  tdltlabelClass.symbol = tdltLabel;
  tdltlabelClass.minScale = 300000;
  tdltLands.setLabelingInfo([ tdltlabelClass ]);

  //Label POI features
  var poiLabel = new TextSymbol();
  poiLabel.font.setSize("8pt");
  poiLabel.font.setFamily("arial");;
  poiLabel.font.setStyle(Font.STYLE_ITALIC);

  var poiJSON = {
  	"labelExpressionInfo": {"value": "{Label}"}
  };

  var poiLabelClass = new LabelClass(poiJSON);
  poiLabelClass.symbol = poiLabel;
  poiLabelClass.minScale = 75000;
  poiLabelClass.labelPlacement = "below-right";
  tdltPOI.setLabelingInfo([poiLabelClass]);


  //Create the map
  map = new Map("mapDiv", {
		basemap: "topo",
		center: [-120.299, 39.372],
		zoom: 10,
		showLabels: true,
		infoWindow: popup,
		sliderPosition: "top-right"
	});


 	var scalebar = new Scalebar({
		map: map,
		scalebarUnit: "dual",
		attachTo: "top-right"
 	});  

  map.addLayers([tdltLands, tdltTrails, tdltPOI]);

  //Create Legends
	map.on("layers-add-result", function (results) {
    poiLegend = new Legend({
        map: map,
        layerInfos: [{
        		layer: tdltPOI,
        		title: " "
        	}
        		]
    }, "poiLegend");
    poiLegend.NLS_noLegend = "";
    poiLegend.startup();

    trailLegend = new Legend({
        map: map,
        layerInfos: [{
        		layer: tdltTrails,
        		title: " "
        	}
        		]
    }, "trailsLegend");
 		// delete "No Legend message"
    trailLegend.NLS_noLegend = "";
    trailLegend.startup();

    landLegend = new Legend({
        map: map,
        layerInfos: [{
        		layer: tdltLands,
        		title: " "
        	}
        		]
    }, "landsLegend");
    landLegend.NLS_noLegend = "";
    landLegend.startup();
	});
	//Query features using FeatureLayer

	var query = new Query();
	query.returnGeometry = true;

  landSelectionSymbol = new SimpleFillSymbol();
  landSelectionSymbol.setColor(new Color([255,255,0,0.25]));
  tdltLands.setSelectionSymbol(landSelectionSymbol);


  var trailSelectSymbol = new CartographicLineSymbol(
		CartographicLineSymbol.STYLE_SHORTDASH,
		new Color([0, 92, 230, 1]),
		1.33,
		CartographicLineSymbol.CAP_ROUND,
		CartographicLineSymbol.JOIN_BEVEL,
		25
	);
	tdltTrails.setSelectionSymbol(trailSelectSymbol);


///Radio Button to toggle query;
	var radioValue = "lands";

	registry.byId("radio1").on("change", function(isChecked){
		if(isChecked){
			radioValue = "lands";
		}
	}, true);


	registry.byId("radio2").on("change", function(isChecked){
		if(isChecked){
			radioValue = "trails";
		}
	}, true);

///Layer toggle of visibility
	var landVis = true;
	var trailVis = true;
	var poiVis = true;

	function layerVisibilityToggle(checkboxDiv, visibilityBoolean, featureLayer) {
		registry.byId(checkboxDiv).on("change", function(){
			visibilityBoolean = !visibilityBoolean;
			featureLayer.setVisibility(visibilityBoolean);
			return visibilityBoolean;
		});
	};

	layerVisibilityToggle("landsCheckBox", landVis, tdltLands);
	layerVisibilityToggle("trailsCheckBox", trailVis, tdltTrails);
	layerVisibilityToggle("poiCheckBox", poiVis, tdltPOI);


//Set tolerance for map query on trails 
	function pointToExtent(map, point, tolerance) {
		var pixelWidth = map.extent.getWidth() / map.width;
		var toleranceInMapCoords = tolerance * pixelWidth;
		return new esri.geometry.Extent(point.x - toleranceInMapCoords,
			point.y - toleranceInMapCoords,
			point.x + toleranceInMapCoords,
			point.y + toleranceInMapCoords,
			map.spatialReference);
	};

  map.on("click", function(event) {
  	tdltTrails.clearSelection();
  	tdltLands.clearSelection();
  	map.graphics.clear("*");
  	map.infoWindow.hide();
  	//make sure layer is visible and query set to lands
		if (radioValue === "lands" && landVis) {
			query.geometry = event.mapPoint;
			tdltLands.selectFeatures(query, FeatureLayer.SELECTION_NEW, function (selection) {
				if (selection.length === 1) {
					map.infoWindow.setFeatures(selection);
			 		map.infoWindow.show(selection)
				}
			});
		} else if (radioValue === "trails" && trailVis) {
			query.geometry = pointToExtent(map, event.mapPoint, 3);
			//to ensure we only select one trail, we first check how many are selected. If more than
			//one are selected we run a new query, selecting only one from the group selected off the click
			tdltTrails.queryFeatures(query, function (returnedFeatures) {
				var count = returnedFeatures["features"].length
				if (count > 0) {
					if (count === 1) {
						selectionQuery = query;
					} else if (count > 1) {
						var selectionQuery = new Query();
						selectionQuery.returnGeometry = true;
						selectionQuery.where = "InLine_FID = " + returnedFeatures["features"][0]["attributes"]["InLine_FID"];
					};
					tdltTrails.selectFeatures(selectionQuery, FeatureLayer.SELECTION_NEW, function (selection) {
						map.infoWindow.setFeatures(selection);
		 				map.infoWindow.show(selection);						
					});
				};
			});					
		}
  });


//activity chooser work
	registry.byId("hikeButton").on("click", function(){
		map.infoWindow.hide();
		var tdltHikeTrails = new CartographicLineSymbol(
			CartographicLineSymbol.STYLE_SHORTDASH,
			new Color([230, 0, 0, 1]),
			1.33,
			CartographicLineSymbol.CAP_ROUND,
			CartographicLineSymbol.JOIN_BEVEL,
			25
		);
  	var newRenderer = new UniqueValueRenderer(defaultSymbol, "Status");
  	newRenderer.addValue({
  		value: "Existing",
  		symbol: tdltHikeTrails,
  		label: "Hiking",
  		description: "Hiking"
  	});
  	var hikeInfo = "From chapparal meadows to old growth pine forests to high alpine lakes, the Land Trust protects and provides access to miles of trails in the diverse landscapes of the Northern Sierra. As well, portions of the Pacfic Crest Trail cross TDLT proteted lands. "
  	map.infoWindow.setContent(hikeInfo);
		map.infoWindow.show(new Point([-120.325, 39.48]))
		map.centerAndZoom([-120.40, 39.38], 10);
  	registry.byId("trailsCheckBox").set("checked", true);
  	map.getLayer("tdltTrails").setRenderer(newRenderer);
  	map.getLayer("tdltTrails").redraw();
  	trailLegend.refresh();
	});

	registry.byId("bikeButton").on("click", function(){
		map.infoWindow.hide();
		var tdltBikeTrails = new CartographicLineSymbol(
			CartographicLineSymbol.STYLE_SHORTDASH,
			new Color([230, 0, 0, 1]),
			1.33,
			CartographicLineSymbol.CAP_ROUND,
			CartographicLineSymbol.JOIN_BEVEL,
			25
		);

	  var tdltNonBikeTrails = new CartographicLineSymbol(
			CartographicLineSymbol.STYLE_SHORTDASH,
			new Color([77, 56, 0, 1]),
			1.33,
			CartographicLineSymbol.CAP_ROUND,
			CartographicLineSymbol.JOIN_BEVEL,
			25
		);

  	var bikeRenderer = new UniqueValueRenderer(defaultSymbol, "MT_BIKE");
  	bikeRenderer.addValue({
  		value: "TRUE",
  		symbol: tdltBikeTrails,
  		label: "Mt. Bike Trails"
  	});
  	bikeRenderer.addValue({
  		value: "FALSE",
  		symbol: tdltNonBikeTrails,
  		label: "Non Mt. Bike Trails"
  	});

  	var bikeInfo = "The Land Trust maintains over 40 miles of mountain bike trails throughout Royal Gorge, Waddle Ranch and the Donner Lake Rim Trail. As well, it provides access to the popular Hole-In-The-Ground trail through Castle Valley."
  	map.infoWindow.setContent(bikeInfo);
		map.infoWindow.show(new Point([-120.26, 39.33]));
  	map.centerAndZoom([-120.30, 39.34], 11);

  	registry.byId("trailsCheckBox").set("checked", true);
  	map.getLayer("tdltTrails").setRenderer(bikeRenderer);
  	map.getLayer("tdltTrails").redraw();
  	trailLegend.refresh();
	});

	registry.byId("horseButton").on("click", function(){
		map.infoWindow.hide();

		var tdltHorseTrails = new CartographicLineSymbol(
			CartographicLineSymbol.STYLE_SHORTDASH,
			new Color([255, 0, 0, 1]),
			1.33,
			CartographicLineSymbol.CAP_ROUND,
			CartographicLineSymbol.JOIN_BEVEL,
			25
		);

	  var tdltNonHorseTrails = new CartographicLineSymbol(
			CartographicLineSymbol.STYLE_SHORTDASH,
			new Color([115, 76, 0, 1]),
			1.33,
			CartographicLineSymbol.CAP_ROUND,
			CartographicLineSymbol.JOIN_BEVEL,
			25
		);		

  	var horseRenderer = new UniqueValueRenderer(defaultSymbol, "HORSE");
  	horseRenderer.addValue({
  		value: "TRUE",
  		symbol: tdltHorseTrails,
  		label: "Horse Trails"
  	});
  	horseRenderer.addValue({
  		value: "FALSE",
  		symbol: tdltNonHorseTrails,
  		label: "Non Horse Trails"
  	});

  	var horseInfo = "The Land Trust maintains over 30 miles of equestrian friendly trails through Royal Gorge and the Donner Lake Rim Trail. As well, TDLT provides and protects important access points to the Pacific Crest Trail."
  	map.infoWindow.setContent(horseInfo);
		map.infoWindow.show(new Point([-120.325, 39.35]));
		map.centerAndZoom([-120.32, 39.325], 12);

  	//make sure layer is visible
  	registry.byId("trailsCheckBox").set("checked", true);

  	map.getLayer("tdltTrails").setRenderer(horseRenderer);
  	map.getLayer("tdltTrails").redraw();
  	trailLegend.refresh();
	});



	registry.byId("climbButton").on("click", function(){
		map.infoWindow.hide();	
		var blackWallInfo = "In 2015, TDLT and The Access Fund closed on the purchase of the Black Wall property, a world-class granite climbing area on Donner Summit. The acquisition contains three climbing zones, the 400-foot Black Wall, the Peanut Gallery and Road Cut."
		map.infoWindow.setContent(blackWallInfo);
		map.infoWindow.show(new Point([-120.314, 39.326]));
		map.centerAndZoom([-120.31, 39.325], 15);
	});


	registry.byId("donnerButton").on("click", function(){
		map.infoWindow.hide();
		
		var donnerInfo = "Explore history with a hike up Donner Summit Canyon. The canyon has served as an important route across the Pacific Crest for thousands of years. On this hike you can view Native American petroglyphs estimated to be 2,500 years old, the China Wall and the world's first automobile underpass. <a href='http://tdlandtrust.org/donner-summit-canyon' target='_blank'>More Information</a>"
		map.infoWindow.setContent(donnerInfo);
		map.infoWindow.show(new Point([-120.318, 39.321]));
		map.centerAndZoom([-120.31, 39.32], 15);
	});

	registry.byId("resetButton").on("click", function(){
		map.getLayer("tdltTrails").setRenderer(trailsRenderer);
		registry.byId("trailsCheckBox").set("checked", true);
		registry.byId("landsCheckBox").set("checked", true);
		map.getLayer("tdltTrails").redraw();
		trailLegend.refresh();
		map.infoWindow.hide();
		map.centerAndZoom([-120.299, 39.372], 10)
	})

});
