
function report(str)
{
    console.log(str);
}

// http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};


WV.getClockTime = function()
{
    return new Date().getTime()/1000.0;
}

/*
  Set the given attribute to given value for every element
  of a dictionary.
 */
WV.setObjsAttr = function(objs, attr, val)
{
    for (id in objs) {
	//report("set objs["+id+"]."+attr+" = "+val);
	objs[id][attr] = val;
    }
}

// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
WV.getParameterByName = function(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

WV.toDegrees = function(r)
{
    return r*180/Math.PI;
}

WV.toRadians = function(d)
{
    return d*Math.PI/180;
}

WV.toDMYHMS = function(t)
{
    var tm = new Date(t*1000);
    var mdy = (tm.getMonth()+1)+"/"+
               tm.getDate()+"/"+
               tm.getFullYear();
    var hms =  tm.getHours()+":"+
               tm.getMinutes()+":"+
               tm.getSeconds();
    return mdy +" "+ hms;
}

WV.toHMS = function(t)
{
    var tm = new Date(t*1000);
    var hms =  tm.getHours()+":"+
               tm.getMinutes()+":"+
               tm.getSeconds();
    return hms;
}

WV.toTimeStr = function(t)
{
    var tm0 = new Date();
    var tm = new Date(t*1000);
    var h = ""+tm.getHours();
    if (h.length == 1)
	h = " "+h;
    var m = ""+tm.getMinutes();
    if (m.length == 1)
	m = "0"+m;
    var s = ""+tm.getSeconds();
    if (s.length == 1)
	s = "0"+s;
    var hms =  h+":"+m+":"+s;
    var dt = tm0 - tm;
    if (dt < 24*60*60*1000 && tm0.getDate() == tm.getDate()) {
	return hms;
    }
    var mdy = (tm.getMonth()+1)+"/"+
               tm.getDate()+"/"+
               tm.getFullYear();
    return mdy +" "+ hms;
}

WV.toJSON = function(obj) { return JSON.stringify(obj, null, 3); }

WV.getUniqueId = function(name, id)
{
    if (!name)
	name = "obj";
    if (!id)
	id = new Date().getTime()+"_"+Math.floor(10000*Math.random());
    return name+"_"+ id;
}


/*
  determine whether two lists of points are the same.
*/
WV.eqPoints = function(a1, a2)
{
    if (a1 == null || a2 == null) {
	return false;
    }
    if (a1.length != a2.length) {
	return false;
    }
    for (var i=0; i<a1.length; i++) {
	if (a1[i].x != a2[i].x ||
	    a1[i].y != a2[i].y ||
	    a1[i].z != a2[i].z) {
	    return false;
	}
    }
    return true;
}


/*
  if arg is array, return it, otherwise get .records field.
 */
WV.getRecords = function(v)
{
    if (v instanceof Array)
	return v;
    return v.records;
}


/*******************************************************
*  Drag and Drop related code
*******************************************************/

WV.DnD = {}

WV.DnD.addEvent = (function () {
  if (document.addEventListener) {
    return function (el, type, fn) {
      if (el && el.nodeName || el === window) {
        el.addEventListener(type, fn, false);
      } else if (el && el.length) {
        for (var i = 0; i < el.length; i++) {
          addEvent(el[i], type, fn);
        }
      }
    };
  } else {
    return function (el, type, fn) {
      if (el && el.nodeName || el === window) {
        el.attachEvent('on' + type, function () { return fn.call(el, window.event); });
      } else if (el && el.length) {
        for (var i = 0; i < el.length; i++) {
          addEvent(el[i], type, fn);
        }
      }
    };
  }
})();


WV.DnD.cancel = function(e) {
  if (e.preventDefault) e.preventDefault(); // required by FF + Safari
  e.dataTransfer.dropEffect = 'copy'; // tells the browser what drop effect is allowed here
  return false; // required by IE
}

// Tells the browser that we *can* drop on this target

WV.DnD.setup = function(urlHandler, fileHandler) {
    var el = window;
    WV.DnD.addEvent(el, 'dragover', WV.DnD.cancel);
    WV.DnD.addEvent(el, 'dragenter', WV.DnD.cancel);
    WV.DnD.addEvent(el, 'drop', function (e) {
       if (e.preventDefault) e.preventDefault(); // stops the browser from
                                                      // redirecting off to the text.

       report("drop.....");
       var dataTrans = e.dataTransfer;
       if (0) {
	   report("types: "+dataTrans.types);
	   for (var i=0; i<dataTrans.types.length; i++) {
	       var tp = dataTrans.types[i];
	       report("type: "+tp);
	   }
       }
       var url = dataTrans.getData('Text');
       if (url) {			    
	   report("got url: "+url);
	   if (urlHandler)
	       urlHandler(e, url);
	   // handle URL
	   return false;
       }
       for (var i=0; i<dataTrans.files.length; i++) {
	   var file = dataTrans.files[i];
	   var fname = file.name;
	   var ftype = file.type;
	   report("file: "+fname+" "+ftype);
	   if (fileHandler)
	       fileHandler(e, file);
       }
       return false;
	});
}


