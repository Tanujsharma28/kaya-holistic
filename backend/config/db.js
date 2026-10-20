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

// Pehli baar chalne par services aur quiz settings seed.json se aati hain
let seed = {};
try {
  seed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'seed.json'), 'utf8'));
} catch { /* seed optional */ }

const defaultQuizMap = seed.settings?.quizMap || {};
const defaultData = {
  services: seed.services || [],
  bookings: [],
  consultations: [],
  settings: { quizMap: { ...defaultQuizMap } },
};

export const db = await JSONFilePreset(file, defaultData);
db.data.services ||= [];
db.data.bookings ||= [];
db.data.consultations ||= [];
db.data.settings ||= {};
// Purani database file me quizMap na ho to defaults se bhar do
db.data.settings.quizMap = { ...defaultQuizMap, ...(db.data.settings.quizMap || {}) };
db.data.consents ||= [];
db.data.users ||= [];
db.data.activity ||= [];

const SEED_VERSION = seed.settings?.seedVersion || 1;
if ((db.data.settings.seedVersion || 1) < SEED_VERSION) {
  for (const s of seed.services || []) {
    const cur = db.data.services.find((x) => x.id === s.id);
    if (!cur) db.data.services.push({ ...s });
    else Object.assign(cur, { name: s.name, price: s.price, duration: s.duration, category: s.category, desc: s.desc, popular: !!s.popular });
  }
  db.data.settings.quizMap = { ...defaultQuizMap };
  db.data.settings.seedVersion = SEED_VERSION;
}
await db.write();
console.log(`🗄️  Database file: ${file}`);