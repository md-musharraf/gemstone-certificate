const path = require('path');
const QRCode = require('qrcode');
const Certificate = require('../models/Certificate');
const { createCertificateNumber } = require('../utils/certificateNumber');
const { buildCertificatePdf } = require('../services/pdfService');

const fields = ['name', 'weight', 'shapeCut', 'colour', 'refractiveIndex', 'hardness', 'clarity', 'speciesGroup', 'comments', 'issuedTo'];

async function createCertificate(req, res, next) {
  try {
    const missing = fields.filter((field) => field !== 'comments' && !String(req.body[field] || '').trim());
    if (missing.length) return res.status(400).json({ error: `Required fields missing: ${missing.join(', ')}` });
    const certificateNumber = await createCertificateNumber();
    const baseUrl = (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const qrCode = await QRCode.toDataURL(`${baseUrl}/verify/${certificateNumber}`, { errorCorrectionLevel: 'H', margin: 1, width: 600 });
    const data = Object.fromEntries(fields.map((field) => [field, String(req.body[field] || '').trim()]));
    const certificate = await Certificate.create({ ...data, certificateNumber, qrCode, imagePath: req.file ? req.file.path : null });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${certificateNumber}.pdf"`, 'X-Certificate-Number': certificateNumber, 'Access-Control-Expose-Headers': 'X-Certificate-Number' });
    buildCertificatePdf(certificate, res);
  } catch (error) { next(error); }
}

async function getCertificate(req, res, next) {
  try {
    const certificate = await Certificate.findOne({ certificateNumber: req.params.certificateNumber }).select('-qrCode -imagePath');
    if (!certificate) return res.status(404).json({ error: 'Certificate not found' });
    res.json(certificate);
  } catch (error) { next(error); }
}

async function downloadCertificatePdf(req, res, next) {
  try {
    const certificate = await Certificate.findOne({ certificateNumber: req.params.certificateNumber });
    if (!certificate) return res.status(404).json({ error: 'Certificate not found' });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${certificate.certificateNumber}.pdf"`,
      'X-Certificate-Number': certificate.certificateNumber,
      'Access-Control-Expose-Headers': 'X-Certificate-Number'
    });
    buildCertificatePdf(certificate, res);
  } catch (error) { next(error); }
}

module.exports = { createCertificate, getCertificate, downloadCertificatePdf };

