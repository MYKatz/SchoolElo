var mongoose = require("mongoose");

var schoolSchema = mongoose.Schema({
    name: String,
    elo: Number,
    history: Array
});

module.exports = mongoose.model("School", schoolSchema);