
WV.chatDivTemplate =
' <div class="chat-window" id="|NAME|Window">\n' +
'    <div style="background-color:grey" id="|NAME|Title">\n' +
'      <span class="chat-title" id="|NAME|Title" style="background-color:grey">|NAME|:</span>\n' +
'      <button id="|NAME|Dismiss" style="height:15px;float:right;"></button>\n' +
'    </div>\n' +
'    <div class="chat-text" id="|NAME|Text"></div>\n' +
'    <form action="" id="|NAME|Form">\n' +
'      <input id="|NAME|Input" autocomplete="off" style="width: 82%;" />\n' +
'      <button>Send</button>\n' +
'    </form>\n' +
'  </div>\n';


WV.noteDivTemplate =
' <div class="chat-window" id="|NAME|Window">\n' +
'    <div style="background-color:grey" id="|NAME|Title">\n' +
'      <span class="chat-title" style="width: 100%;">|NAME|:</span>\n' +
'      <button id="|NAME|Dismiss" style="height:15px;float:right;"></button>\n' +
'    </div>\n' +
'    <div class="chat-text" id="|NAME|Text"></div>\n' +
'    <form action="" id="|NAME|Form">\n' +
'      <textarea id="|NAME|Input" autocomplete="off" style="width: 82%; height:150px" />\n' +
'      </textarea>\n' +
'      <button>Send</button>\n' +
'    </form>\n' +
'  </div>\n';

WV.blankDivTemplate =
' <div class="chat-window" id="|NAME|Window">\n' +
'    <div style="background-color:grey" id="|NAME|Title">\n' +
'      <span class="chat-title" id="|NAME|Title" style="background-color:grey">|NAME|:</span>\n' +
'      <button id="|NAME|Dismiss" style="height:15px;float:right;"></button>\n' +
'    </div>\n' +
'    <div class="chat-text" id="|NAME|Text"></div>\n' +
'  </div>\n';

WV.WindowWidget = function(name, divTemplate)
{
    this.name = name;
    this.divTemplate = divTemplate;

    var windowId = "#"+name+"Window";
    var formId = "#"+name+"Form";
    var textId = "#"+name+"Text";
    var inputId = "#"+name+"Input";
    var titleId = "#"+name+"Title";
    var dismissId = "#"+name+"Dismiss";
    var inst = this;
    this.id = windowId;

    function build() {
	if ($(titleId).length > 0) {
	    report("**** "+titleId+" already exists");
	    return;
	}
	//var str = WV.chatDivTemplate.replace(/\|NAME\|/g, name);
	var str = inst.divTemplate;
	if (str) {
	    report("Using provided template:\n"+str);
	}
	else {
	    str = WV.noteDivTemplate;
	    if (name == "chat") {
		str = WV.chatDivTemplate;
	    }
	    report("Using default template");
	}
	//str = WV.noteDivTemplate.replace(/\|NAME\|/g, name);
	str = str.replace(/\|NAME\|/g, name);
	report("str:\n"+str);
	$("#notesLayerDiv").append(str);
    }

    function rig() {
	//$(titleId).html(" "+name+":");
	if ($(formId)) {
	    $(formId).submit(function(){
		    var text = $(inputId).val();
		    $(inputId).val("");
		    try {
			inst.handleInput(text);
		    }
		    catch (err) {
			report("err: "+err);
		    }
		    return false;
		});
	}
	$(dismissId).click(function(e) {
		inst.dismiss(); 
	    });
	$(windowId).draggable({
		cancel: textId+",input,textarea,button,select,option"
	    });
    }

    this.setText = function(text) {
	report("setText "+text);
	$(textId).html(text);
    }

    this.prepend = function(text) {
	//report("prepend "+text);
	$(textId).prepend(text);
    }

    this.show = function() {
	report("WV.Widget.show");
	$(windowId).show(100);
    }

    this.hide = function() {
	report("WV.Widget.hide");
	$(windowId).hide(100);
    }

    this.dismiss = function() {
	this.hide();
    }

    this.handleInput = function(text)
    {
	report("text was entered: "+text);
    }

    build();
    rig();
}


WV.iframeWidgetTemplate =
' <div class="iframe-window" id="|NAME|Window">\n' +
'    <div style="background-color:grey" id="|NAME|Title">\n' +
'      <span class="chat-title" id="|NAME|Title" style="background-color:grey">|NAME|:</span>\n' +
'      <button id="|NAME|Dismiss" style="height:15px;float:right;"></button>\n' +
'    </div>\n' +
'     <div class="iframe-body" id="|NAME|Div">\n' +
'        <iframe class="iframe-body" id="|NAME|Iframe" ></iframe>\n' +
'     </div>\n' +
' </div>\n';

WV.IframeWidget = function(name)
{
    this.name = name;
    var windowId = "#"+name+"Window";
    var iframeId = "#"+name+"Iframe";
    var titleId = "#"+name+"Title";
    var divId = "#"+name+"Div";
    var dismissId = "#"+name+"Dismiss";
    var inst = this;
    this.divId = divId;

    function build() {
	if ($(titleId).length > 0) {
	    report("**** "+titleId+" already exists");
	    return;
	}
	var str = WV.iframeWidgetTemplate.replace(/\|NAME\|/g, name);
	report("str:\n"+str);
	$("#notesLayerDiv").append(str);
    }

    function rig() {
	$(dismissId).click(function(e) {
		//inst.setSrc("about:blank");
		inst.setSrc("/static/blank.html");
		inst.dismiss(); 
	    });
	$(windowId).draggable({
		cancel: divId+",input,textarea,button,select,option"
	    });
	/*
	$(titleId).on('mousedown', function(e) {
		report("mouse down on "+name);
		var offs0 = $(windowId).offset();
		var p0 = {x: e.pageX, y: e.pageY};
		report(" offset: "+offs0.top+" "+offs0.left);
		$(windowId).on('mousemove', function(e) {
	            $(windowId).offset({
			top:  offs0.top  + (e.pageY - p0.y),
			left: offs0.left + (e.pageX - p0.x)
		    }).on('mouseup', function() {
			report("mouseup");
			$(windowId).off('mousemove');
		    });
                });
		e.preventDefault();
	    });
	*/
    }

    this.setSrc = function(url) {
	report("setSrc "+url);
	//console.trace();
	$(iframeId).attr('src', url);
    }

    this.show = function() {
	report("WV.IframeWidget.show");
	$(windowId).show(100);
    }

    this.hide = function() {
	report("WV.IframeWidget.hide");
	$(windowId).hide(100);
	if (this.onHide)
	    this.onHide();
    }

    this.dismiss = function() {
	this.hide();
    }

    build();
    rig();
}


$(document).ready(function()
{
    WV.pageWidget = new WV.IframeWidget("page");
    WV.pageWidget.hide();
    //WV.pageWidget.setSrc("http://fxpal.com");
    WV.pageWidget.setSrc("/static/blank.html");
});
