
function report(str) { console.log(str); }

var verbosity = 1;

var activeSockets = [];

var http = require('http'),
    fs = require('fs'),
    // NEVER use a Sync function except at start-up!
    index = fs.readFileSync(__dirname + '/index.html');

// Send index.html to all requests
var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
});

// Socket.io server listens to our app
var io = require('socket.io').listen(app);

/*
// Send current time to all connected clients
function sendTime() {
    io.emit('time', { time: new Date().toJSON() });
}

// Send current time every 10 secs
setInterval(sendTime, 10000);
*/

function handleDisconnect(socket)
{
    report("disconnected "+socket);
    var index = activeSockets.indexOf(socket);
    if (index >= 0) {
        activeSockets.splice(index, 1);
    }
}

/*
function handleCommand(msg) {
    report("got command "+JSON.stringify(msg));
    activeSockets.forEach(s => {
	try {
	    s.emit('command', msg);
	}
	catch (e) {
	    report("failed to send to socket "+s);
	}
    });
}

function handlePosition(msg)
{
    report("got position "+JSON.stringify(msg));
    activeSockets.forEach(s => {
	try {
	    s.emit('position', msg);
	}
	catch (e) {
	    report("failed to send to socket "+s);
	}
    });
}
*/

function handleChannel(channel, msg) {
    if (verbosity > 1)
        report("got msg on channel "+channel+": "+JSON.stringify(msg));
    activeSockets.forEach(s => {
	try {
	    //s.emit('command', msg);
	    s.emit(channel, msg);
	}
	catch (e) {
	    report("failed to send to socket "+s);
	}
    });
}

var CHANNELS = ["position", "command", "people"];

// Emit welcome message on connection
io.on('connection', function(socket) {
    // Use socket to communicate with this particular client only, sending it it's own id
    report("got connection "+socket);
    activeSockets.push(socket);
    CHANNELS.forEach(channel => {
	report("setting up events on channel "+channel);
	socket.on(channel, msg => handleChannel(channel, msg));
    });
    /*
    //socket.on('position', handlePosition);
    socket.on('position', msg => handleChannel('position', msg));
    //socket.on('command', handleCommand);
    socket.on('command', msg => handleChannel('command', msg));
    socket.on('people', msg => handleChannel('people', msg));
    */
    socket.on('disconnect', obj => handleDisconnect(socket, obj));
});

var port = 4000;
var addr = "0.0.0.0";
report("listening on address: "+addr+" port:"+port);
app.listen(port, addr);
