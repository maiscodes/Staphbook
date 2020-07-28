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
const connectionString = 'postgresql://postgres:12345@127.0.0.1:5432/staph';

// Sam's connection
//const connectionString = 'postgresql://postgres:postgreSAM@127.0.0.1:5433/postgres';

// Andrew's connection
//const connectionString = 'postgresql://postgres:password@127.0.0.1:5432/Staphopia';

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



/* --------------------------------------------------------------------------------
 *
 * GET routes
 *
 */


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

// advanced search page
app.get('/advancedSearch', function (req, res) {
    if (req.session.userStatus == "loggedIn") {
        userLoggedIn = true;

    } else {
        userLoggedIn = false;
    }

    res.render('pages/advancedSearch', { userLoggedIn: userLoggedIn });
});

/*
 * User account creation page, renders page's html
 */
app.get('/createAccount', function (req, res) {
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;

    } else {
        userLoggedIn = false;
    }
    userAlreadyExists = false;

    res.render('pages/createAccount', { userLoggedIn: userLoggedIn, userAlreadyExists: userAlreadyExists });
});

// result page
app.get('/result', function (req, res) {
    if (req.session.userStatus == "loggedIn") {
        userLoggedIn = true;

    } else {
        userLoggedIn = false;
    }
    let number = 0;
    let sampleID = req.query.sampleSelection;
    req.session.prevSample = sampleID;
    let isFavourited = 0;

    // set session to 'false'
    req.session.favourited = isFavourited; //initially set to 'false' before SQL checks below


    if (userLoggedIn){
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        client.query("SELECT * FROM user_favorites WHERE email='" + email + "' AND sample_id=" + sampleID + "", (err, fav_results) => {
            console.log(err, fav_results);
            if (fav_results.rows.length > 0) {
                isFavourited = 1; //set to "true"

                req.session.favourited = isFavourited;

            }
        });
    }


    // Tags
    client.query('SELECT tag_id FROM tag_tosample WHERE sample_id=' + sampleID + '', (err, result_tag_tosample) => {
        //console.log(err, result_tag_tosample);
        let tagID = result_tag_tosample.rows[0].tag_id;
        client.query('SELECT * FROM tag_tag WHERE id=' + tagID + '', (err, result_tag_tag) => {

            // Sample Name
            client.query('SELECT name FROM sample_sample WHERE id=' + sampleID + '', (err, result_sample_sample) => {
                console.log(err, result_tag_tosample);
                let sampleName = result_sample_sample.rows[0].name;

                // Sample's weighted distances
                client.query("SELECT * FROM weighted_distance WHERE selected_sample='" + sampleName + "'", (err, result_weighted_distances) => {
                    //console.log(err, result_weighted_distances);

            // Metadata
            client.query('SELECT * FROM sample_metadata WHERE sample_id=' + sampleID + '', (err, result_sample_metadata) => {

                // BLASTquery
                client.query('SELECT * FROM staphopia_blastquery', (err, result_blastquery) => {

                    // Sequencing Metrics
                    client.query('SELECT * FROM sequence_summary WHERE sample_id=' + sampleID + '', (err, result_sequence_summary) => {
                        //console.log(err, result_sequence_summary);

                        // Assembly Metrics
                        client.query('SELECT * FROM assembly_summary WHERE sample_id=' + sampleID + '', (err, result_assembly_summary) => {
                            //console.log(err, result_assembly_summary);

                    // MLST
                    client.query('SELECT * FROM mlst_mlst WHERE sample_id=' + sampleID + '', (err, result_mlst_mlst) => {

                        // SCCmec Primer Hits
                        client.query('SELECT * FROM sccmec_primers WHERE sample_id=' + sampleID + '', (err, result_sccmec_primers) => {

                            // SCCmec Subtype Hits
                            client.query('SELECT * FROM sccmec_subtypes WHERE sample_id=' + sampleID + '', (err, result_sccmec_subtypes) => {

                                // SCCmec Protien Hits
                                client.query('SELECT * FROM sccmec_proteins WHERE sample_id=' + sampleID + '', (err, result_sccmec_proteins) => {

                        // Samples with the same Sequence Type
                        let st = result_mlst_mlst.rows[0].st;
                        client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                            "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                            "sample_metadata.metadata->>'isolation_source' AS isolation_source, sample_sample.name, sample_sample.id " +
                            "FROM mlst_mlst  " +
                            "INNER JOIN sample_sample ON mlst_mlst.sample_id=sample_sample.id " +
                            "INNER JOIN sample_metadata ON mlst_mlst.sample_id=sample_metadata.sample_id " +
                            "WHERE mlst_mlst.sample_id IN (SELECT sample_id FROM sample_metadata " +
                            "WHERE st = '" + st + "')", (err, same_sequence) => {
                            number = number + same_sequence.rows.length;

                            // Samples with the same Location
                            let location = result_sample_metadata.rows[0].metadata.country;
                            client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                                "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                                "sample_metadata.metadata->>'isolation_source' AS isolation_source , sample_sample.name, sample_sample.id " +
                                "FROM sample_metadata INNER JOIN sample_sample ON sample_metadata.sample_id = sample_sample.id " +
                                "INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
                                "WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
                                "WHERE metadata->>'country' = '" + location + "')", (err, same_location) => {
                                console.log(err);
                                number = number + same_location.rows.length;

                                // Samples with the same Host
                                let host = result_sample_metadata.rows[0].metadata.host;
                                client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                                    "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                                    "sample_metadata.metadata->>'isolation_source' AS isolation_source , sample_sample.name, sample_sample.id " +
                                    "FROM sample_metadata " +
                                    "INNER JOIN sample_sample ON sample_metadata.sample_id=sample_sample.id " +
                                    "INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
                                    "WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
                                    "WHERE metadata->>'host' = '" + host + "')", (err, same_host) => {
                                    number = number + same_host.rows.length;

                                    // Samples with the same Isolation Source
                                    let iso = result_sample_metadata.rows[0].metadata.isolation_source;
                                    client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                                        "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                                        "sample_metadata.metadata->>'isolation_source' AS isolation_source , sample_sample.name, sample_sample.id " +
                                        "FROM sample_metadata " +
                                        "INNER JOIN sample_sample ON sample_metadata.sample_id=sample_sample.id " +
                                        "INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
                                        "WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
                                        "WHERE metadata->>'isolation_source' = '" + iso + "')", (err, same_isolation) => {
                                        number = number + same_isolation.rows.length;

                                        /**
                                        //favourites
                                        client.query('SELECT favourites FROM registered_users WHERE email=' + req.body.email + '', (err, result_registered_users) => {
                                            console.log(err, result_registered_users);
                                            will need to pass result_registered_users through res.render user_favourites: result_registered_users.rows
                                            **/

                                            // Samples genetically related to current sample
                                            knex.select('name').from('sample_sample').where('id', '=', sampleID).then((sampleName) => {
                                              knex.select('sample_sample.id', 'weighted_distance.distance', 'mlst_mlst.st', 'sample_metadata.metadata')
                                              .from('weighted_distance')
                                              .innerJoin('sample_sample', 'weighted_distance.comparison_sample', 'sample_sample.name')
                                              .innerJoin('sample_metadata', 'sample_sample.id', 'sample_metadata.sample_id')
                                              .innerJoin('mlst_mlst', 'sample_sample.id', 'mlst_mlst.sample_id')
                                              .where('weighted_distance.selected_sample', '=', sampleName[0].name)
                                              .orderBy('weighted_distance.distance', 'asc')
                                              .then((rows) => {

                                                let mainRelatedSampleDetails = []; // We desire only the main attributes
                                                rows.forEach(function (row) {
                                                  var detailedRow = {};
                                                  detailedRow.id = row.id;
                                                  detailedRow.distance = row.distance;
                                                  detailedRow.st = row.st;
                                                  detailedRow.country = row.metadata.country;
                                                  detailedRow.strain = row.metadata.strain;
                                                  detailedRow.host = row.metadata.host;
                                                  detailedRow.isolation_source = row.metadata.isolation_source;
                                                  mainRelatedSampleDetails.push(detailedRow);
                                                })

                                                res.render('pages/result', { sample_ID: sampleID, tag_tag: result_tag_tag.rows, isFavourited: isFavourited,
                                                    sample_metadata: result_sample_metadata.rows, mlst_mlst: result_mlst_mlst.rows, userLoggedIn: userLoggedIn, same_hosts: same_host.rows,
                                                    same_locations: same_location.rows, same_sequences: same_sequence.rows, staphopia_blatstquery: result_blastquery, sequence_summary: result_sequence_summary.rows,
                                                    same_isolations: same_isolation.rows, sccmec_primers: result_sccmec_primers.rows, assembly_summary: result_assembly_summary.rows,
                                                    sccmec_subtypes: result_sccmec_subtypes.rows, sccmec_proteins: result_sccmec_proteins.rows, weighted_distance: result_weighted_distances.rows,
                                                    all_weighted_distances: mainRelatedSampleDetails });

                                              })
                                            })


                                    });
                                });
                            });
                        });
                                });
                            });
                                });
                            });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// search results page
app.get('/searchResults', function (req, res) {
    if (req.session.userStatus == "loggedIn") {
        userLoggedIn = true;

    } else {
        userLoggedIn = false;
    }

    let input = req.query.searchInput;
    let option = req.query.searchOption;
    let number = 0;
	if (req.query.searchInput) {
		if(option == "Sequence"){
			client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
				"sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
				"sample_metadata.metadata->>'isolation_source' AS isolation_source " +
				"FROM mlst_mlst  INNER JOIN sample_metadata ON mlst_mlst.sample_id=sample_metadata.sample_id " +
				"WHERE mlst_mlst.sample_id IN (SELECT sample_id FROM sample_metadata " +
				"WHERE st = '" + input + "')", (err, result_samples) => {
				console.log(err, result_samples);
				number = result_samples.rows.length;
				res.render('pages/searchResults', { samples: result_samples.rows, input: input, option: option, number: number, userLoggedIn: userLoggedIn });
			});
		} else if(option == "Location"){
			client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
				"sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
				"sample_metadata.metadata->>'isolation_source' AS isolation_source " +
				"FROM sample_metadata INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
				"WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
				"WHERE metadata->>'country' ILIKE '%" + input + "%')", (err, result_samples) => {
				console.log(err, result_samples);
				number = result_samples.rows.length;
				res.render('pages/searchResults', { samples: result_samples.rows, input: input, option: option, number: number, userLoggedIn: userLoggedIn });
			});
		} else if(option == "Strain Name"){
			client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
				"sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
				"sample_metadata.metadata->>'isolation_source' AS isolation_source " +
				"FROM sample_metadata INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
				"WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
				"WHERE metadata->>'strain' ILIKE '%" + input + "%')", (err, result_samples) => {
				console.log(err, result_samples);
				number = result_samples.rows.length;
				res.render('pages/searchResults', { samples: result_samples.rows, input: input, option: option, number: number, userLoggedIn: userLoggedIn });
			});
		} else if(option == "Host"){
			client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
				"sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
				"sample_metadata.metadata->>'isolation_source' AS isolation_source " +
				"FROM sample_metadata INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
				"WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
				"WHERE metadata->>'host' ILIKE '%" + input + "%')", (err, result_samples) => {
				console.log(err, result_samples);
				number = result_samples.rows.length;
				res.render('pages/searchResults', { samples: result_samples.rows, input: input, option: option, number: number, userLoggedIn: userLoggedIn });
			});
		} else if(option == "Source"){
			client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
				"sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
				"sample_metadata.metadata->>'isolation_source' AS isolation_source " +
				"FROM sample_metadata INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
				"WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
				"WHERE metadata->>'isolation_source' ILIKE '%" + input + "%')", (err, result_samples) => {
				console.log(err, result_samples);
				number = result_samples.rows.length;
				res.render('pages/searchResults', { samples: result_samples.rows, input: input, option: option, number: number, userLoggedIn: userLoggedIn });
			});
        } else if(option == "Sample"){
            client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                "sample_metadata.metadata->>'isolation_source' AS isolation_source " +
                "FROM mlst_mlst  INNER JOIN sample_metadata ON mlst_mlst.sample_id=sample_metadata.sample_id " +
                "WHERE mlst_mlst.sample_id IN (SELECT sample_id FROM sample_metadata " +
                "WHERE sample_id = '" + input + "')", (err, result_samples) => {
                console.log(err, result_samples);
                number = result_samples.rows.length;
                res.render('pages/searchResults', { samples: result_samples.rows, input: input, option: option, number: number, userLoggedIn: userLoggedIn });
            });
        }
	} else {
		res.redirect('/');
	}
});

// Advanced search results page
app.get('/advSearchResults', function (req, res) {
    if (req.session.userStatus == "loggedIn") {
        userLoggedIn = true;

    } else {
        userLoggedIn = false;
    }

    let sequenceInput = req.query.sequenceInput;
    let startDate = req.query.inputDateStart;
    let endDate = req.query.inputDateEnd;
    let locationInput = req.query.locationInput;
    let strainInput = req.query.strainInput;
    let hostInput = req.query.hostInput;
    let sourceInput = req.query.sourceInput;
    if(strainInput == "" && sequenceInput=="" && startDate=="" && endDate=="" && locationInput=="" && hostInput=="" && sourceInput=="") {
        res.redirect('/advancedSearch');
    } else {
        let selectSQL = "";
        selectSQL = "SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
            "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
            "sample_metadata.metadata->>'isolation_source' AS isolation_source, sample_metadata.metadata->>'date_collected' AS date " +
            "FROM mlst_mlst  INNER JOIN sample_metadata ON mlst_mlst.sample_id=sample_metadata.sample_id " +
            "WHERE";
        if (sequenceInput != ""){
            selectSQL += " mlst_mlst.st = '" + sequenceInput + "'";
            if (locationInput != "" || strainInput != "" || hostInput != "" || sourceInput != "" || startDate != "" || endDate != ""){
                selectSQL += " AND ";
            }
        }
        if (startDate != "" || endDate != ""){
            if(endDate == ""){
                selectSQL += " CAST(metadata->>'collection_date' AS DATE) >= '" + startDate + "'";
            } else if (startDate == ""){
                selectSQL += " CAST(metadata->>'collection_date' AS DATE) <= '" + endDate + "'";
            } else{
                selectSQL += " CAST(metadata->>'collection_date' AS DATE) >= '" + startDate + "' AND  CAST(metadata->>'collection_date' AS DATE) <= '" + endDate + "'";
            }
            if (strainInput != "" || hostInput != "" || sourceInput != ""){
                selectSQL += " AND ";
            }
        }
        if (locationInput != ""){
            selectSQL += " metadata->>'country' ILIKE '%" + locationInput + "%'";
            if (strainInput != "" || hostInput != "" || sourceInput != ""){
                selectSQL += " AND ";
            }
        }
        if (strainInput != ""){
            selectSQL += " metadata->>'strain' ILIKE '%" + strainInput + "%'";
            if (hostInput != "" || sourceInput != ""){
                selectSQL += " AND ";
            }
        }
        if (hostInput != ""){
            selectSQL += " metadata->>'host' ILIKE '%" + hostInput + "%'";
            if (sourceInput != ""){
                selectSQL += " AND ";
            }
        }
        if (sourceInput != ""){
            selectSQL += " metadata->>'isolation_source' ILIKE '%" + sourceInput + "%' ";
        }
        console.log(selectSQL);

        client.query(selectSQL + ";", (err, result_samples) => {
            console.log(err, result_samples);
            number = result_samples.rows.length;
            res.render('pages/advSearchResults', { samples: result_samples.rows, number: number, userLoggedIn: userLoggedIn });
        });
    }
});


app.get('/login', function (req, res) {
    var userNotRegistered = false;
    creationSuccess = false;

	if (req.session.userStatus == true) {
        userLoggedIn = true;
    } else {
        userLoggedIn = false;
    }
    res.render('pages/login', { userLoggedIn: userLoggedIn, creationSuccess: creationSuccess, userNotRegistered: userNotRegistered });
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



/* favourites page
 *
 * Searches through the db based on user's email and finds associated favourited genome samples
 */
app.get('/favourites', function (req, res) {
    if (req.session.userStatus == "loggedIn") {
        userLoggedIn = true;

    } else {
        userLoggedIn = false;
    }

    // Initial values
    let favorites = [];
    let hasFavs = false;

    if (req.session.userStatus == "loggedIn") {
        userLoggedIn = true;
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        client.query("SELECT * FROM user_favorites WHERE email='" + email + "'", (err, fav_results) => {
            console.log(err, fav_results);
            if (fav_results.rows.length > 0) {
                haveFavs = true;
                haveSugs = true;
                let selectSQL = "";
                selectSQL = "SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                    "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                    "sample_metadata.metadata->>'isolation_source' AS isolation_source, sample_metadata.metadata->>'date_collected' AS date " +
                    "FROM mlst_mlst  INNER JOIN sample_metadata ON mlst_mlst.sample_id=sample_metadata.sample_id " +
                    "WHERE mlst_mlst.sample_id IN (SELECT sample_id FROM sample_metadata " +
                    "WHERE";

                for (let i = 0; i < fav_results.rows.length; i++) {
                    if (i == 0) {
                        selectSQL += " sample_id = " + fav_results.rows[i].sample_id + "";
                    }
                    selectSQL += " OR sample_id = " + fav_results.rows[i].sample_id + "";
                }

                client.query(selectSQL + ");", (err, favorites) => {
                    console.log(err, favorites);
                    console.log(haveFavs);
                    res.render('pages/favourites', { userLoggedIn: userLoggedIn, favorites: favorites.rows, haveFavs: haveFavs });
                });
			// no favourites found for current user
            } else {
				res.render('pages/favourites', { userLoggedIn: userLoggedIn, favorites: 0, haveFavs: false });
			}
        });

    }
});


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
app.post('/createAccount', function (req, res) {
    if (req.session.userStatus == "loggedIn") {
        userLoggedIn = true;

    } else {
        userLoggedIn = false;
    }

    var email = req.body.email;
	var organisation = req.body.organisation;
    var occupation = req.body.occupation;

    if (email != "") {

        bcrypt.hash(req.body.password, 10, function (err, hashedPassword) {

            client.query('SELECT * FROM registered_users WHERE email=\'' + req.body.email + '\'', (err, result_registered_users) => {
                console.log(err, result_registered_users);

                if (result_registered_users.rows.length != 0) {
                    userAlreadyExists = true;
                    console.log('User already entered into database');
                    res.render('pages/createAccount', { userLoggedIn: userLoggedIn, userAlreadyExists: userAlreadyExists });
                    return;
                } else {
                    client.query('INSERT INTO registered_users (email, password, organisation, occupation) VALUES (\''
                        + email + '\',\'' + hashedPassword + '\',\'' + organisation + '\',\'' + occupation + '\')',
                        function (error, results, fields) {
                            if (error) {
                                throw error;
                                res.redirect('/');
                            } else {
                                creationSuccess = true;
                                res.redirect('/login');
                            }
                        });
                }
            });
        });
    } else {
        userAlreadyExists = false;
        res.render('pages/createAccount', { userLoggedIn: userLoggedIn, userAlreadyExists: userAlreadyExists });

    }
});



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
app.post('/login', function (req, res) {
    if (req.session.userStatus == "loggedIn") {
        userLoggedIn = true;

    } else {
        userLoggedIn = false;
    }
    let favorites=[];
    let suggested=[];
    let haveFavs = false;
    let haveSugs = false;

    client.query('SELECT * FROM registered_users WHERE email=\'' + req.body.email + '\'', (err, result_registered_users) => {
        console.log(err, result_registered_users);

        if (result_registered_users.rows.length != 1) {
            console.log('user not registered');
            var userNotRegistered = true;
            res.render('pages/login', { userLoggedIn: userLoggedIn, creationSuccess: creationSuccess, userNotRegistered: userNotRegistered});
        } else {
            bcrypt.compare(req.body.password, result_registered_users.rows[0].password, function (err, result) {
                //if password matched DB password
                if (result) {
                    //setting the 'set-cookie' header
                    res.cookie('setCookie', req.body.email, {
                        httpOnly: true
                    });

                    req.session.userStatus = "loggedIn";
                    req.session.userEmail =  req.body.email;

                    userLoggedIn = true;
                    let value = req.session.userEmail;
                    let email = decodeURIComponent(value);
                    client.query("SELECT * FROM user_favorites WHERE email='" + email + "' LIMIT 4", (err, fav_results) => {
                        console.log(err, fav_results);
                        if(fav_results.rows.length > 0) {
                            haveFavs = true;
                            haveSugs = true;
                            let selectSQL = "";
                            selectSQL = "SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                                "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                                "sample_metadata.metadata->>'isolation_source' AS isolation_source, sample_metadata.metadata->>'date_collected' AS date " +
                                "FROM mlst_mlst  INNER JOIN sample_metadata ON mlst_mlst.sample_id=sample_metadata.sample_id " +
                                "WHERE mlst_mlst.sample_id IN (SELECT sample_id FROM sample_metadata " +
                                "WHERE";
                            if (fav_results.rows.length > 0) {
                                selectSQL += " sample_id = " + fav_results.rows[0].sample_id + "";
                            }
                            if (fav_results.rows.length > 1) {
                                selectSQL += " OR  sample_id = " + fav_results.rows[1].sample_id + "";
                            }
                            if (fav_results.rows.length > 2) {
                                selectSQL += " OR  sample_id = " + fav_results.rows[2].sample_id + "";
                            }
                            if (fav_results.rows.length > 3) {
                                selectSQL += " OR  sample_id = " + fav_results.rows[3].sample_id + "";
                            }
                            console.log(selectSQL);

                            client.query(selectSQL + ");", (err, favorites) => {

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
                                            console.log(haveFavs);
                                            res.render('pages/index', {
                                                userLoggedIn: userLoggedIn,
                                                favorites: favorites.rows,
                                                suggested: suggested.rows,
                                                haveFavs: haveFavs,
                                                haveSugs: haveSugs,
                                                creationSuccess: creationSuccess,
                                                userNotRegistered: userNotRegistered
                                            });
                                        });
                                    });
                                });
                            });
                        } else {
                            res.render('pages/index', {  userLoggedIn: userLoggedIn, creationSuccess: creationSuccess, userNotRegistered: userNotRegistered,
                                favorites: favorites.rows, suggested: suggested.rows, haveFavs: haveFavs, haveSugs: haveSugs });
                        }
                    });
                } else {
                    res.render('pages/login', { userLoggedIn: userLoggedIn, creationSuccess: creationSuccess, userNotRegistered: userNotRegistered,
                        favorites: favorites.rows, suggested: suggested.rows, haveFavs: haveFavs, haveSugs: haveSugs});
                }
            });
        }
    });
});



/* Results page
 *
 * Updates the favourites db for the current user based on the user's email and also updates
 * the isFavourited value (0 = false, 1 = true) which is sent through to the HTML scripts
 * Then queries the db for the genome sample details to display in results table and cytoscape scripts
 */
app.post('/result', function (req, res) {
    if (req.session.userStatus == "loggedIn") {
        userLoggedIn = true;

    } else {
        userLoggedIn = false;
    }
    let email = "NA";
    let number = 0;
    let sampleID = req.session.prevSample;


    let isFavourited = req.session.favourited;

    // if isFavourited is 'false', set it to 'true'
    if (isFavourited == 0) {
        if (userLoggedIn){
            let value = req.session.userEmail;
            let email = decodeURIComponent(value);
            client.query("SELECT * FROM user_favorites WHERE email='" + email + "' AND sample_id=" + sampleID + "", (err, fav_results) => {
                console.log(err, fav_results);
                if(fav_results.rows.length < 1){
                    client.query('INSERT INTO user_favorites (email, sample_id) VALUES (\''
                        + email + '\',\'' + sampleID + '\')',
                        function (error, results, fields) {
                            if (error) {
                                throw error;
                            }
                        });
                }
            });
        }

        isFavourited = 1;
    } else if (isFavourited == 1) { // isFavourited is set to 'true', so set it to 'false'
        if (userLoggedIn){
            let value = req.session.userEmail;
            let email = decodeURIComponent(value);
            console.log("=============================================================");
            client.query("SELECT * FROM user_favorites WHERE email='" + email + "' AND sample_id=" + sampleID + "", (err, fav_results) => {
                console.log(err, fav_results);
                if(fav_results.rows.length > 0){
                    client.query("DELETE FROM user_favorites WHERE email='" + email + "' AND sample_id=" + sampleID + "",
                        function (error, results, fields) {
                            if (error) {
                                throw error;
                            }
                        });
                }
            });
        }
        isFavourited = 0;
    }
    // update session to reflect new value
    req.session.favourited = isFavourited;



    // Tags
    client.query('SELECT tag_id FROM tag_tosample WHERE sample_id=' + sampleID + '', (err, result_tag_tosample) => {
        //console.log(err, result_tag_tosample);
        let tagID = result_tag_tosample.rows[0].tag_id;
        client.query('SELECT * FROM tag_tag WHERE id=' + tagID + '', (err, result_tag_tag) => {

            client.query('SELECT name FROM sample_sample WHERE id=' + sampleID + '', (err, result_sample_sample) => {
                console.log(err);
                let sampleName = result_sample_sample.rows[0].name;

                client.query("SELECT * FROM weighted_distance WHERE selected_sample='" + sampleName + "'", (err, result_weighted_distances) => {
                  console.log('TESTING');
                  console.log(err, JSON.stringify(result_weighted_distances.rows));

            // Metadata
            client.query('SELECT * FROM sample_metadata WHERE sample_id=' + sampleID + '', (err, result_sample_metadata) => {

                // BLASTquery
                client.query('SELECT * FROM staphopia_blastquery', (err, result_blastquery) => {

                    // Sequencing Metrics
                    client.query('SELECT * FROM sequence_summary WHERE sample_id=' + sampleID + '', (err, result_sequence_summary) => {
                        //console.log(err, result_sequence_summary);

                        // Assembly Metrics
                        client.query('SELECT * FROM assembly_summary WHERE sample_id=' + sampleID + '', (err, result_assembly_summary) => {
                            //console.log(err, result_assembly_summary);

                            // MLST
                            client.query('SELECT * FROM mlst_mlst WHERE sample_id=' + sampleID + '', (err, result_mlst_mlst) => {

                                // SCCmec Primer Hits
                                client.query('SELECT * FROM sccmec_primers WHERE sample_id=' + sampleID + '', (err, result_sccmec_primers) => {

                                    // SCCmec Subtype Hits
                                    client.query('SELECT * FROM sccmec_subtypes WHERE sample_id=' + sampleID + '', (err, result_sccmec_subtypes) => {

                                        // SCCmec Protien Hits
                                        client.query('SELECT * FROM sccmec_proteins WHERE sample_id=' + sampleID + '', (err, result_sccmec_proteins) => {

                                            // Samples with the same Sequence Type
                                            let st = result_mlst_mlst.rows[0].st;
                                            client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                                                "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                                                "sample_metadata.metadata->>'isolation_source' AS isolation_source, sample_sample.name, sample_sample.id " +
                                                "FROM mlst_mlst  " +
                                                "INNER JOIN sample_sample ON mlst_mlst.sample_id=sample_sample.id " +
                                                "INNER JOIN sample_metadata ON mlst_mlst.sample_id=sample_metadata.sample_id " +
                                                "WHERE mlst_mlst.sample_id IN (SELECT sample_id FROM sample_metadata " +
                                                "WHERE st = '" + st + "')", (err, same_sequence) => {
                                                number = number + same_sequence.rows.length;

                                                // Samples with the same Location
                                                let location = result_sample_metadata.rows[0].metadata.country;
                                                client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                                                    "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                                                    "sample_metadata.metadata->>'isolation_source' AS isolation_source , sample_sample.name, sample_sample.id " +
                                                    "FROM sample_metadata INNER JOIN sample_sample ON sample_metadata.sample_id = sample_sample.id " +
                                                    "INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
                                                    "WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
                                                    "WHERE metadata->>'country' = '" + location + "')", (err, same_location) => {
                                                    console.log(err);
                                                    number = number + same_location.rows.length;

                                                    // Samples with the same Host
                                                    let host = result_sample_metadata.rows[0].metadata.host;
                                                    client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                                                        "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                                                        "sample_metadata.metadata->>'isolation_source' AS isolation_source , sample_sample.name, sample_sample.id " +
                                                        "FROM sample_metadata " +
                                                        "INNER JOIN sample_sample ON sample_metadata.sample_id=sample_sample.id " +
                                                        "INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
                                                        "WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
                                                        "WHERE metadata->>'host' = '" + host + "')", (err, same_host) => {
                                                        number = number + same_host.rows.length;

                                                        // Samples with the same Isolation Source
                                                        let iso = result_sample_metadata.rows[0].metadata.isolation_source;
                                                        client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                                                            "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                                                            "sample_metadata.metadata->>'isolation_source' AS isolation_source , sample_sample.name, sample_sample.id " +
                                                            "FROM sample_metadata " +
                                                            "INNER JOIN sample_sample ON sample_metadata.sample_id=sample_sample.id " +
                                                            "INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
                                                            "WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
                                                            "WHERE metadata->>'isolation_source' = '" + iso + "')", (err, same_isolation) => {
                                                            number = number + same_isolation.rows.length;

                                                                            /**
                                                                            //favourites
                                                                            client.query('SELECT favourites FROM registered_users WHERE email=' + req.body.email + '', (err, result_registered_users) => {
                                                                                console.log(err, result_registered_users);
                                                                                will need to pass result_registered_users through res.render user_favourites: result_registered_users.rows
                                                                                **/
                                                                            res.render('pages/result', {
                                                                                sample_ID: sampleID, tag_tag: result_tag_tag.rows, sampleID: sampleID, isFavourited: isFavourited,
                                                                                sample_metadata: result_sample_metadata.rows, mlst_mlst: result_mlst_mlst.rows, userLoggedIn: userLoggedIn, same_hosts: same_host.rows,
                                                                                same_locations: same_location.rows, same_sequences: same_sequence.rows, staphopia_blatstquery: result_blastquery, sequence_summary: result_sequence_summary.rows,
                                                                                same_isolations: same_isolation.rows, sccmec_primers: result_sccmec_primers.rows, assembly_summary: result_assembly_summary.rows,
                                                                                sccmec_subtypes: result_sccmec_subtypes.rows, sccmec_proteins: result_sccmec_proteins.rows, weighted_distance: result_weighted_distances.rows
                                                                            });
                                                                        });
                                                                });
                                                        });
                                                });
                                        });
                                    });
                                });
                            });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});


/* Favourites page
 *
 * Removes favourites from user account and db
 */
app.post('/favourites', function (req, res) {
    if (req.session.userStatus == "loggedIn") {
        userLoggedIn = true;

    } else {
        userLoggedIn = false;
    }

    let sampleID = req.body.favouritedSampleID;
    console.log("this is the sampleID: " + sampleID);

    if (userLoggedIn) {
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        console.log("=============================================================");
        client.query("SELECT * FROM user_favorites WHERE email='" + email + "' AND sample_id=" + sampleID + "", (err, fav_results) => {
            console.log(err, fav_results);

            if (fav_results.rows.length > 0) {
                client.query("DELETE FROM user_favorites WHERE email='" + email + "' AND sample_id=" + sampleID + "",
                    function (error, results, fields) {
                        if (error) {
                            throw error;
                        }
                    });
                // Initial values
                let favorites = [];
                let hasFavs = false;

                if (req.session.userStatus == "loggedIn") {
                    userLoggedIn = true;
                    let value = req.session.userEmail;
                    let email = decodeURIComponent(value);
                    client.query("SELECT * FROM user_favorites WHERE email='" + email + "'", (err, fav_results) => {
                        console.log(err, fav_results);
                        if (fav_results.rows.length > 0) {
                            haveFavs = true;
                            haveSugs = true;
                            let selectSQL = "";
                            selectSQL = "SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                                "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                                "sample_metadata.metadata->>'isolation_source' AS isolation_source, sample_metadata.metadata->>'date_collected' AS date " +
                                "FROM mlst_mlst  INNER JOIN sample_metadata ON mlst_mlst.sample_id=sample_metadata.sample_id " +
                                "WHERE mlst_mlst.sample_id IN (SELECT sample_id FROM sample_metadata " +
                                "WHERE";

                            for (let i = 0; i < fav_results.rows.length; i++) {
                                if (i == 0) {
                                    selectSQL += " sample_id = " + fav_results.rows[i].sample_id + "";
                                } else {
									selectSQL += " OR sample_id = " + fav_results.rows[i].sample_id + "";
								}
                            }

                            client.query(selectSQL + ");", (err, favorites) => {
                                console.log(err, favorites);
                                console.log(haveFavs);
                                res.render('pages/favourites', { userLoggedIn: userLoggedIn, favorites: favorites.rows, haveFavs: true });
                            });
						// no favourites found for current user
                        } else {
							res.render('pages/favourites', { userLoggedIn: userLoggedIn, favorites: 0, haveFavs: false });
						}
                    });


                }

            }
        });

    }

});


/*
 * --------------------------------------------------------------------------------
 */


app.listen(8000);
console.log('8000 is the magic port');
