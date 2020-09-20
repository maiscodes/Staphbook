var express = require('express')
var router = express.Router()

router.get('/groups', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let emailValue = req.session.userEmail;
    let email = decodeURIComponent(emailValue);

    let groups = [];
    let haveGroups = false;

    if ( userLoggedIn ) {
      let groupCount = req.knex
                          .select('group_id as sample_group_id', req.knex.raw('COUNT(sample_id) as count'))
                          .from('group_samples')
                          .groupBy('sample_group_id')
                          .as('group_samples');

      // Get public groups _all_users_

      // Get shared groups
      let sharedGroupIds = req.knex
                              .select('group_id')
                              .from('group_sharing')
                              .where({share_to_email: email});

      req.knex
        .select('*')
        .from('groups')
        .leftJoin(groupCount, 'groups.group_id', 'group_samples.sample_group_id')
        .where({email: email})
        .then((groups) => {
          console.log(groups);
          for (i = 0; i < groups.length; i++) {
            if (groups[i].count == undefined) {
              groups[i].count = 0;
            }
            if (groups[i].description.length >= 100) {
              groups[i].description = `${groups[i].description.substring(0,100)}...`;
            }
          }

          req.knex
            .select('*')
            .from('groups')
            .leftJoin(groupCount, 'groups.group_id', 'group_samples.sample_group_id')
            .whereNot({email: email}) // Not own groups
            .where('group_id', 'in', sharedGroupIds)
            .then((sharedGroupsInfo) => {
              console.log(sharedGroupsInfo);
              for (i = 0; i < sharedGroupsInfo.length; i++) {
                if (sharedGroupsInfo[i].count == undefined) {
                  sharedGroupsInfo[i].count = 0;
                }
                if (sharedGroupsInfo[i].description.length >= 100) {
                  sharedGroupsInfo[i].description = `${sharedGroupsInfo[i].description.substring(0,100)}...`;
                }
              }
              res.render('pages/groups', {
                  userLoggedIn: userLoggedIn,
                  groups: groups,
                  sharedGroups: sharedGroupsInfo,
                  haveGroups: true
              });

          })

        });
    }
    else{
        res.status(404);
        res.send({ error: 'Not found' });
    }
})


router.post('/updateGroup', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    console.log("user logged in: " + userLoggedIn);
    let groupId = req.body.groupId;
    let title = req.body.title;
    let description = req.body.description;
    let updateTime = req.body.modified;

    let update = {};
    if ( title != undefined ) {
      update["name"] = title;
    }

    if ( description != undefined ) {
      update["description"] = description;
    }

    if ( updateTime != undefined ) {
      update["modified"] = updateTime;
    }

    console.log(update);
    if ( userLoggedIn ) {
      req.knex('groups')
        .where({ group_id: groupId })
        .update(update)
        .then(() => {
          res.status(200).json({"message": "successfully updated group"})
          return;
        })
        .catch((err) => {
          console.log(err);
          res.status(401).json({"message": "error updating group"})
          return;
        });
        return;
    }
    else{
        res.status(404);
        res.send({ error: 'Not found' });
    }
})

module.exports = router;
