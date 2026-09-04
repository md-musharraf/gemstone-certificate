const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateNumber: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  weight: { type: String, required: true, trim: true, maxlength: 50 },
  shapeCut: { type: String, required: true, trim: true, maxlength: 80 },
  colour: { type: String, required: true, trim: true, maxlength: 80 },
  refractiveIndex: { type: String, required: true, trim: true, maxlength: 50 },
  hardness: { type: String, required: true, trim: true, maxlength: 50 },
  clarity: { type: String, required: true, trim: true, maxlength: 80 },
  speciesGroup: { type: String, required: true, trim: true, maxlength: 100 },
  comments: { type: String, trim: true, maxlength: 500, default: '' },
  issuedTo: { type: String, required: true, trim: true, maxlength: 100 },
  imagePath: { type: String, default: null },
  qrCode: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const MongooseModel = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);
const memoryStore = new Map();

const CertificateAdapter = {
  isFallback: false,
  setFallback(val) { this.isFallback = val; },
  async create(data) {
    if (!this.isFallback && mongoose.connection.readyState === 1) {
      return await MongooseModel.create(data);
    }
    const doc = { ...data, createdAt: data.createdAt || new Date(), _id: 'mem_' + Date.now() };
    memoryStore.set(doc.certificateNumber, doc);
    return doc;
  },
  findOne(query) {
    if (!this.isFallback && mongoose.connection.readyState === 1) {
      return MongooseModel.findOne(query);
    }
    const doc = memoryStore.get(query.certificateNumber);
    return {
      select(fields) {
        if (!doc) return Promise.resolve(null);
        const cloned = { ...doc };
        if (typeof fields === 'string') {
          fields.split(/\s+/).forEach(f => {
            if (f.startsWith('-')) delete cloned[f.substring(1)];
          });
        }
        return Promise.resolve(cloned);
      },
      then(resolve, reject) {
        return Promise.resolve(doc ? { ...doc } : null).then(resolve, reject);
      }
    };
  },
  async exists(query) {
    if (!this.isFallback && mongoose.connection.readyState === 1) {
      return await MongooseModel.exists(query);
    }
    return memoryStore.has(query.certificateNumber) ? { _id: 'mem_exists' } : null;
  }
};

module.exports = CertificateAdapter;

