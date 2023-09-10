var express = require('express')
var router = express.Router()

// advanced search page
router.get('/', function (req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }

    res.render('pages/uploadSample', { userLoggedIn: userLoggedIn });
});

router.post('/', function (req, res) {
    let sampleID = req.body.name;
    let sampleSpecies = req.body.species;
    let sampleSource = req.body.source;
    let sampleTime = req.body.time;
    let sampleNotes = req.body.notes;

    req.knex('metadata')
    .insert({
        sample_id: sampleID,
        isolation_species: sampleSpecies,
        isolation_source: sampleSource,
        time_of_sampling: sampleTime,
        notes: sampleNotes
    }).onConflict('sample_id')
    .merge()
    .then(() => {
        console.log("Metadata updated");
    }).catch((err) => {
        console.log(err);
    });
    res.redirect('/');
});

module.exports = router;