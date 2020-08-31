// Require modules
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const cookie = require('cookie');
const session = require('express-session');
const options = require('./knexfile.js');
var knex = require('knex')(options);

// Change secret to unique value
app.use(session({ secret: "Shh, its a secret!" }));

//postgreSQL
const { Pool, Client } = require('pg');
// Change secret to your login details for postgres
//layout is const connectionString = 'postgresql://username:password@address/Database_name';

// Sandra's connection
//const connectionString = 'postgresql://postgres:12345@127.0.0.1:5432/staph';

// Maisie's connection
// const connectionString = 'postgresql://postgres:12345@127.0.0.1:5432/staph';

// Sam's connection
// const connectionString = 'postgresql://postgres:postgreSAM@127.0.0.1:5433/postgres';

// Andrew's connection
//const connectionString = 'postgresql://postgres:password@127.0.0.1:5432/Staphopia';

// const pool = new Pool({
//     connectionString: connectionString,
// });
const pool = new Pool(options.connection);

pool.query('SELECT NOW()', (err, res) => {
    console.log(err, res);
    pool.end();
});

// const client = new Client({
//     connectionString: connectionString,
// });
const client = new Client(options.connection);
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
app.use('/popupS_scripts', express.static(__dirname + '/node_modules/popupS/'));
app.use('/typehead_scripts', express.static(__dirname + '/node_modules/typehead/'));
app.use('/filesaver_scripts', express.static(__dirname + '/node_modules/filesaver/'));

//directories
app.use(express.static(__dirname + '/views/'));

// set the view engine to ejs
app.set('view engine', 'ejs');

// global variable, will need to pop into get and post routes later when published
var userLoggedIn;
var creationSuccess = false;
var userAlreadyExists = true;
var favSampleID;

/*
ROUTERS
 */
let resultRouter = require('./routes/result');
let advancedSearchRouter = require('./routes/advancedSearch');
let createAccountRouter = require('./routes/createAccount')
let searchResultRouter = require('./routes/searchResults')
let advSearchResultRouter = require('./routes/advSearchResults');
let loginRouter = require('./routes/login');
let favouriteRouter = require('./routes/favourites');
let groupsRouter = require('./routes/groups');
let viewGroupRouter = require('./routes/viewGroup')

/* --------------------------------------------------------------------------------
 *
 * GET routes
 *
 */

app.use((req, res, next) => {
    req.db = client
    req.knex = knex
    next()
})

app.use('/result', resultRouter);
app.use('/advancedSearch', advancedSearchRouter);
app.use('/createAccount', createAccountRouter);
app.use('/searchResults', searchResultRouter);
app.use('/advSearchResults', advSearchResultRouter);
app.use('/login', loginRouter);
app.use('/favourites', favouriteRouter)
app.use('/groups', groupsRouter)
app.use('/', viewGroupRouter);



// index page
app.get('/', function (req, res) {
    let favorites=[];
    let suggested=[];
    let haveFavs = false;
    let haveSugs = false;
    if (req.session.userStatus == "loggedIn") {
        userLoggedIn = true;
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        client.query("SELECT * FROM user_favorites WHERE email='" + email + "' LIMIT 4", (err, fav_results) => {
            //console.log(err, fav_results);
            if(fav_results.rows.length > 0){
                haveFavs = true;
                haveSugs = true;
                let selectSQL = "";
                selectSQL = "SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                    "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                    "sample_metadata.metadata->>'isolation_source' AS isolation_source, sample_metadata.metadata->>'date_collected' AS date " +
                    "FROM mlst_mlst  INNER JOIN sample_metadata ON mlst_mlst.sample_id=sample_metadata.sample_id " +
                    "WHERE mlst_mlst.sample_id IN (SELECT sample_id FROM sample_metadata " +
                    "WHERE";
                if (fav_results.rows.length > 0){
                    selectSQL += " sample_id = " + fav_results.rows[0].sample_id + "";
                }
                if (fav_results.rows.length > 1){
                    selectSQL += " OR  sample_id = " + fav_results.rows[1].sample_id + "";
                }
                if (fav_results.rows.length > 2){
                    selectSQL += " OR  sample_id = " + fav_results.rows[2].sample_id + "";
                }
                if (fav_results.rows.length > 3){
                    selectSQL += " OR  sample_id = " + fav_results.rows[3].sample_id + "";
                }
                //console.log(selectSQL);

                client.query(selectSQL + ");", (err, favorites) => {
                    //console.log(err, favorites);

                    client.query('SELECT name FROM sample_sample WHERE id=' + fav_results.rows[fav_results.rows.length-1].sample_id + '', (err, result_sample_sample) => {
                        //console.log(err, result_tag_tosample);
                        let sampleName = result_sample_sample.rows[0].name;

                        // Sample's weighted distances
                        client.query("SELECT * FROM weighted_distance WHERE selected_sample='" + sampleName + "' ORDER BY distance ASC LIMIT 5", (err, result_weighted_distances) => {
                            //console.log(err, result_weighted_distances);
                            console.log(err, result_weighted_distances);

                            client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                                "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                                "sample_metadata.metadata->>'isolation_source' AS isolation_source, sample_sample.name, sample_sample.id " +
                                "FROM sample_sample  " +
                                "INNER JOIN mlst_mlst ON sample_sample.id=mlst_mlst.sample_id " +
                                "INNER JOIN sample_metadata ON sample_sample.id=sample_metadata.sample_id " +
                                "WHERE sample_sample.name='" + result_weighted_distances.rows[1].comparison_sample + "' " +
                                "OR sample_sample.name='" + result_weighted_distances.rows[2].comparison_sample + "' " +
                                "OR sample_sample.name='" + result_weighted_distances.rows[3].comparison_sample + "' " +
                                "OR sample_sample.name='" + result_weighted_distances.rows[4].comparison_sample + "'", (err, suggested) => {
                                console.log(err, suggested);

                                res.render('pages/index', {
                                    userLoggedIn: userLoggedIn,
                                    favorites: favorites.rows,
                                    suggested: suggested.rows,
                                    haveFavs: haveFavs,
                                    haveSugs: haveSugs
                                });
                            });
                        });
                    });
                });
            } else {
                res.render('pages/index', { userLoggedIn: userLoggedIn, favorites: favorites.rows, suggested: suggested.rows, haveFavs: haveFavs, haveSugs: haveSugs });
            }
        });

    } else {
        userLoggedIn = false;
        console.log(haveFavs);
        res.render('pages/index', { userLoggedIn: userLoggedIn, favorites: favorites.rows, suggested: suggested.rows, haveFavs: haveFavs, haveSugs: haveSugs });
    }
});

app.get('/logout', function (req, res) {
    req.session.userStatus = "loggedOut";
    res.clearCookie("setCookie");
    console.log("logout user");
    res.redirect('/');
});

app.get('/predictSeq', function (req, res) {
    let sequence = req.query.key;
    client.query("SELECT DISTINCT st FROM mlst_mlst WHERE CAST(st AS CHAR(10)) LIKE '" + sequence + "%' LIMIT 10", function (err, result, fields) {
        if (err) throw err;
        let i;
        let data = [];
        for (i = 0; i < result.rows.length; i++) {
            data.push(result.rows[i].st.toString());
        }
        res.end(JSON.stringify(data));
    });
});

app.get('/predictSam', function (req, res) {
    let sample = req.query.key;
    client.query("SELECT DISTINCT sample_id FROM mlst_mlst WHERE CAST(sample_id AS CHAR(10)) LIKE '" + sample + "%' LIMIT 10", function (err, result, fields) {
        if (err) throw err;
        let i;
        let data = [];
        for (i = 0; i < result.rows.length; i++) {
            data.push(result.rows[i].sample_id.toString());
        }
        res.end(JSON.stringify(data));
    });
});

app.get('/predictLoc', function (req, res) {
    let location = req.query.key;
    client.query("SELECT DISTINCT metadata->>'country' AS country FROM sample_metadata WHERE metadata->>'country' ILIKE '%" + location + "%' LIMIT 10", function (err, result, fields) {
        if (err) throw err;
        let i;
        let data = [];
        for (i = 0; i < result.rows.length; i++) {
            data.push(result.rows[i].country);
        }
        res.end(JSON.stringify(data));
    });
});

app.get('/predictStr', function (req, res) {
    let strain = req.query.key;
    client.query("SELECT DISTINCT metadata->>'strain' AS strain FROM sample_metadata WHERE metadata->>'strain' ILIKE '%" + strain + "%' LIMIT 10", function (err, result, fields) {
        if (err) throw err;
        let i;
        let data = [];
        for (i = 0; i < result.rows.length; i++) {
            data.push(result.rows[i].strain);
        }
        res.end(JSON.stringify(data));
    });
});

app.get('/predictHost', function (req, res) {
    let host = req.query.key;
    client.query("SELECT DISTINCT metadata->>'host' AS host FROM sample_metadata WHERE metadata->>'host' ILIKE '%" + host + "%' LIMIT 10", function (err, result, fields) {
        if (err) throw err;
        let i;
        let data = [];
        for (i = 0; i < result.rows.length; i++) {
            data.push(result.rows[i].host);
        }
        res.end(JSON.stringify(data));
    });
});

app.get('/predictIso', function (req, res) {
    let source = req.query.key;
    client.query("SELECT DISTINCT metadata->>'isolation_source' AS isolation_source FROM sample_metadata WHERE metadata->>'isolation_source' ILIKE '%" + source + "%' LIMIT 10", function (err, result, fields) {
        if (err) throw err;
        let i;
        let data = [];
        for (i = 0; i < result.rows.length; i++) {
            data.push(result.rows[i].isolation_source);
        }
        res.end(JSON.stringify(data));
    });
});

app.get('/tutorials', function (req, res) {
    if (req.session.userStatus == "loggedIn") {
        userLoggedIn = true;

    } else {
        userLoggedIn = false;
    }
    res.render('pages/tutorials', { userLoggedIn: userLoggedIn });
});


app.listen(8000);
console.log('8000 is the magic port');
