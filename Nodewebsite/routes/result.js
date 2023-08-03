/*
    * @api {get} /result Result
    *
*/


const express = require('express');
const getGatherData = require('../utils/getGatherData');
const getAssemblerData = require('../utils/getAssemblerData');
const getQualityControlData = require('../utils/getQualityControlData');
const getMLSTData = require('../utils/getMLST');


const router = express.Router()
let url = require('url')
const log = require('debug')('routes:result')

// Result page endpoint
router.get('/', async function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let sampleName = req.query.sampleSelection;
    log(`Sample Name: ${sampleName}`);
    req.session.prevSample = sampleName;
    req.session.favourited = false; // Assume that sample is not favorited before check

    // Grab the sample's details from the filesystem
    //      (*)         = Not implemented yet
    //      (** REASON) = Not able to be implemented fully yet
    //      (***)       = Doesn't seem relevant at all - clarify with client and team
    //
    // TAGS                 - RANDOM NUMBER     (*** - Doesn't seem to mean anything)
    // isFavourited         - Bool              Working but colour of heart isnt changing
    // Groups hasnt been implemented yet
    // sample_metadata                          (* - Talk through this) 
        // run_name    - string
        // genome_size - int
        // .. TODO: Work out what else constitutes metadata

    // annotations          - Dict of strings   (* - util exists, need to implement)
    // quality              - list of files     (* - think linking to the files is enough, see util) 
    // sketcher             - Msh files         (** - Need to really think about what this one means and how to use)
    // TODO: Bactopia-Tools Integration

    // similar_genomes      - List of strings   (** - Need utils for doing this query, requires clarification on host etc.
        // can do genetic distance and stuff with sketcher files I believe)
    // mlst (sequence type) - int               (** - appears to require different bactopia setup)


    // res.render('pages/result', { 
    //     sample_ID: sampleID, 
    //     tag_tag: result_tag_tag, 
    //     isFavourited: req.session.favourited,
    //     sample_metadata: result_sample_metadata, 
    //     mlst_mlst: result_mlst_mlst, 
    //     userLoggedIn: userLoggedIn, 
    //     same_hosts: same_host,
    //     same_locations: same_location, 
    //     same_sequences: same_sequence, 
    //     staphopia_blatstquery: result_blastquery, 
    //     sequence_summary: result_sequence_summary,
    //     same_isolations: same_isolation, 
    //     sccmec_primers: result_sccmec_primers, 
    //     assembly_summary: result_assembly_summary,
    //     sccmec_subtypes: result_sccmec_subtypes, 
    //     sccmec_proteins: result_sccmec_proteins, 
    //     weighted_distance: result_weighted_distances,
    //     all_weighted_distances: mainRelatedSampleDetails,
    //     avail_groups: groupsInfo,
    //     sample_groups: sampleGroups,
    // });
    //

    /*
        * If the user is logged in, check if the sample is favourited
        * TODO: database operation
    */
    if (userLoggedIn) {
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        console.log(email)
        // TODO: Work out how to do the whole database thing with these
        let fav_results = await req.knex.select('*').from('user_favorites').where({email: email, sample_id: sampleName})
        
        if (fav_results.length > 0) {
            req.session.favourited = true; //Its not picking this up
        }

        /*then((fav_results) => {
            //console.log(`Results are: ${JSON.stringify(fav_results)}`);
            if (fav_results.length > 0) {
                req.session.favourited = true; //Its not picking this up
            }
        });*/
    }
    /*
        * Error page, if URL is incorrect or not found
    */
    errorPageConfig = {
        description: 'sample',
        query: 'sampleSelection',
        id: sampleName,
        endpoint: '/result',
        userLoggedIn: userLoggedIn
    };

    /*
        * Intended Flow:
        * 1. Check sample exists by checking gather data exists
        * 2. Collate any other data available for the sample
        * 3. Render the page 
    */

    // Check if the sample exists
    const gather = getGatherData(sampleName);
    if(!gather) {
        res.render('pages/error', errorPageConfig);
        return;
    }
    // get dropdown summary content

    const assembly = getAssemblerData(sampleName);
    const qc = getQualityControlData(sampleName);

    // Tools - May or may not exist
    const mlst = getMLSTData(sampleName);
    log(mlst);

    res.render('pages/result', {
        summary: gather, 
        userLoggedIn: userLoggedIn,
        sample_ID: sampleName,
        isFavourited: req.session.favourited,
        metadata: gather,
        result_assembly_summary: assembly,
        sequence_summary: qc,
        mlst: mlst
    });


    return;

    //NOTE: Below this line is the old code from Staphbook
    //      Some of the code has been copied above, but the entirety is left below 
    //      for reference

    if (userLoggedIn) {
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        console.log(email)
        // TODO: Work out how to do the whole database thing with these
        req.knex.select('*').from('user_favorites').where({email: email, sample_id: sampleID}).then((fav_results) => {
            //console.log(`Results are: ${JSON.stringify(fav_results)}`);
            if (fav_results.length > 0) {
                req.session.favourited = true;

            }
        });
    }

    // Setup error page config
    errorPageConfig = {
        description: 'sample',
        query: 'sampleSelection',
        id: sampleID,
        endpoint: '/result',
        userLoggedIn: userLoggedIn
    };

    // Tags
    req.knex.select('tag_id').from('tag_tosample').where({sample_id: sampleID}).then((result_tag_tosample) => {

        try {
            let tagID = result_tag_tosample[0].tag_id;
            req.knex.select('*').from('tag_tag').where({id: tagID}).then((result_tag_tag) => {

                // Sample Name
                req.knex.select('name').from('sample_sample').where({id: sampleID}).then((result_sample_sample) => {
                    let sampleName = result_sample_sample[0].name;

                    let getWeightedDistances = req.knex.select('*').from('weighted_distance').where({selected_sample: sampleName});

                    let getSampleMetadata = req.knex.select('*').from('sample_metadata').where({sample_id: sampleID});

                    let getBlastQuery = req.knex.select('*').from('staphopia_blastquery');

                    let getSequencingMetrics = req.knex.select('*').from('sequence_summary').where({sample_id: sampleID});

                    let getAssemblyMetrics = req.knex.select('*').from('assembly_summary').where({sample_id: sampleID});

                    let getMlst = req.knex.select('*').from('mlst_mlst').where({sample_id: sampleID});

                    let getSccmecPrimerHits = req.knex.select('*').from('sccmec_primers').where({sample_id: sampleID});

                    let getSccmecSubtypeHits = req.knex.select('*').from('sccmec_subtypes').where({sample_id: sampleID});

                    let getSccmecProteinHits = req.knex.select('*').from('sccmec_proteins').where({sample_id: sampleID});

                    let getGroups = req.knex.select('group_id', 'name').from('groups').where({email: ''});
                    let sampleGroups;

                    if (userLoggedIn) {
                        let alreadyInGroups = req.knex.select('group_id').from('group_samples').where({sample_id: sampleID});
                        getGroups = req.knex.select('group_id', 'name')
                            .from('groups')
                            .where({email: decodeURIComponent(req.session.userEmail)})
                            .whereNotIn('group_id', alreadyInGroups);

                        sampleGroups =
                            req.knex.select('groups.group_id', 'name')
                                .from('group_samples')
                                .innerJoin('groups', 'groups.group_id', 'group_samples.group_id')
                                .where({sample_id: sampleID, email: decodeURIComponent(req.session.userEmail)})
                    }


                    Promise
                    .all([ getWeightedDistances, getSampleMetadata, getBlastQuery, getSequencingMetrics, getAssemblyMetrics, getMlst, getSccmecPrimerHits, getSccmecSubtypeHits, getSccmecProteinHits, getGroups, sampleGroups])
                    .then(function([result_weighted_distances, result_sample_metadata, result_blastquery, result_sequence_summary, result_assembly_summary, result_mlst_mlst, result_sccmec_primers, result_sccmec_subtypes, result_sccmec_proteins, groupsInfo, sampleGroups]) {

                      let st = result_mlst_mlst[0].st;
                      console.log(st);
                      console.log(sampleGroups);
                      //console.log(result_sample_metadata);

                      let same_sequence_samples = req.knex.select('sample_id').from('sample_metadata').where({st: st});
                      let getSameSequenceSampleInfo = req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                      name: 'sample_sample.name', id: 'sample_sample.id'}) //TODO: refactor so id is removed
                          .from('mlst_mlst')
                          .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                          .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                          .where('mlst_mlst.sample_id', 'in', same_sequence_samples)
                          .limit(20);

                      let location = result_sample_metadata[0].metadata.country;
                      if (location == undefined) {
                        location = "";
                      }
                      let same_location_samples = req.knex.select('sample_id').from('sample_metadata').whereRaw('metadata->>? = ?', ['country', location]);
                      let getSameLocationSampleInfo = req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                      name: 'sample_sample.name', id: 'sample_sample.id'})
                          .from('mlst_mlst')
                          .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                          .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                          .where('mlst_mlst.sample_id', 'in', same_location_samples)
                          .limit(20);

                      let host = result_sample_metadata[0].metadata.host;
                      if (host == undefined) {
                        host = "";
                      }
                      let same_host_samples = req.knex.select('sample_id').from('sample_metadata').whereRaw('metadata->>? = ?', ['host', host]);
                      let getSameHostSampleInfo = req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                      name: 'sample_sample.name', id: 'sample_sample.id'})
                          .from('mlst_mlst')
                          .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                          .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                          .where('mlst_mlst.sample_id', 'in', same_host_samples)
                          .limit(20);

                      let iso = result_sample_metadata[0].metadata.isolation_source;
                      if (iso == undefined) {
                        iso = "";
                      }
                      let same_iso_samples = req.knex.select('sample_id').from('sample_metadata').whereRaw('metadata->>? = ?', ['isolation_source', iso]);
                      let getSameIsoSourceSampleInfo = req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                      name: 'sample_sample.name', id: 'sample_sample.id'})
                          .from('mlst_mlst')
                          .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                          .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                          .where('mlst_mlst.sample_id', 'in', same_iso_samples)
                          .limit(20);


                      let sample_name = req.knex.select('name').from('sample_sample').where('id', '=', sampleID);
                      let getGeneticallyCloseSampleInfo = req.knex.select('sample_sample.id', 'weighted_distance.distance', 'mlst_mlst.st', 'sample_metadata.metadata')
                              .from('weighted_distance')
                              .innerJoin('sample_sample', 'weighted_distance.comparison_sample', 'sample_sample.name')
                              .innerJoin('sample_metadata', 'sample_sample.id', 'sample_metadata.sample_id')
                              .innerJoin('mlst_mlst', 'sample_sample.id', 'mlst_mlst.sample_id')
                              .where('weighted_distance.selected_sample', '=', sample_name)
                              .andWhere('weighted_distance.distance', '>=', 0.0045) // Based on initial configuration
                              .andWhere('weighted_distance.distance', '<=', 0.009)
                              .orderBy('weighted_distance.distance', 'asc')
                              .limit(100)
                              .offset(0); 

                      Promise
                        .all([getSameSequenceSampleInfo, getSameLocationSampleInfo, getSameHostSampleInfo, getSameIsoSourceSampleInfo, getGeneticallyCloseSampleInfo])
                        .then(function([same_sequence, same_location, same_host, same_isolation, genetically_close]) {
                          for(same of same_sequence) {
                            same.country = same.metadata.country;
                            same.strain = same.metadata.strain;
                            same.host = same.metadata.host;
                            same.isolation_source = same.metadata.isolation_source;
                          }

                          for(same of same_location) {
                            same.country = same.metadata.country;
                            same.strain = same.metadata.strain;
                            same.host = same.metadata.host;
                            same.isolation_source = same.metadata.isolation_source;
                          }

                          for(same of same_host) {
                            same.country = same.metadata.country;
                            same.strain = same.metadata.strain;
                            same.host = same.metadata.host;
                            same.isolation_source = same.metadata.isolation_source;
                          }

                          for(same of same_isolation) {
                            same.country = same.metadata.country;
                            same.strain = same.metadata.strain;
                            same.host = same.metadata.host;
                            same.isolation_source = same.metadata.isolation_source;
                          }

                          let mainRelatedSampleDetails = [];
                          genetically_close.forEach(function (row) {
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
                              all_weighted_distances: mainRelatedSampleDetails,
                              avail_groups: groupsInfo,
                              sample_groups: sampleGroups,
                          });

                        })
                        .catch(function (err) {
                            console.log(err);
                            res.render('pages/error', errorPageConfig);
                        });
                }).catch(function (err) {
                    console.log(err);
                    res.render('pages/error', errorPageConfig);
                });
            }).catch(function (err) {
                console.log(err);
                res.render('pages/error', errorPageConfig);
            });
        }).catch(function(err) {
            res.render('pages/error', errorPageConfig);
        });

      } catch(err) {
          res.render('pages/error', errorPageConfig);
      }

    }).catch(function (err) {
        console.log(err);
        res.render('pages/error', errorPageConfig);
    });
});

// Favorites endpoint
router.post('/', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let isFavourite = req.session.favourited;
    let email = "NA";
    let sampleID = req.session.prevSample;

    let errorPageConfig = {
        description: '',
        query: 'Favoriting a sample',
        id: sampleID,
        endpoint: '/result',
        userLoggedIn: userLoggedIn
    };

    if (userLoggedIn) {
        if (isFavourite) {
            let value = req.session.userEmail;
            let email = decodeURIComponent(value);
            // Delete from database, if record exists
            req.knex('user_favorites')
                .where({email: email, sample_id: sampleID})
                .del()
                .then((result) => {
                    console.log(`User favorites record ${email}-${sampleID} has been deleted successfully`);
                    res.redirect(url.format({
                        pathname: "/result",
                        query: {
                            sampleSelection: sampleID
                        }
                    }));
                })
                .catch((error) => {
                    console.log(`User favourites record ${email}-${sampleID} does not exist and cannot be deleted`);
                    errorPageConfig.description = `User favourites record ${email}-${sampleID} does not exist and cannot be deleted`;
                    res.render('pages/error', errorPageConfig);
                })
        }
        else {
            let value = req.session.userEmail;
            let email = decodeURIComponent(value);
            console.log(email);
            // Unique constraint applied in postgres database
            req.knex('user_favorites')
                .insert({email: email, sample_id: sampleID})
                .then((result) => {
                    console.log(`${sampleID} added to ${email}'s' favourites`);
                    res.redirect(url.format({
                                pathname: "/result",
                                query: {
                                    sampleSelection: sampleID
                                }
                            }));
                })
                .catch((error) => {
                    console.log("Already added to favourites");
                    errorPageConfig.description = "Sample already in favorites";
                    res.render('pages/error', errorPageConfig);
                })
        }
    }
    else{
        res.redirect(url.format({
            pathname: "/result",
            query: {
                sampleSelection: sampleID
            }
        }));
    }

});

module.exports = router;
