// load the things we need
var express = require('express');
var app = express();

app.use('/cytoscape_scripts', express.static(__dirname + '/node_modules/cytoscape/dist/'));
app.use('/cola_scripts', express.static(__dirname + '/node_modules/cytoscape-cola/'));

// set the view engine to ejs
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file

// index page
app.get('/', function(req, res) {
    res.render('pages/index');
});

// advanced search page
app.get('/advancedSearch', function(req, res) {
    res.render('pages/advancedSearch');
});

// account creation page page
app.get('/createAccount', function(req, res) {
    res.render('pages/createAccount');
});

// result page
app.get('/result', function(req, res) {
    res.render('pages/result');
});

// search results page
app.get('/searchResults', function(req, res) {
    res.render('pages/searchResults');
});

app.listen(8000);
console.log('8000 is the magic port');