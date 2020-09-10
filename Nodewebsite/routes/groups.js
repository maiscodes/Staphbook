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
            .then((groups) => {
                res.render('pages/groups', {
                    userLoggedIn: userLoggedIn,
                    groups: groups,
                    haveGroups: true
                })
        })
    }
    else{
        res.status(404);
        res.send({ error: 'Not found' });
    }
})

module.exports = router;