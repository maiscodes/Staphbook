var express = require('express')
var router = express.Router()

router.get('/', function (req, res) {
    let userLoggedIn = false;
    if (req.session.userStatus === "loggedIn") {
        userLoggedIn = true;
    }

    let sequenceInput = req.query.sequenceInput;
    let startDate = req.query.inputDateStart;
    let endDate = req.query.inputDateEnd;
    let locationInput = req.query.locationInput;
    let strainInput = req.query.strainInput;
    let hostInput = req.query.hostInput;
    let sourceInput = req.query.sourceInput;
    if(strainInput == "" && sequenceInput=="" && startDate=="" && endDate=="" && locationInput=="" && hostInput=="" && sourceInput=="") {
        res.redirect('/advancedSearch');
    } else {
        let selectSQL = "";
        selectSQL = "SELECT mlst_mlst.st, sample_metadata.sample_id, metadata->>'country' AS country, " +
            "sample_metadata.metadata->>'strain' AS strain, sample_metadata.metadata->>'host' AS host, " +
            "sample_metadata.metadata->>'isolation_source' AS isolation_source, sample_metadata.metadata->>'date_collected' AS date " +
            "FROM mlst_mlst  INNER JOIN sample_metadata ON mlst_mlst.sample_id=sample_metadata.sample_id " +
            "WHERE";
        if (sequenceInput != ""){
            selectSQL += " mlst_mlst.st = '" + sequenceInput + "'";
            if (locationInput != "" || strainInput != "" || hostInput != "" || sourceInput != "" || startDate != "" || endDate != ""){
                selectSQL += " AND ";
            }
        }
        if (startDate != "" || endDate != ""){
            if(endDate == ""){
                selectSQL += " CAST(metadata->>'collection_date' AS DATE) >= '" + startDate + "'";
            } else if (startDate == ""){
                selectSQL += " CAST(metadata->>'collection_date' AS DATE) <= '" + endDate + "'";
            } else{
                selectSQL += " CAST(metadata->>'collection_date' AS DATE) >= '" + startDate + "' AND  CAST(metadata->>'collection_date' AS DATE) <= '" + endDate + "'";
            }
            if (strainInput != "" || hostInput != "" || sourceInput != ""){
                selectSQL += " AND ";
            }
        }
        if (locationInput != ""){
            selectSQL += " metadata->>'country' ILIKE '%" + locationInput + "%'";
            if (strainInput != "" || hostInput != "" || sourceInput != ""){
                selectSQL += " AND ";
            }
        }
        if (strainInput != ""){
            selectSQL += " metadata->>'strain' ILIKE '%" + strainInput + "%'";
            if (hostInput != "" || sourceInput != ""){
                selectSQL += " AND ";
            }
        }
        if (hostInput != ""){
            selectSQL += " metadata->>'host' ILIKE '%" + hostInput + "%'";
            if (sourceInput != ""){
                selectSQL += " AND ";
            }
        }
        if (sourceInput != ""){
            selectSQL += " metadata->>'isolation_source' ILIKE '%" + sourceInput + "%' ";
        }
        console.log(selectSQL);

        req.db.query(selectSQL + ";", (err, result_samples) => {
            console.log(err, result_samples);
            number = result_samples.rows.length;
            res.render('pages/advSearchResults', { samples: result_samples.rows, number: number, userLoggedIn: userLoggedIn });
        });
    }
});

module.exports = router