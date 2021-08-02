const mongoose = require("mongoose");
let cardSchema = new mongoose.Schema({
	//Details
	contents: Array,
	class: String,
    classArray: Array,
	quality: Number,
	qualityArray: Array,
	sentiment: String,
	sentimentArray: Array,
	depressionFlag: Boolean,
	ldaTopic: Number
});
module.exports = mongoose.model("Card", cardSchema);