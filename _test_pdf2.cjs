const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const buf = fs.readFileSync('../Test-Policen/Gebaeudeversicherung_Wiener_Staedtische_Mariahilfer.pdf');
const parser = new PDFParse();
parser.parse(buf).then(d => {
  console.log('keys:', Object.keys(d));
  console.log('text type:', typeof d.text);
  console.log('text sample:', JSON.stringify((d.text || '').substring(0, 200)));
}).catch(e => console.error('ERROR:', e.message));
