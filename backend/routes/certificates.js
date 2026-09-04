const express = require('express');
const multer = require('multer');
const path = require('path');
const { createCertificate, getCertificate, downloadCertificatePdf } = require('../controllers/certificateController');
const router = express.Router();
const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'), limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) return cb(new Error('Only PNG, JPEG, and WebP image uploads are allowed'));
    return cb(null, true);
  }
});
router.post('/', upload.single('image'), createCertificate);
router.get('/:certificateNumber', getCertificate);
router.get('/:certificateNumber/pdf', downloadCertificatePdf);
module.exports = router;
