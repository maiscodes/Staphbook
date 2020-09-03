var express = require('express')
var router = express.Router()
let bcrypt = require('bcrypt')

router.get('/', function (req, res) {
    let userLoggedIn = false
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }

    res.render('pages/createAccount', { userLoggedIn: userLoggedIn, userAlreadyExists: false });
});


router.post('/', function (req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }

    var email = req.body.email;
    var organisation = req.body.organisation;
    var occupation = req.body.occupation;

    if (email !== "") {

        bcrypt.hash(req.body.password, 10, function (err, hashedPassword) {

            req.db.query('SELECT * FROM registered_users WHERE email=\'' + req.body.email + '\'', (err, result_registered_users) => {
                console.log(err, result_registered_users);

                if (result_registered_users.rows.length != 0) {
                    console.log('User already entered into database');
                    res.render('pages/createAccount', { userLoggedIn: userLoggedIn, userAlreadyExists: true });
                    return;
                } else {
                    req.db.query('INSERT INTO registered_users (email, password, organisation, occupation) VALUES (\''
                        + email + '\',\'' + hashedPassword + '\',\'' + organisation + '\',\'' + occupation + '\')',
                        function (error, results, fields) {
                            if (error) {
                                throw error;
                                res.redirect('/');
                            } else {
                                creationSuccess = true;
                                res.redirect('/login');
                            }
                        });
                }
            });
        });
    } else {
        res.render('pages/createAccount', { userLoggedIn: userLoggedIn, userAlreadyExists: false });

    }
});

module.exports = router;