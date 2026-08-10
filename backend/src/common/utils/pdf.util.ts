import PDFDocument from 'pdfkit';

/**
 * Thin wrapper around pdfkit producing branded, print-ready A4 documents.
 * Each `render*` method returns a Buffer so controllers can stream it
 * straight to the response with `Content-Type: application/pdf`.
 *
 * Replaces the "pending-render" / raw-JSON stubs that Weighbridge, Billing,
 * and Dispatch previously returned (see backend README TODO list).
 */
export class PdfUtil {
  private static readonly BRAND_COLOR = '#1B5E20'; // deep green — matches warehouse/agri theme

  private static newDoc(): PDFKit.PDFDocument {
    return new PDFDocument({ size: 'A4', margin: 40 });
  }

  private static async toBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }

  private static header(doc: PDFKit.PDFDocument, title: string, docNumber: string) {
    doc
      .fillColor(this.BRAND_COLOR)
      .fontSize(20)
      .text('AWMS — Agricultural Warehouse Management', { align: 'left' })
      .fontSize(10)
      .fillColor('#555')
      .text('Computer-generated document — no signature required unless stated', { align: 'left' })
      .moveDown(0.5);

    doc
      .fillColor('#000')
      .fontSize(16)
      .text(title, { align: 'right' })
      .fontSize(10)
      .fillColor('#555')
      .text(docNumber, { align: 'right' })
      .fillColor('#000')
      .moveDown(1);

    doc
      .moveTo(40, doc.y)
      .lineTo(555, doc.y)
      .strokeColor(this.BRAND_COLOR)
      .lineWidth(1.5)
      .stroke()
      .moveDown(1);
  }

  private static kvRow(doc: PDFKit.PDFDocument, label: string, value: string) {
    doc
      .fontSize(10)
      .fillColor('#555')
      .text(label, { continued: true, width: 150 })
      .fillColor('#000')
      .text(value ?? '—');
  }

  private static footer(doc: PDFKit.PDFDocument) {
    doc
      .fontSize(8)
      .fillColor('#999')
      .text(`Generated ${new Date().toLocaleString('en-IN')}`, 40, 780, { align: 'center', width: 515 });
  }

  static async renderWeighbridgeSlip(entry: {
    slipNumber: string;
    vehicleNo: string;
    direction: string;
    grossWeight: number;
    tareWeight: number;
    netWeight: number;
    notes?: string | null;
    createdAt: Date;
    farmer?: { name: string; farmerCode: string; mobile: string } | null;
  }): Promise<Buffer> {
    const doc = this.newDoc();
    this.header(doc, 'Weighbridge Slip', entry.slipNumber);

    this.kvRow(doc, 'Date/Time:', new Date(entry.createdAt).toLocaleString('en-IN'));
    this.kvRow(doc, 'Vehicle Number:', entry.vehicleNo);
    this.kvRow(doc, 'Direction:', entry.direction);
    if (entry.farmer) {
      this.kvRow(doc, 'Farmer:', `${entry.farmer.name} (${entry.farmer.farmerCode})`);
      this.kvRow(doc, 'Mobile:', entry.farmer.mobile);
    }
    doc.moveDown(1);

    doc.fontSize(12).fillColor(this.BRAND_COLOR).text('Weight Details', { underline: true }).moveDown(0.5);
    this.kvRow(doc, 'Gross Weight:', `${entry.grossWeight} kg`);
    this.kvRow(doc, 'Tare Weight:', `${entry.tareWeight} kg`);
    doc.fontSize(12).fillColor('#000');
    this.kvRow(doc, 'Net Weight:', `${entry.netWeight} kg`);

    if (entry.notes) {
      doc.moveDown(1).fontSize(10).fillColor('#555').text('Notes:', { continued: false });
      doc.fillColor('#000').text(entry.notes);
    }

    this.footer(doc);
    return this.toBuffer(doc);
  }

  static async renderInvoice(invoice: {
    invoiceNumber: string;
    periodFrom: Date;
    periodTo: Date;
    subtotal: number;
    gstAmount: number;
    discount: number;
    penalty: number;
    totalAmount: number;
    status: string;
    createdAt: Date;
    farmer: { name: string; farmerCode: string; mobile: string; village?: string | null };
    payments?: { amount: number; paidAt: Date; mode: string; receiptNumber: string }[];
  }): Promise<Buffer> {
    const gstPercent = invoice.subtotal > 0 ? (invoice.gstAmount / invoice.subtotal) * 100 : 0;
    const doc = this.newDoc();
    this.header(doc, 'Storage Invoice', invoice.invoiceNumber);

    this.kvRow(doc, 'Farmer:', `${invoice.farmer.name} (${invoice.farmer.farmerCode})`);
    this.kvRow(doc, 'Mobile:', invoice.farmer.mobile);
    if (invoice.farmer.village) this.kvRow(doc, 'Village:', invoice.farmer.village);
    this.kvRow(
      doc,
      'Billing Period:',
      `${new Date(invoice.periodFrom).toLocaleDateString('en-IN')} – ${new Date(invoice.periodTo).toLocaleDateString('en-IN')}`,
    );
    this.kvRow(doc, 'Status:', invoice.status);
    doc.moveDown(1);

    doc.fontSize(12).fillColor(this.BRAND_COLOR).text('Charges', { underline: true }).moveDown(0.5);
    this.kvRow(doc, 'Subtotal:', `Rs. ${Number(invoice.subtotal).toFixed(2)}`);
    this.kvRow(doc, `GST (${gstPercent.toFixed(1)}%):`, `Rs. ${Number(invoice.gstAmount).toFixed(2)}`);
    if (Number(invoice.discount) > 0) this.kvRow(doc, 'Discount:', `- Rs. ${Number(invoice.discount).toFixed(2)}`);
    if (Number(invoice.penalty) > 0) this.kvRow(doc, 'Penalty:', `+ Rs. ${Number(invoice.penalty).toFixed(2)}`);

    doc.moveDown(0.5);
    doc.fontSize(13).fillColor(this.BRAND_COLOR).text(`Total Due: Rs. ${Number(invoice.totalAmount).toFixed(2)}`, {
      align: 'right',
    });
    doc.fillColor('#000');

    if (invoice.payments && invoice.payments.length > 0) {
      doc.moveDown(1.5).fontSize(12).fillColor(this.BRAND_COLOR).text('Payments Received', { underline: true }).moveDown(0.5);
      doc.fillColor('#000').fontSize(10);
      for (const p of invoice.payments) {
        doc.text(
          `${new Date(p.paidAt).toLocaleDateString('en-IN')}  •  Rs. ${Number(p.amount).toFixed(2)}  •  ${p.mode}  •  Receipt ${p.receiptNumber}`,
        );
      }
    }

    this.footer(doc);
    return this.toBuffer(doc);
  }

  static async renderGatePass(dispatch: {
    dispatchNumber: string;
    vehicleNo?: string | null;
    driverName?: string | null;
    driverMobile?: string | null;
    dispatchType: string;
    status: string;
    createdAt: Date;
    farmer: { name: string; farmerCode: string; mobile: string };
    bags: { bag: { bagCode: string; weightKg: number; crop?: { name: string } } }[];
  }): Promise<Buffer> {
    const doc = this.newDoc();
    this.header(doc, 'Dispatch Gate Pass', dispatch.dispatchNumber);

    this.kvRow(doc, 'Farmer:', `${dispatch.farmer.name} (${dispatch.farmer.farmerCode})`);
    this.kvRow(doc, 'Mobile:', dispatch.farmer.mobile);
    this.kvRow(doc, 'Dispatch Type:', dispatch.dispatchType);
    this.kvRow(doc, 'Vehicle Number:', dispatch.vehicleNo ?? '—');
    this.kvRow(doc, 'Driver:', dispatch.driverName ?? '—');
    this.kvRow(doc, 'Driver Mobile:', dispatch.driverMobile ?? '—');
    this.kvRow(doc, 'Status:', dispatch.status);
    doc.moveDown(1);

    doc.fontSize(12).fillColor(this.BRAND_COLOR).text(`Bags (${dispatch.bags.length})`, { underline: true }).moveDown(0.5);
    doc.fontSize(10).fillColor('#000');
    let totalWeight = 0;
    for (const { bag } of dispatch.bags) {
      totalWeight += Number(bag.weightKg);
      doc.text(`${bag.bagCode}   ${bag.crop?.name ?? ''}   ${bag.weightKg} kg`);
    }
    doc.moveDown(0.5).fontSize(11).fillColor(this.BRAND_COLOR).text(`Total Weight: ${totalWeight} kg`, { align: 'right' });

    doc.moveDown(2).fillColor('#000').fontSize(10);
    doc.text('Security Signature: ________________________', 40, doc.y);
    doc.text('Driver Signature: ________________________', 320, doc.y - 12);

    this.footer(doc);
    return this.toBuffer(doc);
  }
}
