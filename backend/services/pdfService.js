const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const MM = 72 / 25.4;
const page = { width: 85.6 * MM, height: 54 * MM }; // 242.6456 x 153.0708 pt

function safeText(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

function drawGuilloche(doc, x, y, radius, steps, color) {
  doc.save();
  doc.strokeColor(color).lineWidth(0.25).opacity(0.35);
  for (let i = 0; i < steps; i++) {
    const angle = (i * Math.PI) / (steps / 2);
    const rx = radius * Math.cos(angle * 2);
    const ry = radius * Math.sin(angle * 3);
    doc.ellipse(x, y, Math.abs(rx), Math.abs(ry)).stroke();
  }
  doc.restore();
}

function drawDiamondIcon(doc, cx, cy, size, strokeColor, fillColor) {
  doc.save();
  doc.strokeColor(strokeColor).lineWidth(0.7);
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

  doc.strokeColor(gold).lineWidth(0.4);
  const rays = 32;
  for (let i = 0; i < rays; i++) {
    const a = (i * 2 * Math.PI) / rays;
    const r1 = r - 1;
    const r2 = r + 1.2;
    doc.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
       .lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2)
       .stroke();
  }

  doc.circle(cx, cy, r).strokeColor(gold).lineWidth(0.7).stroke();
  doc.circle(cx, cy, r - 2.2).strokeColor(darkGold).lineWidth(0.35).stroke();
  doc.circle(cx, cy, r - 2.8).fillColor('#FDFBF7').fill();

  doc.font('Helvetica-Bold').fontSize(3.1).fillColor(darkGold)
     .text('VERIFIED', cx - 12, cy - 3.2, { width: 24, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(2.2).fillColor(gold)
     .text('GENUINE LAB', cx - 12, cy + 0.8, { width: 24, align: 'center', lineBreak: false });

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
    goldLight: '#E5D1A4',
    goldDark: '#8C6F2D',
    slate: '#2C3E50',
    muted: '#66788A',
    paper: '#FCFAF7',
    white: '#FFFFFF',
    border: '#E2D8C3'
  };

  // ==========================================
  // PAGE 1: FRONT SIDE (SPECIMEN IDENTIFICATION)
  // ==========================================
  doc.addPage({ size: [W, H], margin: 0 });

  // Background
  doc.rect(0, 0, W, H).fill(C.paper);

  // Subtle Guilloche Pattern
  drawGuilloche(doc, W * 0.72, H * 0.58, 28, 16, C.goldLight);

  // Outer Gold Decorative Border
  doc.rect(4, 4, W - 8, H - 8).strokeColor(C.gold).lineWidth(0.8).stroke();
  doc.rect(5.6, 5.6, W - 11.2, H - 11.2).strokeColor(C.goldLight).lineWidth(0.3).stroke();

  // Corner Ornaments
  const cornerSize = 3.5;
  [[4, 4], [W - 4 - cornerSize, 4], [4, H - 4 - cornerSize], [W - 4 - cornerSize, H - 4 - cornerSize]].forEach(([cx, cy]) => {
    doc.rect(cx, cy, cornerSize, cornerSize).fillColor(C.gold).fill();
  });

  // Top Header Banner
  doc.rect(6, 6, W - 12, 23).fill(C.navyDark);
  doc.rect(6, 29, W - 12, 0.8).fill(C.gold);

  // Lab Logo Crest
  drawDiamondIcon(doc, 20, 17.5, 11, C.goldLight);

  // Lab Titles
  doc.font('Helvetica-Bold').fontSize(6.4).fillColor(C.goldLight).text('INTERNATIONAL GEMOLOGICAL ARCHIVE', 30, 10, { width: 140, lineBreak: false });
  doc.font('Helvetica').fontSize(3.8).fillColor('#DCE6F1').text('AUTHENTICITY • IDENTIFICATION • LABORATORY REPORT', 30, 18.5, { characterSpacing: 0.6, lineBreak: false });

  doc.font('Helvetica-Bold').fontSize(4.5).fillColor(C.gold).text('IDENTIFICATION CARD', W - 68, 10.5, { width: 60, align: 'right', lineBreak: false });
  doc.font('Helvetica').fontSize(3.6).fillColor('#B0C2D4').text(`REPORT #${certificate.certificateNumber}`, W - 68, 17.5, { width: 60, align: 'right', lineBreak: false });

  // Photo / Specimen Graphic Box
  const photoX = 11;
  const photoY = 34;
  const photoW = 60;
  const photoH = 68;

  doc.rect(photoX, photoY, photoW, photoH).fill('#FFFFFF');
  doc.rect(photoX, photoY, photoW, photoH).strokeColor(C.gold).lineWidth(0.6).stroke();
  doc.rect(photoX + 1.2, photoY + 1.2, photoW - 2.4, photoH - 2.4).strokeColor(C.border).lineWidth(0.3).stroke();

  if (certificate.imagePath && fs.existsSync(certificate.imagePath)) {
    try {
      doc.image(certificate.imagePath, photoX + 2, photoY + 2, { fit: [photoW - 4, photoH - 4], align: 'center', valign: 'center' });
    } catch (_) {
      drawDiamondIcon(doc, photoX + photoW / 2, photoY + photoH / 2 - 3, 26, C.gold, '#F7F3E7');
      doc.font('Helvetica-Bold').fontSize(3.6).fillColor(C.goldDark).text('OFFICIAL SPECIMEN', photoX, photoY + photoH - 12, { width: photoW, align: 'center', lineBreak: false });
    }
  } else {
    drawDiamondIcon(doc, photoX + photoW / 2, photoY + photoH / 2 - 3, 26, C.gold, '#F7F3E7');
    doc.font('Helvetica-Bold').fontSize(3.6).fillColor(C.goldDark).text('OFFICIAL SPECIMEN', photoX, photoY + photoH - 12, { width: photoW, align: 'center', lineBreak: false });
    doc.font('Helvetica').fontSize(3).fillColor(C.muted).text('LABORATORY ARCHIVE', photoX, photoY + photoH - 8, { width: photoW, align: 'center', lineBreak: false });
  }

  // Embossed Seal on Front below photo
  drawGoldSeal(doc, photoX + photoW / 2, 120, 11);

  // Main Identification Details (Right Column)
  const specX = 77;
  let specY = 33;

  doc.font('Helvetica-Bold').fontSize(4).fillColor(C.goldDark).text('GEMSTONE IDENTIFICATION', specX, specY, { characterSpacing: 0.5, lineBreak: false });
  specY += 5.5;

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.navyDark).text(safeText(certificate.name), specX, specY, { width: 154, height: 10, ellipsis: true, lineBreak: false });
  specY += 11;

  const frontRows = [
    ['WEIGHT / CARAT', certificate.weight],
    ['SHAPE / CUT', certificate.shapeCut],
    ['COLOUR GRADE', certificate.colour],
    ['SPECIES / GROUP', certificate.speciesGroup],
    ['CLARITY GRADE', certificate.clarity],
    ['ISSUED TO', certificate.issuedTo],
    ['ISSUE DATE', new Date(certificate.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })]
  ];

  frontRows.forEach(([lbl, val]) => {
    doc.font('Helvetica-Bold').fontSize(3.6).fillColor(C.muted).text(lbl, specX, specY, { width: 44, lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(4.6).fillColor(C.navyDark).text(safeText(val), specX + 46, specY - 0.4, { width: 108, height: 7, ellipsis: true, lineBreak: false });
    doc.moveTo(specX, specY + 6.8).lineTo(W - 11, specY + 6.8).strokeColor('#ECE5D8').lineWidth(0.3).stroke();
    specY += 8.2;
  });

  // Security microline on front footer
  doc.rect(6, H - 14, W - 12, 8).fill(C.navyDark);
  doc.font('Helvetica').fontSize(2.9).fillColor(C.goldLight).text('SECURITY DOCUMENT • GENUINE REGISTERED IDENTIFICATION REPORT • SCAN REVERSE QR TO VERIFY', 8, H - 10.5, { width: W - 16, align: 'center', characterSpacing: 0.3, lineBreak: false });

  // ==========================================
  // PAGE 2: BACK SIDE (LABORATORY ANALYSIS & QR)
  // ==========================================
  doc.addPage({ size: [W, H], margin: 0 });

  // Background
  doc.rect(0, 0, W, H).fill(C.paper);

  // Subtle Guilloche
  drawGuilloche(doc, 52, 78, 25, 14, C.goldLight);

  // Outer Gold Decorative Border
  doc.rect(4, 4, W - 8, H - 8).strokeColor(C.gold).lineWidth(0.8).stroke();
  doc.rect(5.6, 5.6, W - 11.2, H - 11.2).strokeColor(C.goldLight).lineWidth(0.3).stroke();

  // Corner Ornaments
  [[4, 4], [W - 4 - cornerSize, 4], [4, H - 4 - cornerSize], [W - 4 - cornerSize, H - 4 - cornerSize]].forEach(([cx, cy]) => {
    doc.rect(cx, cy, cornerSize, cornerSize).fillColor(C.gold).fill();
  });

  // Top Subheader Banner
  doc.rect(6, 6, W - 12, 16).fill(C.navyDark);
  doc.rect(6, 22, W - 12, 0.8).fill(C.gold);
  doc.font('Helvetica-Bold').fontSize(5.5).fillColor(C.goldLight).text('ANALYTICAL GEMOLOGICAL REPORT', 11, 10.5, { width: 125, lineBreak: false });
  doc.font('Helvetica').fontSize(3.6).fillColor('#CBD8E6').text(`OFFICIAL RECORD • ID: ${certificate.certificateNumber}`, W - 98, 11, { width: 88, align: 'right', lineBreak: false });

  // Left Details: Technical Characteristics
  const backX = 11;
  let backY = 27;

  doc.font('Helvetica-Bold').fontSize(4.2).fillColor(C.goldDark).text('PHYSICAL & OPTICAL PROPERTIES', backX, backY, { lineBreak: false });
  backY += 6.5;

  const backRows = [
    ['REFRACTIVE INDEX', certificate.refractiveIndex],
    ['HARDNESS (MOHS)', certificate.hardness],
    ['CLARITY SCALE', certificate.clarity],
    ['SPECIES / GROUP', certificate.speciesGroup]
  ];

  backRows.forEach(([lbl, val]) => {
    doc.font('Helvetica-Bold').fontSize(3.6).fillColor(C.muted).text(lbl, backX, backY, { width: 50, lineBreak: false });
    doc.font('Helvetica').fontSize(4.4).fillColor(C.navyDark).text(safeText(val), backX + 52, backY, { width: 92, lineBreak: false });
    doc.moveTo(backX, backY + 6.2).lineTo(backX + 144, backY + 6.2).strokeColor('#ECE5D8').lineWidth(0.3).stroke();
    backY += 7.8;
  });

  // Comments / Observations Box
  backY += 2;
  doc.font('Helvetica-Bold').fontSize(3.8).fillColor(C.goldDark).text('LABORATORY COMMENTS & OBSERVATIONS:', backX, backY, { lineBreak: false });
  backY += 5;
  doc.rect(backX, backY, 144, 25).fill('#FFFFFF');
  doc.rect(backX, backY, 144, 25).strokeColor(C.border).lineWidth(0.4).stroke();
  doc.font('Helvetica-Oblique').fontSize(4).fillColor(C.slate).text(
    safeText(certificate.comments || 'No specific treatments or modifications detected on this specimen. All analytical criteria align with international gemological standards.'),
    backX + 3.5, backY + 3.5, { width: 137, height: 18, lineGap: 1 }
  );

  // Signature Block
  const sigY = 98;
  doc.font('Helvetica-Bold').fontSize(3.5).fillColor(C.muted).text('AUTHORIZED SIGNATURE', backX, sigY, { lineBreak: false });
  doc.save();
  doc.strokeColor(C.navyDark).lineWidth(0.65);
  doc.moveTo(backX + 4, sigY + 11).bezierCurveTo(backX + 14, sigY + 4, backX + 24, sigY + 16, backX + 40, sigY + 8)
     .bezierCurveTo(backX + 48, sigY + 4, backX + 58, sigY + 13, backX + 72, sigY + 7).stroke();
  doc.restore();
  doc.moveTo(backX, sigY + 15).lineTo(backX + 78, sigY + 15).strokeColor(C.gold).lineWidth(0.35).stroke();
  doc.font('Helvetica-Bold').fontSize(3.2).fillColor(C.slate).text('Chief Senior Gemologist, FGA DGA', backX, sigY + 16.5, { lineBreak: false });

  // Right Side: QR Code Box
  const qrBoxX = 163;
  const qrBoxY = 27;
  const qrBoxW = 68;
  const qrBoxH = 88;

  doc.rect(qrBoxX, qrBoxY, qrBoxW, qrBoxH).fill('#FFFFFF');
  doc.rect(qrBoxX, qrBoxY, qrBoxW, qrBoxH).strokeColor(C.gold).lineWidth(0.6).stroke();
  doc.rect(qrBoxX + 1.2, qrBoxY + 1.2, qrBoxW - 2.4, qrBoxH - 2.4).strokeColor(C.border).lineWidth(0.3).stroke();

  if (certificate.qrCode) {
    const qrBuf = Buffer.from(certificate.qrCode.split(',')[1], 'base64');
    doc.image(qrBuf, qrBoxX + 10, qrBoxY + 6, { width: 48, height: 48 });
  }

  doc.font('Helvetica-Bold').fontSize(4.4).fillColor(C.navyDark).text('SCAN TO VERIFY', qrBoxX, qrBoxY + 56, { width: qrBoxW, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(3).fillColor(C.muted).text('Instant 24/7 Digital Registry Validation', qrBoxX + 4, qrBoxY + 63, { width: qrBoxW - 8, align: 'center', lineGap: 0.8 });

  doc.roundedRect(qrBoxX + 6, qrBoxY + 74, qrBoxW - 12, 7.5, 2).fill(C.navyDark);
  doc.font('Helvetica-Bold').fontSize(3.1).fillColor(C.goldLight).text('SECURE QR VALIDATION', qrBoxX + 6, qrBoxY + 76.2, { width: qrBoxW - 12, align: 'center', lineBreak: false });

  // Footer on Back Side
  doc.rect(6, H - 14, W - 12, 8).fill(C.navyDark);
  doc.font('Helvetica').fontSize(2.8).fillColor(C.goldLight).text('THIS IDENTIFICATION CARD REPRESENTS THE OPINION OF SPECIALIZED GEMOLOGICAL EXPERTS AT THE TIME OF EXAMINATION • ALL RIGHTS RESERVED', 8, H - 10.5, { width: W - 16, align: 'center', lineBreak: false });

  doc.end();
}

module.exports = { buildCertificatePdf };

