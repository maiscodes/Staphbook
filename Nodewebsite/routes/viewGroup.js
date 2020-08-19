var express = require('express')
var router = express.Router()

router.get('/', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";

    let groupID = req.query.sampleSelection; // groupID instead?

    if(userLoggedIn){
        // TODO: SQL Query to get of group information and samples belonging to each group
        // result_samples.rows

        let result_samples = [{
            country: "unknown/missing",
            host: "undefined",
            id: "40584",
            isolation_source: "undefined",
            st: "72",
            strain: "undefined"
        }, {
            country: "United States of America (USA)",
            host: "Homo sapiens",
            id: "43765",
            isolation_source: "Nares",
            st: "8",
            strain: "H51158"
        }, {
            country: "United States of America (USA)",
            host: "Homo sapiens",
            id: "44028",
            isolation_source: "Nares",
            st: "8",
            strain: "M42212"
        }, {
            country: "United States of America (USA)",
            host: "Human",
            id: "41697",
            isolation_source: "Respiratory",
            st: "8",
            strain: "2588STDY5627603"
        }, {
            country: "United States of America (USA)",
            host: "Human",
            id: 41823,
            isolation_source: "Respiratory",
            st: 15,
            strain: "undefined",
        }, {
            country: "unknown/missing",
            host: "undefined",
            id: "43502",
            isolation_source: "Sputum",
            st: "8",
            strain: "COAS6087"
        }, {
            country: "unknown/missing",
            host: "undefined",
            id: "43502",
            isolation_source: "Sputum",
            st: "8",
            strain: "COAS6087"
        }];

        let groupInfo = {
            group_id: "4000",
            description: "Really close genomes to sample 44140",
            name: "Group 4",
            count: "4",
            created: "2019-09-15T13:45:30",
            modified: "2020-01-02T13:45:30"
        };

        res.render('pages/viewGroup', {
            userLoggedIn: userLoggedIn,
            samples: result_samples,
            groupInfo: groupInfo
        });
    }
    else{
        res.status(404);
        res.send({ error: 'Not found' });
        res.render('pages/error');
    }
})

module.exports = router;