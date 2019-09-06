const Contacto = require("../models/contacto");

module.exports = {
	check: async (socket, codes) => {
		try {
			console.log('Empezamos');
			const { negocio, ciudad } = codes;
			const contactos = await Contacto.find({
				negocio, ciudad
			});
			socket.emit("retrieve data", contactos);
		} catch (e) {
			console.log("Nuestro error", e);
		}
	}
};
