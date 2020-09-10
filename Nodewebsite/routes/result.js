var express = require('express')
var router = express.Router()
let url = require('url')

// result page
router.get('/', function (req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
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
        req.db.query("SELECT * FROM user_favorites WHERE email='" + email + "' AND sample_id=" + sampleID + "", (err, fav_results) => {
            console.log(err, fav_results);
            if (fav_results.rows.length > 0) {
                isFavourited = 1; //set to "true"

                req.session.favourited = isFavourited;

            }
        });
    }


    // Tags
    req.db.query('SELECT tag_id FROM tag_tosample WHERE sample_id=' + sampleID + '', (err, result_tag_tosample) => {
        //console.log(err, result_tag_tosample);

        try {
            let tagID = result_tag_tosample.rows[0].tag_id;
            req.db.query('SELECT * FROM tag_tag WHERE id=' + tagID + '', (err, result_tag_tag) => {

                // Sample Name
                req.db.query('SELECT name FROM sample_sample WHERE id=' + sampleID + '', (err, result_sample_sample) => {
                    console.log(err, result_tag_tosample);
                    let sampleName = result_sample_sample.rows[0].name;

                    // Sample's weighted distances
                    req.db.query("SELECT * FROM weighted_distance WHERE selected_sample='" + sampleName + "'", (err, result_weighted_distances) => {
                        //console.log(err, result_weighted_distances);

                        // Metadata
                        req.db.query('SELECT * FROM sample_metadata WHERE sample_id=' + sampleID + '', (err, result_sample_metadata) => {

                            // BLASTquery
                            req.db.query('SELECT * FROM staphopia_blastquery', (err, result_blastquery) => {

                                // Sequencing Metrics
                                req.db.query('SELECT * FROM sequence_summary WHERE sample_id=' + sampleID + '', (err, result_sequence_summary) => {
                                    //console.log(err, result_sequence_summary);

                                    // Assembly Metrics
                                    req.db.query('SELECT * FROM assembly_summary WHERE sample_id=' + sampleID + '', (err, result_assembly_summary) => {
                                        //console.log(err, result_assembly_summary);

                                        // MLST
                                        req.db.query('SELECT * FROM mlst_mlst WHERE sample_id=' + sampleID + '', (err, result_mlst_mlst) => {

                                            // SCCmec Primer Hits
                                            req.db.query('SELECT * FROM sccmec_primers WHERE sample_id=' + sampleID + '', (err, result_sccmec_primers) => {

                                                // SCCmec Subtype Hits
                                                req.db.query('SELECT * FROM sccmec_subtypes WHERE sample_id=' + sampleID + '', (err, result_sccmec_subtypes) => {

                                                    // SCCmec Protien Hits
                                                    req.db.query('SELECT * FROM sccmec_proteins WHERE sample_id=' + sampleID + '', (err, result_sccmec_proteins) => {

                                                        // Samples with the same Sequence Type
                                                        let st = result_mlst_mlst.rows[0].st;
                                                        req.db.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
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
                                                            req.db.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
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
                                                                req.db.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
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
                                                                    req.db.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
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
                                                                         req.db.query('SELECT favourites FROM registered_users WHERE email=' + req.body.email + '', (err, result_registered_users) => {
                                              console.log(err, result_registered_users);
                                              will need to pass result_registered_users through res.render user_favourites: result_registered_users.rows
                                                                         **/

                                                                        // Samples genetically related to current sample
                                                                        req.knex.select('name').from('sample_sample').where('id', '=', sampleID).then((sampleName) => {
                                                                            req.knex.select('sample_sample.id', 'weighted_distance.distance', 'mlst_mlst.st', 'sample_metadata.metadata')
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
        }
        catch (err) {
            res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
        }

    });
});

router.post('/', function (req, res) {
    let userLoggedIn = false;
    if(req.session.userStatus === "loggedIn") {
        userLoggedIn = true;

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
            req.db.query("SELECT * FROM user_favorites WHERE email='" + email + "' AND sample_id=" + sampleID + "", (err, fav_results) => {
                console.log(err, fav_results);
                if(fav_results.rows.length < 1){
                    req.db.query('INSERT INTO user_favorites (email, sample_id) VALUES (\''
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
    }
    else if (isFavourited == 1) { // isFavourited is set to 'true', so set it to 'false'
        if (userLoggedIn){
            let value = req.session.userEmail;
            let email = decodeURIComponent(value);
            console.log("=============================================================");
            req.db.query("SELECT * FROM user_favorites WHERE email='" + email + "' AND sample_id=" + sampleID + "", (err, fav_results) => {
                console.log(err, fav_results);
                if(fav_results.rows.length > 0){
                    req.db.query("DELETE FROM user_favorites WHERE email='" + email + "' AND sample_id=" + sampleID + "",
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

    res.redirect(url.format({
        pathname: "/result",
        query: {
            sampleSelection: sampleID
        }
    }))
});

module.exports = router;