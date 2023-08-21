var express = require('express')
var router = express.Router()
const searchGenomes = require('../utils/searchGenomes');
const getGatherData = require('../utils/getGatherData');
const log = require('debug')('routes:searchResults');

// GET request for searching. If errors (wrong category etc.) then return to home page
// TODO: Add better error handling and communication
//
router.get('/', function(req, res) {
    const category = req.query.category;
    const query = req.query.query;
    let result = [];
    try {
        result = searchGenomes(query, category);
    } catch (err) {
        log(err);
    }
    // Get some metadata about the samples that have been returned. Limit to 50
    const samples = result.slice(0, 50).map((sample) => {
        return getGatherData(sample);

    });
    res.render('pages/searchResults', {samples, query, category, number: samples.length, userLoggedIn: res.locals.userLoggedIn })

});

module.exports = router;
