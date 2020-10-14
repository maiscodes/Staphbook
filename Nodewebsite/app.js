// Require modules
const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');
const cookie = require('cookie');
const session = require('express-session');
const options = require('./knexfile.js');
var knex = require('knex')(options);

// Change secret to unique value
app.use(session({ secret: "Shh, its a secret!" }));
app.use(cors());

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

// Chaashya's connection
const connectionString = "postgresql://postgres:12345@127.0.0.1:5432/staph";

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
var groupAlreadyExists = true;
var favSampleID;

// Middleware
let authenticateUserView = require('./middleware/authenticationViewGroup.js');
let authenticateUserEdit = require('./middleware/authenticationEditGroup.js');

/*
ROUTERS
 */
let resultRouter = require("./routes/result");
let advancedSearchRouter = require("./routes/advancedSearch");
let createAccountRouter = require("./routes/createAccount");
let searchResultRouter = require("./routes/searchResults");
let advSearchResultRouter = require("./routes/advSearchResults");
let loginRouter = require("./routes/login");
let favouriteRouter = require("./routes/favourites");
let groupsRouter = require("./routes/groups");
let viewGroupRouter = require("./routes/viewGroup");
let createGroupRouter = require("./routes/createGroup");
let shareGroupRouter = require("./routes/addUserToGroup");
let addGroupSampleRouter = require("./routes/addGroupSample");
let removeGroupSampleRouter = require("./routes/removeGroupSample");
let removeUserGroupAccessRouter = require("./routes/removeUserFromGroup");

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

app.use("/result", resultRouter);
app.use("/advancedSearch", advancedSearchRouter);
app.use("/createAccount", createAccountRouter);
app.use("/searchResults", searchResultRouter);
app.use("/advSearchResults", advSearchResultRouter);
app.use("/login", loginRouter);
app.use("/favourites", favouriteRouter);
app.use("/", groupsRouter);
app.use("/viewGroup", authenticateUserView, viewGroupRouter);
app.use("/removeGroupSample", authenticateUserEdit, removeGroupSampleRouter)
app.use("/addGroupSample", authenticateUserEdit, addGroupSampleRouter)
app.use("/createGroup", createGroupRouter);
app.use("/addUserToGroup", authenticateUserEdit, shareGroupRouter);
app.use("/removeUserFromGroup", authenticateUserEdit, removeUserGroupAccessRouter);

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
        userNotRegistered = false;

            req.knex
                .select("*")
                .from("user_favorites")
                .where({ email: email })
                .limit(4)
                .then((fav_results, err) => {
                    console.log("fav_results");
                    console.log(fav_results, err);
                    console.log(fav_results.length);

                    let fav_sample_list = [];
                    if (fav_results.length > 0) {
                        //maybe for-loop
                        if (fav_results.length > 0) {
                            fav_sample_list.push(fav_results[0].sample_id);
                        }
                        if (fav_results.length > 1) {
                            fav_sample_list.push(fav_results[1].sample_id);
                        }
                        if (fav_results.length > 2) {
                            fav_sample_list.push(fav_results[2].sample_id);
                        }
                        if (fav_results.length > 3) {
                            fav_sample_list.push(fav_results[3].sample_id);
                        }

                        let sample_id_subquery = req.knex.select("sample_id").from("sample_metadata").whereIn('sample_id', fav_sample_list);

                        haveFavs = true;
                        haveSugs = true;

                        req.knex
                            .select({
                                st: "mlst_mlst.st",
                                sample_id: "sample_metadata.sample_id",
                                metadata: "sample_metadata.metadata",
                                name: "sample_sample.name",
                                id: "sample_sample.id",
                            })
                            .from("mlst_mlst")
                            .innerJoin(
                                "sample_sample",
                                "mlst_mlst.sample_id",
                                "sample_sample.id"
                            )
                            .innerJoin(
                                "sample_metadata",
                                "mlst_mlst.sample_id",
                                "sample_metadata.sample_id"
                            )
                            .whereIn("mlst_mlst.sample_id", sample_id_subquery)
                            .then((same_sequence, err) => {
                                //console.log("I found sample data of my favs");
                                //console.log(same_sequence);
                                req.knex
                                    .select("name")
                                    .from("sample_sample")
                                    .where({
                                        id: fav_results[fav_results.length - 1].sample_id,
                                    })
                                    .then((result_sample_sample, err) => {

                                        //console.log(err, result_sample_sample);
                                        let sampleName = result_sample_sample[0].name;
                                        //console.log(sampleName);

                                        req.knex
                                            .select("*")
                                            .from("weighted_distance")
                                            .where({ selected_sample: sampleName })
                                            .limit(5)
                                            .orderBy("distance", "asc")
                                            .then((result_weighted_distances, err) => {
                                                //console.log(err, result_weighted_distances);
                                                console.log(result_weighted_distances, err);
                                                if (result_weighted_distances.length > 1) {
                                                    let close_genetic_distances = [];
                                                    for (let i = 1; i < 5; i++) {
                                                        close_genetic_distances.push(result_weighted_distances[i].comparison_sample);
                                                        //console.log("Index: " + [i]);
                                                        //console.log(result_weighted_distances[i].comparison_sample);
                                                    }

                                                    req.knex
                                                        .select({
                                                            st: "mlst_mlst.st",
                                                            sample_id: "sample_metadata.sample_id",
                                                            metadata: "sample_metadata.metadata",
                                                            name: "sample_sample.name",
                                                            id: "sample_sample.id",
                                                        })
                                                        .from("mlst_mlst")
                                                        .innerJoin(
                                                            "sample_sample",
                                                            "mlst_mlst.sample_id",
                                                            "sample_sample.id"
                                                        )
                                                        .innerJoin(
                                                            "sample_metadata",
                                                            "mlst_mlst.sample_id",
                                                            "sample_metadata.sample_id"
                                                        )
                                                        .where(
                                                            "sample_sample.name",
                                                            "in",
                                                            close_genetic_distances)
                                                        .then(
                                                            (suggested, err) => {
                                                                //console.log(suggested, err);
                                                                //console.log(haveFavs);
                                                                res.render("pages/index", {
                                                                    userLoggedIn: userLoggedIn,
                                                                    favorites: favorites,
                                                                    suggested: suggested,
                                                                    haveFavs: haveFavs,
                                                                    haveSugs: haveSugs,
                                                                });
                                                            })
                                                }
                                                else {
                                                    res.render("pages/index", {
                                                        userLoggedIn: userLoggedIn,
                                                        favorites: favorites,
                                                        suggested: [],
                                                        haveFavs: haveFavs,
                                                        haveSugs: haveSugs,
                                                    });
                                                }
                                            });
                                    });
                            });
                    }
                    else{
                        res.render("pages/index", {
                            userLoggedIn: userLoggedIn,
                            haveFavs: false,
                            haveSugs: false,
                        })
                    }
                });
    } else {
        userLoggedIn = false;
        console.log(haveFavs);
        res.render("pages/index", {
            userLoggedIn: userLoggedIn,
            favorites: favorites,
            suggested: suggested,
            haveFavs: haveFavs,
            haveSugs: haveSugs,
        });
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
