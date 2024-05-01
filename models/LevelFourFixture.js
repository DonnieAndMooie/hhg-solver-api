const mongoose = require("mongoose")
const { Schema } = mongoose

const fixtureSchema = new Schema({
    awayTeam: {type: String, required: true},
    stadium: {type: String, required: true},
    homeTeam: {type: String}
  })



module.exports = mongoose.model("LevelFourFixture", fixtureSchema)