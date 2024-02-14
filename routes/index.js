var express = require('express');
var router = express.Router();
const Match = require ("../models/Match")
const axios = require("axios")
const cheerio = require("cheerio")
const asyncHandler = require("express-async-handler")
const fs = require("node:fs")

router.use((req, res, next) => {
  const origin = req.get("origin")
  if (origin === "https://donnieandmooie.github.io"){
    res.setHeader("Access-Control-Allow-Origin", "https://donnieandmooie.github.io");
  }
  else{
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
  }
  next()
})


router.get('/answer/:awayTeam/:stadium', asyncHandler(async function(req, res, next) {
  const answers = await Match.find({awayTeam: req.params.awayTeam, stadium: req.params.stadium}).sort("season")
  res.json(answers)
}));

router.get("/update", asyncHandler(async function (req, res, next) {

  await Match.deleteMany({season: "2023/24"})
  const url = "https://www.worldfootball.net/all_matches/eng-premier-league-2023-2024/"
  const season = "2023/24"

  await fetchSeasonData(url, season)


  async function fetchSeasonData(url, season){
    await axios(url)
    .then(async (response) => {
        const allMatches = []
        const html = response.data
        const $ = cheerio.load(html)
         $(".standard_tabelle").find("a").each(async function(){
            const text = $(this).text()
            if (text.length === 10 && text[text.length - 2] === ")"){
                const href = $(this).attr("href")
                const matchURL = `https://www.worldfootball.net${href}`
                const matchData = fetchMatchData(matchURL, season)
                //console.log(matchData)
                allMatches.push(matchData)
            }
        })
        return allMatches
  
    })
    .then(async (response) => {
        const data =  await Promise.all(response)
        //console.log(data)
        for (const match of data){
          const newMatch = new Match({
            season: match.season,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            score: match.score,
            awayGoalScorers: match.awayGoalScorers,
            stadium: match.stadium
          })
          await newMatch.save()
        }
        res.json(data)
    })
  }
  
  
  async function fetchMatchData(url, season){
    const matchData = {season}
    await axios(url)
        .then((response) => {
            const html = response.data
            const $ = cheerio.load(html)
            const teams = $("[width=35%]").each(function(i){
                const team = $(this).text().trim()
                if (i === 0){
                    matchData.homeTeam = team
                } else{
                    matchData.awayTeam = team
                }
            })
            const score = $(".resultat").text().trim()
            matchData.score = score
            const stadium = $("[href^=/venues]").text().slice(8)
            matchData.stadium = stadium
            matchData.awayGoalScorers = []
            const awayGoalScorers = $("td[style='padding-left: 50px;']").each(function(){
                const scorerData = $(this).text()
                const words = scorerData.slice(1).split(" ")
                let name = ""
                let minute
                for (const word of words){
                    if (word.match(/^\d/)) {
                        minute = word.replace(".", "'")
                        name = name.slice(0, -1)
                        break
                     }
                     else{
                        name += word + " "
                     }
                }
                matchData.awayGoalScorers.push({
                    name,
                    minute
                })
            })
           // console.log(matchData)
            return matchData
        })
        return matchData
  }
  
  
}))




module.exports = router;
