const express = require("express");
const router = express.Router();

const Ciudad = require("../models/ciudad");

router.get("/", async (req, res) => {
	Ciudad.find()
		.then(r => res.json(r))
		.catch(er => res.status(500));
});

module.exports = router;
