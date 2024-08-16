var fs = require('fs');
var path = require('path');
var assert = require('assert');
var puppeteer = require('puppeteer');
/*
 * Create a PDF file out of an HTML string using Puppeteer.
 */
module.exports = PDF;
function PDF(html, options) {
  this.html = html;
  this.options = options || {};

  if (this.options.filename) this.options.filename = path.resolve(this.options.filename);
  this.options.timeout = parseInt(this.options.timeout, 10) || 30000;

  assert(typeof this.html === 'string' && this.html.length, "Can't create a pdf without an html string");
}
PDF.prototype.toBuffer = async function PdfToBuffer(callback) {
  try {
    const pdfBuffer = await this.generatePdf();
    callback(null, pdfBuffer);
  } catch (err) {
    callback(err);
  }
};
PDF.prototype.toStream = async function PdfToStream(callback) {
  try {
    const pdfBuffer = await this.generatePdf();
    const stream = fs.createReadStream(pdfBuffer);

    stream.on('end', () => {
      fs.unlink(pdfBuffer, (err) => {
        if (err) console.log('Error deleting temp file:', err);
      });
    });

    callback(null, stream);
  } catch (err) {
    callback(err);
  }
};

PDF.prototype.toFile = async function PdfToFile(filename, callback) {
  assert(arguments.length > 0, 'The method .toFile([filename, ]callback) requires a callback.');
  if (typeof filename === 'function') {
    callback = filename;
    filename = undefined;
  } else {
    this.options.filename = path.resolve(filename);
  }

  try {
    const pdfBuffer = await this.generatePdf();
    fs.writeFileSync(this.options.filename, pdfBuffer);
    callback(null, { filename: this.options.filename });
  } catch (err) {
    callback(err);
  }
};
PDF.prototype.generatePdf = async function generatePdf() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Load the HTML content
  await page.setContent(this.html, { waitUntil: 'domcontentloaded' });

  // Generate the PDF
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    ...this.options.pdfOptions, // You can pass custom Puppeteer PDF options here
  });

  await browser.close();

  return pdfBuffer;
};
