
function report(str)
{
  console.log(str);
}

var VS = {};

VS.sioUrl = "http://platonia";
VS.sock = null;
VS.msgNum = 0;
VS.userId = null;
VS.name = "joe";
VS.origin = [37.38, -122.18];
VS.curPos = [37.8, -122.0];
VS.handler = null;

VS.clockTime = function()
{
    return new Date() / 1000.0;
}

VS.setup = function(url, handler)
{
   if (url)
	VS.sioUrl = url;
   VS.handler = handler;
   VS.userId = "user"+Math.floor(10000*Math.random());
   report("getting socket to "+VS.sioUrl);
   VS.sock = io(VS.sioUrl);
   report("got sock = "+VS.sock);
   if (VS.sock == null) {
      report("*** failed to get socket ***");
      return;
   }
   //VS.sock.on('viewInfo', VS.watchViewInfo);
   VS.sock.on('people', VS.watchViewInfo);
}

VS.sendStatus = function(panoLon, panoLat)
{
   if (VS.sock == null) {
      report("no socket - can't send status");
   }
   var msg = {'name': 'joe', 'type': 'people'};
   msg.userId = VS.userId;
   msg.name = VS.name;
   msg.origin = VS.origin;
   msg.curPos = VS.curPos;
   msg.num = VS.msgNum++;
   msg.t = VS.clockTime();
   if (panoLon != null && panoLat != null) {
      msg.panoView = [panoLon, panoLat];
   }
   var str = JSON.stringify(msg);
   //report("sending "+str);
   //VS.sock.emit('viewInfo', str);
   VS.sock.emit('people', str);
   $("#status").html("sending "+JSON.stringify(msg));
}

VS.watchViewInfo = function(msg)
{
   //report("got msg: "+JSON.stringify(msg));
   if (VS.handler)
       VS.handler(msg);
}

