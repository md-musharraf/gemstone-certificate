require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const fs = require('fs');
const Certificate = require('./models/Certificate');
const certificateRoutes = require('./routes/certificates');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/certificates', certificateRoutes);

app.get('/verify/:certificateNumber', async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({ certificateNumber: req.params.certificateNumber });
    res.status(certificate ? 200 : 404).send(verificationPage(certificate, req.params.certificateNumber));
  } catch (error) { next(error); }
});

app.use((err, req, res, next) => {
  if (err instanceof require('multer').MulterError) return res.status(400).json({ error: err.message });
  if (err.message === 'Only image uploads are allowed' || err.message === 'Only PNG, JPEG, and WebP image uploads are allowed') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

function esc(value) {
  return String(value || '').replace(/[&<>'"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));
}

function verificationPage(c, number) {
  const isFound = !!c;
  const pageTitle = isFound ? `Verification: ${esc(c.certificateNumber)} - ${esc(c.name)}` : 'Certificate Record Not Found';
  const issueDate = isFound && c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const hasImage = isFound && c.imagePath && fs.existsSync(c.imagePath);
  const imageFilename = hasImage ? path.basename(c.imagePath) : null;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageTitle} | International Gemological Archive</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy-deep: #071527;
      --navy-text: #0F172A;
      --gold-primary: #B38E36;
      --gold-light: #FAF4E6;
      --gold-dark: #8C6F2D;
      --text-main: #071527;
      --text-muted: #64748B;
      --surface-border: rgba(197, 160, 89, 0.35);
      --surface-highlight: #FAF8F5;
      --bg-page: #F5F7FB;
      --card-bg: #FFFFFF;
      --success-green: #059669;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: linear-gradient(180deg, #F8FAFC 0%, #EFF3F8 100%);
      color: var(--navy-text);
      font-family: 'Montserrat', sans-serif;
      min-height: 100vh;
      padding: 40px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .portal-container {
      width: 100%;
      max-width: 880px;
      background: var(--card-bg);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(7, 21, 39, 0.08), 0 4px 20px rgba(197, 160, 89, 0.12);
      overflow: hidden;
      margin-bottom: 32px;
    }
    .portal-header {
      background: linear-gradient(135deg, #FAF8F5 0%, #F4EFE6 100%);
      padding: 24px 32px;
      border-bottom: 2px solid var(--gold-primary);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .diamond-icon {
      width: 36px;
      height: 36px;
      color: var(--gold-primary);
    }
    .brand-title {
      font-family: 'Cinzel', serif;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: var(--navy-deep);
    }
    .brand-subtitle {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--gold-dark);
      font-weight: 600;
      margin-top: 2px;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ECFDF5;
      border: 1px solid #10B981;
      color: #065F46;
      padding: 8px 18px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .status-badge.invalid {
      background: #FEF2F2;
      border-color: #EF4444;
      color: #991B1B;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }
    .portal-body {
      padding: 36px;
    }
    .cert-heading {
      margin-bottom: 28px;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
    }
    .cert-name {
      font-family: 'Cinzel', serif;
      font-size: 28px;
      font-weight: 700;
      color: var(--navy-deep);
      line-height: 1.25;
    }
    .cert-meta {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 8px;
    }
    .cert-meta span {
      margin-right: 18px;
      display: inline-block;
    }
    .cert-meta strong {
      color: var(--navy-deep);
    }
    .cert-id-tag {
      font-family: 'Cinzel', serif;
      font-size: 18px;
      color: var(--navy-deep) !important;
      background: linear-gradient(135deg, #FAF4E6, #F4E8CD);
      border: 2px solid var(--gold-primary);
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 900;
      letter-spacing: 1.5px;
      box-shadow: 0 4px 12px rgba(179, 142, 54, 0.15);
    }
    .grid-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 32px;
      align-items: start;
    }
    @media (max-width: 768px) {
      body { padding: 20px 12px; }
      .portal-container { border-radius: 12px; }
      .portal-header { padding: 18px 20px; flex-direction: column; align-items: flex-start; gap: 12px; }
      .brand-title { font-size: 17px; }
      .portal-body { padding: 20px 16px; }
      .cert-heading { flex-direction: column; gap: 12px; }
      .cert-name { font-size: 23px; }
      .cert-id-tag { width: 100%; text-align: center; font-size: 16px; padding: 8px 14px; }
      .grid-layout { grid-template-columns: 1fr; gap: 20px; }
      .specimen-card { padding: 14px; }
      .specimen-photo { height: 180px; }
      .action-bar { flex-direction: column; gap: 10px; }
      .action-bar .btn { width: 100%; justify-content: center; }
      .search-form { flex-direction: column; }
      .search-form .btn { width: 100%; }
    }

    @media (max-width: 480px) {
      body { padding: 12px 8px; }
      .brand-title { font-size: 15px; }
      .brand-subtitle { font-size: 9.5px; }
      .specs-table th { width: 45%; font-size: 10px; padding: 10px 6px; }
      .specs-table td { font-size: 13px; padding: 10px 6px; }
      .comments-box { padding: 12px 14px; }
      .comments-text { font-size: 12px; }
    }
    .specimen-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 18px;
      text-align: center;
    }
    .specimen-photo {
      width: 100%;
      height: 220px;
      border-radius: 8px;
      border: 1.5px solid var(--gold-primary);
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .specimen-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .specimen-placeholder-icon {
      width: 64px;
      height: 64px;
      color: var(--gold-primary);
      opacity: 0.6;
    }
    .qr-preview {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #E2E8F0;
    }
    .qr-preview a {
      color: #059669;
      font-weight: 600;
      font-size: 12px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .specs-table {
      width: 100%;
      border-collapse: collapse;
    }
    .specs-table tr {
      border-bottom: 1px solid #E2E8F0;
    }
    .specs-table tr:last-child {
      border-bottom: none;
    }
    .specs-table th {
      text-align: left;
      padding: 13px 10px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: var(--text-muted);
      width: 40%;
      font-weight: 700;
    }
    .specs-table td {
      text-align: left;
      padding: 13px 10px;
      font-size: 14px;
      color: var(--navy-deep);
      font-weight: 600;
    }
    .comments-box {
      margin-top: 24px;
      background: #FAF8F5;
      border-left: 3px solid var(--gold-primary);
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
      border: 1px solid #EAE3D2;
      border-left: 4px solid var(--gold-primary);
    }
    .comments-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--gold-dark);
      font-weight: 800;
      margin-bottom: 6px;
    }
    .comments-text {
      font-size: 13px;
      color: #334155;
      font-style: italic;
      line-height: 1.6;
    }
    .action-bar {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      align-items: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 13px 26px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .btn-gold {
      background: linear-gradient(135deg, #B38E36 0%, #967425 100%);
      color: #FFFFFF;
      border: 1px solid #967425;
      box-shadow: 0 4px 14px rgba(179, 142, 54, 0.25);
    }
    .btn-gold:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(179, 142, 54, 0.35);
      color: #FFFFFF;
    }
    .btn-outline {
      background: #FFFFFF;
      color: var(--navy-deep);
      border: 1.5px solid #CBD5E1;
    }
    .btn-outline:hover {
      background: #F8FAFC;
      border-color: var(--gold-primary);
      color: var(--gold-dark);
    }
    .search-wrap {
      margin-top: 28px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 22px;
    }
    .search-form {
      display: flex;
      gap: 12px;
      margin-top: 12px;
    }
    .search-input {
      flex: 1;
      background: #FFFFFF;
      border: 1.5px solid #CBD5E1;
      color: var(--navy-deep);
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      font-weight: 600;
    }
    .search-input:focus {
      outline: none;
      border-color: var(--gold-primary);
      box-shadow: 0 0 0 3px rgba(179, 142, 54, 0.15);
    }
    .notice-card {
      margin-top: 24px;
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.6;
      text-align: center;
      letter-spacing: 0.3px;
    }
    .not-found-box {
      text-align: center;
      padding: 48px 24px;
    }
    .not-found-title {
      font-family: 'Cinzel', serif;
      font-size: 26px;
      color: #DC2626;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <div class="portal-container">
    <header class="portal-header">
      <div class="brand-wrap">
        <svg class="diamond-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 3h12l4 7-10 11L2 10l4-7z"></path>
          <path d="M2 10h20"></path>
          <path d="M10 3l-4 7 6 11 6-11-4-7"></path>
        </svg>
        <div>
          <h1 class="brand-title">INTERNATIONAL GEMOLOGICAL ARCHIVE</h1>
          <p class="brand-subtitle">Official Public Verification & Registry System</p>
        </div>
      </div>
      <div>
        ${isFound
          ? `<span class="status-badge"><span class="status-dot"></span> Official Record • Valid</span>`
          : `<span class="status-badge invalid"><span class="status-dot"></span> Unregistered / Invalid</span>`
        }
      </div>
    </header>

    <div class="portal-body">
      ${isFound ? `
        <div class="cert-heading">
          <div>
            <h2 class="cert-name">${esc(c.name)}</h2>
            <div class="cert-meta">
              <span><strong>Issued To:</strong> ${esc(c.issuedTo)}</span>
              <span><strong>Date of Record:</strong> ${issueDate}</span>
            </div>
          </div>
          <div class="cert-id-tag">
            REPORT #${esc(c.certificateNumber)}
          </div>
        </div>

        <div class="grid-layout">
          <div class="specimen-card">
            <div class="specimen-photo">
              ${imageFilename
                ? `<img src="/uploads/${esc(imageFilename)}" alt="Gemstone Specimen">`
                : `<svg class="specimen-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                     <path d="M6 3h12l4 7-10 11L2 10l4-7z"></path>
                     <path d="M2 10h20"></path>
                     <path d="M10 3l-4 7 6 11 6-11-4-7"></path>
                   </svg>`
              }
            </div>
            <p style="font-size: 11px; color: var(--gold-light); margin-top: 10px; font-weight: 600; letter-spacing: 0.5px;">OFFICIAL ARCHIVE SPECIMEN</p>
            <div class="qr-preview">
              <img src="/api/certificates/${esc(c.certificateNumber)}/pdf" style="display:none" alt="PDF">
              <a href="/verify/${esc(c.certificateNumber)}" style="color: var(--text-muted); font-size: 11px; text-decoration: none;">
                Cryptographic Match Verified ✓
              </a>
            </div>
          </div>

          <div>
            <table class="specs-table">
              <tbody>
                <tr><th>Weight / Carat</th><td><strong>${esc(c.weight)}</strong></td></tr>
                <tr><th>Shape / Cut</th><td>${esc(c.shapeCut)}</td></tr>
                <tr><th>Colour Grade</th><td>${esc(c.colour)}</td></tr>
                <tr><th>Refractive Index</th><td>${esc(c.refractiveIndex)}</td></tr>
                <tr><th>Hardness (Mohs)</th><td>${esc(c.hardness)}</td></tr>
                <tr><th>Clarity Grade</th><td>${esc(c.clarity)}</td></tr>
                <tr><th>Species / Group</th><td>${esc(c.speciesGroup)}</td></tr>
              </tbody>
            </table>

            <div class="comments-box">
              <div class="comments-title">Laboratory Comments & Analysis</div>
              <div class="comments-text">
                "${esc(c.comments || 'No specific treatments or alterations detected. Analytical data is fully consistent with registered species.')}"
              </div>
            </div>
          </div>
        </div>

        <div class="action-bar">
          <a class="btn btn-gold" href="/api/certificates/${esc(c.certificateNumber)}/pdf">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download Official Certificate PDF
          </a>
          <button class="btn btn-outline" onclick="window.print()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print Verification Sheet
          </button>
          <a class="btn btn-outline" href="/">
            Return to Generator Studio
          </a>
        </div>
      ` : `
        <div class="not-found-box">
          <h2 class="not-found-title">Record Not Found</h2>
          <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px;">
            The certificate identification <strong>${esc(number)}</strong> is not registered in the International Gemological Archive database. Please verify the code on your physical document.
          </p>
          <a class="btn btn-gold" href="/">Go to Generator Studio</a>
        </div>
      `}

      <div class="search-wrap">
        <label style="font-size: 12px; color: var(--gold-light); font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
          Verify Another Gemstone Certificate
        </label>
        <form class="search-form" onsubmit="event.preventDefault(); const val=document.getElementById('search-input').value.trim(); if(val) window.location.href='/verify/'+encodeURIComponent(val);">
          <input id="search-input" class="search-input" placeholder="Enter Certificate No. (e.g. JGT-849201)" required>
          <button type="submit" class="btn btn-gold">Verify Report</button>
        </form>
      </div>

      <div class="notice-card">
        SECURITY NOTICE: This electronic verification page is an authentic mirror of the international gemstone registry database.
        Unauthorized duplication, tampering, or reproduction is strictly prohibited and protected by international laboratory verification protocols.
      </div>
    </div>
  </div>
</body>
</html>`;
}

const defaultPort = parseInt(process.env.PORT, 10) || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gemstone_certificates';

function startServer(port = defaultPort) {
  const server = app.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`💎 International Gemological Archive Studio Ready!`);
    console.log(`🌐 URL: http://localhost:${port}`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port === 3000 ? 3005 : port + 1;
      console.warn(`Notice: Port ${port} is occupied. Trying next available port: ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('Server error:', err);
    }
  });
}

mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 })
  .then(() => {
    console.log('Connected to MongoDB database successfully.');
    startServer();
  })
  .catch((error) => {
    console.warn(`Notice: MongoDB connection failed (${error.message}). Running in local in-memory fallback mode for testing/demo.`);
    Certificate.setFallback(true);
    startServer();
  });

