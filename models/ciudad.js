const mongoose = require("mongoose");
const { Schema } = mongoose;

const CiudadSchema = new Schema({
	// _id: mongoose.Schema.Types.ObjectId,
	nombre: { type: String, required: true },
	provincia: { type: String },
	codigo: { type: String }
}, {
	collection: "ciudades"
});

module.exports = mongoose.model("Ciudad", CiudadSchema);
