(function() {

    function report(str) { console.log(str); }

    "use strict";
    /*global console,require,__dirname,process*/
    /*jshint es3:false*/

    //var app = require('express')();
    var express = require('express');
    var app = express();
    var http = require('http').Server(app);
    var io = require("socket.io")(http);
    var compression = require('compression');
    var url = require('url');
    var request = require('request');
    var rethink = require('rethinkdb');
    //var httpPort = 3000;
    var httpPort = null;

    var connection = null;

    function connectToDB()
    {
	report("connecing to Rethinkdb");
	rethink.connect( {host: 'localhost', port: 28015},
			 function(err, conn) {
			     //if (err) throw err;
			     if (err) {
				 report("err: "+err);
				 report("Could not connect to rethinkdb");
				 report("*** WARNING - NO DB ACCESS ***");
			     }
			     else {
				 connection = conn;
				 loadTables();
			     }
			 });
    }

    function getClockTime()
    {
	return new Date().getTime()/1000.0;
    }

    function loadTables()
    {
	if (connection == null) {
	    report("*** loadTables - NO DB ACCESS ***");
	    return;
	}
        rethink.table('chat').run(connection, loadCallback);
    }

    function addObj(table, obj)
    {
	if (connection == null) {
	    report("*** addObj "+table+" - NO DB ACCESS ***");
	    return;
	}
        rethink.table(table).insert(obj).run(
	     connection,
	     function(err, res) {
		 if(err) throw err;
		 console.log(res);
	     });
    }

    function addChatMsg(jStr)
    {
        report("addChatMsg");
	try {
	    msg = JSON.parse(jStr);
	}
	catch (err) {
	    report("Cannot parse json");
	    report("err: "+err);
	    return;
	}
	msg.user = msg.name;
	addObj('chat', msg);
    }

    function addNoteMsg(jStr)
    {
        report("addNoteMsg");
	try {
	    msg = JSON.parse(jStr);
	    //addMsg("note", msg);
	}
	catch (err) {
	    report("Cannot parse json");
	    report("err: "+err);
	    return;
	}
	addObj('notes', msg);
    }

    var loadCallback = function(err, cursor) {
         if (err) throw err;
         // returns an array of all documents (fruit in this case) in the cursor
         cursor.toArray(function(err, fruit) {
             if (err) throw err;
             console.log("got: "+fruit);
          //socket.emit('load_fruit', fruit);
         });
    }

    var yargs = require('yargs').options({
        'port' : {
            'default' : 3000,
            'description' : 'Port to listen on.'
        },
        'public' : {
            'type' : 'boolean',
            'description' : 'Run a public server that listens on all interfaces.'
        },
        'upstream-proxy' : {
            'description' : 'A standard proxy server that will be used to retrieve data.  Specify a URL including port, e.g. "http://proxy:8000".'
        },
        'bypass-upstream-proxy-hosts' : {
            'description' : 'A comma separated list of hosts that will bypass the specified upstream_proxy, e.g. "lanhost1,lanhost2"'
        },
        'help' : {
            'alias' : 'h',
            'type' : 'boolean',
            'description' : 'Show this help.'
        }
    });
    var argv = yargs.argv;

    if (argv.help) {
        return yargs.showHelp();
    }
    httpPort = argv.port;
    report("httpPort: "+httpPort);

    connectToDB();

    // eventually this mime type configuration will need to change
    // https://github.com/visionmedia/send/commit/d2cb54658ce65948b0ed6e5fb5de69d022bef941
    var mime = express.static.mime;
    mime.define({
        'application/json' : ['czml', 'json', 'geojson', 'topojson', 'gltf'],
        'text/plain' : ['glsl']
    });

    app.use(compression());
    app.use(express.static(__dirname));


    function getRemoteUrlFromParam(req) {
        var remoteUrl = req.params[0];
        if (remoteUrl) {
            // add http:// to the URL if no protocol is present
            if (!/^https?:\/\//.test(remoteUrl)) {
                remoteUrl = 'http://' + remoteUrl;
            }
            remoteUrl = url.parse(remoteUrl);
            // copy query string
            remoteUrl.search = url.parse(req.url).search;
        }
        return remoteUrl;
    }

    var dontProxyHeaderRegex = /^(?:Host|Proxy-Connection|Connection|Keep-Alive|Transfer-Encoding|TE|Trailer|Proxy-Authorization|Proxy-Authenticate|Upgrade)$/i;

    function filterHeaders(req, headers) {
        var result = {};
        // filter out headers that are listed in the regex above
        Object.keys(headers).forEach(function(name) {
            if (!dontProxyHeaderRegex.test(name)) {
                result[name] = headers[name];
            }
        });
        return result;
    }

    var upstreamProxy = argv['upstream-proxy'];
    var bypassUpstreamProxyHosts = {};
    if (argv['bypass-upstream-proxy-hosts']) {
        argv['bypass-upstream-proxy-hosts'].split(',').forEach(function(host) {
            bypassUpstreamProxyHosts[host.toLowerCase()] = true;
        });
    }

    app.get('/db/*', function(req, res, next) {
	    var etype = req.params[0];
	    report("handling etype: "+etype);
	    var tableName = etype;
	    res.setHeader('Content-Type', 'application/json');
            rethink.table(tableName).run(connection, function(err,cursor) {
		    if (err) {
			var robj = {'error': err};
			res.send(JSON.stringify(vec, null, 3));
		    }
		    else {
			cursor.toArray(function(err, vec) {
                            if (err) {
				var robj = {'error': err};
				res.send(JSON.stringify(vec, null, 3));
			    }
			    else {
				console.log("got: "+vec);
				var t = getClockTime();
				var robj = {'records': vec, 'table': tableName, t: t};
				var jbuf = JSON.stringify(robj, null, 3);
				res.send(jbuf);
			    }
			});
		    }
		});
	});


    app.get('/proxy/*', function(req, res, next) {
        // look for request like http://localhost:8080/proxy/http://example.com/file?query=1
        var remoteUrl = getRemoteUrlFromParam(req);
        if (!remoteUrl) {
            // look for request like http://localhost:8080/proxy/?http%3A%2F%2Fexample.com%2Ffile%3Fquery%3D1
            remoteUrl = Object.keys(req.query)[0];
            if (remoteUrl) {
                remoteUrl = url.parse(remoteUrl);
            }
        }

        if (!remoteUrl) {
            return res.send(400, 'No url specified.');
        }

        if (!remoteUrl.protocol) {
            remoteUrl.protocol = 'http:';
        }

        var proxy;
        if (upstreamProxy && !(remoteUrl.host in bypassUpstreamProxyHosts)) {
            proxy = upstreamProxy;
        }

        // encoding : null means "body" passed to the callback will be raw bytes

        request.get({
            url : url.format(remoteUrl),
            headers : filterHeaders(req, req.headers),
            encoding : null,
            proxy : proxy
        }, function(error, response, body) {
            var code = 500;

            if (response) {
                code = response.statusCode;
                res.header(filterHeaders(req, response.headers));
            }

            res.send(code, body);
        });
    });

    io.on('connection', function(socket){
        report("setting up socket.io channels register chat");
	socket.on('people', function(rmsg){
            report('people: '+rmsg);
            io.emit('people', rmsg);
        });
	socket.on('chat', function(msgStr){
	    report('chat: '+msgStr);
            io.emit('chat', msgStr);
            addChatMsg(msgStr);
        });
	socket.on('notes', function(msgStr){
	    report('note: '+msgStr);
            io.emit('notes', msgStr);
            addNoteMsg(msgStr);
        });
    });

    //server = http.listen(3000, function() {
    server = http.listen(httpPort, function() {
	    console.log("listening on *:"+httpPort);
	    console.log("addr:"+server.address());
	    console.log("port:"+server.address().port);
	});

    /*
    var server = app.listen(3000, 'localhost', function() {
        console.log('Use http://localhost:%d/', server.address().port);
    });
    */

    server.on('error', function (e) {
        if (e.code === 'EADDRINUSE') {
            console.log('Error: Port %d is already in use, select a different port.', argv.port);
            console.log('Example: node server.js --port %d', argv.port + 1);
        } else if (e.code === 'EACCES') {
            console.log('Error: This process does not have permission to listen on port %d.', argv.port);
            if (argv.port < 1024) {
                console.log('Try a port number higher than 1024.');
            }
        }
        console.log(e);
        process.exit(1);
    });

    server.on('close', function() {
        console.log('Cesium development server stopped.');
    });

    process.on('SIGINT', function() {
        server.close(function() {
            process.exit(0);
        });
    });

    report("done with main function");
})();
