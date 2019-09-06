const Contacto = require("../models/contacto");
const nodemailer = require("nodemailer");
const HTMLController = require("../controllers/HTMLController");

const transporter = nodemailer.createTransport({
	host: "smtp.buzondecorreo.com",
	port: 465,
	secure: true, // true for 465, false for other ports
	auth: {
		user: "gorka@nxtwayconsulting.com",
		pass: "u1630830U01"
	}
});

const sleep = milliseconds => {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if (new Date().getTime() - start > milliseconds) {
			break;
		}
	}
	return true;
};

module.exports = {
	getSubject: contacto => {
		let subject = `RE: Acerca de ${contacto.producto}`;
		if (
			contacto.contacto != undefined &&
			contacto.contacto_numero === "Singular"
		) {
			subject = `RE: ${contacto.contacto} - Acerca de ${contacto.producto}`;
		}
		return subject;
	},
	enviaMail: async contacto => {
		///////////// CREAMOS EL HTML
		let html = contacto.email_data.html;
		///////////// CONFIGURAMOS EL EMAIL
		let subject = contacto.email_data.subject;
		let mailOptions = {
			from: `"Gorka Villar" <gorka@nxtwayconsulting.com>`,
			to: contacto.email,
			// to: "gorkavillara@gmail.com",
			subject,
			bcc: "gorka@nxtwayconsulting.com",
			html: html
		};
		/////////////// ENVIAMOS EL EMAIL
		try {
			await transporter.sendMail(mailOptions);
			/////////////// ACTUALIZAMOS EL CONTACTO -> ENVÍO REALIZADO
			try {
				let nuevosdatos = {
					enviado: true,
					fechaenviado: new Date()
				};
				await Contacto.updateOne({ _id: contacto._id }, nuevosdatos);
			} catch (er) {
				console.log(er);
			}
		} catch (er) {
			console.log(er);
		}
	},
	enviaMails: async (contactos, template, socket) => {
		var successful = 0;
		var wrong = 0;
		for (let contacto of contactos) {
			socket.emit("email feedback", {
				sending: true,
				total: contactos.length,
				successful,
				wrong,
				to: contacto
			});
			if (contacto.nombre !== "" && contacto.email !== "") {
				///////////// CREAMOS EL HTML
				let html = await HTMLController.compile(template, contacto);
				///////////// CONFIGURAMOS EL EMAIL
				let subject = contacto.subject;
				let mailOptions = {
					from: `"Gorka Villar" <gorka@nxtwayconsulting.com>`,
					to: contacto.email,
					// to: "gorkavillara@gmail.com",
					subject,
					bcc: "gorka@nxtwayconsulting.com",
					html: html
				};
				/////////////// ENVIAMOS EL EMAIL
				try {
					await transporter.sendMail(mailOptions);
					successful++;
					/////////////// ACTUALIZAMOS EL CONTACTO -> ENVÍO REALIZADO
					try {
						let nuevosdatos = {
							enviado: true,
							fechaenviado: new Date()
						};
						await Contacto.updateOne({ _id: contacto._id }, nuevosdatos);
					} catch (er) {
						console.log(er);
					}
				} catch (er) {
					console.log(er);
					wrong++;
				}
				sleep(3000);
			}
		}
		socket.emit("email feedback", {
			sending: false,
			total: contactos.length,
			successful,
			wrong,
			to: {}
		});
	}
};
