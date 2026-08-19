const axios = require('axios');
const http = require('http');
const https = require('https');

// Reuses TCP connections across requests instead of opening a fresh
// connection (DNS lookup + TCP handshake) on every single outbound call.
// keepAliveMsecs raised to 30s so the socket survives normal gaps between
// requests (e.g. a user clicking through checkout) rather than the 1s
// Node default, which was closing the connection between most real calls.
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
});
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
});

const client = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 10000,
});

module.exports = client;