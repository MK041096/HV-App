const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const buf = fs.readFileSync('../Test-Policen/Gebaeudeversicherung_Wiener_Staedtische_Mariahilfer.pdf');
const parser = new PDFParse();
parser.parse(buf).then(d => { process.stdout.write(JSON.stringify(d.text.substring(0, 800)) + '\n'); });
