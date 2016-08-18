'use strict';

var Promise = require('bluebird');
var express = require('express');
var router = express.Router();

var mysql = require('../storage/mysql');

// FIXME: Randomly selected problems may already be done by this player
router.get('/', function(req, res) {
    var difficulty = req.query.difficulty;
    mysql.get().then(function (connection) {
        return Promise.resolve().then(function () {
            // Get unsolved problems id list
            if (difficulty)
                return connection.query('SELECT pid FROM problems WHERE difficulty = ?', [difficulty]);
            else
                return connection.query('SELECT pid FROM problems', []);
        }).then(function (rows) {
            if (rows.length === 0) throw new Error('No any problems on server now :(');
            var selected = Math.floor(Math.random() * rows.length);
            return connection.query('SELECT pid, content FROM problems WHERE pid = ?', [rows[selected].pid]);
        }).then(function (rows) {
            res.status(200).send(JSON.stringify({
                msg: 'Succeed!',
                data: rows[0]
            }));
        }).catch(function (err) {
            console.error(err);
            res.status(500).send(JSON.stringify({
                msg: err.message
            }));
        });
    })
});

module.exports = router;
