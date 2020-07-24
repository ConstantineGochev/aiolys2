'use strict';

const redis = require('redis');
const config = require("../config.json")
// Read in keys and secrets. Using nconf use can set secrets via
// environment variables, command-line arguments, or a keys.json file.

/**
 * Setting up redis clients.
 */

// const songsclient = redis.createClient({ auth_pass: process.env.DB_AUTH });
// const usersclient = redis.createClient({ auth_pass: process.env.DB_AUTH });
console.log("nconf", nconf);
const songsclient = redis.createClient(config.redisPort || '6379',
  config.redisHost || '127.0.0.1',
  {
    'auth_pass': config.redisKey,
    'return_buffers': true
  }
);
const usersclient = redis.createClient(config.redisPort|| '6379',
  config.redisHost || '127.0.0.1',
  {
    'auth_pass': config.redisKey,
    'return_buffers': true
  }
);
const privateclient = redis.createClient(config.redisPort || '6379',
  config.redisHost || '127.0.0.1',
  {
    'auth_pass': config.redisKey,
    'return_buffers': true
  }
);

songsclient.on('error', function(err) {
  console.error(err.message);
});

usersclient.on('error', function(err) {
  console.error(err.message);
});

usersclient.select(1);
privateclient.select(2);
/**
 * Expose the clients
 */

exports.songs = songsclient;
exports.users = usersclient;
exports.privateclient = privateclient;
