const mongoose = require("mongoose")
const { Schema } = mongoose

const fixtureSchema = new Schema({
    awayTeam: {type: String, required: true},
    stadium: {type: String, required: true}
  })



module.exports = mongoose.model("LevelFiveFixture", fixtureSchema)