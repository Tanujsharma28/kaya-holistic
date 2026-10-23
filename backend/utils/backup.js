import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import { db, dbFile } from '../config/db.js';

const DIR = process.env.BACKUP_DIR
  ? path.resolve(process.env.BACKUP_DIR)
  : path.join(path.dirname(dbFile), 'backups');
const KEEP = Number(process.env.BACKUP_KEEP) || 14; // kitne din ke backup rakhne hain

const stamp = () => new Date().toISOString().slice(0, 10);

export const makeBackup = () => {
  fs.mkdirSync(DIR, { recursive: true });
  const file = path.join(DIR, `kaya-backup-${stamp()}.json`);
  fs.writeFileSync(file, JSON.stringify(db.data));

  // purane backups hata do
  const files = fs.readdirSync(DIR).filter((f) => /^kaya-backup-.*\.json$/.test(f)).sort();
  files.slice(0, Math.max(0, files.length - KEEP)).forEach((f) => fs.unlinkSync(path.join(DIR, f)));
  return file;
};

export const initBackupCron = () => {
  try {
    const today = path.join(DIR, `kaya-backup-${stamp()}.json`);
    if (!fs.existsSync(today)) makeBackup();
  } catch (e) { console.error('❌ Startup backup failed:', e.message); }
  // roz raat 3:30 AM (Evanston time)
  cron.schedule('30 3 * * *', () => {
    try { console.log('💾 Backup saved:', makeBackup()); }
    catch (e) { console.error('❌ Backup failed:', e.message); }
  }, { timezone: 'America/Chicago' });
};

// Admin "Download backup" button ke liye
export const downloadBackup = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="kaya-backup-${stamp()}.json"`);
  res.send(JSON.stringify(db.data, null, 2));
};