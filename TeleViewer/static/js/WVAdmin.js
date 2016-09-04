
WV.Admin = {}
WV.Admin.widget = null;
WV.Admin.buttons = '<button name="update">Update</button>';

WV.Admin.getAdminWidget = function()
{
    if (WV.Admin.widget == null) {
	WV.Admin.widget = new WV.WindowWidget("admin", WV.blankDivTemplate);
	$("#adminText").html(WV.Admin.buttons);
	var w = WV.Admin.widget;
	$(w.id).find('[name=update]').click(function(e) {
		report("Click update!!!");
	    });
    }
    return WV.Admin.widget;
}

WV.Admin.setVisibility = function(v)
{
    report("WV.Admin.setVisibility "+v);
    var w = WV.Admin.getAdminWidget();
    if (!w)
	return;
    if (v) { w.show();    }
    else   { w.hide();    }
}

WV.registerModule("WVAdmin.js");

WV.registerLayerType("admin", {
	setVisibility: WV.Admin.setVisibility
});

