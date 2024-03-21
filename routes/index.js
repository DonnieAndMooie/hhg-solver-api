var express = require('express');
var router = express.Router();
const Match = require ("../models/Match")
const LevelOneFixture = require("../models/LevelOneFixture")
const LevelTwoFixture = require ("../models/LevelTwoFixture")
const LevelThreeFixture = require("../models/LevelThreeFixture")
const LevelFourFixture = require ("../models/LevelFourFixture")
const LevelFiveFixture =  require ("../models/LevelFiveFixture")
const DailyFixtures = require ("../models/DailyFixtures")
const axios = require("axios")
const cheerio = require("cheerio")
const asyncHandler = require("express-async-handler")


router.use((req, res, next) => {
  const origin = req.get("origin")
  if (origin === "https://donnieandmooie.github.io"){
    res.setHeader("Access-Control-Allow-Origin", "https://donnieandmooie.github.io");
  }
  else{
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Content-Type-Options, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Private-Network", true);
  res.setHeader("Access-Control-Max-Age", 7200);
  next()
})


router.get('/answer/:awayTeam/:stadium', asyncHandler(async function(req, res, next) {
  const answers = await Match.find({awayTeam: req.params.awayTeam, stadium: req.params.stadium}).sort("season")
  res.json(answers)
}));

router.get("/update", asyncHandler(async function (req, res, next) {

  //await Match.deleteMany({season: "2023/24"})
  const savedMatches = await Match.find({season: "2023/24"})
  const url = "https://www.worldfootball.net/all_matches/eng-premier-league-2023-2024/"
  const season = "2023/24"

  await fetchSeasonData(url, season)


  async function fetchSeasonData(url, season){
    await axios(url)
    .then(async (response) => {
        const allMatches = []
        const html = response.data
        const $ = cheerio.load(html)
        let homeTeam = null
        let saveMatch = false
         $(".standard_tabelle").find("a").each(async function(){

          const href = $(this).attr("href")
          if (href.startsWith("/teams")){
            if (homeTeam){
              let awayTeam = $(this).text()
              const saved = savedMatches.find((match) => match.homeTeam === homeTeam && match.awayTeam === awayTeam)
              homeTeam = null
              if (saved === undefined){
                saveMatch = true
              }
            }
            else{
              homeTeam = $(this).text()
              saveMatch = false
            }
            return
          }

            const text = $(this).text()
            if (text.length === 10 && text[text.length - 2] === ")" && saveMatch){
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

router.get("/daily-fixtures", async (req, res, next) => {
  const currentFixtures = await DailyFixtures.findOne({}) 
  const savedDate = currentFixtures.timestamp.toDateString()
    if (savedDate === new Date().toDateString()){
      res.json(currentFixtures)
    }
    else{
      await DailyFixtures.deleteOne()
      const fixture1 = await LevelOneFixture.aggregate().sample(1)
      const fixture2 = await LevelTwoFixture.aggregate().sample(1)
      const fixture3 = await LevelThreeFixture.aggregate().sample(1)
      const fixture4 = await LevelFourFixture.aggregate().sample(1)
      const fixture5 = await LevelFiveFixture.aggregate().sample(1)

      async function getAnswers(fixture){
        const fixturedetails = await Match.find({awayTeam: fixture[0].awayTeam, stadium: fixture[0].stadium})
        const answers = []
        for (const game of fixturedetails){
          for (const goalscorer of game.awayGoalScorers){
            answers.push({season: game.season, player: goalscorer.name})
            console.log(goalscorer.name)
          }
        }
        answers.sort((a,b) => (a.season > b.season) ? 1 : ((b.season > a.season) ? -1 : 0))
        return answers
      }

      const [answers1, answers2, answers3, answers4, answers5] = await Promise.all([getAnswers(fixture1), getAnswers(fixture2), getAnswers(fixture3), getAnswers(fixture4), getAnswers(fixture5)])

      // const answers1 = await getAnswers(fixture1)
      // const answers2 = await getAnswers(fixture2)
      // const answers3 = await getAnswers(fixture3)
      // const answers4 = await getAnswers(fixture4)
      // const answers5 = await getAnswers(fixture5)

      const dailyFixtures = new DailyFixtures({
        levelOne: {awayTeam: fixture1[0].awayTeam, stadium: fixture1[0].stadium, answers: answers1},
        levelTwo: {awayTeam: fixture2[0].awayTeam, stadium: fixture2[0].stadium, answers: answers2},
        levelThree: {awayTeam: fixture3[0].awayTeam, stadium: fixture3[0].stadium, answers: answers3},
        levelFour: {awayTeam: fixture4[0].awayTeam, stadium: fixture4[0].stadium, answers: answers4},
        levelFive: {awayTeam: fixture5[0].awayTeam, stadium: fixture5[0].stadium, answers: answers5},
        timestamp: Date.now()
      })
      await dailyFixtures.save()
      res.json(dailyFixtures)
    }

    

})




module.exports = router;
