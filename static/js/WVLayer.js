/*
  In TeleViewer, a layer is a collection of information that is
  logically grouped together and may be turned on (made visible)
  or off as a collection.   When on, items of data in the layer
  may be visually presented as billboards, images, etc.  Those
  depictions may have some behaviors, such as enlargement on mouse
  over, launching video windows on click, etc.

  Each type of layer is implemented as a LayerType, which is a set
  of handlers and functions for presenting the items and handling
  UI interactions.  The LayerType also has a data handler for
  processing records in files or incoming streams of objects
  associated with that type of layer.

  Each layer is assigned a type, which handles interactions for
  that layer.

  When TeleViewer is run, a layers file is read which defines the
  layers that the user can choose from.  The each layer has a name
  and a type (maybe implicit).
*/

WV.layerTypes = {};
WV.layers = {};
/*
   Module names should exactly match the javascript filename, including extension.
 */
WV.modules = {};

WV.getIconUrl = function(url)
{
    if (url.startsWith("/") || url.startsWith("http")) {
	return url;
    }
    return "/static/img/billboards/"+url;
}

/*
A LayerType is a type of layer that can be turned on or off and typically shows
many items of information, such as positions of videos, as well as some behaviors
such as allowing videos to be played by clicking on billboards or paths.
The LayerTypeObj is somewhat like a class, in that there may be many instances
of layers of a given layer type.

Some types are: admin, chat, craigslist, default, dynWiki, dynYouTube, 
html, indoorMaps, notes, people, robots, sharecam, spirals, trails, youtube.

 */
WV.LayerTypeObj = function(name, opts)
{
    report("new LayerType "+name);
    this.name = name;
    WV.layerTypes[name] = this;
    this.defaultRecType = opts.defaultRecType;
    this.initFun = opts.initFun;
    this.dataHandler = opts.dataHandler;
    if (!this.dataHandler) {
	this.dataHandler = WV.handleRecs;
    }
    this.clickHandler = opts.clickHandler;
    this.moveHandler = opts.moveHandler;
    this.setVisibility = opts.setVisibility;
    if (this.moveHandler) {
	report("Added moveHandler");
    }
    else {
	report("*** LayerType "+name+" no moveHandler");
    }
    if (!this.dataHandler) {
	report("*** LayerType "+name+" using default dataHandler");
	this.dataHandler = WV.handleRecs;
    }
    if (!this.clickHandler)
	report("*** Warning LayerType "+name+"  no clickHandler");
}

WV.registerLayerType = function(name, opts)
{
    opts = opts || {};
    report("----->>>>> WV.registerLayerType "+name+" "+JSON.stringify(opts));
    return new WV.LayerTypeObj(name, opts);
}

/*
This is an instance of a layer, which may be one of many instances
of a given layer type.
*/
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
    if (this.mediaType) {
	report("******* mediaType is no longer supported.  Use layerType *****");
    }
    this.initializedLoad = false;
    this.localData = null; // could be used if local files are dragged.
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
    this.layerTypeObj = null;
    var inst = this;
    if (!this.layerType) {
	report("****  No layerType specified for layer "+name+" using layerType="+name);
	this.layerType = name;
    }
    report("layerType: "+this.layerType);
    this.layerTypeObj = WV.layerTypes[this.layerType];
    if (this.layerTypeObj) {
	if (this.layerTypeObj.initFun) {
	    report("calling initFun "+inst);
	    this.layerTypeObj.initFun(inst);
	}
    }
    else {
	report("***** Warning: No layerType for layer "+name);
    }

    this.loaderFun = function() {
	if (this.initializedLoad) {
	    report("already initializedLoad for layer "+this.name);
	    return;
	}
	var layer = WV.layers[this.name];
	var name = this.name;
	var layerTypeObj = this.layerTypeObj;
	if (layerTypeObj) {
	    layer.clickHandler = layerTypeObj.clickHandler;
	    layer.moveHandler = layerTypeObj.moveHandler;
	    report(">>>>>>>> subscribe "+name+" "+this.layerTypeObj.name);
	    if (layer.localData == null) {
		wvCom.subscribe(name, layerTypeObj.dataHandler, {dataFile: layer.dataFile});
	    }
	    else {
		report("*********** skipping local subscribe for local data *********");
	    }
	}
	else {
	    report("**** no LayerType for "+name);
	}
	if (name == "photos")
	    WV.getTwitterImages();
	this.initializedLoad = true;
    }

    /*
     * This may be used for handling files dragged
     * and dropped onto TeleViewer.
     */
    this.handleLocalData = function(obj) {
	report("handleLocalData");
	var layer = WV.layers[this.name];
	layer.localData = obj;
	report("**** attached obj");
	if (!this.initializedLoad)
	    this.loaderFun();
	this.setVisibility(true);
	this.layerTypeObj.dataHandler(obj, name);
    }

    this.setVisibility = function(visible) {
	if (!this.initializedLoad)
	    this.loaderFun();
	if (this.layerTypeObj && this.layerTypeObj.setVisibility) {
	    report("***** Using override setVisibility function ******");
	    this.layerTypeObj.setVisibility(visible);
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

WV.addBillboardToLayer = function(layer, rec)
{
    var imageUrl = layer.iconUrl;
    var lon = rec.lon;
    var lat = rec.lat;
    var id = layer.name+"_"+rec.id;
    if (layer.recs[id]) {
	report("already have "+id+" in layer "+layer.name);
	return;
    }
    layer.recs[id] = rec;
    WV.recs[id] = rec;
    var h = 100000;
    if (layer.height)
	h = layer.height;
    var b = WV.addBillboard(layer.bbCollection, lat, lon, imageUrl,
			    id, layer.scale, h, layer.showTethers);
    if (b.anchor) {
	//report("---- adding _wvrec to anchor to "+b.anchor.id);
	b.anchor._wvrec = rec;
    }
    layer.billboards[id] = b;
    if (rec.clickHandler)
	return;
    if (rec.youtubeId)
	rec.clickHandler = WV.playVid;
    else
	rec.clickHandler = WV.showPage;
}

WV.recHandlers = {};

/*
  handler should be a function with signature (layer, rec)
 */
WV.registerRecHandler = function(recType, handler)
{
    WV.recHandlers[recType.toLowerCase()] = handler;
}

WV.flyHome = function(layer, rec)
{
    var dur = 5;
    if (rec.duration)
	dur = rec.duration;
    report("flyHome "+dur);
    WV.viewer.camera.flyHome(dur);
}

WV.addKmlRec = function(layer, rec)
{
    var url = rec.url;
    report("Adding KML "+url);
    var dsPromise = WV.addKML(url);
    dsPromise.then(function(ds) {
	    layer.dataSources.push(ds);
	});
}

WV.addGeoJSONRec = function(layer, rec)
{
    var url = rec.url;
    report("Adding GeoJSON "+url);
    var dsPromise = WV.addGeoJSON(url);
    dsPromise.then(function(ds) {
	    layer.dataSources.push(ds);
	});
}

WV.addVidRec = function(layer, rec)
{
    if (rec.vtype == "youtube" && !rec.youtubeId) {
	report("assigning rec.youtubeId = rec.id");
	rec.youtubeId = rec.id;
    }
    if (!rec.youtubeId) {
	report("ignoring vidRec without youtubeId");
	return;
    }
    WV.addBillboardToLayer(layer, rec);
}


WV.registerRecHandler('flyhome',  WV.flyHome);
WV.registerRecHandler('kml',      WV.addKmlRec);
WV.registerRecHandler('video',    WV.addVidRec);
WV.registerRecHandler('html',     WV.addBillboardToLayer);
WV.registerRecHandler('geojson',  WV.addGeoJSONRec);

WV.handleRec = function(layer, rec)
{
    if (!rec.recType) {
	if (rec.type == "youtube") {
	    rec.recType = "video";
	    report('Using recType video for rec.type=youtube');
	}
	else {
	    report("*** WV.handleRec skipping rec with no recType\n");
	    report("*** rec:\n"+WV.toJSON(rec)+"\n");
	    return;
	}
    }
    recType = rec.recType.toLowerCase();
    if (WV.recHandlers[recType]) {
	WV.recHandlers[recType](layer, rec);
    }
    else {
	report("*** no matching rec handler for recType "+recType);
    }
}

WV.handleRecs = function(data, layerName)
{
    report("*** generic handleRecs "+layerName);
    //report("data:\n"+WV.toJSON(data));
    var layer = WV.layers[layerName];
    var defaultRecType = null;
    if (data.defaultRecType) {
	report("WV.handleRecs using defaultRecType from data");
	defaultRecType = data.defaultRecType;
    }
    if (!defaultRecType && layer.defaultRecType) {
	report("WV.handleRecs using defaultRecType from layer");
	defaultRecType = layer.defaultRecType;
    }
    if (!defaultRecType && layer.layerTypeObj.defaultRecType) {
	report("WV.handleRecs using defaultRecType from layerType");
	defaultRecType = layer.layerTypeObj.defaultRecType;
    }
    if (!defaultRecType) {
	report("*** no default rec type for data for layer "+layerName);
    }
    if (layer.recs == null) {
	report("initing layer "+layerName);
	layer.recs = {};
	layer.tethers = {};
	layer.billboards = {};
	layer.bbCollection = new Cesium.BillboardCollection();
	WV.scene.primitives.add(layer.bbCollection);
    }
    var recs = WV.getRecords(data);
    for (var i=0; i<recs.length; i++) {
        var rec = recs[i];
	//report("rec:\n"+WV.toJSON(rec));
	if (rec.type) {
	    report("**** waring rec "+rec.id+" for layer "+layer.name+
                 " has rec with type field "+rec.type);
	}
	rec.layerName = layerName;
	if (rec.type == "youtube" && rec.id) {
	    rec.youtubeId = rec.id;
	}
	recType = rec.recType;
	if (!recType)
	    recType = defaultRecType;
        layer.numObjs++;
        if (layer.numObjs > layer.maxNum)
            return;
	/*
	if (!recType) {
	    if (rec.youtubeId) {
		report("setting rec with youtubeId to recType=video");
		recType = "video";
	    }
	}
	*/
	//report("recType: "+recType);
	rec.recType = recType;
	WV.handleRec(layer, rec);
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
    WV.recurseLayers(layers, cbList, prefix="");
}

WV.recurseLayers = function(layers, cbList, prefix)
{
    layers.forEach(function(spec) {
        //report("---------------------------------------------------");
	if (spec.type == 'folder') {
	    var div = WV.addLayerFolder(spec, cbList, prefix);
	    layers = spec['layers'];
	    WV.recurseLayers(layers, div, prefix+"&nbsp;");
	    return;
	};
	if (spec.require) {
	    WV.requireModule(spec.require, function() { WV.addLayer(spec, cbList, prefix); });
	}
	else {
	    WV.addLayer(spec, cbList, prefix);
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


WV.requireModule = function(jsName, done)
{
    var jsURL;
    if (jsName.startsWith("/") || jsName.startsWith("http")){
	jsURL = jsName;
    }
    else {
	jsURL = "/static/js/"+jsName;
    }
    report("******* requireModule: "+jsName+" ******");
    report("jsURL: "+jsURL);
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
	    report("**** requireModule script loaded: "+jsURL+" ****");
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
	    report("******************************************************");
	    report("******************************************************");
	    report("requireCode failed: "+exception);
	});
}

WV.addLayer = function(layerSpec, cbList, prefix)
{
    if (!cbList)
        cbList = WV.layersCBList;
    var layer = new WV.Layer(layerSpec);
    var name = layer.name;
    var id = "cb_"+layer.name;
    var uiDivId = "ui_div_"+layer.name;
    layer.uiDivId = uiDivId;
    //report("setupLayers layer: "+WV.toJSON(layer));
    var desc = layer.description;
    if (prefix) {
        $('<span />', { html: prefix}).appendTo(cbList);
    }
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

WV.addLayerFolder = function(spec, cbList, prefix)
{
    //report("=================================================");
    //report("addLayerFolder spec: "+WV.toJSON(spec));
    var name = spec.name;
    var open = true;
    if (spec.open != null)
	open = spec.open;
    var id = "cb_"+spec.name;
    var folderDivId = "folder_div"+name;
    var folderSpanId = "folder_span"+name;
    spec.folderDivId = folderDivId;
    var desc = spec.name + "...<br>";
    if (open)
	desc = spec.name + "/";
    //report("desc: "+desc);
    var folderSpan = $('<span />',
        { html: desc, style: "color:white" }).appendTo(cbList);
    var folderDiv = $('<div />',
        { id: folderDivId, show: 0, style: "color:white;" }).appendTo(cbList);
    if (!open)
	folderDiv.hide();
    folderSpan.click(function(e) {
	    report("******** click *******");
            var str = folderSpan.html();
            report("str: "+str);
	    if (str == name+"/") {
		folderDiv.hide();
		folderSpan.html(name+"...<br>");
	    }
	    else {
		folderDiv.show();
		folderSpan.html(name+"/");
	    }
    });
    return folderDiv;
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
    WV.registerLayerType("default");
    WV.registerLayerType("youtube", {defaultRecType: "video"});
    WV.registerLayerType("html", {defaultRecType: "html"})
});


