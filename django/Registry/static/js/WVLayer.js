/*
  In TeleViewer, a layer is a collection of information that is logically grouped together
  and may be turned on (made visible) or off as a collection.  When on, items of data in
  the layer may be visually presented as billboards, images, etc.  Those depitons may have
  some behaviors, such as enlargement on mouse over, launching video windows on click, etc.

  Each type of layer is implemented as a LayerType, which is a set of handlers and functions
  for presenting the items and handling UI interactions.  The LayerType also has a data
  handler for processing records in files or incoming streams of objects associated with
  that type of layer.

  Each layer is assigned a type, which handles interactions for that layer.

  When TeleViewer is run, a layers file is read which defines the layers that the user
  can choose from.  The each layer has a name and a type (maybe implicit).
*/

WV.layerTypes = {};
WV.layers = {};
/*
   Module names should exactly match the javascript filename, including extension.
 */
WV.modules = {};

WV.LayerType = function(name, opts)
{
    report("new LayerType "+name);
    this.name = name;
    WV.layerTypes[name] = this;
    this.initFun = opts.initFun;
    this.dataHandler = opts.dataHandler;
    this.clickHandler = opts.clickHandler;
    this.moveHandler = opts.moveHandler;
    this.setVisibility = opts.setVisibility;
    if (this.moveHandler) {
	report("Added moveHandler");
    }
    else {
	report("*** No moveHandler");
    }
    if (!this.dataHandler)
	report("*** Warning LayerType "+name+"  no dataHandler");
    if (!this.clickHandler)
	report("*** Warning LayerType "+name+"  no clickHandler");
}

WV.registerLayerType = function(name, opts)
{
    report("----->>>>> WV.registerLayerType "+name+" "+JSON.stringify(opts));
    return new WV.LayerType(name, opts);
}

WV.Layer = function(spec)
{
    var name = spec.name;
    report("***** WV.Layer name: "+name);
    this.visible = false;
    this.scale = 0.2;
    this.height = 100000;
    this.showTethers = false;
    for (var key in spec) {
	this[key] = spec[key];
    }
    this.initializedLoad = false;
    this.showFun = null;
    this.hideFun = null;
    this.spec = spec;
    this.numObjs = 0;
    this.recs = null;
    this.billboards = null;
    this.bbCollection = null;
    this.dataSources = [];
    this.models = [];
    this.pickHandler = WV.simplePickHandler;
    this.clickHandler = WV.simpleClickHandler;
    WV.layers[name] = this;
    this.layerType = null;
    var inst = this;
    if (!this.mediaType) { // Is this a good idea?  Maybe its too loose.
	report("***** No mediaType for layer "+name+" using mediaType="+name);
	this.mediaType = name;
    }
    if (this.mediaType) {
	report("mediaType:"+this.mediaType);
	this.layerType = WV.layerTypes[this.mediaType];
	if (this.layerType) {
	    if (this.layerType.initFun) {
		report("calling initFun "+inst);
		this.layerType.initFun(inst);
	    }
	}
	else {
	    report("***** No layerType for layer "+name);
	}
    }
    else {
	report("***** No mediaType for layer "+name);
    }

    this.loaderFun = function() {
	if (this.initializedLoad) {
	    report("already initializedLoad for layer "+this.name);
	    return;
	}
	var layer = WV.layers[this.name];
	var name = this.name;
	var layerType = this.layerType;
	if (layerType) {
	    layer.clickHandler = layerType.clickHandler;
	    layer.moveHandler = layerType.moveHandler;
	    report(">>>>>>>> subscribe "+name+" "+this.layerType.name);
	    wvCom.subscribe(name, layerType.dataHandler, {dataFile: layer.dataFile});
	}
	else {
	    report("**** no LayerType for "+name);
	}
	if (name == "photos")
	    WV.getTwitterImages();
	this.initializedLoad = true;
    }

    this.setVisibility = function(visible) {
	if (!this.initializedLoad)
	    this.loaderFun();
	if (this.layerType && this.layerType.setVisibility) {
	    report("***** Using override setVisibility function ******");
	    this.layerType.setVisibility(visible);
	    return;
	}
	this.visible = visible;
	report("setVisibility "+this.name+" "+visible);
	if (visible) {
	    if (this.showFun) {
		//report("calling showFun for "+this.name);
		this.showFun(this);
	    }
	    if (this.billboards == null) {
		this.loaderFun();
	    }
	    else {
		WV.setBillboardsVisibility(this.billboards, true, this.showTethers);
		if (this.picbillboards) {
		    WV.setBillboardsVisibility(this.picbillboards, true, true);
		}
	    }
	    for (var i=0; i<this.dataSources.length; i++) {
		var ds = this.dataSources[i];
		WV.addDataSource(ds);
	    }
	    for (var i=0; i<this.models.length; i++) {
		var model = this.models[i];
		if (!WV.entities.contains(model))
		    WV.entities.add(model);
	    }
	}
	else {
	    if (this.hideFun) {
		report("calling hideFun for "+this.name);
		this.hideFun(this);
	    }
	    WV.setBillboardsVisibility(this.billboards, false);
	    if (this.picbillboards) {
		WV.setBillboardsVisibility(this.picbillboards, false, false);
	    }
	    for (var i=0; i<this.dataSources.length; i++) {
		var ds = this.dataSources[i];
		WV.removeDataSource(ds);
	    }
	    for (var i=0; i<this.models.length; i++) {
		var model = this.models[i];
		WV.entities.remove(model);
	    }
	}
        var id = "cb_"+this.name;
	$("#"+id).prop('checked', this.visible);
    }
}


WV.handleVideoRecs = function(data, layerName)
{
    report("handleVideoRecs "+layerName);
    var layer = WV.layers[layerName];
    layer.recs = {};
    layer.billboards = {};
    layer.bbCollection = new Cesium.BillboardCollection();
    WV.scene.primitives.add(layer.bbCollection);
    var recs = WV.getRecords(data);
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	rec.layerName = layerName;
        layer.numObjs++;
	if (rec.type == "youtube" && rec.id)
	    rec.youtubeId = rec.id;
	if (!rec.youtubeId) {
            report("skipping recs with no youtube video");
            continue;
        }
        if (layer.numObjs > layer.maxNum)
            return;
        var imageUrl = layer.iconUrl;
        var lon = rec.lon;
        var lat = rec.lat;
        id = layerName+"_"+rec.id;
        layer.recs[id] = rec;
	WV.recs[id] = rec;
        var b = WV.addBillboard(layer.bbCollection, lat, lon, imageUrl, id,
				layer.scale, layer.height, layer.showTethers);
        layer.billboards[id] = b;
    }
}


WV.handleHTMLRecs = function(data, layerName)
{
    report("*** handleHTMLRecs "+layerName);
    //report("data:\n"+WV.toJSON(data));
    var layer = WV.layers[layerName];
    if (layer.recs == null) {
	layer.recs = {};
	layer.billboards = {};
	layer.bbCollection = new Cesium.BillboardCollection();
	WV.scene.primitives.add(layer.bbCollection);
    }
    var recs = WV.getRecords(data);
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	report("rec:\n"+WV.toJSON(rec));
	rec.layerName = layerName;
        layer.numObjs++;
        if (layer.numObjs > layer.maxNum)
            return;
	if (rec.recType == "KML") {
	    var url = rec.url;
	    report("Adding KML "+url);
	    var dsPromise = WV.addKML(url);
	    dsPromise.then(function(ds) {
		    layer.dataSources.push(ds);
		});
	    continue;
	}
        var imageUrl = layer.iconUrl;
        var lon = rec.lon;
        var lat = rec.lat;
        id = layerName+"_"+rec.id;
        layer.recs[id] = rec;
	WV.recs[id] = rec;
	h = 100000;
	if (layer.height)
	    h = layer.height;
        var b = WV.addBillboard(layer.bbCollection, lat, lon, imageUrl,
				id, layer.scale, h, layer.showTethers);
        layer.billboards[id] = b;
    }
}

/*
  This loads the layer information, and then sets up the GUI
  to show those layers.  For now the layer information is hard
  coded into this program, but could be loaded from the server
  and user specific.
 */
WV.getLayers = function()
{
    //$.getJSON(WV.layersUrl, setupLayers);
    WV.getJSON(WV.layersUrl, WV.setupLayers);
    //setupLayers(WV.LAYER_DATA);
}

/*
  This creates the Jquery UI for showing layers with checkboxes.
 */
WV.layersCBList = null;
WV.setupLayers = function(layerData)
{
    var layers = layerData.layers;
    var layersDiv = $("#layersDiv");
    var cbList = $('<div />', { type: 'div', id: 'cbListDiv'}
                   ).appendTo(layersDiv);
    WV.layersCBList = cbList;
    //var cbList = $("#cbListDiv");

    $("#layersLabel").click(function(e) {
	    report("******** click *******");
            var txt = $("#layersLabel").html();
            report("txt: "+txt);
	    if (txt == "Hide Layers") {
		$("#layersLabel").html("Show Layers");
		cbList.hide(100);
	    }
	    else {
		$("#layersLabel").html("Hide Layers");
		cbList.show(100);
	    }
    });

    layers.forEach(function(spec) {
	if (spec.require) {
	    WV.requireModule(spec.require, function() { WV.addLayer(spec); });
	}
	else {
	    WV.addLayer(spec);
	}
    });
}

WV.scriptCompletions = {}
WV.getModuleName = function(name)
{
    var i = name.lastIndexOf("/")
    if (i >= 0)
	name = name.slice(i+1);
    return name;
}

WV.registerModule = function(name)
{
    WV.modules[name] = name;
}


WV.requireModule = function(jsURL, done)
{
    report("************ requireModule: "+jsURL+" **********");
    var name = WV.getModuleName(jsURL);
    if (WV.modules[name]) {
	report("already have module "+jsURL);
	if (done) {
	    try {
		done();
	    }
	    catch (err) {
		report("caught error: "+err);
	    }
	}
	return;
    }
    if (!jsURL.startsWith("/"))
	jsURL = "/Viewer/js/" + jsURL;
    report("jsURL: "+jsURL+" name: "+WV.getModuleName(jsURL));
    var completions = WV.scriptCompletions[jsURL];
    if (completions != null) {
	completions.push(done);
	report("*** already loaded "+jsURL);
	return;
    }
    completions = [done];
    WV.scriptCompletions[jsURL] = completions;
    $.getScript(jsURL)
    .done(function(script, textStatus) {
	    report("************ requireModule script loaded: "+jsURL+" **********");
	    report("calling completions num: "+completions.length);
	    completions.forEach(function(doneFun) {
		    try {
			doneFun();
		    }
		    catch (err) {
			report("caught error: "+err);
		    }
            });
	    report("finished completions");
	})
    .fail(function(jqxhr, settings, exception) {
	    report("requireCode failed: "+exception);
	});
}

WV.addLayer = function(layerSpec)
{
    var cbList = WV.layersCBList;
    var layer = new WV.Layer(layerSpec);
    var name = layer.name;
    var id = "cb_"+layer.name;
    var uiDivId = "ui_div_"+layer.name;
    layer.uiDivId = uiDivId;
    //report("setupLayers layer: "+WV.toJSON(layer));
    var desc = layer.description;
    $('<input />',
        { type: 'checkbox', id: id, value: desc,
	  click: WV.Layer.toggleCB}).appendTo(cbList);
    $('<label />',
        { 'for': id, text: desc, style: "color:white" }).appendTo(cbList);
    $('<div />',
        { id: uiDivId, show: 0, style: "color:white;display:none;" }).appendTo(cbList);
    $('<br />').appendTo(cbList);
    if (layer.visible) {
	layer.setVisibility(true);
    }
}


WV.Layer.toggleCB = function(e)
{
    report("e: "+e.target.id);
    var layer = e.target.id.slice(3);
    report("checked.... "+$("#"+e.target.id).is(":checked"));
    WV.Layer.toggle(layer);
}

WV.Layer.toggle = function(layerName)
{
    report("toggleLayer "+layerName);
    var layer = WV.layers[layerName];
    var id = "cb_"+layerName;
    var checked = $("#"+id).is(":checked");
    report(" checked: "+checked);
    layer.setVisibility(checked);
}


$(document).ready(function() {
    new WV.LayerType("youtube", {
         dataHandler: WV.handleVideoRecs,
	 clickHandler: WV.playVid
    });
    new WV.LayerType("html", {
         dataHandler: WV.handleHTMLRecs,
         clickHandler: WV.showPage
    });
});


