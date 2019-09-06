const mongoose = require("mongoose");
const { Schema } = mongoose;

const ContactoSchema = new Schema({
	// _id: mongoose.Schema.Types.ObjectId,
	// contactid: { type: Number, required: true },
	nombre: { type: String, required: true },
	tipo: String,
	ciudad: String,
	negocio: String,
	provincia: String,
	comunidad: String,
	direccion: String,
	telefono: String,
	contacto: String,
	contacto_numero: String,
	interes: { type: String, default: "Facebook" },
	email_data: { type: Schema.Types.Mixed, default: {} },
	imagenes: { type: Array },
	producto: String,
	url: String,
	web: String,
	formulario: String,
	comentario: String,
	email: String,
	usuario: String,
	enviado: Boolean,
	fechaenviado: Date,
	created: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Contacto", ContactoSchema);
