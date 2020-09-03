var express = require('express')
var router = express.Router()

router.get('/', function (req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }

    //TODO clean this up
    let sequenceInput = req.query.sequenceInput;
    let startDate = req.query.inputDateStart;
    let endDate = req.query.inputDateEnd;
    let locationInput = req.query.locationInput;
    let strainInput = req.query.strainInput;
    let hostInput = req.query.hostInput;
    let sourceInput = req.query.sourceInput;
    if(strainInput == "" && sequenceInput=="" && startDate=="" && endDate=="" && locationInput=="" && hostInput=="" && sourceInput=="") {
        res.redirect('/advancedSearch');
    }
    //TO HERE
    else {
        req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
            name: 'sample_sample.name', id: 'sample_sample.id'})
            .from('mlst_mlst')
            .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
            .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
            .modify(function (queryBuilder){
                if(req.query.sequenceInput){
                    queryBuilder.where({'mlst_mlst.st': req.query.sequenceInput});
                }
                if(req.query.inputDateStart){
                    queryBuilder.whereRaw("CAST(metadata->>'collection_date' AS DATE) >= ?", [req.query.inputDateStart])
                }
                if(req.query.inputDateEnd){
                    queryBuilder.whereRaw("CAST(metadata->>'collection_date' AS DATE) <= ?", [req.query.inputDateStart])
                }
                if(req.query.locationInput){
                    queryBuilder.whereRaw("metadata->>'country' ILIKE ?", ["%"+req.query.locationInput+"%"])
                }
                if(req.query.strainInput){
                    queryBuilder.whereRaw("metadata->>'strain' ILIKE ?", ["%"+req.query.strainInput+"%"])
                }
                if(req.query.hostInput){
                    queryBuilder.whereRaw("metadata->>'host' ILIKE ?", ["%"+req.query.hostInput+"%"])
                }
                if(req.query.sourceInput){
                    queryBuilder.whereRaw("metadata->>'isolation_source' ILIKE ?", ["%"+req.query.sourceInput+"%"])
                }

            })
            .then((results) => {
                for (const same of results) {
                    same.country = same.metadata.country;
                    same.strain = same.metadata.strain;
                    same.host = same.metadata.host;
                    same.isolation_source = same.metadata.isolation_source;
                }
                let number = results.length;
                res.render('pages/advSearchResults', { samples: results, number: number, userLoggedIn: userLoggedIn });
            })
    }
});

module.exports = router