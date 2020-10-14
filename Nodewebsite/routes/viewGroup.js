var express = require('express')
var router = express.Router()
let url = require('url')


router.get('/viewGroup', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let groupID = req.query.groupId;

    // Setup error handling
    errorPageConfig = { description: 'group', query: 'groupId', id: groupID, endpoint: '/viewGroup', userLoggedIn: userLoggedIn };

    // Now execute SQL queries
    if ( userLoggedIn ) {
      try {
        let getGroupsInfo = req.knex
                                .select('*')
                                .from('groups')
                                .where({group_id: groupID || 0});

        let getSampleIds = req.knex
                              .select('sample_id')
                              .from('group_samples')
                              .where({group_id: groupID || 0});

        Promise.all([getGroupsInfo, getSampleIds]).then(function([groupInfo, sampleIds]) {
          groupInfo = groupInfo[0];
          if (sampleIds.length < 1) {
            sampleIds = [ { sample_id: -1 } ];
          }
          req.knex.select({st: 'mlst_mlst.st', sample_id: 'sample_metadata.sample_id', metadata: 'sample_metadata.metadata',
          name: 'sample_sample.name', id: 'sample_sample.id'}) //TODO: refactor so id is removed
              .from('mlst_mlst')
              .innerJoin('sample_sample', 'mlst_mlst.sample_id', 'sample_sample.id')
              .innerJoin('sample_metadata', 'mlst_mlst.sample_id', 'sample_metadata.sample_id')
              .modify(function (queryBuilder) {
                  queryBuilder.where('mlst_mlst.sample_id', sampleIds[0].sample_id || 0);
                  for (i = 1; i < sampleIds.length; i++) {
                    queryBuilder.orWhere('mlst_mlst.sample_id', sampleIds[i].sample_id);
                  }
              })
              .then((sampleInfos) => {
                //console.log(sampleInfos);
                for(sampleInfo of sampleInfos) {
                  sampleInfo.country = sampleInfo.metadata.country;
                  sampleInfo.strain = sampleInfo.metadata.strain;
                  sampleInfo.host = sampleInfo.metadata.host;
                  sampleInfo.isolation_source = sampleInfo.metadata.isolation_source;
                }

                if (groupInfo == undefined) {
                  res.render('pages/error', errorPageConfig);
                  return;
                }

                res.render('pages/viewGroup', {
                    userLoggedIn: userLoggedIn,
                    samples: sampleInfos,
                    groupInfo: groupInfo
                });
              });
        })
        .catch(function(err) {
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

router.post('/addGroupSample', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let groupId = req.body.groupId;
    let sampleId = req.body.sampleId;

    console.log("Add sample to group login: " + userLoggedIn);
    if ( userLoggedIn ) {
        req.knex('group_samples')
            .insert({
                group_id: groupId,
                sample_id: sampleId
            })
            .then( () => {
                req.knex('groups')
                    .where({group_id: groupId})
                    .update({modified: new Date(Date.now()).toISOString()})
                    .then(() => {
                        console.log("Success")
                        res.status(200)
                    })
                    .catch((err) => {
                        console.log("error updating")
                        res.status(401).json({"message": "Error updating group"})
                    })
                }
            )
            .catch((err) => {
                console.log("error adding")
                console.log(err);
                res.status(401).json({"message": "Error adding sample"})
            })

    }
})

router.post('/removeGroupSample', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let groupId = req.body.groupId;
    let sampleIds = req.body.sampleId;
    sampleIds = sampleIds.split(',');

    if ( userLoggedIn ) {
      req.knex('group_samples')
        .modify(function (queryBuilder) {
            queryBuilder.where({ group_id: groupId, sample_id: sampleIds[0] });
            for (i = 1; i < sampleIds.length; i++) {
              queryBuilder.orWhere({ group_id: groupId, sample_id: sampleIds[i] });
            }
        })
        .del()
        .then(() => {
          res.status(200).json({"message": "successfully removed from group"})
          return;
        })
        .catch((err) => {
          console.log(err);
          res.status(401).json({"message": "error deleting from group"})
          return;
        });
        return;
    }

    res.status(401).json({"message": "permissions error - user not logged in"})

    // Include update time stamp here instead?
})

router.post('/removeGroup', function (req, res) {
  let userLoggedIn = req.session.userStatus === "loggedIn";
  let groupId = req.body.groupId;
  console.log(groupId);

  console.log(userLoggedIn);
  if (userLoggedIn) {

    console.log("=============================================================");
    req.knex('groups')
      .where({ group_id: groupId }) 
      .del()
      .then(() => {
        console.log("GROUP DELETED")
        res.status(200).json({"message": "successfully removed group"})
        return;
      })
      .catch((err) => {
        console.log(err);
        res.status(401).json({ "message": "error deleting group" })
        return;
      });
    return;
  }
  res.status(401).json({"message": "permissions error - user not logged in"})
// })
})

module.exports = router;
