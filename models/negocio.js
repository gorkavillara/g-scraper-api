const mongoose = require("mongoose");
const { Schema } = mongoose;

const NegocioSchema = new Schema({
	// _id: mongoose.Schema.Types.ObjectId,
	nombre: { type: String, required: true },
	codigo: { type: String }
});

module.exports = mongoose.model("Negocio", NegocioSchema);
