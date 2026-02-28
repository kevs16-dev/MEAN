const PDFDocument = require('pdfkit');

/**
 * Construit les détails de la boutique (contact, localisation) pour affichage sous le nom.
 */
function buildShopDetails(shop) {
  const parts = [];
  const contact = shop?.contact;
  if (contact?.phone || contact?.email) {
    const c = [contact.phone, contact.email].filter(Boolean).join(' • ');
    if (c) parts.push(c);
  }
  const loc = shop?.location;
  if (loc?.floor || loc?.block) {
    const l = [loc.floor, loc.block].filter(Boolean).join(', ');
    if (l) parts.push(`Étage/Bloc : ${l}`);
  }
  return parts.length > 0 ? parts.join(' | ') : null;
}

/**
 * Dessine un tableau stylé avec hauteur de ligne dynamique pour que le texte rentre.
 * Colonnes : Produit | Variante | Prix unit. | Quantité | Sous-total (pas Image).
 */
function drawTable(doc, headers, rows, startY) {
  const margin = 40;
  const pageWidth = 595;
  const tableWidth = pageWidth - margin * 2;
  const colWidths = [140, 160, 70, 55, 75]; // Produit, Variante (large), Prix, Qty, Sous-total
  const headerBg = '#e9ecef';
  const stripeBg = '#f8f9fa';
  const padding = 6;
  const minRowHeight = 22;

  let y = startY;

  const drawRowRect = (rowY, rowH, fillColor, strokeColor) => {
    if (fillColor) {
      doc.fillColor(fillColor);
      doc.rect(margin, rowY, tableWidth, rowH);
      doc.fill();
    }
    doc.strokeColor(strokeColor || '#dee2e6');
    // Contour extérieur
    doc.rect(margin, rowY, tableWidth, rowH).stroke();
    // Lignes verticales entre colonnes
    let x = margin;
    for (let i = 0; i < colWidths.length - 1; i++) {
      x += colWidths[i];
      doc.moveTo(x, rowY).lineTo(x, rowY + rowH).stroke();
    }
  };

  // Hauteur d'une ligne de texte
  const getCellHeight = (text, colIdx) => {
    const w = colWidths[colIdx] - padding * 2;
    return doc.heightOfString(String(text || ''), { width: w }) + padding;
  };

  const getRowHeight = (row) => {
    let h = minRowHeight;
    row.forEach((cell, i) => {
      const ch = getCellHeight(cell, i);
      if (ch > h) h = ch;
    });
    return Math.ceil(h);
  };

  // En-tête
  const headerHeight = minRowHeight;
  drawRowRect(y, headerHeight, headerBg, '#adb5bd');
  let x = margin;
  headers.forEach((h, i) => {
    doc.fontSize(9).font('Helvetica-Bold').fillColor('black');
    doc.text(h, x + padding, y + padding / 2, {
      width: colWidths[i] - padding * 2,
      align: i === headers.length - 1 ? 'right' : 'left'
    });
    x += colWidths[i];
  });
  y += headerHeight;

  // Lignes de données avec hauteur dynamique
  rows.forEach((row, rowIdx) => {
    const rowHeight = getRowHeight(row);
    const bg = rowIdx % 2 === 1 ? stripeBg : null;
    drawRowRect(y, rowHeight, bg, '#dee2e6');
    x = margin;
    row.forEach((cell, i) => {
      doc.fontSize(9).font('Helvetica').fillColor('black');
      doc.text(String(cell), x + padding, y + padding / 2, {
        width: colWidths[i] - padding * 2,
        align: i === row.length - 1 ? 'right' : 'left',
        lineBreak: true
      });
      x += colWidths[i];
    });
    y += rowHeight;
  });

  return y;
}

/**
 * Génère un PDF récapitulatif des commandes.
 * @param {object[]} orders - Commandes avec shopId et items.productVariantId populate
 * @param {object} user - Utilisateur (nom, prenom, email)
 * @returns {Promise<Buffer>}
 */
const generateReceiptPdf = (orders, user) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const date = new Date().toLocaleString('fr-FR');
    const userName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.username || 'Client';
    const userEmail = user?.email || '-';

    doc.fontSize(18).text('Mon panier', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Date : ${date}`);
    doc.text(`Client : ${userName}`);
    doc.text(`Email : ${userEmail}`);
    doc.moveDown();

    if (!orders || orders.length === 0) {
      doc.text('Aucune commande.');
      doc.end();
      return;
    }

    let grandTotal = 0;
    let y = doc.y;

    orders.forEach((order, orderIndex) => {
      const shop = order.shopId || {};
      const shopName = shop.name || 'Boutique';
      const shopDetails = buildShopDetails(shop);
      const orderTotal = Number(order.totalAmount) || 0;
      grandTotal += orderTotal;

      // Nom de la boutique
      doc.fontSize(12).text(shopName, { underline: true });
      // Détails de la boutique en dessous
      if (shopDetails) {
        doc.fontSize(9).fillColor('#6c757d').text(shopDetails);
      }
      doc.moveDown(0.5);
      y = doc.y;

      if (order.items && order.items.length > 0) {
        const headers = ['Produit', 'Variante', 'Prix unit.', 'Quantité', 'Sous-total'];
        const rows = order.items.map((item) => {
          const variant = item.productVariantId;
          const name = item.nameSnapshot || '—';
          const variantStr =
            variant?.attributes?.length > 0
              ? variant.attributes.map((a) => `${a.name}: ${a.value}`).join(', ')
              : variant?.sku || '—';
          const price = Number(item.priceSnapshot) || 0;
          const qty = Number(item.quantity) || 0;
          const subtotal = (price * qty).toFixed(2);
          return [name, variantStr, `${price.toFixed(2)} €`, String(qty), `${subtotal} €`];
        });
        y = drawTable(doc, headers, rows, y);
      }

      doc.y = y + 8;
      doc.fontSize(10).fillColor('black').text(`Sous-total ${shopName} : ${orderTotal.toFixed(2)} €`, 40, doc.y, {
        width: 515,
        align: 'right'
      });
      doc.y += 16;
    });

    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total panier : ${grandTotal.toFixed(2)} €`, { underline: true });
    doc.end();
  });
};

module.exports = { generateReceiptPdf };
