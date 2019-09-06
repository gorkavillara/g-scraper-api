const express = require("express");
const router = express.Router();

const Ciudad = require("../models/ciudad");
const ciudades = require("../data/ciudades.json");

router.get("/ciudades", async (req, res) => {
	// Ciudades
	let ciudadesBulk = [];
	for (let ciudad of ciudades) {
		ciudadesBulk.push({ insertOne: { document: ciudad } });
	}
	try {
		let resp = await Ciudad.bulkWrite(ciudadesBulk);
		res.json({ resp });
	} catch (error) {
		res.json({ error });
	}
});

module.exports = router;
