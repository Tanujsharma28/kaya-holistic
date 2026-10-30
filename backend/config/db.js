import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { openMongoState } from './mongoAdapter.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Production me DB_FILE ko persistent disk par point karo (jaise /var/data/kaya-db.json).
// Warna redeploy par bookings mit sakti hain.
const file = process.env.DB_FILE
  ? path.resolve(process.env.DB_FILE)
  : path.join(__dirname, '..', 'data', 'db.json');

fs.mkdirSync(path.dirname(file), { recursive: true });
export const dbFile = file;

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

const useMongo = String(process.env.DB_DRIVER || '').toLowerCase() === 'mongo';
let lowdb;
if (useMongo) {
  lowdb = new Low(await openMongoState(process.env.MONGO_URI), defaultData);
  await lowdb.read();
} else {
  lowdb = await JSONFilePreset(file, defaultData);
}
export const db = lowdb;
db.data.services ||= [];
db.data.bookings ||= [];
db.data.consultations ||= [];
db.data.settings ||= {};
// Purani database file me quizMap na ho to defaults se bhar do
db.data.settings.quizMap = { ...defaultQuizMap, ...(db.data.settings.quizMap || {}) };
db.data.consents ||= [];
db.data.users ||= [];
db.data.activity ||= [];
db.data.giftCards ||= [];
db.data.trash ||= [];
db.data.auditLog ||= [];

const SEED_VERSION = seed.settings?.seedVersion || 1;
if ((db.data.settings.seedVersion || 1) < SEED_VERSION) {
  for (const s of seed.services || []) {
    const cur = db.data.services.find((x) => x.id === s.id);
    if (!cur) db.data.services.push({ ...s });
    else if (cur.userEdited) continue; 
    else Object.assign(cur, { name: s.name, price: s.price, duration: s.duration, category: s.category, desc: s.desc, popular: !!s.popular });
  }
  // Menu se hataye gaye services purani DB se bhi nikaalo
  const removed = seed.settings?.removedServiceIds || [];
  if (removed.length) db.data.services = db.data.services.filter((x) => !removed.includes(x.id));
  db.data.settings.quizMap = { ...defaultQuizMap };
  db.data.settings.seedVersion = SEED_VERSION;
}
await db.write();
if (!useMongo) console.log(`🗄️  Database file: ${file}`);