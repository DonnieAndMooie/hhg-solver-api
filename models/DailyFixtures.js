const mongoose = require("mongoose")
const { Schema } = mongoose

const answerSchema = new Schema({
  player: {type: String, required: true},
  season: {type: String, required: true}
})

const dailyFixturesSchema = new Schema({
    levelOne: {
      awayTeam: {type: String, required: true},
      stadium: {type: String, required: true},
      answers: [answerSchema],
    },
    levelTwo: {
      awayTeam: {type: String, required: true},
      stadium: {type: String, required: true},
      answers: [answerSchema],
    },
    levelThree: {
      awayTeam: {type: String, required: true},
      stadium: {type: String, required: true},
      answers: [answerSchema],
    },
    levelFour: {
      awayTeam: {type: String, required: true},
      stadium: {type: String, required: true},
      answers: [answerSchema],
    },
    levelFive: {
      awayTeam: {type: String, required: true},
      stadium: {type: String, required: true},
      answers: [answerSchema],
    },
    timestamp: {type: Date, default: Date.now(), required: true},
  })



module.exports = mongoose.model("DailyFixtures", dailyFixturesSchema)