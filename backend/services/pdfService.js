const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const MM = 72 / 25.4;
// ISO/IEC 7810 ID-1 / CR80 ATM Card Standard Dimensions: 85.6 mm × 54.0 mm
const page = { width: 85.6 * MM, height: 54 * MM }; // 242.6456 x 153.0708 pt

function safeText(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

function drawDiamondIcon(doc, cx, cy, size, strokeColor, fillColor) {
  doc.save();
  doc.strokeColor(strokeColor).lineWidth(0.6);
  if (fillColor) doc.fillColor(fillColor);

  const w = size;
  const h = size * 0.75;
  const topW = w * 0.55;
  const tableH = h * 0.35;

  const x1 = cx - topW / 2;
  const x2 = cx + topW / 2;
  const yTop = cy - h / 2;
  const yGirdle = yTop + tableH;
  const yCulet = cy + h / 2;
  const xGirdleL = cx - w / 2;
  const xGirdleR = cx + w / 2;

  doc.polygon([x1, yTop], [x2, yTop], [xGirdleR, yGirdle], [cx, yCulet], [xGirdleL, yGirdle]);
  if (fillColor) doc.fillAndStroke(); else doc.stroke();

  doc.moveTo(x1, yTop).lineTo(cx - topW * 0.2, yGirdle).lineTo(cx, yCulet).stroke();
  doc.moveTo(x2, yTop).lineTo(cx + topW * 0.2, yGirdle).lineTo(cx, yCulet).stroke();
  doc.moveTo(cx - topW * 0.2, yGirdle).lineTo(cx + topW * 0.2, yGirdle).stroke();
  doc.moveTo(xGirdleL, yGirdle).lineTo(cx - topW * 0.2, yGirdle).stroke();
  doc.moveTo(xGirdleR, yGirdle).lineTo(cx + topW * 0.2, yGirdle).stroke();

  doc.restore();
}

function drawGoldSeal(doc, cx, cy, r) {
  doc.save();
  const gold = '#C5A059';
  const darkGold = '#8C6F2D';

  doc.strokeColor(gold).lineWidth(0.35);
  const rays = 28;
  for (let i = 0; i < rays; i++) {
    const a = (i * 2 * Math.PI) / rays;
    const r1 = r - 0.8;
    const r2 = r + 1.1;
    doc.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
       .lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2)
       .stroke();
  }

  doc.circle(cx, cy, r).strokeColor(gold).lineWidth(0.6).stroke();
  doc.circle(cx, cy, r - 1.8).strokeColor(darkGold).lineWidth(0.3).stroke();
  doc.circle(cx, cy, r - 2.4).fillColor('#FDFBF7').fill();

  doc.font('Helvetica-Bold').fontSize(2.7).fillColor(darkGold)
     .text('VERIFIED', cx - 11, cy - 2.8, { width: 22, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(1.9).fillColor(gold)
     .text('GENUINE LAB', cx - 11, cy + 0.6, { width: 22, align: 'center', lineBreak: false });

  doc.restore();
}

function buildCertificatePdf(certificate, stream) {
  const W = page.width;
  const H = page.height;

  const doc = new PDFDocument({
    size: [W, H],
    margin: 0,
    autoFirstPage: false,
    info: { Title: `Gemstone Certificate ${certificate.certificateNumber}` }
  });

  doc.pipe(stream);

  const C = {
    navyDark: '#071527',
    navyMid: '#0E2744',
    gold: '#C5A059',
    goldLight: '#F4E8CD',
    goldDark: '#8C6F2D',
    slate: '#2C3E50',
    muted: '#64748B',
    paper: '#FCFAF7',
    white: '#FFFFFF',
    border: '#E2D8C3',
    line: '#ECE5D8'
  };

  // STRICTLY SINGLE-SIDED ATM CARD (1 PAGE ONLY, ZERO BACKSIDE)
  doc.addPage({ size: [W, H], margin: 0 });

  // Background
  doc.rect(0, 0, W, H).fill(C.paper);

  // Outer Gold Decorative Borders
  doc.rect(3, 3, W - 6, H - 6).strokeColor(C.gold).lineWidth(0.7).stroke();
  doc.rect(4.5, 4.5, W - 9, H - 9).strokeColor(C.goldLight).lineWidth(0.3).stroke();

  // Corner Ornaments
  const cornerSize = 2.8;
  [[3, 3], [W - 3 - cornerSize, 3], [3, H - 3 - cornerSize], [W - 3 - cornerSize, H - 3 - cornerSize]].forEach(([cx, cy]) => {
    doc.rect(cx, cy, cornerSize, cornerSize).fillColor(C.gold).fill();
  });

  // ==========================================
  // TOP HEADER BANNER
  // ==========================================
  doc.rect(5, 5, W - 10, 19).fill(C.navyDark);
  doc.rect(5, 24, W - 10, 0.7).fill(C.gold);

  // Diamond Logo
  drawDiamondIcon(doc, 15, 14.5, 9.5, C.goldLight);

  // Brand Titles
  doc.font('Helvetica-Bold').fontSize(5.4).fillColor(C.goldLight)
     .text('INTERNATIONAL GEMOLOGICAL ARCHIVE', 23, 8.5, { width: 145, lineBreak: false });
  doc.font('Helvetica').fontSize(3.1).fillColor('#DCE6F1')
     .text('AUTHENTICITY • IDENTIFICATION • OFFICIAL LABORATORY REPORT', 23, 15.5, { characterSpacing: 0.4, lineBreak: false });

  // Header Right Report Identification
  doc.font('Helvetica-Bold').fontSize(3.6).fillColor(C.gold)
     .text('CR80 CARD', W - 68, 8.5, { width: 60, align: 'right', lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(4.2).fillColor('#FFFFFF')
     .text(`REPORT #${certificate.certificateNumber}`, W - 68, 14.5, { width: 60, align: 'right', lineBreak: false });

  // ==========================================
  // ZONE 1 (LEFT): SPECIMEN PHOTO & SEAL (Width: 54pt)
  // ==========================================
  const photoX = 7.5;
  const photoY = 27;
  const photoW = 54;
  const photoH = 58;

  doc.rect(photoX, photoY, photoW, photoH).fill('#FFFFFF');
  doc.rect(photoX, photoY, photoW, photoH).strokeColor(C.gold).lineWidth(0.5).stroke();
  doc.rect(photoX + 1, photoY + 1, photoW - 2, photoH - 2).strokeColor(C.border).lineWidth(0.25).stroke();

  if (certificate.imagePath && fs.existsSync(certificate.imagePath)) {
    try {
      doc.image(certificate.imagePath, photoX + 1.5, photoY + 1.5, {
        fit: [photoW - 3, photoH - 3],
        align: 'center',
        valign: 'center'
      });
    } catch (_) {
      drawDiamondIcon(doc, photoX + photoW / 2, photoY + photoH / 2 - 2, 22, C.gold, '#FDF8EC');
      doc.font('Helvetica-Bold').fontSize(3.2).fillColor(C.goldDark)
         .text('OFFICIAL SPECIMEN', photoX, photoY + photoH - 10, { width: photoW, align: 'center', lineBreak: false });
    }
  } else {
    drawDiamondIcon(doc, photoX + photoW / 2, photoY + photoH / 2 - 2, 22, C.gold, '#FDF8EC');
    doc.font('Helvetica-Bold').fontSize(3.2).fillColor(C.goldDark)
       .text('OFFICIAL SPECIMEN', photoX, photoY + photoH - 10, { width: photoW, align: 'center', lineBreak: false });
    doc.font('Helvetica').fontSize(2.6).fillColor(C.muted)
       .text('SECURE ARCHIVE', photoX, photoY + photoH - 6, { width: photoW, align: 'center', lineBreak: false });
  }

  // Official Gold Seal below photo
  drawGoldSeal(doc, photoX + photoW / 2, 101, 10.5);

  // Date of Record
  const issueDateStr = new Date(certificate.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.font('Helvetica-Bold').fontSize(3.2).fillColor(C.muted)
     .text(`DATE: ${issueDateStr}`, photoX, 117.5, { width: photoW, align: 'center', lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(2.7).fillColor(C.goldDark)
     .text('AUTHENTIC RECORD', photoX, 122.5, { width: photoW, align: 'center', lineBreak: false });

  // ==========================================
  // ZONE 2 (CENTER): GEMSTONE SPECIFICATIONS (Width: 114pt)
  // ==========================================
  const specX = 66;
  let specY = 27;

  doc.font('Helvetica-Bold').fontSize(3.3).fillColor(C.goldDark)
     .text('GEMSTONE IDENTIFICATION:', specX, specY, { lineBreak: false });
  specY += 4.8;

  doc.font('Helvetica-Bold').fontSize(6.8).fillColor(C.navyDark)
     .text(safeText(certificate.name), specX, specY, { width: 114, height: 9, ellipsis: true, lineBreak: false });
  specY += 9;

  // Key-Value Specifications
  const specs = [
    ['WEIGHT / CARAT', certificate.weight],
    ['SHAPE / CUT', certificate.shapeCut],
    ['COLOUR GRADE', certificate.colour],
    ['SPECIES / GROUP', certificate.speciesGroup],
    ['REFRACTIVE INDEX', certificate.refractiveIndex],
    ['HARDNESS (MOHS)', certificate.hardness],
    ['CLARITY SCALE', certificate.clarity],
    ['ISSUED TO', certificate.issuedTo]
  ];

  specs.forEach(([lbl, val]) => {
    doc.font('Helvetica-Bold').fontSize(3.1).fillColor(C.muted)
       .text(lbl, specX, specY, { width: 44, lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(4.0).fillColor(C.navyDark)
       .text(safeText(val), specX + 45, specY - 0.2, { width: 68, height: 6, ellipsis: true, lineBreak: false });
    doc.moveTo(specX, specY + 5.5).lineTo(specX + 113, specY + 5.5)
       .strokeColor(C.line).lineWidth(0.25).stroke();
    specY += 7.0;
  });

  // Observations & Comments Box
  specY += 1.5;
  doc.rect(specX, specY, 114, 15).fill('#FFFFFF');
  doc.rect(specX, specY, 114, 15).strokeColor(C.border).lineWidth(0.3).stroke();
  doc.rect(specX, specY, 1.8, 15).fill(C.gold);
  doc.font('Helvetica-Bold').fontSize(2.7).fillColor(C.goldDark)
     .text('OBSERVATIONS & COMMENTS:', specX + 4, specY + 2, { lineBreak: false });
  doc.font('Helvetica-Oblique').fontSize(3.1).fillColor(C.slate)
     .text(
       safeText(certificate.comments || 'No indications of thermal treatment. Physical and optical properties conform to registered standards.'),
       specX + 4, specY + 5.8, { width: 108, height: 8, ellipsis: true, lineGap: 0.5 }
     );

  // ==========================================
  // ZONE 3 (RIGHT): QR CODE & SIGNATURE (Width: 52pt)
  // ==========================================
  const qrX = 183.5;
  const qrY = 27;
  const qrW = 52;
  const qrH = 58;

  doc.rect(qrX, qrY, qrW, qrH).fill('#FFFFFF');
  doc.rect(qrX, qrY, qrW, qrH).strokeColor(C.gold).lineWidth(0.5).stroke();
  doc.rect(qrX + 1, qrY + 1, qrW - 2, qrH - 2).strokeColor(C.border).lineWidth(0.25).stroke();

  if (certificate.qrCode) {
    try {
      const qrBuf = Buffer.from(certificate.qrCode.split(',')[1], 'base64');
      doc.image(qrBuf, qrX + 6, qrY + 4, { width: 40, height: 40 });
    } catch (_) {}
  }

  doc.font('Helvetica-Bold').fontSize(3.4).fillColor(C.navyDark)
     .text('SCAN TO VERIFY', qrX, qrY + 45.5, { width: qrW, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(2.5).fillColor(C.muted)
     .text('Instant 24/7 Digital Check', qrX, qrY + 50.5, { width: qrW, align: 'center', lineBreak: false });

  // Security Pill
  doc.roundedRect(qrX + 2, 88, qrW - 4, 7, 1.5).fill(C.navyDark);
  doc.font('Helvetica-Bold').fontSize(2.8).fillColor(C.goldLight)
     .text('OFFICIAL RECORD', qrX + 2, 90, { width: qrW - 4, align: 'center', lineBreak: false });

  // Authorized Signature Block
  const sigY = 99;
  doc.font('Helvetica-Bold').fontSize(2.8).fillColor(C.muted)
     .text('AUTHORIZED SIGNATURE', qrX, sigY, { width: qrW, align: 'center', lineBreak: false });
  doc.save();
  doc.strokeColor(C.navyDark).lineWidth(0.55);
  doc.moveTo(qrX + 4, sigY + 9).bezierCurveTo(qrX + 14, sigY + 4, qrX + 22, sigY + 13, qrX + 32, sigY + 7)
     .bezierCurveTo(qrX + 38, sigY + 4, qrX + 44, sigY + 11, qrX + 48, sigY + 6).stroke();
  doc.restore();
  doc.moveTo(qrX + 2, sigY + 13).lineTo(qrX + qrW - 2, sigY + 13)
     .strokeColor(C.gold).lineWidth(0.35).stroke();
  doc.font('Helvetica-Bold').fontSize(2.6).fillColor(C.slate)
     .text('Chief Gemologist, FGA', qrX, sigY + 14.5, { width: qrW, align: 'center', lineBreak: false });

  // ==========================================
  // BOTTOM SECURITY FOOTER
  // ==========================================
  doc.rect(5, H - 13, W - 10, 8).fill(C.navyDark);
  doc.rect(5, H - 13, W - 10, 0.5).fill(C.gold);
  doc.font('Helvetica').fontSize(2.7).fillColor(C.goldLight)
     .text('ALL-IN-ONE ATM CARD • ISO/IEC 7810 CR80 FORMAT • VERIFIED GEMOLOGICAL ARCHIVE • SCAN QR FOR OFFICIAL RECORD', 6, H - 9.8, { width: W - 12, align: 'center', characterSpacing: 0.2, lineBreak: false });

  doc.end();
}

module.exports = { buildCertificatePdf };
