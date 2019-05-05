var mongoose = require("mongoose");

var matchSchema = mongoose.Schema({
    school1: String,
    school2: String,
    result: Number //1 for school1 win, 0 for school1 loss/school2 win, 0.5 for tie
});

module.exports = mongoose.model("School", schoolSchema);