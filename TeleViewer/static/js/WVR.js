
WVR = {}

function report(str) {
   console.log(str);
}

WVR.formatNumber = function(num, length)
{
    var r = "" + num;
    while (r.length < length) {
        r = "0" + r;
    }
    return r;
}

WVR.getTagsStr = function(tags)
{
//TODO: map multiple tags to safe string
    report("tags: "+tags);
    return tags;
}

WVR.getRandRoom = function() {
    var n = Math.floor(Math.random() * 10000000000);
    return WVR.formatNumber(n, 10);
}

WVR.addRequest = function(req, doneFn)
{
      var url = "/reg_addrequest/";
      var qs = objToQueryStr(req);
      if (qs)
	  url += "?"+qs;
      report("url: "+url);
      $.getJSON(url, function(obj) {
          report("got back: "+JSON.stringify(obj));
          if (doneFn)
             doneFn(obj);
      });
}

WVR.addGuide = function(guide, doneFn)
{
      var url = "/reg_addguide/";
      var qs = objToQueryStr(guide);
      if (qs)
	  url += "?"+qs;
      report("url: "+url);
      $.getJSON(url, function(obj) {
          report("got back: "+JSON.stringify(obj));
          if (doneFn)
             doneFn(obj);
      });
}

objToQueryStr = function(obj) {
    report("objToQueryStr: "+JSON.stringify(obj));
    var str = [];
    for(var p in obj) {
	if (obj.hasOwnProperty(p)) {
	    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
	}
    }
    return str.join("&");
}

//http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function queryStrToObj(a) {
    if (a == "") return {};
    a = a.split("&");
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
}

WVR.report = report
WVR.queryStrToObj = queryStrToObj
WVR.objToQueryStr = objToQueryStr
