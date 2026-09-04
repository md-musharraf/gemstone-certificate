# Gemstone Certificate Generator

A simple Node.js, Express, MongoDB application that issues fixed-format, credit-card-sized gemstone identification cards as print-ready PDFs.

## Setup

1. Install [Node.js](https://nodejs.org/) 18+ and start MongoDB locally (or create a MongoDB Atlas database).
2. Copy `.env.example` to `.env`, then set `MONGODB_URI`, `PORT`, and the public `BASE_URL`. `BASE_URL` must be the publicly accessible address used by QR scanners.
3. Install packages: `npm install`
4. Start the application: `npm start` (development: `npm run dev`).
5. Visit `http://localhost:3000`. Complete the form and click **Generate Certificate**. The response provides a downloadable PDF and print action.
6. Scan the PDF QR code or visit `/verify/<certificate-number>` to verify the stored record.

## API

- `POST /api/certificates` — multipart form with the form fields plus optional `image`; returns a PDF. The `X-Certificate-Number` header provides the assigned number.
- `GET /api/certificates/:certificateNumber` — certificate JSON.
- `GET /verify/:certificateNumber` — public verification page.

Uploads accept PNG, JPEG, or WebP up to 5 MB. The PDF template is isolated in `backend/services/pdfService.js`, so a future CSV/Excel import can call the same certificate creation/template service without changing the card layout.
