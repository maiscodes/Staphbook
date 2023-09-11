var express = require('express')
var router = express.Router()
let url = require('url')
const getMashDistances = require('../utils/getMashDistances')
const getGatherData = require('../utils/getGatherData')
const getMLST = require('../utils/getMLST')

// Returns close samples and their metadata for use in the funcional network view
router.get('/', async function(req, res) {
    const sampleId = req.query.sampleId;
    // get the mash distances
    const distances = await getMashDistances(sampleId);
    const others = Object.keys(distances);
    const allSamples = others.concat([sampleId]);
    // get metadata where sampleId in others using knex
    const metadata = await req.knex.select('*').from('metadata').whereIn('sample_id', allSamples);
    const sequence_types = allSamples.map((s) => {
        const mlst = getMLST(s);
        return { sample_id: s, sequence_type: mlst?.sequence_type };
    });
    const species = allSamples.map((s) => {
        const gather = getGatherData(s);
        return { sample_id: s, species: gather?.species };
    });

    // merge all the stuff
    const closeSamples = allSamples.map((s) => {
        const sampleMetadata = metadata.find((m) => m.sample_id === s);
        const sampleSequenceType = sequence_types.find((m) => m.sample_id === s);
        const sampleSpecies = species.find((m) => m.sample_id === s);
        return {
            sample_id: s,
            distance: distances[s],
            isolation_species: sampleMetadata?.isolation_species,
            isolation_location: sampleMetadata?.isolation_location,
            time_of_sampling: sampleMetadata?.time_of_sampling,
            notes: sampleMetadata?.notes,
            sequence_type: sampleSequenceType?.sequence_type,
            species: sampleSpecies?.species,
        };
    });
    res.json(closeSamples);
})

module.exports = router;
