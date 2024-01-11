var express = require('express');
var router = express.Router();
const Match = require ("../models/Match")

/* GET home page. */
router.get('/answer/:awayTeam/:stadium', async function(req, res, next) {
  const answers = await Match.find({awayTeam: req.params.awayTeam, stadium: req.params.stadium}).sort("season")
  res.json(answers)
});

module.exports = router;
