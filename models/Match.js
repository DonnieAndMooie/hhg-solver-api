const mongoose = require("mongoose")
const { Schema } = mongoose

const goalScorerSchema = new Schema({
    name: {type: String, required: true},
    minute: {type: String, required: true}
})


const MatchSchema = new Schema({
    season: {type: String, required: true},
    homeTeam: {type: String, required: true},
    awayTeam: {type: String, required: true},
    score: {type: String, required: true},
    stadium: {type: String, required: true},
    awayGoalScorers: [goalScorerSchema]
})


module.exports = mongoose.model("Match", MatchSchema)