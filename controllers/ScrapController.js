const puppeteer = require("puppeteer");
const Contacto = require("../models/contacto");
var fs = require("fs");

module.exports = {
	elemsToLinks: elems => {
		let links = [];
		return links;
	},
	scrapeImages: async (contacto, extensions, selectors) => {
		try {
			if (!fs.existsSync(`imagenes/${contacto._id}`)) {
				fs.mkdirSync(`imagenes/${contacto._id}`);
			}
			extensions.map(async (ext, key) => {
				const browser = await puppeteer.launch({
					headless: true
				});
				const page = await browser.newPage();
				page.setViewport({ width: 1920, height: 1080 });
				page.setUserAgent(
					"Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36"
				);
				let selector = selectors[key];
				let keepScrolling = true;
				let elem, previousHeight, newHeight;
				try {
					await page.goto(`${contacto.url}${ext}`);
				} catch (er) {
					console.log("Load page error:", er);
				}
				while (keepScrolling) {
					elem = await page.$(selector);
					if (elem != undefined) {
						keepScrolling = false;
					}
					try {
						newHeight = await page.evaluate("document.body.scrollHeight");
						console.log("new Height", newHeight);
						console.log("previous Height", previousHeight);
						console.log("-----------------------------");
						previousHeight = newHeight;
						await page.evaluate(
							"window.scrollTo(0, document.body.scrollHeight)"
						);
						await page.waitForFunction(
							`document.body.scrollHeight > ${previousHeight}`
						);
						await page.waitFor(1000);
					} catch (er) {
						console.log("Browser error:", er);
					}
				}
				await page.evaluate(
					`document.querySelector("${selector}").scrollIntoView()`
				);
				let buttonClose = await page.$("._3j0u");
				if (buttonClose != undefined) {
					await buttonClose.click();
				}
				await page.screenshot({
					path: `imagenes/${contacto._id}/image_0${key}.png`
				});
				await browser.close();
			});
		} catch (er) {
			console.log("Error scraping images:", er);
		}
	},
	scrapeInfiniteInstance: async (socket, instance, q) => {
		try {
			// console.log("instance", instance);
			let ins = JSON.parse(JSON.stringify(instance));
			let queue = [ins, ...q._tasks.toArray()];
			socket.emit("send queue", queue);
			const codigos = { ciudad: instance.city, negocio: instance.business };
			const browser = await puppeteer.launch({
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

			let links = [];
			let seguir = true;
			let previousHeight;
			let scrollDelay = 1000;
			let fin;
			while (seguir) {
				try {
					previousHeight = await page.evaluate("document.body.scrollHeight");
					await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
					await page.waitForFunction(
						`document.body.scrollHeight > ${previousHeight}`
					);
					await page.waitFor(scrollDelay);
					fin = await page.$("._64f._1zun");
					if (fin != undefined) {
						seguir = false;
					}
				} catch (e) {
					seguir = false;
				}
				prevIndex = links.length;
				links = await page.$$("._1uhw");
				newIndex = links.length - 1;
				ins.total = links.length;
				queue = [ins, ...q._tasks.toArray()];
				socket.emit("send queue", queue);
			}
			let contactos = [];
			let contacto = {};
			const pag = await browser.newPage();
			for (const link of links) {
				contacto = {};
				contacto.negocio = instance.business;
				contacto.ciudad = instance.city;
				contacto.nombre = await link.$eval("a", a => a.innerText);
				contacto.url = await link.$eval("a", a => a.href);
				await pag.goto(`${contacto.url}about/?ref=page_internal`);
				try {
					let tel = await pag.$eval("._50f4", elem => elem.innerText);
					contacto.telefono = tel.includes("Llamar")
						? tel.substring(7, tel.length)
						: "";
				} catch (e) {
					// console.log("No hay teléfono", e);
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
					contacto.imgUrl = await pag.$eval(
						"._4on7._3mk2.img",
						elem => elem.src
					);
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
				socket.emit("progress update", {
					total: links.length,
					completed: contactos.length
				});
			}

			Contacto.collection.insert(contactos, async function(err, docs) {
				if (err) {
					return console.error(err);
				} else {
					socket.emit("data saved", docs);
					await browser.close();
				}
			});
		} catch (e) {
			console.log("Scraping error", e);
		}
	},
	scrapeInfinite: async (socket, codes) => {
		try {
			console.log("codes :", codes);
			const { ciudad, negocio } = codes;
			const codigos = { ciudad, negocio };
			const browser = await puppeteer.launch({
				headless: true
			});

			const page = await browser.newPage();
			page.setUserAgent(
				"Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36"
				// "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
				// "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.149 Safari/537.36"
				// "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)"
			);
			await page.goto(
				`https://www.facebook.com/search/${codigos.ciudad}/places-in/${
					codigos.negocio
				}/places/intersect/`
			);
			// return false;

			let links = [];
			let seguir = true;
			let previousHeight;
			let scrollDelay = 1000;
			let fin;
			while (seguir) {
				previousHeight = await page.evaluate("document.body.scrollHeight");
				await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
				await page.waitForFunction(
					`document.body.scrollHeight > ${previousHeight}`
				);
				await page.waitFor(scrollDelay);
				fin = await page.$("._64f._1zun");
				if (fin != undefined) {
					seguir = false;
				}
			}
			links = await page.$$("._1uhw");
			socket.emit("progress update", {
				total: links.length,
				completed: 0
			});
			// return false;
			let contactos = [];
			let contacto = {};
			const pag = await browser.newPage();
			for (const link of links) {
				contacto = {};
				contacto.negocio = negocio;
				contacto.ciudad = ciudad;
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
				try {
					contacto.imgUrl = await pag.$eval(
						"._4on7._3mk2.img",
						elem => elem.src
					);
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
				socket.emit("progress update", {
					total: links.length,
					completed: contactos.length
				});
			}

			Contacto.collection.insert(contactos, async function(err, docs) {
				if (err) {
					return console.error(err);
				} else {
					socket.emit("data saved", docs);
					await browser.close();
				}
			});
		} catch (e) {
			console.log("Nuestro error", e);
		}
	},
	scrap: async (socket, codes) => {
		try {
			console.log("Empezamos");
			console.log("codes :", codes);
			const { ciudad, negocio } = codes;
			const codigos = { ciudad, negocio };
			const browser = await puppeteer.launch({
				headless: false
			});

			const page = await browser.newPage();
			page.setUserAgent(
				// "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36"
				// "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
				// "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.149 Safari/537.36"
				"Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)"
			);
			await page.goto(
				`https://www.facebook.com/search/${codigos.ciudad}/places-in/${
					codigos.negocio
				}/places/intersect/`
			);
			// return false;

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
			socket.emit("progress update", {
				total: links.length,
				completed: 0
			});

			let contactos = [];
			let contacto = {};
			const pag = await browser.newPage();
			for (const link of links) {
				contacto = {};
				contacto.negocio = negocio;
				contacto.ciudad = ciudad;
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
				try {
					contacto.imgUrl = await pag.$eval(
						"._4on7._3mk2.img",
						elem => elem.src
					);
				} catch (e) {
					// console.log("No hay imgUrl");
				}
				console.log(contacto);
				contactos.push(contacto);
				socket.emit("progress update", {
					total: links.length,
					completed: contactos.length
				});
			}

			Contacto.collection.insert(contactos, async function(err, docs) {
				if (err) {
					return console.error(err);
				} else {
					socket.emit("data saved", docs);
					await browser.close();
				}
			});
		} catch (e) {
			console.log("Nuestro error", e);
		}
	}
};
