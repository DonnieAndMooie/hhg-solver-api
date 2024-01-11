var express = require('express');
var router = express.Router();
const Match = require ("../models/Match")

/* GET home page. */
router.get('/answer/:awayTeam/:stadium', async function(req, res, next) {
  const origin = req.get("origin")
  if (origin === "https://donnieandmooie.github.io"){
    res.setHeader("Access-Control-Allow-Origin", "https://donnieandmooie.github.io");
  }
  else{
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
  }
  
  const answers = await Match.find({awayTeam: req.params.awayTeam, stadium: req.params.stadium}).sort("season")
  res.json(answers)
});

module.exports = router;
