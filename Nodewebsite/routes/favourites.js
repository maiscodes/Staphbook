var express = require('express')
var router = express.Router()
router.get('/', function (req, res) {
  let userLoggedIn = false;
  let favorites = [];
  let hasFavs = false;
  if (req.session.userStatus === "loggedIn") {
    userLoggedIn = true;
    let value = req.session.userEmail;
    let email = decodeURIComponent(value);
    req.knex.select("*").from("user_favorites").where({ email: email }).then((fav_results, err) => {
      console.log(fav_results, err);
      //let fav_sample_list = [];
      // for (let i = 0; i < fav_results.length; i++) {
      //   fav_sample_list.push(fav_results[i].sample_id);
      // }
      if (fav_results.length > 0) {
        haveFavs = true;
        haveSugs = true;
        let same_sequence;
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
          .modify(function (queryBuilder) {
            queryBuilder.where({ "mlst_mlst.sample_id": fav_results[0].sample_id });
            for (let i = 1; i < fav_results.length; i++) {
              queryBuilder.orWhere({ "mlst_mlst.sample_id": fav_results[i].sample_id });
            }
          })
          .then((favorites, err) => {
            console.log(favorites, err);
            console.log(haveFavs);

            res.render('pages/favourites', { userLoggedIn: userLoggedIn, favorites: favorites, haveFavs: haveFavs });
          });
      }
      // no favourites found for current user
      else {
        res.render('pages/favourites', { userLoggedIn: userLoggedIn, favorites: 0, haveFavs: false });
      }
    });
  }
});

router.post('/', function (req, res) {
  let userLoggedIn = false;
  if (req.session.userStatus === "loggedIn") {
    userLoggedIn = true;
  }

  let sampleID = req.body.favouritedSampleID;
  console.log("this is the sampleID: " + sampleID);

  if (userLoggedIn) {
    let value = req.session.userEmail;
    let email = decodeURIComponent(value);
    console.log("=============================================================");

    req.knex("user_favorites").where({ email: email, sample_id: sampleID }).del().then((favorites, err) => {
      res.redirect("/favourites");
    })

  }

});

module.exports = router;