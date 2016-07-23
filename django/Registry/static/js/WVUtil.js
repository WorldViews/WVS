
function report(str)
{
    console.log(str);
}

WV.getClockTime = function()
{
    return new Date().getTime()/1000.0;
}

/*
  Set the give attribute to given value for every element
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

WV.getUniqueId = function(name)
{
    if (!name)
	name = "obj";
    var id = name+"_"+ new Date().getTime()+"_"+Math.floor(10000*Math.random());
    return id;
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

