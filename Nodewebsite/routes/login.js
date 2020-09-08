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
              console.log(email);

              req.knex
                .select("*")
                .from("user_favorites")
                .where({ email: email })
                .limit(4)
                .then((fav_results, err) => {
                  console.log("fav_results");
                  console.log(fav_results, err);
                  console.log(fav_results.length);

                  let fav_sample_list=[];
                  if (fav_results.length > 0) {
                    //maybe for-loop
                    if (fav_results.length > 0) {
                      fav_sample_list.push(fav_results[0].sample_id); 
                    }
                    if (fav_results.length > 1) {
                      fav_sample_list.push(fav_results[1].sample_id);
                    }
                    if (fav_results.length > 2) {
                      fav_sample_list.push(fav_results[2].sample_id);
                    }
                    if (fav_results.length > 3) {
                      fav_sample_list.push(fav_results[3].sample_id);
                    }

                  let sample_id_subquery = req.knex.select("sample_id").from("sample_metadata").whereIn('sample_id', fav_sample_list);
                  
                    haveFavs = true;
                    haveSugs = true;

                    let same_sequence;
                  
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
                      .where("mlst_mlst.sample_id", "in", sample_id_subquery)
                      .then((same_sequence, err) => {
                        console.log(same_sequence);
                        req.knex
                        .select("name")
                        .from("sample_sample")
                        .where({
                          id: fav_results[fav_results.length - 1].sample_id,
                        })
                        .then((result_sample_sample, err) => {
                        
                          console.log(err, result_sample_sample);
                          let sampleName = result_sample_sample[0].name;
                          console.log(sampleName);

                          req.knex
                            .select("*")
                            .from("weighted_distance")
                            .where({ selected_sample: sampleName })
                            .limit(5)
                            .orderBy("distance", "asc")
                            .then((result_weighted_distances, err) => {
                              //console.log(err, result_weighted_distances);
                              console.log(result_weighted_distances, err);
                              if(result_weighted_distances.length>1){
                                let close_genetic_distances=[];
                              for (let i = 1; i < 5; i++) {
                                close_genetic_distances.push(result_weighted_distances[i].comparison_sample);
                            }
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
                                  close_genetic_distances)
                                  // result_weighted_distances[1].comparison_sample
                                  //   .wherein(
                                  //     sample_sample.name,
                                  //     result_weighted_distances[2]
                                  //       .comparison_sample
                                  //   )
                                  //   .wherein(
                                  //     sample_sample.name,
                                  //     result_weighted_distances[3]
                                  //       .comparison_sample
                                  //   )
                                  //   .wherein(
                                  //     sample_sample.name,
                                  //     result_weighted_distances[4]
                                  //       .comparison_sample
                                  //   ),
                                  .then(
                                                      (suggested, err) => {
                                    console.log(suggested, err);
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
                            )
                              }
                              // in case weighted distance not set up in DB
                              else{
                                res.render("pages/index", {
                                  userLoggedIn: userLoggedIn,
                                  favorites: favorites,
                                  suggested:[],
                                  haveFavs: haveFavs,
                                  haveSugs: haveSugs,
                                  creationSuccess: false,
                                  userNotRegistered: userNotRegistered,
                                });
                              }

                              
                                                            });
                        });
                        /*
                        //console.log(same_sequence);
                        for (same of same_sequence) {
                          // Make backwards compatible, TODO: keep as metadata later
                          same.country = same.metadata.country;
                          same.strain = same.metadata.strain;
                          same.host = same.metadata.host;
                          same.isolation_source =
                            same.metadata.isolation_source;
                          same.date = same.metadata.date_collected;
                        }
                      })//.where;
                    console.log("Fave results are"); */
                    
                    //console.log(selectKnex);

                    //req.knex(selectKnex + ");", (favorites, err) => {
               
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
