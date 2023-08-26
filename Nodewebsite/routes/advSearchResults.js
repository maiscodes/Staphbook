var express = require('express')
var router = express.Router()
const searchGenomes = require('../utils/searchGenomes');
const getGatherData = require('../utils/getGatherData');

router.get('/', function(req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }

    //TODO clean this up
    const sequence_type = req.query.sequence_type;
    const annotations = req.query.annotations;
    const species = req.query.species;
    // NOTE: Maybe really slow but works for now
    //
    // conduct three searches, then take the intersection of the results
    let results = null;
    if (sequence_type) {
        results = searchGenomes(sequence_type, "sequence_type");
    }
    if (annotations) {
        const an_results = searchGenomes(annotations, "annotations");
        results = results ? results.filter(value => an_results.includes(value)) : an_results;
    }
    if (species) {
        const sp_results = searchGenomes(species, "species");
        results = results ? results.filter(value => sp_results.includes(value)) : sp_results;
    }
    let number = results.length;

    const samples = results.map((id) => {
        return getGatherData(id);
    });

    res.render('pages/advSearchResults', { samples, number: number, userLoggedIn: userLoggedIn });
});

module.exports = router
