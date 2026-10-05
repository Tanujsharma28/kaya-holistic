import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import dotenv from 'dotenv';
dotenv.config();

const PORT = 4000;
const REDIRECT_URI = `http://localhost:${PORT}`;

const client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/calendar.events'],
});

console.log('\n👉 Ye URL browser mein khol, apne Gmail se login karke allow kar:\n');
console.log(authUrl, '\n');

const server = http.createServer(async (req, res) => {
  const code = new url.URL(req.url, REDIRECT_URI).searchParams.get('code');
  if (!code) return res.end('Code nahi mila, dubara try kar.');
  res.end('✅ Ho gaya! Terminal mein wapas jao.');
  server.close();
  const { tokens } = await client.getToken(code);
  console.log('\n✅ Ye line apne backend/.env mein add kar:\n');
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  process.exit(0);
});

server.listen(PORT, () => console.log(`Google ke redirect ka wait ho raha hai...`));