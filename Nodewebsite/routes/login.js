var express = require("express");
var router = express.Router();
let bcrypt = require("bcrypt");

router.get("/", function (req, res) {
  let userLoggedIn = false;
  if (req.session.userStatus === "loggedIn") {
    userLoggedIn = true;
  }
  res.render("pages/login", {
    userLoggedIn: userLoggedIn,
    creationSuccess: false,
    userNotRegistered: false,
  });
});

router.post("/", function (req, res) {
  let userLoggedIn = false;
  if (req.session.userStatus == "loggedIn") {
    userLoggedIn = true;
  }
  let favorites = [];
  let suggested = [];
  let haveFavs = false;
  let haveSugs = false;

  let value = req.body.email;
  let email = decodeURIComponent(value);

  //console.log("The email is: " + value);

  req.knex
    .select("*")
    .from("registered_users")
    .where({ email: email })
    .then((result_registered_users, err) => {
      console.log(result_registered_users, err);
      if (result_registered_users.length !== 1) {
        console.log("user not registered");
        var userNotRegistered = true;
        res.render("pages/login", {
          userLoggedIn: userLoggedIn,
          creationSuccess: false,
          userNotRegistered: userNotRegistered,
        });
      } else {
        bcrypt.compare(
          req.body.password,
          result_registered_users[0].password,
          function (err, result) {
            //if password matched DB password
            if (result) {
              //setting the 'set-cookie' header
              res.cookie("setCookie", req.body.email, {
                httpOnly: true,
              });

              req.session.userStatus = "loggedIn";
              req.session.userEmail = req.body.email;

              userLoggedIn = true;
              let value = req.session.userEmail;
              let email = decodeURIComponent(value);

              req.knex
                .select("*")
                .from("user_favorites")
                .where({ email: email })
                .limit(4)
                .then((fav_results, err) => {
                  console.log(fav_results, err);
                  if (fav_results.length > 0) {
                    haveFavs = true;
                    haveSugs = true;

                    let same_sequence;
                    let same_sequence_samples = req.knex
                      .select("sample_id")
                      .from("sample_metadata");
                    let selectKnex = req.knex
                      .select({
                        st: "mlst_mlst.st",
                        sample_id: "sample_metadata.sample_id",
                        metadata: "sample_metadata.metadata",
                        name: "sample_sample.name",
                        id: "sample_sample.id",
                      })
                      .from("mlst_mlst")
                      .innerJoin(
                        "sample_sample",
                        "mlst_mlst.sample_id",
                        "sample_sample.id"
                      )
                      .innerJoin(
                        "sample_metadata",
                        "mlst_mlst.sample_id",
                        "sample_metadata.sample_id"
                      )
                      .where("mlst_mlst.sample_id", "in", same_sequence_samples)
                      .then((same_sequence) => {
                        for (same of same_sequence) {
                          // Make backwards compatible, TODO: keep as metadata later
                          same.country = same.metadata.country;
                          same.strain = same.metadata.strain;
                          same.host = same.metadata.host;
                          same.isolation_source =
                            same.metadata.isolation_source;
                          same.date = same.metadata.date_collected;
                        }
                      }).where;
                    if (fav_results.length > 0) {
                      selectKnex += {
                        sample_id: fav_results[0].sample_id,
                      };
                    }
                    if (fav_results.length > 1) {
                      selectKnex += {
                        sample_id: fav_results[1].sample_id,
                      };
                    }
                    if (fav_results.length > 2) {
                      selectKnex += {
                        sample_id: fav_results[2].sample_id,
                      };
                    }
                    if (fav_results.length > 3) {
                      selectKnex += {
                        sample_id: fav_results[3].sample_id,
                      };
                    }
                    console.log(selectKnex);

                    req.knex(selectKnex + ");", (err, favorites) => {
                      req.knex
                        .select("name")
                        .from("sample_sample")
                        .where({
                          id: fav_results[fav_results.length - 1].sample_id,
                        })
                        .then((err, result_sample_sample) => {
                          //console.log(err, result_tag_tosample);
                          let sampleName = result_sample_sample[0].name;

                          req.knex
                            .select("*")
                            .from("weighted_distance")
                            .where({ selected_sample: sampleName })
                            .limit(5)
                            .orderBy("distance", "asc")
                            .then((err, result_weighted_distances) => {
                              //console.log(err, result_weighted_distances);
                              console.log(err, result_weighted_distances);

                              req.knex
                                .select({
                                  st: "mlst_mlst.st",
                                  sample_id: "sample_metadata.sample_id",
                                  metadata: "sample_metadata.metadata",
                                  name: "sample_sample.name",
                                  id: "sample_sample.id",
                                })
                                .from("mlst_mlst")
                                .innerJoin(
                                  "sample_sample",
                                  "mlst_mlst.sample_id",
                                  "sample_sample.id"
                                )
                                .innerJoin(
                                  "sample_metadata",
                                  "mlst_mlst.sample_id",
                                  "sample_metadata.sample_id"
                                )
                                .where(
                                  "mlst_mlst.sample_id",
                                  "in",
                                  same_sequence_samples,
                                  result_weighted_distances[1].comparison_sample
                                    .wherein(
                                      sample_sample.name,
                                      result_weighted_distances[2]
                                        .comparison_sample
                                    )
                                    .wherein(
                                      sample_sample.name,
                                      result_weighted_distances[3]
                                        .comparison_sample
                                    )
                                    .wherein(
                                      sample_sample.name,
                                      result_weighted_distances[4]
                                        .comparison_sample
                                    ),
                                  (err, suggested) => {
                                    console.log(err, suggested);
                                    console.log(haveFavs);
                                    res.render("pages/index", {
                                      userLoggedIn: userLoggedIn,
                                      favorites: favorites,
                                      suggested: suggested,
                                      haveFavs: haveFavs,
                                      haveSugs: haveSugs,
                                      creationSuccess: false,
                                      userNotRegistered: userNotRegistered,
                                    });
                                  }
                                );
                            });
                        });
                    });
                  } else {
                    res.render("pages/index", {
                      userLoggedIn: userLoggedIn,
                      creationSuccess: false,
                      userNotRegistered: userNotRegistered,
                      favorites: favorites,
                      suggested: suggested,
                      haveFavs: haveFavs,
                      haveSugs: haveSugs,
                    });
                  }
                });
            } else {
              res.render("pages/login", {
                userLoggedIn: userLoggedIn,
                creationSuccess: false,
                userNotRegistered: userNotRegistered,
                favorites: favorites,
                suggested: suggested,
                haveFavs: haveFavs,
                haveSugs: haveSugs,
              });
            }
          }
        );
      }
    });
});
module.exports = router;
