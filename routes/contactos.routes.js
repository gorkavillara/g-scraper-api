const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");

const Contacto = require("../models/contacto");

router.get("/", (req, res) => {
	if (req.query.negocio != 0) {
		Contacto.find({ negocio: req.query.negocio })
			.then(r => res.json(r))
			.catch(er => res.status(500));
	} else {
		Contacto.find()
			.then(r => res.json(r))
			.catch(er => res.status(500));
	}
	Contacto.find()
		.then(r => res.json(r))
		.catch(er => res.status(500));
});

router.post("/scrap", async (req, res) => {
	try {
		const ciudad = "109480645745835";
		const negocio = "186230924744328";
		// const codigos = {
		// 	ciudad: req.body.ciudad,
		// 	negocio: req.body.negocio
		// };
		const codigos = { ciudad, negocio };
		const browser = await puppeteer.launch({
			// waitUntil: "networkidle",
			headless: true
		});

		const page = await browser.newPage();
		page.setUserAgent(
			"Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36"
		);
		await page.goto(
			`https://www.facebook.com/search/${codigos.ciudad}/places-in/${
				codigos.negocio
			}/places/intersect/`
		);

		await page.waitForSelector("._32-s._32-q");
		let links = [];
		let linksTmp = [];
		let seguir = true;
		let sig;
		while (seguir) {
			linksTmp = await page.$$("._1uhw");
			links = links.concat(linksTmp);
			sig = await page.$("._32-s._32-q > a");
			if (sig === null) {
				seguir = false;
			} else {
				await page.click("._32-s._32-q > a");
				await page.waitForSelector("._32-s._32-q");
			}
		}

		let contactos = [];
		let contacto = {};
		const pag = await browser.newPage();
		for (const link of links) {
			contacto = {};
			contacto.nombre = await link.$eval("a", a => a.innerText);
			contacto.url = await link.$eval("a", a => a.href);
			await pag.goto(`${contacto.url}about/?ref=page_internal`);
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
			console.log(contacto);
			contactos.push(contacto);
		}
		await browser.close();
		res.json({
			contactos
		});
	} catch (e) {
		console.log("Nuestro error", e);
	}
});

router.post("/scrap2", async (req, res) => {
	try {
		const ciudad = "109480645745835";
		const negocio = "186230924744328";
		// const codigos = {
		// 	ciudad: req.body.ciudad,
		// 	negocio: req.body.negocio
		// };
		const codigos = { ciudad, negocio };
		const browser = await puppeteer.launch({
			waitUntil: "networkidle",
			headless: false
		});

		const page = await browser.newPage();
		page.setUserAgent(
			"Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36"
		);
		await page.goto(
			`https://www.facebook.com/search/${codigos.ciudad}/places-in/${
				codigos.negocio
			}/places/intersect/`
		);

		await page.waitForSelector("._1uhw");
		const links = await page.$$("._1uhw");
		let contactos = [];

		for (link of links) {
			let contacto = {};
			contacto.nombre = await link.$eval("a", a => a.innerText);
			contacto.url = await link.$eval("a", a => a.href);

			let infoPage = await browser.newPage();
			infoPage.setUserAgent(
				"Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36"
			);
			await infoPage.goto(`${contacto.url}about/?ref=page_internal`);
			// await newPage.screenshot({path: 'example.png'});
			try {
				contacto.horario = await infoPage.$eval(
					"u_jsonp_2_1",
					elem => elem.textContent
				);
			} catch (e) {
				// console.log("No hay horario");
			}
			try {
				contacto.direccion = await infoPage.$eval(
					"._5aj7._3-8j._20ud",
					elem => elem.textContent
				);
			} catch (e) {
				// console.log("No hay dirección");
			}
			try {
				contacto.email = await infoPage.$eval(
					"#u_jsonp_2_3",
					elem => elem.textContent
				);
			} catch (e) {
				// console.log("No hay email");
			}
			try {
				contacto.web = await infoPage.$eval("#u_0_o", elem => elem.textContent);
			} catch (e) {
				// console.log("No hay web");
			}
			infoPage.close();
			contactos.push(contacto);
		}

		// console.log(contacto);
		await browser.close();
		res.json({
			contactos
		});
	} catch (e) {
		console.log("Nuestro error", e);
	}
});

module.exports = router;
