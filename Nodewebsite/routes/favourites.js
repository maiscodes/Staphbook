var express = require('express')
var router = express.Router()
const getGatherData = require('../utils/getGatherData')

router.get('/', async function(req, res) {
    // Initial values
    let userLoggedIn = false;
    let favorites = [];
    let hasFavs = false;

    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);

        /*req.knex
            .select('*')
            .from('user_favorites')
            .where({email: email})
            .then((sampleInfos) => {
                for (sampleInfo of sampleInfos) {
                    sampleInfo.country = "Australia";
                    sampleInfo.strain = "Covid";
                    sampleInfo.host = "Humans";
                    sampleInfo.isolation_source = "Nasal swab";
                }
            res.render('pages/favourites', { userLoggedIn: userLoggedIn, favorites: sampleInfos, haveFavs: true });
            */

        let favouriteIds = [];

        let favs = await req.knex
            .select('*')
            .from('user_favorites')
            .where({ email: email });

        favs.forEach(fav => {
            favouriteIds.push(fav.sample_id);
        });
        favorites = await Promise.all(favouriteIds.map(async (f) =>
            // get the metadata
            getGatherData(f)
        ));
        // Append metadata for each sample to favs
        for (const samples of favorites) {
            const metadatas = await req.knex.select('isolation_host', 'isolation_source', 'isolation_location', 'time_of_sampling', 'notes').from('metadata').where({sample_id: samples.sample});
            if (metadatas.length == 0) {
                metadatas.push({isolation_host: '', isolation_source: '', isolation_location: '', time_of_sampling: '', notes: ''})
            }
            samples.host = metadatas[0].isolation_host
            samples.source = metadatas[0].isolation_source
            samples.location = metadatas[0].isolation_location
            samples.time = metadatas[0].time_of_sampling
            samples.notes = metadatas[0].notes
            console.log(samples.host)
        }

        res.render('pages/favourites', { userLoggedIn: userLoggedIn, favorites: favorites, haveFavs: true });

        /*
        .then(favs => {
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
                .then((sampleInfos) => {
                    //console.log(sampleInfos);
                    for (sampleInfo of sampleInfos) {
                        sampleInfo.country = sampleInfo.metadata.country;
                        sampleInfo.strain = sampleInfo.metadata.strain;
                        sampleInfo.host = sampleInfo.metadata.host;
                        sampleInfo.isolation_source = sampleInfo.metadata.isolation_source;
                    }
                    
                    res.render('pages/favourites', { userLoggedIn: userLoggedIn, favorites: sampleInfos, haveFavs: true });
                });
        });*/
    }
    else {
        // redirect to '/'
        res.redirect('/');
    }
});

router.post('/', function(req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";

    let sampleID = req.body.favouritedSampleID;

    if (userLoggedIn) {
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);

        req.knex('user_favorites')
            .where({ email: email, sample_id: sampleID })
            .del()
            .then((deleted) => {
                res.redirect('/favourites');
            })
    }

});

module.exports = router;
