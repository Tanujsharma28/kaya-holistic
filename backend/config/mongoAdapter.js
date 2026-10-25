import { MongoClient } from 'mongodb';

// lowdb ka storage MongoDB me. Poora database ek JSON object hai (services, bookings, users...).
// Har top-level key (bookings, giftCards...) apna alag document hai, aur sirf badli hui keys hi save hoti hain.
export class MongoAdapter {
  constructor(coll) {
    this.coll = coll;
    this.known = new Map(); // key -> last saved JSON text
    this.queue = Promise.resolve();
  }

  async read() {
    const docs = await this.coll.find({}).toArray();
    if (!docs.length) return null; // pehli baar: lowdb defaults use karega
    const data = {};
    for (const d of docs) {
      data[d._id] = JSON.parse(d.json);
      this.known.set(d._id, d.json);
    }
    return data;
  }

  // Saari writes line se chalti hain. Alag requests ek saath save karein to purani snapshot
  // naye data ke upar nahi likhi jaati, kyunki har write chalte waqt latest data uthati hai.
  write(data) {
    const run = () => this._write(data);
    const p = this.queue.then(run, run);
    this.queue = p.catch(() => {});
    return p;
  }

  async _write(data) {
    const ops = [];
    const next = new Map();
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      const json = JSON.stringify(value);
      next.set(key, json);
      if (this.known.get(key) !== json) {
        ops.push({ updateOne: { filter: { _id: key }, update: { $set: { json, at: new Date() } }, upsert: true } });
      }
    }
    for (const key of this.known.keys()) {
      if (!next.has(key)) ops.push({ deleteOne: { filter: { _id: key } } });
    }
    if (ops.length) await this.coll.bulkWrite(ops, { ordered: true });
    this.known = next;
  }
}

export async function openMongoState(uri) {
  if (!uri) throw new Error('DB_DRIVER=mongo hai par MONGO_URI set nahi hai.');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
  } catch (e) {
    // Chupchap file par mat girna: warna data redeploy par mit jata. Saaf error ke saath band ho jao.
    throw new Error(
      `MongoDB se connect nahi ho paya (${e.message}). MONGO_URI sahi hai? Atlas > Network Access me Render ka access (0.0.0.0/0) allow hai?`
    );
  }
  const name = client.db().databaseName;
  console.log(`🗄️  Database: MongoDB (${name} / kaya_state)`);
  return new MongoAdapter(client.db().collection('kaya_state'));
}