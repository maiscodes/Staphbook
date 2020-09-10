var express = require('express')
var router = express.Router()

router.get('/', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";

    let groups = [];
    let haveGroups = false;

    if(userLoggedIn){
        //TODO SQL Query to get list of groups

        res.render('pages/groups', {
            userLoggedIn: userLoggedIn,
            groups: [
                {
                    group_id: "0001",
                    name: "group 1",
                    count: "10",
                    created: "2020-01-15T13:45:30",
                    modified: "2020-02-15T13:45:30"
                },
                {
                    group_id: "0020",
                    name: "group 2",
                    count: "15",
                    created: "2020-05-15T13:45:30",
                    modified: "2020-07-15T13:45:30"
                },
                {
                    group_id: "0300",
                    name: "group 3",
                    count: "7",
                    created: "2020-01-15T13:45:30",
                    modified: "2020-09-15T13:45:30"
                },
                {
                    group_id: "4000",
                    name: "group 4",
                    count: "4",
                    created: "2019-09-15T13:45:30",
                    modified: "2020-01-02T13:45:30"
                },
            ],
            haveGroups: true
        });
    }
    else{
        res.status(404);
        res.send({ error: 'Not found' });
    }
})

module.exports = router;