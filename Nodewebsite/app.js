// load the things we need
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const cookie = require('cookie');
//cookie parser
const cookieParser = require('cookie-parser');
app.use(cookieParser('xoxoGossipGirl'));

//postgreSQL
const { Pool, Client } = require('pg');
//layout is const connectionString = 'postgresql://username:password@address/Database_name';
//const connectionString = 'postgresql://postgres:12345@127.0.0.1:5432/staph';
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

//directories
app.use(express.static(__dirname + '/views/'));

// set the view engine to ejs
app.set('view engine', 'ejs');

// global variable
var userLoggedIn;


/*
** GET routes
*/

// index page
app.get('/', function (req, res) {
	if (req.headers.cookie) {
        userLoggedIn = true;
        console.log('req headers cookie if statement cookie test @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');

    } else {
        userLoggedIn = false;
    }
    res.render('pages/index', { userLoggedIn: userLoggedIn });
});

// advanced search page
app.get('/advancedSearch', function (req, res) {
	if (req.headers.cookie) {
        userLoggedIn = true;
        console.log('req headers cookie if statement cookie test @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');

    } else {
        userLoggedIn = false;
    }
    res.render('pages/advancedSearch', { userLoggedIn: userLoggedIn });
});

// account creation page page
app.get('/createAccount', function (req, res) {
	if (req.headers.cookie) {
        userLoggedIn = true;
        console.log('req headers cookie if statement cookie test @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');

    } else {
        userLoggedIn = false;
    }
	
    res.render('pages/createAccount', { userLoggedIn: userLoggedIn });
});

// result page
app.get('/result', function (req, res) {
	if (req.headers.cookie) {
        userLoggedIn = true;
        console.log('req headers cookie if statement cookie test @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');

    } else {
        userLoggedIn = false;
    }
    let number = 0;
    let sampleID = req.query.sampleSelection;

    // Tags
    client.query('SELECT tag_id FROM tag_tosample WHERE sample_id=' + sampleID + '', (err, result_tag_tosample) => {
        console.log(err, result_tag_tosample);
        let tagID = result_tag_tosample.rows[0].tag_id;
        client.query('SELECT * FROM tag_tag WHERE id=' + tagID + '', (err, result_tag_tag) => {
            console.log(err, result_tag_tag);

            // Metadata
            client.query('SELECT * FROM sample_metadata WHERE sample_id=' + sampleID + '', (err, result_sample_metadata) => {
                console.log(err, result_sample_metadata);

                // MLST
                client.query('SELECT * FROM mlst_mlst WHERE sample_id=' + sampleID + '', (err, result_mlst_mlst) => {
                    console.log(err, result_mlst_mlst);

                    // Samples with the same Sequence Type
                    let st = result_mlst_mlst.rows[0].st;
                    client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                        "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                        "sample_metadata.metadata->>'isolation_source' AS isolation_source " +
                        "FROM mlst_mlst  INNER JOIN sample_metadata ON mlst_mlst.sample_id=sample_metadata.sample_id " +
                        "WHERE mlst_mlst.sample_id IN (SELECT sample_id FROM sample_metadata " +
                        "WHERE st = '" + st + "')", (err, same_sequence) => {
                        console.log(err, same_sequence);
                        number = number + same_sequence.rows.length;

                        // Samples with the same Location
                        let location = result_sample_metadata.rows[0].metadata.country;
                        client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                            "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                            "sample_metadata.metadata->>'isolation_source' AS isolation_source " +
                            "FROM sample_metadata INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
                            "WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
                            "WHERE metadata->>'country' = '" + location + "')", (err, same_location) => {
                            console.log(err, same_location);
                            number = number + same_location.rows.length;

                            // Samples with the same Host
                            let host = result_sample_metadata.rows[0].metadata.host;
                            client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                                "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                                "sample_metadata.metadata->>'isolation_source' AS isolation_source " +
                                "FROM sample_metadata INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
                                "WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
                                "WHERE metadata->>'host' = '" + host + "')", (err, same_host) => {
                                console.log(err, same_host);
                                number = number + same_host.rows.length;

                                // Samples with the same Isolation Source
                                let iso = result_sample_metadata.rows[0].metadata.isolation_source;
                                client.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                                    "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                                    "sample_metadata.metadata->>'isolation_source' AS isolation_source " +
                                    "FROM sample_metadata INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
                                    "WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
                                    "WHERE metadata->>'isolation_source' = '" + iso + "')", (err, same_isolation) => {
                                    console.log(err, same_isolation);
                                    number = number + same_isolation.rows.length;

                                    /**
                                    //favourites
                                    client.query('SELECT favourites FROM registered_users WHERE email=' + req.body.email + '', (err, result_registered_users) => {
                                        console.log(err, result_registered_users);
                                        will need to pass result_registered_users through res.render user_favourites: result_registered_users.rows
                                        **/
                                    console.log(sampleID);
                                    res.render('pages/result', { sample_ID: sampleID, tag_tag: result_tag_tag.rows,
                                        sample_metadata: result_sample_metadata.rows, mlst_mlst: result_mlst_mlst.rows, userLoggedIn: userLoggedIn, same_hosts: same_host.rows,
                                        same_locations: same_location.rows, same_sequences: same_sequence.rows, same_isolations: same_isolation.rows});
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
	if (req.headers.cookie) {
        userLoggedIn = true;
        console.log('req headers cookie if statement cookie test @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');

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
    if (req.headers.cookie) {
        userLoggedIn = true;
        console.log('req headers cookie if statement cookie test @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');

    } else {
        userLoggedIn = false;
    }

    let sequenceInput = req.query.sequenceInput;
    let locationInput = req.query.locationInput;
    let strainInput = req.query.strainInput;
    let hostInput = req.query.hostInput;
    let sourceInput = req.query.sourceInput;
    if(strainInput == "") {
        //strainInput=null;
    }
    let selectSQL = "";
    selectSQL = "SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
        "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
        "sample_metadata.metadata->>'isolation_source' AS isolation_source " +
        "FROM mlst_mlst  INNER JOIN sample_metadata ON mlst_mlst.sample_id=sample_metadata.sample_id " +
        "WHERE";
    if (sequenceInput != ""){
        selectSQL += " mlst_mlst.st = '" + sequenceInput + "'";
        if (locationInput != "" || strainInput != "" || hostInput != "" || sourceInput != ""){
            selectSQL += " AND ";
        }
    }
    if (locationInput != ""){
        selectSQL += "metadata->>'country' ILIKE '%" + locationInput + "%'";
        if (strainInput != "" || hostInput != "" || sourceInput != ""){
            selectSQL += " AND ";
        }
    }
    if (strainInput != ""){
        selectSQL += "metadata->>'strain' ILIKE '%" + strainInput + "%'";
        if (hostInput != "" || sourceInput != ""){
            selectSQL += " AND ";
        }
    }
    if (hostInput != ""){
        selectSQL += "metadata->>'host' ILIKE '%" + hostInput + "%'";
        if (sourceInput != ""){
            selectSQL += " AND ";
        }
    }
    if (sourceInput != ""){
        selectSQL += "metadata->>'isolation_source' ILIKE '%" + sourceInput + "%' ";
    }
    console.log(selectSQL);

    if (req.query.sequenceInput) {
        client.query(selectSQL + ";", (err, result_samples) => {
            console.log(err, result_samples);
            number = result_samples.rows.length;
            res.render('pages/advSearchResults', { samples: result_samples.rows, number: number, userLoggedIn: userLoggedIn });
        });
    //} else {
        //res.redirect('/advancedSearch');
    }
});


app.get('/login', function (req, res) {
	if (req.headers.cookie) {
        userLoggedIn = true;
        console.log('req headers cookie if statement cookie test @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');

    } else {
        userLoggedIn = false;
    }
    console.log('rendered');
    res.render('pages/login', { userLoggedIn: userLoggedIn } );
});

app.get('/logout', function (req, res) {
    res.clearCookie('setCookie');
    res.redirect('/');
});


/*
** POST routes
*/

// account creation page page
app.post('/createAccount', function (req, res) {
	if (req.headers.cookie) {
        userLoggedIn = true;
        console.log('req headers cookie if statement cookie test @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');

    } else {
        userLoggedIn = false;
    }
	
    console.log("Create account - post method");

    var email = req.body.email;
    var organisation = req.body.organisation;
    var occupation = req.body.occupation;


    bcrypt.hash(req.body.password, 10, function (err, hashedPassword) {

        client.query('INSERT INTO registered_users (email, password, organisation, occupation) VALUES (\''
            + email + '\',\'' + hashedPassword + '\',\'' + organisation + '\',\'' + occupation + '\')',
            function (error, results, fields) {
                if (error) {
                    throw error;
                } else {
                    console.log("User inserted to db successfully");
                }
            });

    });
    res.render('/login', { userLoggedIn: userLoggedIn });
});

 // login page
app.post('/login', function (req, res) {
	if (req.headers.cookie) {
        userLoggedIn = true;
        console.log('req headers cookie if statement cookie test @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');

    } else {
        userLoggedIn = false;
    }

    console.log('post login');

    client.query('SELECT * FROM registered_users WHERE email=\'' + req.body.email + '\'', (err, result_registered_users) => {
        console.log(err, result_registered_users);

        if (err) {
            throw err;
        };

        if (result_registered_users.rows.length > 0 && result_registered_users.rows.length != 1) {
            throw err;
            console.log('Failed to find exactly one user');
        };

        bcrypt.compare(req.body.password, result_registered_users.rows[0].password, function (err, result) {
            //if password matched DB password
            if (result) {
                //setting the 'set-cookie' header

                res.cookie('setCookie', req.body.email, {
                    httpOnly: true
                });
				
				userLoggedIn = true;


                res.render('pages/index', { userLoggedIn: userLoggedIn });
            } else {
                res.send("Invalid password!")
            }
        });
    });
});


app.listen(8000);
console.log('8000 is the magic port');