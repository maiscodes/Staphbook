var express = require('express')
var router = express.Router()

router.get('/', function (req, res) {
    let userLoggedIn = false
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }

    res.render('pages/createAccount', { userLoggedIn: userLoggedIn, userAlreadyExists: false });
});

module.exports = router;