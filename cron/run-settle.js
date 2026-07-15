// cron/run-settle.js
// Small runner for the Railway "Cron" service.
// It calls the app's settle-auctions endpoint on a timer to close
// auctions that have ended, pick winners, and email them.
//
// Railway Cron service settings:
//   Start Command:  node cron/run-settle.js
//   Cron Schedule:  */5 * * * *   (every 5 minutes)
//   Variables:      APP_BASE_URL  (your Railway web address, later your domain)
//                   CRON_SECRET   (same value as the Web service)

const BASE = process.env.APP_BASE_URL;
const SECRET = process.env.CRON_SECRET;

async function main() {
  if (!BASE || !SECRET) {
    console.error('Missing APP_BASE_URL or CRON_SECRET environment variable');
    process.exit(1);
  }

  const res = await fetch(`${BASE}/api/admin/settle-auctions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SECRET}` },
  });

  const text = await res.text();
  console.log('settle-auctions status', res.status, text);

  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
