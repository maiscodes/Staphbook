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
app.use(session({secret: "Shh, its a secret!"}));
app.use(cors());

//postgreSQL
const {Pool, Client} = require('pg');
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
app.use('/cola', express.static(__dirname + '/node_modules/webcola'));
app.use('/cola_scripts', express.static(__dirname + '/node_modules/cytoscape-cola'));
app.use('/popupS_scripts', express.static(__dirname + '/node_modules/popupS/'));
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
let uploadResultRouter = require("./routes/uploadResult");
let uploadSampleRouter = require("./routes/uploadSample");

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
app.use("/", viewGroupRouter);
app.use("/createGroup", createGroupRouter);
app.use("/uploadResult", uploadResultRouter);
app.use("/uploadSample", uploadSampleRouter);


// index page
app.get('/', function (req, res) {
    let favorites = [];
    let suggested = [];
    let haveFavs = false;
    let haveSugs = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        userNotRegistered = false;

        req.knex
            .select('*')
            .from('user_favorites')
            .where({email: email})
            .limit(4)
            .then(favs => {
                if(favs.length > 0){
                    haveSugs = true;
                    haveFavs = true;

                    req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                        name: 'sample_sample.name', id: 'sample_sample.id'}) //TODO: refactor so id is removed
                        .from('mlst_mlst')
                        .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                        .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                        .modify(function (queryBuilder) {
                            queryBuilder.where('mlst_mlst.sample_id', favs[0].sample_id || 0);
                            for (i = 1; i < favs.length; i++) {
                                queryBuilder.orWhere('mlst_mlst.sample_id', favs[i].sample_id);
                            }
                        })
                        .then((favoriteSamples) => {
                            //console.log(sampleInfos);
                            for (sampleInfo of favoriteSamples) {
                                sampleInfo.country = sampleInfo.metadata.country;
                                sampleInfo.strain = sampleInfo.metadata.strain;
                                sampleInfo.host = sampleInfo.metadata.host;
                                sampleInfo.isolation_source = sampleInfo.metadata.isolation_source;
                            }

                            knex.select('name')
                                .from('sample_sample')
                                .where({id: favoriteSamples[0].sample_id})
                                .then(result => {
                                    let sampleName = result[0].name;

                                    knex.select('*')
                                        .from('weighted_distance')
                                        .where({selected_sample: sampleName})
                                        .orderBy('distance', 'asc')
                                        .limit(5)
                                        .then(close => {
                                            req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                                                name: 'sample_sample.name', id: 'sample_sample.id'}) //TODO: refactor so id is removed
                                                .from('mlst_mlst')
                                                .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                                                .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                                                .modify(function (queryBuilder) {
                                                    queryBuilder.where('sample_sample.name', close[0].comparison_sample || 0);
                                                    for (let i = 1; i < close.length; i++) {
                                                        queryBuilder.orWhere('sample_sample.name', close[i].comparison_sample);
                                                    }
                                                })
                                                .then((suggestedSamples) => {
                                                    //console.log(sampleInfos);
                                                    for (sampleInfo of suggestedSamples) {
                                                        sampleInfo.country = sampleInfo.metadata.country;
                                                        sampleInfo.strain = sampleInfo.metadata.strain;
                                                        sampleInfo.host = sampleInfo.metadata.host;
                                                        sampleInfo.isolation_source = sampleInfo.metadata.isolation_source;
                                                    }

                                                    res.render('pages/index', {
                                                        userLoggedIn: userLoggedIn,
                                                        favorites: favoriteSamples,
                                                        suggested: suggestedSamples,
                                                        haveFavs: haveFavs,
                                                        haveSugs: haveSugs
                                                    });
                                                })
                                        })
                                })
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
        res.render("pages/index", {
            userLoggedIn: userLoggedIn,
            haveFavs: false,
            haveSugs: false,
        })
    }
});

app.get('/logout', function (req, res) {
    req.session.userStatus = "loggedOut";
    res.clearCookie("setCookie");
    console.log("logout user");
    res.redirect('/');
});

app.get('/tutorials', function (req, res) {
    userLoggedIn = req.session.userStatus === "loggedIn";
    res.render('pages/tutorials', {userLoggedIn: userLoggedIn});
});


app.listen(8000);
console.log('8000 is the magic port');
