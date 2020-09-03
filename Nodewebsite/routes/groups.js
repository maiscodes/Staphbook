var express = require('express')
var router = express.Router()

router.get('/groups', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";

    let groups = [];
    let haveGroups = false;

    if(userLoggedIn){
        req.knex
            .select('*')
            .from('groups')
            .where({email: req.session.userEmail})
            .orderBy('group_id', 'asc')
            .then((groups) => {
              let ids = [];
              for (i = 0; i < groups.length; i ++) {
                ids.push(groups[i].group_id);
              }
              req.knex
                .select('*')
                .from('group_samples')
                .whereIn('group_id', ids)
                .orderBy('group_id', 'asc')
                .then((group_samples) => {
                  for (i = 0; i < group_samples.length; i++) {
                    groups[i].count = group_samples[i].sample_id.length;
                  }
                  res.render('pages/groups', {
                      userLoggedIn: userLoggedIn,
                      groups: groups,
                      haveGroups: true
                })
              })
          })
    }
    else{
        res.status(404);
        res.send({ error: 'Not found' });
    }
})


router.post('/updateGroup', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    console.log(userLoggedIn);
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
