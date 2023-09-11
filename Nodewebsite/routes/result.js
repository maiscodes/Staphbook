/*
    * @api {get} /result Result
    *
*/


const express = require('express');
const getGatherData = require('../utils/getGatherData');
const getAssemblerData = require('../utils/getAssemblerData');
const getAnnotations = require('../utils/getAnnotations');
const getQualityControlData = require('../utils/getQualityControlData');
const getMLSTData = require('../utils/getMLST');
const getAllSamples = require('../utils/getAllSampleNames');
const getMashDistances = require('../utils/getMashDistances');


const { exec } = require('child_process');
const fs = require('fs');
const router = express.Router()
let url = require('url')
const log = require('debug')('routes:result')

// Result page endpoint 
router.get('/', async function(req, res) {
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

    /*
        * If the user is logged in, check if the sample is favourited
        * TODO: database operation
    */
    if (userLoggedIn) {
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        // TODO: Work out how to do the whole database thing with these
        let fav_results = await req.knex.select('*').from('user_favorites').where({ email: email, sample_id: sampleName })

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
    let getGroups = req.knex.select('group_id', 'name').from('groups').where({ email: '' });
    let sampleGroups;

    if (userLoggedIn) {
        let alreadyInGroups = req.knex.select('group_id').from('group_samples').where({ sample_id: sampleName });
        getGroups = req.knex.select('group_id', 'name')
            .from('groups')
            .where({ email: decodeURIComponent(req.session.userEmail) })
            .whereNotIn('group_id', alreadyInGroups);

        sampleGroups =
            req.knex.select('groups.group_id', 'name')
                .from('group_samples')
                .innerJoin('groups', 'groups.group_id', 'group_samples.group_id')
                .where({ sample_id: sampleName, email: decodeURIComponent(req.session.userEmail) })
    }

    /*
        * Error page, if URL is incorrect or not found
    */
    errorPageConfig = {
        description: 'sample',
        query: 'sampleSelection',
        id: sampleName,
        endpoint: '/result',
        userLoggedIn: userLoggedIn,
    };

    /*
        * Intended Flow:
        * 1. Check sample exists by checking gather data exists
        * 2. Collate any other data available for the sample
        * 3. Render the page 
    */

    // Check if the sample exists
    const gather = getGatherData(sampleName);
    if (!gather) {
        res.render('pages/error', errorPageConfig);
        return;
    }
    // get dropdown summary content

    const assembly = getAssemblerData(sampleName);
    const qc = getQualityControlData(sampleName);
    const annotations = getAnnotations(sampleName);

    const metadatas = await req.knex.select('isolation_species', 'isolation_location', 'time_of_sampling', 'notes').from('metadata').where({sample_id: sampleName});
    if (metadatas.length == 0) {
        metadatas.push({isolation_species: '', isolation_location: '', time_of_sampling: '', notes: ''})
    }
    console.log(metadatas);
    // Tools - May or may not exist
    const mlst = getMLSTData(sampleName);
    // get distances, then render
    //TEST: mash distances
    const distances = await getMashDistances(sampleName);

    Promise
        .all([getGroups, sampleGroups, distances])
        .then(function([groupsInfo, sampleGroups]) {

            res.render('pages/result', {
                summary: gather,
            userMeta: metadatas[0],
                userLoggedIn: userLoggedIn,
                sample_ID: sampleName,
                isFavourited: req.session.favourited,
                metadata: gather,
                result_assembly_summary: assembly,
                sequence_summary: qc,
                mlst: mlst,
                annotations: annotations,
                avail_groups: groupsInfo,
                sample_groups: sampleGroups,
                distances: distances,
            });
        })
        .catch(function(err) {
            console.log(err);
            res.render('pages/error', errorPageConfig);
        });



    return;
});

// Favorites endpoint
router.post('/', function(req, res) {
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
                .where({ email: email, sample_id: sampleID })
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
                .insert({ email: email, sample_id: sampleID })
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
    else {
        res.redirect(url.format({
            pathname: "/result",
            query: {
                sampleSelection: sampleID
            }
        }));
    }

});

module.exports = router;
