var express = require("express");
var router = express.Router();
let bcrypt = require("bcrypt");

router.get("/", function (req, res) {
  let userLoggedIn = false;
  if (req.session.userStatus === "loggedIn") {
    userLoggedIn = true;
  }

  res.render("pages/createAccount", {
    userLoggedIn: userLoggedIn,
    userAlreadyExists: false,
  });
});

router.post("/", function (req, res) {
  let userLoggedIn = false;
  if (req.session.userStatus === "loggedIn") {
    userLoggedIn = true;
  }

  var email = req.body.email;
  var organisation = req.body.organisation;
  var occupation = req.body.occupation;

  if (email !== "") {
    bcrypt.hash(req.body.password, 10, function (err, hashedPassword) {
      req.knex
        .select("*")
        .from("registered_users")
        .where({ email: email })
        .then((result_registered_users, err) => {
          console.log(result_registered_users, err);

          //return knex('registered_users').where
          if (result_registered_users.length != 0) {
            console.log("User already entered into database");
            res.render("pages/createAccount", {
              userLoggedIn: userLoggedIn,
              userAlreadyExists: true,
            });
            return;
          } else {
            req
              .knex("registered_users")
              .insert({
                email: email,
                password: hashedPassword,
                organisation: organisation,
                occupation: occupation,
              })
              .then((result_registered_users, error) => {
                console.log(result_registered_users, error);
                if (error) {
                  throw error;
                  res.redirect("/");
                } else {
                  creationSuccess = true;
                  res.redirect("/login");
                }
              });
          }
        });
    });
  } else {
    res.render("pages/createAccount", {
      userLoggedIn: userLoggedIn,
      userAlreadyExists: false,
    });
  }
});

module.exports = router;
