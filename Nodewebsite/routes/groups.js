var express = require('express')
var router = express.Router()

router.get('/', function (req, res) {
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

module.exports = router;
