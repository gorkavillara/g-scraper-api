const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
// const { mongoose } = require("./database");
const async = require("async");

const app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

const ScrapController = require("./controllers/ScrapController");
const ContactosController = require("./controllers/ContactosController");
const GoogleController = require("./controllers/GoogleController");
const MailController = require("./controllers/MailController");
const Contacto = require("./models/contacto");
const FBController = require("./controllers/FBController");
const SheetsController = require("./controllers/SheetsController");

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

app.get("/", async (req, res) => {
	res.send(`
		<html>
			<h1>Esta es la API de GorkaVillarConsulting - Aplicación para Scraping en Google</h1>
		</html>
	`);
});

app.post("/buscaGoogle", async (req, res) => {
	console.log(req.body);
	let resultados = await GoogleController.busca(req.body);
	// let resultados = [{nombre: "Nombre", web: "http://web.com", telefono: "1234569789"}];
	res.json(resultados);
});

app.get("/api", (req, res) => {
	res.json({
		status: "Hola"
	});
});

io.on("connection", socket => {
	socket.on("buscaGoogle", async data => {
		await GoogleController.buscaSocket(data, socket, data.mostrarSoloEmails);
		io.emit("finBusqueda");
	});
	socket.on("buscaMasivo", async (cola, mostrarSoloEmails) => {
		console.log(mostrarSoloEmails);
		for (let i = 0; i < cola.length; i++) {
			let data = {
				localidad: cola[i].localidad,
				negocio: cola[i].negocio
			}
			await GoogleController.buscaSocket(data, socket, mostrarSoloEmails);
		}
		io.emit("finBusqueda");
	});
})

http.listen(app.get("port"), () => {
	console.log(`server on port ${app.get("port")}`);
});
