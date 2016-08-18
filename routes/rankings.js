'use strict';

var Promise = require('bluebird');
var express = require('express');
var router = express.Router();

var mysql = require('../storage/mysql');

/**
 * Get rankings.
 * @param req.body.difficulty {Number}
 * @param req.body.limit {Number}
 */
router.get('/', function(req, res) {
    var difficulty = req.body.difficulty;
    var limit = req.body.limit || 10;

    mysql.get().then(function (connection) {
        if (!difficulty) throw new Error('Require \'difficulty\' parameter!');
        if (!(/[0-2]/).test(difficulty)) throw new Error('\'difficulty\' should only be 0, 1 or 2!');

        return connection.query(('SELECT nickname, total_solved_d%D, average_time_d%D FROM players ORDER BY total_solved_d%D DESC, average_time_d%D ASC LIMIT ?').replace('%D', difficulty), [limit]);
    }).then(function (data) {
        res.status(200).send(JSON.stringify({
            msg: 'Succeed!',
            data: data
        }));
    }).catch(function (err) {
        console.error(err);
        res.status(500).send(JSON.stringify({
            msg: err.message
        }));
    });
});

router.post('/', function (req, res) {
    var nickname = req.body.nickname;
    var pid = req.body.pid;
    var time = req.body.time;

    var player;
    var difficulty;

    mysql.get().then(function (connection) {
        return Promise.resolve().then(function () {
            // Get difficulty
            return connection.query('SELECT difficulty FROM problems WHERE pid = ?', [pid]).then(function (rows) {
                if (rows.length === 0) throw new Error('Problem ' + pid + ' not exists!');
                difficulty = rows[0].difficulty;
            });
        }).then(function () {
            // Get player
            return connection.query('SELECT * FROM players WHERE nickname = ?', [nickname]).then(function (rows) {
                if (rows.length !== 0) return rows[0];
                // Create not existing player
                return connection.query('INSERT INTO players (nickname) VALUES (?)', [nickname]).then(function (result) {
                    return connection.query('SELECT * FROM players WHERE uid = ?', [result.insertId]);
                }).then(function (rows) {
                    if (rows.length !== 0) return rows[0];
                    throw new Error('Create new user failed!');
                });
            }).then(function (p) {
                player = p;
            });
        }).then(function () {
            // Insert new solve
            return connection.query('INSERT INTO solves (uid, pid, time) VALUES (?, ?, ?)', [player.uid, pid, time]);
        }).then(function () {
            // Get new ave time
            return connection.query('SELECT SUM(solves.time) AS total_time FROM solves, problems WHERE solves.uid = ? AND solves.pid = problems.pid AND problems.difficulty = ?', [player.uid, difficulty]);
        }).then(function (rows) {
            // Update rankings
            if (rows.length === 0) throw new Error('Failed to sum total time!');
            var newTotalSolved = player.total_solved + 1;
            return connection.query(('UPDATE players SET total_solved_d%D = ?, average_time_d%D = ? WHERE uid = ?').replace('%D', difficulty), [newTotalSolved, rows[0].total_time / newTotalSolved, player.uid]);
        });
    }).then(function (data) {
        res.status(200).send(JSON.stringify({
            msg: 'Succeed!',
            data: data
        }));
    }).catch(function (err) {
        console.error(err);
        res.status(500).send(JSON.stringify({
            msg: err.message
        }));
    });
});

module.exports = router;
