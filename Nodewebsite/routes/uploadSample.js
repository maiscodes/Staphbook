var express = require('express')
var router = express.Router()

// advanced search page
router.get('/', function (req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }

    res.render('pages/uploadSample', { userLoggedIn: userLoggedIn });
});

router.post('/', function (req, res) {
    let sampleID = req.body.nameInput;
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }
    console.log("Im running");
    res.render('pages/result', { userLoggedIn: userLoggedIn, sampleSelection: sampleID});
});

module.exports = router;