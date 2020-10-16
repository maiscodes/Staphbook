var express = require('express')
var router = express.Router()

router.get('/', function (req, res) {
    // Initial values
    let userLoggedIn = false;
    let favorites = [];
    let hasFavs = false;

    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);

        req.knex
            .select('*')
            .from('user_favorites')
            .where({email: email})
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
            });
    }
});

router.post('/', function (req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }

    let sampleID = req.body.favouritedSampleID;
    console.log("this is the sampleID: " + sampleID);

    if(userLoggedIn) {
        let value = req.session.userEmail;
        let email = decodeURIComponent(value);
        console.log("=============================================================");
        req.db.query("SELECT * FROM user_favorites WHERE email='" + email + "' AND sample_id=" + sampleID + "", (err, fav_results) => {
            console.log(err, fav_results);

            if (fav_results.rows.length > 0) {
                req.db.query("DELETE FROM user_favorites WHERE email='" + email + "' AND sample_id=" + sampleID + "",
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
                    req.db.query("SELECT * FROM user_favorites WHERE email='" + email + "'", (err, fav_results) => {
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

                            req.db.query(selectSQL + ");", (err, favorites) => {
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

module.exports = router;