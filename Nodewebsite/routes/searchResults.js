var express = require('express')
var router = express.Router()

router.get('/', function (req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }

    let input = req.query.searchInput;
    let option = req.query.searchOption;
    let number = 0;
    if (req.query.searchInput) {
        if(option === "Sequence"){
            // req.db.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
            //     "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
            //     "sample_metadata.metadata->>'isolation_source' AS isolation_source " +
            //     "FROM mlst_mlst  INNER JOIN sample_metadata ON mlst_mlst.sample_id=sample_metadata.sample_id " +
            //     "WHERE mlst_mlst.sample_id IN (SELECT sample_id FROM sample_metadata " +
            //     "WHERE st = '" + input + "')", (err, result_samples) => {
            //     console.log(err, result_samples);
            //     number = result_samples.rows.length;
            //     res.render('pages/searchResults', { samples: result_samples.rows, input: input, option: option, number: number, userLoggedIn: userLoggedIn });
            // });


            console.log(input);
            let same_sequence;
            let same_sequence_samples = req.knex.select('sample_id').from('sample_metadata').where({st: input});
            req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                name: 'sample_sample.name', id: 'sample_sample.id'}) //TODO: refactor so id is removed
                .from('mlst_mlst')
                .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                .where('mlst_mlst.sample_id', 'in', same_sequence_samples)
                .then((same_sequence) => {
                    for (same of same_sequence) { // Make backwards compatible, TODO: keep as metadata later
                        same.country = same.metadata.country;
                        same.strain = same.metadata.strain;
                        same.host = same.metadata.host;
                        same.isolation_source = same.metadata.isolation_source;
                    }
                    number = number + same_sequence.length;
                    res.render('pages/searchResults', { samples: same_sequence, input: input, option: option, number: number, userLoggedIn: userLoggedIn });
                });

        } else if(option === "Location"){
            req.db.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                "sample_metadata.metadata->>'isolation_source' AS isolation_source " +
                "FROM sample_metadata INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
                "WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
                "WHERE metadata->>'country' ILIKE '%" + input + "%')", (err, result_samples) => {
                console.log(err, result_samples);
                number = result_samples.rows.length;
                res.render('pages/searchResults', { samples: result_samples.rows, input: input, option: option, number: number, userLoggedIn: userLoggedIn });
            });
        } else if(option === "Strain Name"){
            req.db.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                "sample_metadata.metadata->>'isolation_source' AS isolation_source " +
                "FROM sample_metadata INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
                "WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
                "WHERE metadata->>'strain' ILIKE '%" + input + "%')", (err, result_samples) => {
                console.log(err, result_samples);
                number = result_samples.rows.length;
                res.render('pages/searchResults', { samples: result_samples.rows, input: input, option: option, number: number, userLoggedIn: userLoggedIn });
            });
        } else if(option === "Host"){
            req.db.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                "sample_metadata.metadata->>'isolation_source' AS isolation_source " +
                "FROM sample_metadata INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
                "WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
                "WHERE metadata->>'host' ILIKE '%" + input + "%')", (err, result_samples) => {
                console.log(err, result_samples);
                number = result_samples.rows.length;
                res.render('pages/searchResults', { samples: result_samples.rows, input: input, option: option, number: number, userLoggedIn: userLoggedIn });
            });
        } else if(option === "Source"){
            req.db.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                "sample_metadata.metadata->>'isolation_source' AS isolation_source " +
                "FROM sample_metadata INNER JOIN mlst_mlst ON sample_metadata.sample_id=mlst_mlst.sample_id " +
                "WHERE sample_metadata.sample_id IN (SELECT sample_id FROM sample_metadata " +
                "WHERE metadata->>'isolation_source' ILIKE '%" + input + "%')", (err, result_samples) => {
                console.log(err, result_samples);
                number = result_samples.rows.length;
                res.render('pages/searchResults', { samples: result_samples.rows, input: input, option: option, number: number, userLoggedIn: userLoggedIn });
            });
        } else if(option === "Sample"){
            req.db.query("SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
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

module.exports = router;