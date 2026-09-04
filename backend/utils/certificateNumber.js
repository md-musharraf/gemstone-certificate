const Certificate = require('../models/Certificate');

async function createCertificateNumber() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const number = `JGT-${Math.floor(100000 + Math.random() * 900000)}`;
    if (!(await Certificate.exists({ certificateNumber: number }))) return number;
  }
  throw new Error('Could not allocate a unique certificate number. Please try again.');
}

module.exports = { createCertificateNumber };
