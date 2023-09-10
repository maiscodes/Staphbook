var express = require('express')
var router = express.Router()
const getAllSampleNames = require('../utils/getAllSampleNames')
// advanced search page
router.get('/', async function (req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }
    const sampleNames = getAllSampleNames();
    //const metadatas = await req.knex.select('isolation_species', 'isolation_source', 'time_of_sampling', 'notes').from('metadata').where({sample_id: sampleName});
    //if (metadatas.length == 0) {
    //    metadatas.push({isolation_species: '', isolation_source: '', time_of_sampling: '', notes: ''})
    //}
    res.render('pages/uploadSample', { userLoggedIn: userLoggedIn, samples: sampleNames});
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