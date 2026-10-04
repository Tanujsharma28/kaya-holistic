import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '..', 'data', 'db.json');

const defaultData = { services: [], bookings: [], consultations: [] };

export const db = await JSONFilePreset(file, defaultData);