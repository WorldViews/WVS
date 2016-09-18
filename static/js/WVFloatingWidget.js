/*
  This code is currently not used, but may later be used as the base
  level for implementation of all code now in WVWidget.js
 */
WV.floatingDivTemplate =
' <div class="chat-window" id="|NAME|Window">\n' +
'    <div style="background-color:grey" id="|NAME|Title">\n' +
'      <span class="chat-title" id="|NAME|Title" style="background-color:grey">|NAME|:</span>\n' +
'      <button id="|NAME|Dismiss" style="height:15px;float:right;"></button>\n' +
'    </div>\n' +
'    <div class="floating-body" id="|NAME|Body">\n' +
'    </div>\n' +
'  </div>\n';


WV.FloatingWidget = function(name)
{
    this.name = name;
    var windowId = "#"+name+"Window";
    var titleId = "#"+name+"Title";
    var dismissId = "#"+name+"Dismiss";
    var bodyId = "#"+name+"Body";
    var inst = this;
    this.windowId = windowId;
    this.titleId = titleId;
    this.bodyId = bodyId;
    function build() {
	if ($(titleId).length > 0) {
	    report("**** "+titleId+" already exists");
	    return;
	}
	var str = WV.floatingDivTemplate;
	//str = WV.noteDivTemplate.replace(/\|NAME\|/g, name);
	str = str.replace(/\|NAME\|/g, name);
	report("str:\n"+str);
	$("#notesLayerDiv").append(str);
	$(dismissId).click(function(e) {
		inst.dismiss(); 
	    });
	$(windowId).draggable({
		cancel: bodyId+",input,textarea,button,select,option"
	    });
    }

    this.show = function() {
	report("****** WV.FloatingWidget.show *****");
	$(windowId).show(100);
    }

    this.hide = function() {
	report("WV.FloatingWidget.hide");
	$(windowId).hide(100);
    }

    this.dismiss = function() {
	this.hide();
    }

    build();
}

WV.GetNoterWidget = function(name)
{
    var w = new WV.FloatingWidget(name);
    report("w.bodyId "+w.bodyId);
    $(w.bodyId).append("Hello");
    var url = "/Viewer/frag.html"
    $.get(url, null, function(hstr) {
	    $(w.bodyId).html(hstr);
	});
    return w;
}

/*
$(document).ready(function() {
    report("=*=*==*=*==*=*==*=*==*=*==*=*==*=*==*=*==*=*==*=*==*=*==*=*==*=*=");
    report("WVFloatingWidget");
    var w = WV.GetNoterWidget("foo");
    WV.noterWidget = w;
    w.show();
});
*/

