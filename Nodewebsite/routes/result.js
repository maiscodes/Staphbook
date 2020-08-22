var express = require('express')
var router = express.Router()
let url = require('url')

// Result page endpoint
router.get('/', function (req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }
    //let number = 0;
    let sampleID = req.query.sampleSelection;
    req.session.prevSample = sampleID;

    req.session.favourited = false; // Assume that sample is not favorited before check

    if (userLoggedIn){
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        req.knex.select('*').from('user_favorites').where({email: email, sample_id: sampleID}).then((fav_results) => {
            //console.log(`Results are: ${JSON.stringify(fav_results)}`);
            if (fav_results.length > 0) {
                req.session.favourited = true;

            }
        });
    }

    // TODO: Find the current groups of sample

    // Tags
    req.knex.select('tag_id').from('tag_tosample').where({sample_id: sampleID}).then((result_tag_tosample) => {

        try {
            let tagID = result_tag_tosample[0].tag_id;
            req.knex.select('*').from('tag_tag').where({id: tagID}).then((result_tag_tag) => {

                // Sample Name
                req.knex.select('name').from('sample_sample').where({id: sampleID}).then((result_sample_sample) => {
                    let sampleName = result_sample_sample[0].name;

                    // Sample's weighted distances
                    req.knex.select('*').from('weighted_distance').where({selected_sample: sampleName}).then((result_weighted_distances) => {

                        // Metadata
                        req.knex.select('*').from('sample_metadata').where({sample_id: sampleID}).then((result_sample_metadata) => {

                            // BLASTquery
                            req.knex.select('*').from('staphopia_blastquery').then((result_blastquery) => {

                                // Sequencing Metrics
                                req.knex.select('*').from('sequence_summary').where({sample_id: sampleID}).then((result_sequence_summary) => {

                                    // Assembly Metrics
                                    req.knex.select('*').from('assembly_summary').where({sample_id: sampleID}).then((result_assembly_summary) => {

                                        // MLST
                                        req.knex.select('*').from('mlst_mlst').where({sample_id: sampleID}).then((result_mlst_mlst) => {

                                            // SCCmec Primer Hits
                                            req.knex.select('*').from('sccmec_primers').where({sample_id: sampleID}).then((result_sccmec_primers) => {

                                                // SCCmec Subtype Hits
                                                req.knex.select('*').from('sccmec_subtypes').where({sample_id: sampleID}).then((result_sccmec_subtypes) => {

                                                    // SCCmec Protien Hits
                                                    req.knex.select('*').from('sccmec_proteins').where({sample_id: sampleID}).then((result_sccmec_proteins) => {

                                                        // Samples with the same Sequence Type
                                                        let st = result_mlst_mlst[0].st;
                                                        console.log(st);
                                                        let same_sequence_samples = req.knex.select('sample_id').from('sample_metadata').where({st: st});
                                                        req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                                                        name: 'sample_sample.name', id: 'sample_sample.id'}) //TODO: refactor so id is removed
                                                            .from('mlst_mlst')
                                                            .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                                                            .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                                                            .where('mlst_mlst.sample_id', 'in', same_sequence_samples)
                                                            .then((same_sequence) => {
                                                              for(same of same_sequence) { // Make backwards compatible, TODO: keep as metadata later
                                                                same.country = same.metadata.country;
                                                                same.strain = same.metadata.strain;
                                                                same.host = same.metadata.host;
                                                                same.isolation_source = same.metadata.isolation_source;
                                                              }
                                                            //number = number + same_sequence.length;


                                                            // Samples with the same Location
                                                            let location = result_sample_metadata[0].metadata.country;
                                                            // console.log(location);
                                                            if (location == undefined) {
                                                              location = "";
                                                            }
                                                            let same_location_samples = req.knex.select('sample_id').from('sample_metadata').whereRaw('metadata->>? = ?', ['country', location]);
                                                            req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                                                            name: 'sample_sample.name', id: 'sample_sample.id'})
                                                                .from('mlst_mlst')
                                                                .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                                                                .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                                                                .where('mlst_mlst.sample_id', 'in', same_location_samples)
                                                                .then((same_location) => {
                                                                  for(same of same_location) {
                                                                    same.country = same.metadata.country;
                                                                    same.strain = same.metadata.strain;
                                                                    same.host = same.metadata.host;
                                                                    same.isolation_source = same.metadata.isolation_source;
                                                                  }
                                                                //number = number + same_location.length;


                                                                // Samples with the same Host
                                                                let host = result_sample_metadata[0].metadata.host;
                                                                if (host == undefined) {
                                                                  host = "";
                                                                }
                                                                // console.log(host);
                                                                let same_host_samples = req.knex.select('sample_id').from('sample_metadata').whereRaw('metadata->>? = ?', ['host', host]);
                                                                req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                                                                name: 'sample_sample.name', id: 'sample_sample.id'})
                                                                    .from('mlst_mlst')
                                                                    .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                                                                    .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                                                                    .where('mlst_mlst.sample_id', 'in', same_host_samples)
                                                                    .then((same_host) => {
                                                                      for(same of same_location) {
                                                                        same.country = same.metadata.country;
                                                                        same.strain = same.metadata.strain;
                                                                        same.host = same.metadata.host;
                                                                        same.isolation_source = same.metadata.isolation_source;
                                                                      }
                                                                    //number = number + same_host.length;

                                                                    // Samples with the same Isolation Source
                                                                    let iso = result_sample_metadata[0].metadata.isolation_source;
                                                                    if (iso == undefined) {
                                                                      iso = "";
                                                                    }
                                                                    // console.log(iso);
                                                                    let same_iso_samples = req.knex.select('sample_id').from('sample_metadata').whereRaw('metadata->>? = ?', ['isolation_source', iso]);
                                                                    req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                                                                    name: 'sample_sample.name', id: 'sample_sample.id'})
                                                                        .from('mlst_mlst')
                                                                        .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                                                                        .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                                                                        .where('mlst_mlst.sample_id', 'in', same_iso_samples)
                                                                        .then((same_isolation) => {
                                                                          for(same of same_location) {
                                                                            same.country = same.metadata.country;
                                                                            same.strain = same.metadata.strain;
                                                                            same.host = same.metadata.host;
                                                                            same.isolation_source = same.metadata.isolation_source;
                                                                          }
                                                                        //number = number + same_isolation.length;

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

                                                                                    res.render('pages/result', { sample_ID: sampleID, tag_tag: result_tag_tag, isFavourited: req.session.favourited,
                                                                                        sample_metadata: result_sample_metadata, mlst_mlst: result_mlst_mlst, userLoggedIn: userLoggedIn, same_hosts: same_host,
                                                                                        same_locations: same_location, same_sequences: same_sequence, staphopia_blatstquery: result_blastquery, sequence_summary: result_sequence_summary,
                                                                                        same_isolations: same_isolation, sccmec_primers: result_sccmec_primers, assembly_summary: result_assembly_summary,
                                                                                        sccmec_subtypes: result_sccmec_subtypes, sccmec_proteins: result_sccmec_proteins, weighted_distance: result_weighted_distances,
                                                                                        all_weighted_distances: mainRelatedSampleDetails });

                                                                                }).catch(function(err) {
                                                                                  console.log(err);
                                                                                  res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                                                                                });

                                                                        }).catch(function(err) {
                                                                          console.log(err);
                                                                          res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                                                                        });
                                                                    }).catch(function(err) {
                                                                      console.log(err);
                                                                      res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                                                                    });
                                                                }).catch(function(err) {
                                                                  console.log(err);
                                                                  res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                                                                });
                                                            }).catch(function(err) {
                                                              console.log(err);
                                                              res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                                                            });
                                                        }).catch(function(err) {
                                                          console.log(err);
                                                          res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                                                        });
                                                    }).catch(function(err) {
                                                      console.log(err);
                                                      res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                                                    });
                                                }).catch(function(err) {
                                                  console.log(err);
                                                  res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                                                });
                                            }).catch(function(err) {
                                              console.log(err);
                                              res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                                            });
                                        }).catch(function(err) {
                                          console.log(err);
                                          res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                                        });
                                    }).catch(function(err) {
                                      console.log(err);
                                      res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                                    });
                                }).catch(function(err) {
                                  console.log(err);
                                  res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                                });
                            }).catch(function(err) {
                              console.log(err);
                              res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                            });
                        }).catch(function(err) {
                          console.log(err);
                          res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                        });
                    }).catch(function(err) {
                      console.log(err);
                      res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                    });
                }).catch(function(err) {
                  console.log(err);
                  res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
                });
            }).catch(function(err) {
              console.log(err);
              res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
            });
        }
        catch (err) {
            res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
        }

    }).catch(function(err) {
      console.log(err);
      res.render('pages/error', { sample_ID: sampleID, userLoggedIn: userLoggedIn });
    });
});

// Favorites endpoint
router.post('/', function (req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }
    let email = "NA";
    //let number = 0;
    let sampleID = req.session.prevSample;

    // Async programming, because javascript
    const getFavorite = async () => {
      return !req.session.favourited;
    }

    getFavorite().then((isFavourited) => {
      console.log(isFavourited);
      req.session.favourited = isFavourited;

      if (!isFavourited && userLoggedIn ) {
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        // Delete from database, if record exists
        req.knex('user_favorites')
        .where({email: email, sample_id: sampleID})
        .del()
        .then((result) => {
          console.log(`User favorites record ${email}-${sampleID} has been deleted successfully`);
        })
        .catch((error) => {
          console.log(`User favourites record ${email}-${sampleID} does not exist and cannot be deleted`);
        })
      }
      else if (isFavourited && userLoggedIn){ // isFavourited is set to 'true', so set it to 'false'
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        console.log(email);
        // Unique constraint applied in postgres database
        req.knex('user_favorites')
        .insert({email: email, sample_id: sampleID})
        .then((result) => {
          console.log(`${sampleID} added to ${email}'s' favourites`);
        })
        .catch((error) => {
          console.log("Already added to favourites");
        })

    }

    res.redirect(url.format({
        pathname: "/result",
        query: {
            sampleSelection: sampleID
        }
    }))

    });

});

module.exports = router;
