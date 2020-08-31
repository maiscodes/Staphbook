var express = require('express')
var router = express.Router()

router.get('/viewGroup', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let groupID = req.query.groupId;

    // Setup error handling
    errorPageConfig = { description: 'group', query: 'groupId', id: groupID, endpoint: '/viewGroup', userLoggedIn: userLoggedIn };

    // Now execute SQL queries
    if ( userLoggedIn ) {
      try {
        req.knex.select('*').from('groups').where({group_id: groupID || 0}).then((groupInfo) => {
            groupInfo = groupInfo[0];

            req.knex.select('*').from('group_samples').where({group_id: groupID || 0}).then((row) => {
                row = row[0];
                groupSampleIds = row.sample_id || 0;
                //console.log(sampleIds); TODO: add handling when group doesn't have any samples
                req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
                name: 'sample_sample.name', id: 'sample_sample.id'}) //TODO: refactor so id is removed
                    .from('mlst_mlst')
                    .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
                    .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
                    .where('mlst_mlst.sample_id', 'in', groupSampleIds || 0)
                    .then((sampleInfos) => {
                      console.log(sampleInfos);
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

    }
    else{
        res.status(404);
        res.send({ error: 'Not found' });
        res.render('pages/error');
    }
})


router.post('/removeGroupSample', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let groupId = req.body.groupId;
    let sampleIds = req.body.sampleId;
    sampleIds = sampleIds.split(',');
    //console.log(groupId);
    //console.log(sampleIds);

    if (userLoggedIn) {
      req.knex.select('sample_id').from('group_samples').where({group_id: groupId || 0}).then((currentSamples) => {
          currentSamples = currentSamples[0].sample_id;

          let remainingSamples = currentSamples.filter(function(item) {
            return !sampleIds.includes(JSON.stringify(item));
          })

          req.knex('group_samples')
            .where({ group_id: groupId })
            .update({ sample_id: remainingSamples }, ['group_id', 'sample_id'])
            .then(() => {
              res.status(200).json({"message": "successfully removed from group"})
              return;
            })
            .catch((err) => {
              console.log(err);
              res.status(401).json({"message": "error deleting from group"})
              return;
            });
        })
        .catch((err) => {
          console.log(err);
          res.status(401).json({"message": "error deleting from group"})
          return;
        });
        return;
    }
    res.status(401).json({"message": "permissions error - user not logged in"})
})

module.exports = router;
