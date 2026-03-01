const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const http = require('http');
const https = require('https');

const drawHeader = (doc) => {
  doc.save();
  doc.roundedRect(35, 30, 525, 110, 14).fill('#1d4ed8');
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text("Ticket d'évènement", 55, 54);
  doc.fontSize(11).font('Helvetica').fillColor('#dbeafe').text("Accès nominatif - à présenter à l'entrée", 55, 84);
  doc.restore();
};

const downloadImageBuffer = (url) => new Promise((resolve) => {
  if (!url) {
    resolve(null);
    return;
  }

  try {
    const normalizedUrl = String(url).trim();
    const client = normalizedUrl.startsWith('https') ? https : http;
    client.get(normalizedUrl, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadImageBuffer(response.headers.location).then(resolve);
        return;
      }

      if (response.statusCode !== 200) {
        resolve(null);
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', () => resolve(null));
    }).on('error', () => resolve(null));
  } catch {
    resolve(null);
  }
});

const generateEventTicketPdf = async ({ event, registration, ticketNumber, ticketCode, user }) => {
  const qrPayload = [
    `Ticket: ${ticketCode || '-'}`,
    `EventId: ${String(event?._id || '-')}`,
    `UserId: ${String(registration?.user || '-')}`,
    `Type: ${registration?.ticketTypeName || '-'}`,
    `InscriptionNo: ${ticketNumber || '-'}`
  ].join('\n');

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 1,
    width: 220,
    color: {
      dark: '#111827',
      light: '#FFFFFF'
    }
  });
  const qrImageBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  const shop = event?.createdBy?.shopId || null;
  const shopLogoBuffer = await downloadImageBuffer(shop?.logo);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const fullName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.username || 'Client';
    const email = user?.email || '-';
    const eventDate = event?.startDate ? new Date(event.startDate).toLocaleString('fr-FR') : '-';
    const ticketDate = registration?.registeredAt ? new Date(registration.registeredAt).toLocaleString('fr-FR') : '-';
    const ticketTypeName = registration?.ticketTypeName || '-';
    const shopName = shop?.name || 'Organisateur';
    const selectedType = (event?.ticketTypes || []).find((ticketType) =>
      String(ticketType?.name || '').trim().toLowerCase() === String(ticketTypeName).trim().toLowerCase()
    );
    const paf = Number(selectedType?.paf ?? 0);
    const ticketNumberValue = Number(ticketNumber || 0);
    const ticketCodeValue = ticketCode || `${String(event?._id || '').slice(-6).toUpperCase()}-${String(ticketNumberValue).padStart(4, '0')}`;

    drawHeader(doc);
    doc.roundedRect(35, 155, 525, 380, 14).lineWidth(1).strokeColor('#d1d5db').stroke();

    if (shopLogoBuffer) {
      try {
        doc.image(shopLogoBuffer, 55, 175, { fit: [70, 70], align: 'center', valign: 'center' });
      } catch {
        // Ignore image rendering errors.
      }
    }

    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(14).text(shopName, 135, 184);
    doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text('Boutique organisatrice', 135, 205);

    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(12).text('Informations du ticket', 55, 265);
    doc.font('Helvetica').fontSize(11).fillColor('#111827');
    doc.text(`Évènement : ${event?.title || '-'}`, 55, 289);
    doc.text(`Type de billet : ${ticketTypeName}`, 55, 309);
    doc.text(`PAF : ${paf.toFixed(2)} €`, 55, 329);
    doc.text(`Date évènement : ${eventDate}`, 55, 349);
    doc.text(`Lieu : ${event?.location || '-'}`, 55, 369, { width: 290 });

    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(12).text('Participant', 55, 418);
    doc.font('Helvetica').fontSize(11).fillColor('#111827');
    doc.text(`Nom : ${fullName}`, 55, 442);
    doc.text(`Email : ${email}`, 55, 462);
    doc.text(`Date d'inscription : ${ticketDate}`, 55, 482);

    doc.image(qrImageBuffer, 360, 275, { fit: [170, 170] });
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(`N° inscription : ${ticketNumberValue}`, 360, 462);
    doc.font('Helvetica').fontSize(10).fillColor('#374151').text(`Code ticket : ${ticketCodeValue}`, 360, 480, { width: 170 });

    doc.font('Helvetica').fontSize(9).fillColor('#6b7280')
      .text('Ce ticket est personnel. Le QR code contient les données de vérification.', 55, 548, { width: 470 });

    doc.end();
  });
};

module.exports = { generateEventTicketPdf };
