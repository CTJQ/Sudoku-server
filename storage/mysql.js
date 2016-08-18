'use strict';

var Promise = require('bluebird');
var pmysql = require('promise-mysql');
var config = require('../config/mysql.json');

var database = module.exports = {
    connection: null,
    createConnection: createConnection,
    get: get
};

function createConnection() {
    return pmysql.createConnection({
        host: config['host'],
        port: config['port'],
        user: config['user'],
        password: config['password'],
        database: config['database']
    }).then(function (conn) {
        database.connection = conn;
        return conn;
    });
}

function get() {
    if (database.connection)
        return Promise.resolve(database.connection);
    return createConnection();
}
