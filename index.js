var uuid = require('node-uuid')
  , fs = require('fs');

//     Param redis:     Redis client
//     Param namespace: A prefix for the file name
//     Param callback:  Method to be called when file path is creaetd.
//                      Accepts an error, and the fPath
//     The purpose of this wrapper is to create a unique blob name in redis
//     Returns a file path to use
//     User is responsible for cleaning the filename from Redis
//     and clean the touched file from the FS
//
module.exports.createUniquePath = function(redis, namespace, callback) {
  if (namespace == undefined) {
    namespace = "tmp";
  }

  var touchFile = function(fPath, callback) {
    fs.writeFile(fPath, "", function(err) {
        if (err) {
            return callback(err);
        }
        callback();
    });
  }

  var inner = function() {

    // Generate random filename
    var fPath = "/tmp/" + namespace + uuid.v4();

    // Use this file path as a unique id
    // If the file path is unique in redis, then return
    redis.setnx('blob:' + fPath, "", function(err, result) {
      if (err) {
        return callback(err);
      }

      if (result == 1) {
        touchFile(fPath, function(err) {
          if (err) {
            return callback(err);
          }
          callback(null, fPath);
        });
      } else {
        inner();
      }
    });
  }
  inner();
}