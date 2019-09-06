let GoogleSpreadsheet = require("google-spreadsheet");
let creds = require("../DriveKey/My-Project-42430d1b905b.json");

// Create a document object using the ID of the spreadsheet - obtained from its URL.
let doc = new GoogleSpreadsheet("10sautHoE-4VW7DCbZlKmMqesNZA-F6g-Nf2MRX4FFhs");

/*
// Authenticate with the Google Spreadsheets API.
doc.useServiceAccountAuth(creds, function(err) {
	// Get all of the rows from the spreadsheet.
	doc.getRows(1, function(err, rows) {
		console.log("Rows", rows.length);
	});
	doc.getRows(1, (e, rows) => console.log(rows.length));
});
*/

const nuevoResultado = resultado =>
	doc.useServiceAccountAuth(creds, err =>
		doc.addRow(3, resultado, (e, row) => e && console.log(e))
	);

module.exports = { nuevoResultado };
