'use strict';


var kraken = require('kraken-js'),
    app = {};

var databaseUrl = "mongodb://127.0.0.1:27017/noteditnote"; 
var collections = ["mails", "posts"]
var db = require("mongojs").connect(databaseUrl, collections);

app.configure = function configure(nconf, next) {
    // Async method run on startup.
    next(null);
};


app.requestStart = function requestStart(server) {
    // Run before most express middleware has been registered.
};


app.requestBeforeRoute = function requestBeforeRoute(server) {
    // Run before any routes have been added.

};


app.requestAfterRoute = function requestAfterRoute(server) {
    
};





if (require.main === module) {
    kraken.create(app).listen(function (err, server) {
      if (err) {
        console.error(err);
      }

      var io = require('socket.io').listen(server);
      var online = 0
      

      io.sockets.on('connection', function(socket) {
        var ID = (socket.id).toString().substr(0, 10);
        online++
        io.sockets.emit('online', online);

        socket.on('contine', function(data) {
          if(data.length > 12) {
            socket.emit('bum');
          } else {
            var date = new Date().getTime()
            socket.broadcast.emit('contine', { text: data, id: ID, time: date });

            db.posts.findOne({id: ID}, function(err, posts) {
              if( err || !posts) {
                db.posts.save({text: data, name: 'anonim', time: date, id: ID}, function(err, saved) {
                  if( err || !saved ) console.log("post save error");
                });
              }

            else {
               db.posts.update({id: ID}, {$set: {text: posts.text+data}}, function(err, saved) {
                  if( err || !saved ) console.log("post update error");
                });
             }
              
            });

          }
        });


        socket.on('mail', function(data) {

            db.mails.findOne({email: data}, function(err, users) {
              if( err || !users) {
                db.mails.save({email: data}, function(err, saved) {
                  if( err || !saved ) console.log("User not saved");
                  else socket.emit('mail_save');
                });
              }
              else {
                socket.emit('bum2');
              }
            });

        });

        socket.on('disconnect', function() {
            online--
            io.sockets.emit('online', online);
            socket.broadcast.emit('done', ID);
        })

      });
    });
}


module.exports = app;