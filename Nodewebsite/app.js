// load the things we need
const express = require('express');
const app = express();

//postgreSQL
const { Pool, Client } = require('pg');
const connectionString = 'postgresql://postgres:password@127.0.0.1:5432/Staphopia';

const pool = new Pool({
    connectionString: connectionString,
});

pool.query('SELECT NOW()', (err, res) => {
    console.log(err, res);
    pool.end();
});

const client = new Client({
    connectionString: connectionString,
});
client.connect();

//BodyParser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//Cytoscape.js
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
app.post('/searchResults', function(req, res) {
    console.log(req.body.search.input);
    let title_id = 0;
    client.query("SELECT id FROM staphopia_blastquery WHERE title='"+ req.body.search.input + "'",(err, result)=> {
        console.log(err, result);
        title_id = result.rows[0].id;
        client.query('SELECT * FROM sccmec_primers WHERE query_id='+ title_id + '', (err, result) => {
            console.log(err, result);
            res.render('pages/searchResults', {sccmec_primers: result.rows});
        });
    });
});

app.listen(8000);
console.log('8000 is the magic port');