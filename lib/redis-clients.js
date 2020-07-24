'use strict';

const redis = require('redis');
// Read in keys and secrets. Using nconf use can set secrets via
// environment variables, command-line arguments, or a keys.json file.

/**
 * Setting up redis clients.
 */

// const songsclient = redis.createClient({ auth_pass: process.env.DB_AUTH });
// const usersclient = redis.createClient({ auth_pass: process.env.DB_AUTH });
const songsclient = redis.createClient();
const usersclient = redis.createClient();
const privateclient = redis.createClient();

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
