
function report(str) { console.log(str); }

r = require('rethinkdb');

function createTable(conn, tableName)
{
    r.db('test').tableCreate(tableName).run(conn, function(err, res) {
	if(err) {
	    //throw err;
	    report("err: "+err);
	    report("Cannot create table "+tableName);
	}
	else {
	    console.log(res);
	    report("Created table "+tableName);
	}
    });
}

r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
    if(err) throw err;
    createTable(conn, "chat");
    createTable(conn, "notes");
    createTable(conn, "periscope");
});



