const fs = require("fs");
const puppeteer = require("puppeteer");

const FBController = require("./controllers/FBController");

const nombre = "Restaurantes_Donostia.html";
// console.log(links);

let links = FBController.obtenLinks(nombre);
