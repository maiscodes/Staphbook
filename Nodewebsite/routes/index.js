/* Route for the home page
If User Is Logged In:
    - Render the index page with random, suggested, and favorite samples
If User Is Not Logged In:
    - Render the index page with random samples
*/

const log = require('debug')('routes:index')
const express = require('express')

const router = express.Router()
const getAllSampleNames = require('../utils/getAllSampleNames') 
const getGatherData = require('../utils/getGatherData')

router.get('/', async function (req, res) {
    const userLoggedIn = req.session.userStatus === "loggedIn";

    let suggested = [];
    let favorites = [];
    const allSamples = getAllSampleNames();

    log(`Number of samples: ${allSamples.length}`)

    // random is 3 random samples from allSamples
    const randomIds = [];
    const randomNames = [];
    while (randomIds.length < 3) {
        const randomId = Math.floor(Math.random() * allSamples.length);
        if (!randomIds.includes(randomId)) {
            randomIds.push(randomId);
            randomNames.push(allSamples[randomId]);
        }
    }
    const random = await Promise.all(randomNames.map(async (r) =>
        // get the metadata
        getGatherData(r) 
    ));
    log(random)

    // Recommended will eventually be 3 random samples from the user's favourites

    // Favourites will eventually be all the samples from the user's favourites. Currently just all samples.
    if(userLoggedIn){
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        let favouriteIds = [];
        let favouriteNames = [];
        let favs = await req.knex
                .select('*')
                .from('user_favorites')
                .where({email: email});

        favs.forEach(fav => {
                    favs.forEach(fav => {
                    favouriteIds.push(fav.sample_id);
                    favouriteNames.push(fav.email);
                });
            });
            favorites = await Promise.all(favouriteNames.map(async (f) =>
            // get the metadata
            getGatherData(f) 
        ));
    }

    if (userLoggedIn){
        log("User is logged in");
    } else {
        log("User is not logged in");
    }


    return res.render("pages/index", {
        userLoggedIn: userLoggedIn,
        randomSamples: random,
        suggested: suggested,
        favorites: []
    });




    if (userLoggedIn) {
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

                                                    req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                                                        name: 'sample_sample.name', id: 'sample_sample.id'})
                                                        .from('mlst_mlst')
                                                        .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                                                        .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                                                        .orderByRaw('random()')
                                                        .limit(4)
                                                        .then((random) => {
                                                            for (const same of random) {
                                                                same.country = same.metadata.country;
                                                                same.strain = same.metadata.strain;
                                                                same.host = same.metadata.host;
                                                                same.isolation_source = same.metadata.isolation_source;
                                                            }
                                                            res.render('pages/index', {
                                                                userLoggedIn: userLoggedIn,
                                                                randomSamples: random,
                                                                favorites: favoriteSamples,
                                                                suggested: suggestedSamples,
                                                                haveFavs: haveFavs,
                                                                haveSugs: haveSugs
                                                            });
                                                        });
                                                })
                                        })
                                })
                        });
                }
                else{
                    req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                        name: 'sample_sample.name', id: 'sample_sample.id'})
                        .from('mlst_mlst')
                        .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                        .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                        .orderByRaw('random()')
                        .limit(4)
                        .then((random) => {
                            for (const same of random) {
                                same.country = same.metadata.country;
                                same.strain = same.metadata.strain;
                                same.host = same.metadata.host;
                                same.isolation_source = same.metadata.isolation_source;
                            }
                            res.render("pages/index", {
                                userLoggedIn: userLoggedIn,
                                randomSamples: random,
                                haveFavs: false,
                                haveSugs: false,
                            });
                        });
                }
            });

    }
    else {
        req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
            name: 'sample_sample.name', id: 'sample_sample.id'})
            .from('mlst_mlst')
            .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
            .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
            .orderByRaw('random()')
            .limit(4)
            .then((random) => {
                for (const same of random) {
                    same.country = same.metadata.country;
                    same.strain = same.metadata.strain;
                    same.host = same.metadata.host;
                    same.isolation_source = same.metadata.isolation_source;
                }
                res.render("pages/index", {
                    userLoggedIn: userLoggedIn,
                    randomSamples: random,
                    haveFavs: false,
                    haveSugs: false,
                });
            });
    }
});

module.exports = router;
