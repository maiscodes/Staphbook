var express = require('express')
var router = express.Router()

router.get('/', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let groupID = req.query.groupId;

    // Setup error handling
    errorPageConfig = { description: 'group', query: 'groupId', id: groupID, endpoint: '/viewGroup', userLoggedIn: userLoggedIn };

    // Now execute SQL queries
    if(userLoggedIn){
      try {
        req.knex.select('*').from('groups').where({group_id: groupID || 0}).then((groupInfo) => { // Default values so knex never handles undefined
            groupInfo = groupInfo[0];

            req.knex.select('*').from('group_samples').where({group_id: groupID || 0}).then((row) => {
                row = row[0];
                groupSampleIds = row.sample_id;
                //console.log(sampleIds);
                req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                name: 'sample_sample.name', id: 'sample_sample.id'}) //TODO: refactor so id is removed
                    .from('mlst_mlst')
                    .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                    .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                    .where('mlst_mlst.sample_id', 'in', groupSampleIds || 0)
                    .then((sampleInfos) => {
                      for(sampleInfo of sampleInfos) {
                        sampleInfo.country = sampleInfo.metadata.country;
                        sampleInfo.strain = sampleInfo.metadata.strain;
                        sampleInfo.host = sampleInfo.metadata.host;
                        sampleInfo.isolation_source = sampleInfo.metadata.isolation_source;
                      }

                      res.render('pages/viewGroup', {
                          userLoggedIn: userLoggedIn,
                          samples: sampleInfos,
                          groupInfo: groupInfo
                      });

                }).catch(function(err) {
                  console.log(err);
                  res.render('pages/error', errorPageConfig);
                });

            }).catch(function(err) {
              console.log(err);
              res.render('pages/error', errorPageConfig);
            });

        }).catch(function(err) {
          console.log(err);
          res.render('pages/error', errorPageConfig);
        });

      } catch (err) {
            res.render('pages/error', errorPageConfig);
      }

        // TODO: SQL Query to get of group information and samples belonging to each group
        // result_samples.rows
        // Get group information

        // Get sample list, get sample information
        /*
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
        }); */
    }
    else{
        res.status(404);
        res.send({ error: 'Not found' });
        res.render('pages/error');
    }
})

module.exports = router;
