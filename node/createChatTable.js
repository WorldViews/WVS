
r = require('rethinkdb')
r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
  if(err) throw err;
  r.db('test').tableCreate('chat').run(conn, function(err, res) {
    if(err) throw err;
    console.log(res);
    r.table('chat').insert({ user: 'Don', text: 'Hello World' }).run(conn, function(err, res)
    {
      if(err) throw err;
      console.log(res);
    });
  });
});

