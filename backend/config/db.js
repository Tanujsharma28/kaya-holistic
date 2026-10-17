import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Production me DB_FILE ko persistent disk par point karo (jaise /var/data/kaya-db.json).
// Warna redeploy par bookings mit sakti hain.
const file = process.env.DB_FILE
  ? path.resolve(process.env.DB_FILE)
  : path.join(__dirname, '..', 'data', 'db.json');

fs.mkdirSync(path.dirname(file), { recursive: true });

// Pehli baar chalne par services seed.json se aati hain
let seedServices = [];
try {
  seedServices = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'seed.json'), 'utf8')).services || [];
} catch { /* seed optional */ }

const defaultData = { services: seedServices, bookings: [], consultations: [] };

export const db = await JSONFilePreset(file, defaultData);
db.data.services ||= [];
db.data.bookings ||= [];
db.data.consultations ||= [];
console.log(`🗄️  Database file: ${file}`);