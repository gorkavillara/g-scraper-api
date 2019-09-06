const fs = require("fs-extra");
const hbs = require("handlebars");
const path = require("path");

module.exports = {
	compile: async (templateName, dataRaw) => {
		const filePath = path.join(
			process.cwd(),
			"src",
			"templates",
			`${templateName}`
		);
		console.log("Read file: ", templateName);
		const html = await fs.readFile(filePath, "utf-8");

		let data = JSON.parse(JSON.stringify(dataRaw));
		if (data.interes == undefined) {
			data.interes = "Facebook";
		}
		if (data.contacto_numero === "Singular") {
			data.singular = true;
			data.interes = `tu ${data.interes}`;
		} else {
			if (data.interes === "Facebook") {
				data.interes = `vuestro Facebook`;
			} else {
				data.interes = `vuestra Web`;
			}
		}

		data.buttonURL = `https://nxtwayconsulting.com/contacto-email?nombre=${
			dataRaw.nombre
		}&email=${dataRaw.email}&url=${dataRaw.url}`;
		return hbs.compile(html)(data);
	}
};
