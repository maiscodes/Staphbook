var express = require('express')
var router = express.Router()

router.post('/addUserToGroup', function (req, res) {
    let userLoggedIn = req.session.userStatus === "loggedIn";
    let userEmail = decodeURIComponent(req.session.userEmail);
    let groupId = req.body.groupId;
    let email = req.body.email;
    console.log(groupId);
    console.log(email);

    let truncatedGroups = req.knex
                            .select('group_id', 'email')
                            .from('groups');

    let collaboratorSummary = req.knex
                                 .select('*')
                                 .from({groups: truncatedGroups})
                                 .union(function() {
                                   this.select({group_id: 'group_id', email: 'share_to_email'}).from('group_sharing')
                                 });
    // Check user has editting rights
    req.knex
        .select('*')
        .from({summary: collaboratorSummary})
        .where({group_id: groupId || 0})
        .andWhere({email: userEmail || ""})
        .then((collaborators)=> {
          console.log(collaborators)
          if (collaborators.length < 1) { // Fix for async
            return;
          }
          console.log("Collaborator Exists");
          //console.log("collab legnth greater than 1");
          req.knex('group_sharing')
              .insert({
                  group_id: groupId,
                  share_to_email: email
              })
              .then(() => {
                  console.log("Inserted")
                  req.knex('groups')
                      .where({group_id: groupId})
                      .update({modified: new Date(Date.now()).toISOString()})
                      .then(() => {
                          console.log("Success")
                          res.status(200).json({"message": "successfully added to group"})
                      })
                      .catch((err) => {
                          console.log("error updating")
                          res.status(401).json({"message": "Error updating group"})
                      })
                  }
              )
              .catch((err) => {
                  console.log("error adding")
                  console.log(err);
                  res.status(401).json({"message": "Error adding sample"})
              });
        })
        .catch(()=>{
          console.log("Not logged in")
        });

})

// Remove user from group


module.exports = router;
