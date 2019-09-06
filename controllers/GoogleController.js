const puppeteer = require("puppeteer");
var fs = require("fs");
const SheetsController = require("./SheetsController");

const devuelveEntre = (texto, inicio, fin) => {
	const pos = texto.search(inicio);
	if (pos === -1) {
		return "";
	} else {
		let raw = texto.substr(pos + inicio.length);
		if (fin === "") {
			return raw;
		} else {
			let posFin = raw.search(fin);
			if (posFin === -1) {
				return "";
			} else {
				return raw.substr(0, posFin);
			}
		}
	}
};

const devuelveDetalles = async info => {
	info.email = "";
	info.facebook = "";
	console.log(info.nombre);
	if (typeof info.web !== "undefined") {
		const browser = await puppeteer.launch({ headless: true });
		try {
			const page = await browser.newPage();
			if (info.web.search("facebook.com") === -1) {
				await page.goto(info.web);
				let html = await page.$eval("html", h => h.innerHTML);
				info.email = devuelveEntre(html, "mailto:", `\"`);
				info.facebook = devuelveEntre(html, "facebook.com/", `\"`);
			} else {
				info.facebook = devuelveEntre(info.web, "facebook.com/", "");
			}
			if (info.facebook.charAt(info.facebook.length - 1) === "/") {
				info.facebook = info.facebook.substr(0, info.facebook.length - 1);
			}
			if (info.email === "" && info.facebook !== "") {
				await page.goto(
					`https://www.facebook.com/${info.facebook}/about/?ref=page_internal`
				);
				html = await page.$eval("html", h => h.innerHTML);
				try {
					info.email = await page.$eval(
						"a[href*=mailto]",
						elem => elem.textContent
					);
					console.log(info.nombre + " email de Facebook!");
				} catch (e) {
					// console.log("No hay email");
				}
			}
			await page.close();
			await browser.close();
		} catch (e) {
			// console.log(e);
			await browser.close();
		}
	}
	return info;
};

const buscaSocket = async (codigos, socket, mostrarSoloEmails = false) => {
	// let resultados = [];
	let hayNext = true;
	let botonNext = null;
	let nodesNombres = [];
	let tmpNombre = "";
	const browser = await puppeteer.launch({
		// headless: false
	});
	try {
		const page = await browser.newPage();
		await page.setViewport({
			width: 1920,
			height: 1080
		});
		await page.goto("https://google.com");
		await page.type(
			"input.gLFyf.gsfi",
			`${codigos.negocio} en ${codigos.localidad}`
		);
		page.keyboard.press("Enter");

		await page.waitForSelector("div#resultStats");
		const masSitios = await page.$(".DLOTif");
		await masSitios.click();

		while (hayNext) {
			await page.waitForSelector("div.rl_full-list");

			/////////////
			// return false;
			/////////////

			try {
				botonNext = await page.$("a#pnnext.pn");
			} catch (e) {
				console.log("No hay botón next", e);
			}
			// const boxes = await page.$$(".VkpGBb");
			nodesNombres = await page.$$(".dbg0pd");
			tmpNombre = "";
			for (let i in nodesNombres) {
				let nodo = nodesNombres[i];
				let resultado = {};
				await nodo.click();
				await page.waitForSelector(".SPZz6b");
				await page.waitFor(1000);
				tmpNombre = await page.$eval(".SPZz6b", n => n.innerText);
				resultado.id = i;
				resultado.negocio = codigos.negocio;
				resultado.localidad = codigos.localidad;
				try {
					resultado.nombre = await page.$eval(".SPZz6b", n => n.innerText);
				} catch (e) {
					resultado.nombre = "";
					// No hay nombre
				}
				try {
					resultado.web = await page.$eval(".CL9Uqc.ab_button", n =>
						n.href.substr(0, 30) === "https://www.google.com/search?"
							? ""
							: n.href
					);
				} catch (e) {
					resultado.web = "";
					// No hay web
				}
				try {
					resultado.direccion = await page.$$eval(
						".zloOqf.kno-fb-ctx.PZPZlf > .LrzXr",
						nodes => nodes[0].innerText
					);
				} catch (e) {
					resultado.direccion = "";
					// No hay direccion
				}
				try {
					resultado.telefono = await page.$eval(
						".LrzXr.zdqRlf.kno-fv",
						n => n.innerText
					);
				} catch (e) {
					resultado.telefono = "";
					// No hay telefono
				}

				resultado = await devuelveDetalles(resultado);
				if (mostrarSoloEmails) {
					if (resultado.email !== "") {
						socket.emit("nuevoResultado", resultado);
						await SheetsController.nuevoResultado(resultado);
					}
				} else {
					socket.emit("nuevoResultado", resultado);
					await SheetsController.nuevoResultado(resultado);
				}
			}
			if (botonNext !== null) {
				await botonNext.click();
				await page.waitFor(5000);
			} else {
				hayNext = false;
			}
		}
		await browser.close();
		return true;
	} catch (err) {
		// console.error(err);
		console.log("Error");
		await browser.close();
		return false;
	}
};

module.exports = {
	buscaSocket
};
