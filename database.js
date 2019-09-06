const mongoose = require("mongoose");

const URI = "mongodb://localhost:27017/fb-scrapper";
const opt = { useNewUrlParser: true };

mongoose
	.connect(
		URI,
		opt
	)
	.then(db => console.log("DB fb-scrapper is connected"))
	.catch(err => console.log(err));

module.exports = mongoose;
