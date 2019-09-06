const fs = require("fs");
const puppeteer = require("puppeteer");

const obtenLinks = nombre => {
	const archivo = fs.readFileSync(`./htmls/${nombre}.html`);

	const html = archivo.toString();

	const res = html.split(
		'data-bt="{&quot;ct&quot;:&quot;place_name&quot;}"><a href="'
	);
	const resInicial = html.split(',url:"');
	let links = [];
	let splits = [];
	console.log("Buscando links...");
	// for (let i = 1; i < resInicial.length; i++) {
	// 	splits = resInicial[i].split('",messageData');
	// 	links.push(splits[0]);
	// }
	for (let i = 1; i < res.length; i++) {
		splits = res[i].split('">');
		links.push(splits[0]);
	}
	console.log("Links encontrados: " + links.length);
	return links;
};

const obtenInfo = async (links, nombreFichero) => {
	const browser = await puppeteer.launch({
		headless: true
	});
	let contactos = [];
	let contacto = {};
	let link;
	const pag = await browser.newPage();
	console.log("Busqueda chrome abierta");
	for (let i in links) {
		link = links[i];
		contacto = {};
		contacto.fichero = nombreFichero;
		if (link.charAt(link.length - 1) === "/") {
			contacto.url = link;
		} else {
			contacto.url = link + "/";
		}
		await pag.goto(`${contacto.url}about/?ref=page_internal`);
		try {
			contacto.nombre = await pag.$eval("._64-f", elem => elem.innerText);
		} catch (e) {
			// console.log("No hay horario");
		}
		try {
			contacto.horario = await pag.$eval(
				".clearfix._ikh._5jau._p",
				elem => elem.textContent
			);
		} catch (e) {
			// console.log("No hay horario");
		}
		try {
			contacto.direccion = await pag.$eval(
				"._5aj7._3-8j._20ud > ._4bl9",
				elem => elem.innerText.replace(/\r\n|\n|\r/g, " ")
			);
		} catch (e) {
			// console.log("No hay dirección");
		}
		try {
			contacto.email = await pag.$eval(
				"a[href*=mailto]",
				elem => elem.textContent
			);
		} catch (e) {
			// console.log("No hay email");
		}
		try {
			contacto.web = await pag.$eval(
				'a[rel="noopener nofollow"] [id*=u_0]',
				elem => elem.textContent
			);
		} catch (e) {
			// console.log("No hay web");
		}
		try {
			contacto.imgUrl = await pag.$eval("._4on7._3mk2.img", elem => elem.src);
		} catch (e) {
			// console.log("No hay imgUrl");
		}
		await pag.goto(`${contacto.url}community/?ref=page_internal`);
		try {
			contacto.likes = await pag.$eval(
				"._4bl7._3xoj > ._3xom",
				elem => elem.textContent
			);
		} catch (e) {
			// console.log("No hay likes");
		}
		contactos.push(contacto);
		console.log((((Number(Number(i) + 1)) * 100) / links.length).toFixed(2) + "%");
	}
	// fs.writeFileSync(`../htmls/${nombreFichero}.json`, contactos);
	fs.writeFile(`./htmls/${nombreFichero}.json`, JSON.stringify(contactos), function(err) {
		if (err) throw err;
		console.log("Fichero JSON creado con éxito.");
	});
	let csvText = "Nombre,Email,Web,Url"
	for (const cont of contactos) {
		csvText += "\n";
		csvText += typeof cont.nombre === "undefined" ? "" : `${cont.nombre}`;
		csvText += `,`;
		csvText += typeof cont.email === "undefined" ? "" : `${cont.email}`;
		csvText += `,`;
		csvText += typeof cont.web === "undefined" ? "" : `${cont.web}`;
		csvText += `,`;
		csvText += typeof cont.url === "undefined" ? "" : `${cont.url}`;
	}
	fs.writeFile(`./htmls/${nombreFichero}.csv`, csvText, function(err) {
		if (err) throw err;
		console.log("Fichero CSV creado con éxito.");
	});
};

module.exports = { obtenInfo, obtenLinks };
