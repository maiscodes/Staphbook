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
app.post('/result', function(req, res) {
    console.log(req.body.searchResult.selection);
    let sampleID = req.body.searchResult.selection;

    // Tags
    client.query('SELECT tag_id FROM tag_tosample WHERE sample_id='+ sampleID + '', (err, result_tag_tosample) => {
        console.log(err, result_tag_tosample);
        let tagID = result_tag_tosample.rows[0].tag_id;
        client.query('SELECT * FROM tag_tag WHERE id='+ tagID + '', (err, result_tag_tag) => {
            console.log(err, result_tag_tag);

            // Metadata
            client.query('SELECT * FROM sample_metadata WHERE sample_id='+ sampleID + '', (err, result_sample_metadata) => {
                console.log(err, result_sample_metadata);

                // MLST
                client.query('SELECT * FROM mlst_mlst WHERE sample_id='+ sampleID + '', (err, result_mlst_mlst) => {
                    console.log(err, result_mlst_mlst);
                    res.render('pages/result', {tag_tag: result_tag_tag.rows, sample_metadata: result_sample_metadata.rows, mlst_mlst: result_mlst_mlst.rows});
                });
            });


        });
    });
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