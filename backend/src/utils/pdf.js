const PDFDocument = require('pdfkit');

const money = (n) => `$${Number(n).toFixed(2)}`;
const date = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '-');

function writeInvoicePdf(invoice, customer, stream) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);

  doc.fontSize(20).text('INVOICE', { align: 'right' });
  doc.fontSize(10).text(`Invoice #: ${invoice.number}`, { align: 'right' });
  doc.text(`Issued: ${date(invoice.issuedAt)}`, { align: 'right' });
  doc.text(`Due: ${date(invoice.dueDate)}`, { align: 'right' });
  doc.text(`Status: ${invoice.status.toUpperCase()}`, { align: 'right' });

  doc.moveDown(2).fontSize(12).text('Bill to:', { underline: true });
  doc.fontSize(10).text(customer.name);
  if (customer.address) doc.text(customer.address);
  if (customer.email) doc.text(customer.email);

  doc.moveDown(2);
  const top = doc.y;
  const cols = { desc: 50, qty: 330, price: 390, total: 470 };
  doc.font('Helvetica-Bold');
  doc.text('Description', cols.desc, top);
  doc.text('Qty', cols.qty, top);
  doc.text('Unit', cols.price, top);
  doc.text('Amount', cols.total, top);
  doc.font('Helvetica');

  let y = top + 20;
  for (const line of invoice.lines) {
    doc.text(line.description, cols.desc, y, { width: 270 });
    doc.text(String(line.qty), cols.qty, y);
    doc.text(money(line.unitPrice), cols.price, y);
    doc.text(money(line.qty * line.unitPrice), cols.total, y);
    y += 20;
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
  }

  y += 10;
  doc.text(`Subtotal: ${money(invoice.subtotal)}`, cols.price, y);
  doc.text(`Tax: ${money(invoice.tax)}`, cols.price, y + 15);
  doc.font('Helvetica-Bold').text(`Total: ${money(invoice.total)}`, cols.price, y + 30);

  doc.end();
}

module.exports = { writeInvoicePdf };
