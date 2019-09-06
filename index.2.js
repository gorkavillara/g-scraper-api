const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const { mongoose } = require("./database");
const async = require("async");

const app = express();

var http = require("http").Server(app);
var io = require("socket.io")(http);

const ScrapController = require("./controllers/ScrapController");
const ContactosController = require("./controllers/ContactosController");
const HTMLController = require("./controllers/HTMLController");
const MailController = require("./controllers/MailController");
const Contacto = require("./models/contacto");

app.set("port", process.env.PORT || 4000);

app.use(express.json({ limit: "50mb" }));
app.use(
	express.urlencoded({
		limit: "50mb",
		extended: true,
		parameterLimit: 5000000000
	})
);
app.use(cors());

app.use(morgan("dev"));
app.use("/api/inicializa", require("./routes/inicializa.routes"));
app.use("/api/ciudades", require("./routes/ciudades.routes"));
app.use("/api/contactos", require("./routes/contactos.routes"));

app.get("/", (req, res) => {
	res.send(`
		<html>
			<h1>Hola bienvenido a Node</h1>
			<p>Esta es la página de bienvenida</p>
		</html>
	`);
});
app.get("/api", (req, res) => {
	res.json({
		status: "Hola"
	});
});

io.on("connection", function(socket) {
	console.log("Connection IO");

	let q = async.queue(async (instance, callback) => {
		socket.emit("send queue", [instance, ...q._tasks.toArray()]);
		if (instance.city != 0) {
			try {
				await ScrapController.scrapeInfiniteInstance(socket, instance, q);
			} catch (er) {
				socket.emit("send failed", { instance, error: "Error desconocido" });
				console.log("Queue error:", er);
			}
		} else {
			socket.emit("send failed", { instance, error: "Código no legible" });
			console.log("Instance city equals 0 - Not scrapeable");
		}
		callback();
	}, 1);
	q.drain = () => socket.emit("send queue", []);

	socket.on("add to queue", instance => q.push(instance, () => true));
	socket.on("new queue", newQueue => {
		q.remove(() => true);
		return newQueue.map(ins => q.push(ins, () => true));
	});
	socket.on("remove", instance => {
		let fn = ({ data, priority }) =>
			data.city === instance.city && data.business === instance.business;
		q.remove(fn);
	});
	socket.on("scrape images", contacto => {
		return ScrapController.scrapeImages(
			contacto,
			["", "", "photos"],
			["._li", "._5va1._427x", "._c24._2iel"]
		);
	});
	socket.on("get contacts", async (filter, ack) => {
		let contacts = await Contacto.find(filter);
		ack(contacts);
	});

	socket.on("check data", async codes => {
		await ContactosController.check(socket, codes);
	});
	socket.on("scrap", async codes => {
		socket.emit("progress update", {
			total: 0,
			completed: 0
		});
		await ScrapController.scrapeInfinite(socket, codes);
	});
	socket.on("update contact", async (contact, ack) => {
		await Contacto.updateOne({ _id: contact._id }, contact);
		socket.emit("contacts message", "Contacto actualizado!");
		ack(contact);
	});
	socket.on("silent update contact", async contact => {
		await Contacto.updateOne({ _id: contact._id }, contact);
	});
	socket.on("delete contacts", async (contacts, ack) => {
		let ids = contacts.map(contact => contact._id);
		await Contacto.deleteMany({ _id: { $in: ids } });
		ack("Contactos Eliminados");
	});
	socket.on("get html", async (template, contacts, ack) => {
		try {
			const html = await HTMLController.compile(template, contacts[0]);
			const subject = MailController.getSubject(contacts[0]);
			ack({ html, subject });
		} catch (e) {
			console.log(e);
		}
	});
	socket.on("get mail", async (template, contacts, ack) => {
		try {
			const html = await HTMLController.compile(template, contacts[0]);
			ack(html);
		} catch (e) {
			console.log(e);
		}
	});
	socket.on("send email", async (contact, ack) => {
		await MailController.enviaMail(contact, socket);		
		ack("Email enviado!");
	});
	socket.on("send emails", async (data, ack) => {
		let contacto = JSON.parse(JSON.stringify(data.contacts[0]));
		contacto.email_data = {
			subject: data.subject,
			html: data.html
		};
		await Contacto.updateOne({ _id: contacto._id }, contacto);
		await MailController.enviaMail(contacto);
		ack("Email enviado!");
	});
	socket.on("save contact email", async (data, ack) => {
		let contacto = JSON.parse(JSON.stringify(data.contacts[0]));
		contacto.email_data = {
			subject: data.subject,
			html: data.html
		};
		await Contacto.updateOne({ _id: contacto._id }, contacto);
		ack("Contacto guardado!");
	});
	socket.on("send emails", async (data, ack) => {
		await MailController.enviaMails(data.contacts, data.template, socket);
		ack("Emails enviados!");
	});
	socket.on("get email list", () => {
		let emailFolder = "./src/templates/";
		fs.readdir(emailFolder, (err, files) => {
			socket.emit("email list", files);
		});
	});

	socket.on("inicializa", async () => {
		await Contacto.updateMany(
			{ email_data: { $exists: false } },
			{ $set: { email_data: { subject: "", html: "" } } }
		);
	});
});

http.listen(app.get("port"), () => {
	console.log(`server on port ${app.get("port")}`);
});
