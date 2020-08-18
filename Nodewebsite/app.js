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
let favouriteRouter = require('./routes/favourites')

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

app.get('/groups', function (req, res) {
    userLoggedIn = req.session.userStatus == "loggedIn";

    let groups = [];
    let haveGroups = false;

    if(req.session.userStatus == "loggedIn"){
        //TODO SQL Query to get list of groups

        res.render('pages/groups', {
            userLoggedIn: userLoggedIn,
            groups: [
                {
                    group_id: "0001",
                    name: "group 1",
                    count: "10",
                    created: "2020-01-15T13:45:30",
                    modified: "2020-02-15T13:45:30"
                },
                {
                    group_id: "0020",
                    name: "group 2",
                    count: "15",
                    created: "2020-05-15T13:45:30",
                    modified: "2020-07-15T13:45:30"
                },
                {
                    group_id: "0300",
                    name: "group 3",
                    count: "7",
                    created: "2020-01-15T13:45:30",
                    modified: "2020-09-15T13:45:30"
                },
                {
                    group_id: "4000",
                    name: "group 4",
                    count: "4",
                    created: "2019-09-15T13:45:30",
                    modified: "2020-01-02T13:45:30"
                },
                ],
            haveGroups: true
        });
    }
    else{
        res.status(404);
        res.send({ error: 'Not found' });
    }
})

/* view samples page
*
* Searches through the db and retrieves samples belonging to each group
* displaying aggregated statistics
*
*/
app.get('/viewGroup', function (req, res) {
    userLoggedIn = req.session.userStatus == "loggedIn";

    let groupID = req.query.sampleSelection; // groupID instead?

    if(req.session.userStatus == "loggedIn"){
        // TODO: SQL Query to get of group information and samples belonging to each group
        // result_samples.rows

        result_samples = [{
          country: "unknown/missing",
          host: "undefined",
          id: "40584",
          isolation_source: "undefined",
          st: "72",
          strain: "undefined"
        }, {
          country: "United States of America (USA)",
          host: "Homo sapiens",
          id: "43765",
          isolation_source: "Nares",
          st: "8",
          strain: "H51158"
        }, {
          country: "United States of America (USA)",
          host: "Homo sapiens",
          id: "44028",
          isolation_source: "Nares",
          st: "8",
          strain: "M42212"
        }, {
          country: "United States of America (USA)",
          host: "Human",
          id: "41697",
          isolation_source: "Respiratory",
          st: "8",
          strain: "2588STDY5627603"
        }, {
          country: "United States of America (USA)",
          host: "Human",
          id: 41823,
          isolation_source: "Respiratory",
          st: 15,
          strain: "undefined",
        }, {
          country: "unknown/missing",
          host: "undefined",
          id: "43502",
          isolation_source: "Sputum",
          st: "8",
          strain: "COAS6087"
        }, {
          country: "unknown/missing",
          host: "undefined",
          id: "43502",
          isolation_source: "Sputum",
          st: "8",
          strain: "COAS6087"
        }];

        groupInfo = {
          group_id: "4000",
          description: "Really close genomes to sample 44140",
          name: "Group 4",
          count: "4",
          created: "2019-09-15T13:45:30",
          modified: "2020-01-02T13:45:30"
        };

        res.render('pages/viewGroup', {
            userLoggedIn: userLoggedIn,
            samples: result_samples,
            groupInfo: groupInfo
        });
    }
    else{
        res.status(404);
        res.send({ error: 'Not found' });
        res.render('pages/error');
    }
})


/* favourites page
 *
 * Searches through the db based on user's email and finds associated favourited genome samples
 */


/* --------------------------------------------------------------------------------
 *
 * POST routes
 *
 */


/* User account creation page
 *
 * Checks if user tries to submit an email already in the database and sends an alert to the HTML scripts if found
 * Otherwise, adds user account details to db and hashes password
 */



 /* Login page
  *
  * Check if user exists based on submitted username and email, if found, sets sessions for email and
  * logged in status. Also sets cookies which potentially could be removed considering session is set
  * for logged in status. Db is then checked against users email for any favourited samples, if found,
  * four samples are retrieved and recommended samples are then found from the database also, to
  * display on the landing/index page.
  *
  * If user not found, alert is sent on HTML
  */

/* Results page
 *
 * Updates the favourites db for the current user based on the user's email and also updates
 * the isFavourited value (0 = false, 1 = true) which is sent through to the HTML scripts
 * Then queries the db for the genome sample details to display in results table and cytoscape scripts
 */


/* Favourites page
 *
 * Removes favourites from user account and db
 */

/*
 * --------------------------------------------------------------------------------
 */


app.listen(8000);
console.log('8000 is the magic port');
