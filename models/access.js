const mongoose = require("mongoose");
let accessSchema = new mongoose.Schema({
	code: String,
	date: Date,
	used: Boolean
});
module.exports = mongoose.model("Access", accessSchema);