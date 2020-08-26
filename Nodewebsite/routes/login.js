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

  let value = req.session.userEmail;
  let email = decodeURIComponent(value);

  req.knex
    .select("*")
    .from("registered_users")
    .where({ email: email })
    .then((err, result_registered_users) => {
      //console.log(err, result_registered_users);
      if (result_registered_users.rows.length != 1) {
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
          result_registered_users.rows[0].password,
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
                .where({ email: email, limit: 4 })
                .then((err, fav_results) => {
                  //console.log(err, fav_results);
                  if (fav_results.rows.length > 0) {
                    haveFavs = true;
                    haveSugs = true;
                    // let selectSQL = "";
                    // selectSQL =
                    //   "SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                    //   "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                    //   "sample_metadata.metadata->>'isolation_source' AS isolation_source, sample_metadata.metadata->>'date_collected' AS date " +
                    //   "FROM mlst_mlst  INNER JOIN sample_metadata ON mlst_mlst.sample_id=sample_metadata.sample_id " +
                    //   "WHERE mlst_mlst.sample_id IN (SELECT sample_id FROM sample_metadata " +
                    //   "WHERE";
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
                      .where(
                        "mlst_mlst.sample_id",
                        "in",
                        same_sequence_samples
                      );

                    if (fav_results.rows.length > 0) {
                      selectKnex +=
                        " sample_id = " + fav_results.rows[0].sample_id + "";
                    }
                    if (fav_results.rows.length > 1) {
                      selectKnex +=
                        " OR  sample_id = " +
                        fav_results.rows[1].sample_id +
                        "";
                    }
                    if (fav_results.rows.length > 2) {
                      selectKnex +=
                        " OR  sample_id = " +
                        fav_results.rows[2].sample_id +
                        "";
                    }
                    if (fav_results.rows.length > 3) {
                      selectKnex +=
                        " OR  sample_id = " +
                        fav_results.rows[3].sample_id +
                        "";
                    }
                    console.log(selectKnex);

                    req.knex(selectKnex + ");", (err, favorites) => {
                      // req.db.query(
                      //   "SELECT name FROM sample_sample WHERE id=" +
                      //     fav_results.rows[fav_results.rows.length - 1]
                      //       .sample_id +
                      //     "",
                      req.knex
                        .select("name")
                        .from("sample_sample")
                        .where({
                          id:
                            fav_results.rows[fav_results.rows.length - 1]
                              .sample_id,
                        })
                        .then((err, result_sample_sample) => {
                          //console.log(err, result_tag_tosample);
                          let sampleName = result_sample_sample.rows[0].name;

                          // Sample's weighted distances
                          // req.db.query(
                          //   "SELECT * FROM weighted_distance WHERE selected_sample='" +
                          //     sampleName +
                          //     "' ORDER BY distance ASC LIMIT 5",
                          //   (err, result_weighted_distances) =>
                          req.knex
                            .select("*")
                            .from("weighted_distance")
                            .where({ selected_sample: sampleName, limit: 5 })
                            .orderBy("distance", "asc")
                            .then((err, result_weighted_distances) => {
                              //console.log(err, result_weighted_distances);
                              console.log(err, result_weighted_distances);

                              // req.db.query(
                              //   "SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
                              //     "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
                              //     "sample_metadata.metadata->>'isolation_source' AS isolation_source, sample_sample.name, sample_sample.id " +
                              //     "FROM sample_sample  " +
                              //     "INNER JOIN mlst_mlst ON sample_sample.id=mlst_mlst.sample_id " +
                              //     "INNER JOIN sample_metadata ON sample_sample.id=sample_metadata.sample_id " +
                              //     "WHERE sample_sample.name='" +
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
                                  same_sequence_samples +
                                    result_weighted_distances.rows[1]
                                      .comparison_sample +
                                    "' " +
                                    "OR sample_sample.name='" +
                                    result_weighted_distances.rows[2]
                                      .comparison_sample +
                                    "' " +
                                    "OR sample_sample.name='" +
                                    result_weighted_distances.rows[3]
                                      .comparison_sample +
                                    "' " +
                                    "OR sample_sample.name='" +
                                    result_weighted_distances.rows[4]
                                      .comparison_sample +
                                    "'",
                                  (err, suggested) => {
                                    console.log(err, suggested);
                                    console.log(haveFavs);
                                    res.render("pages/index", {
                                      userLoggedIn: userLoggedIn,
                                      favorites: favorites.rows,
                                      suggested: suggested.rows,
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
                      favorites: favorites.rows,
                      suggested: suggested.rows,
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
                favorites: favorites.rows,
                suggested: suggested.rows,
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
