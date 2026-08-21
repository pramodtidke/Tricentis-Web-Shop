import http from 'k6/http';
import { check, sleep } from 'k6';

// ── Task 3: Black Friday load profile ──────────────────────────────
export const options = {
  stages: [
    { duration: '15s', target: 30 },  // ramp 0→30 VUs
    { duration: '60s', target: 30 },  // hold
    { duration: '15s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<2500'], // 95% of requests must complete in < 2s
    checks: ['rate>0.95'],             // fail the run if >5% of checks fail
  },
};

const BASE_URL = 'http://localhost:4000';

// 100 unique test users (User Service / Postgres) — one per VU, registered
// via POST /users/register ahead of this run. Using __VU (k6's 1-indexed
// virtual user number) to assign a dedicated identity per VU eliminates
// the cart-collision race that occurs when multiple VUs share an account
// (VU-A adds to cart, VU-B checks out and clears it, VU-A's checkout then
// hits an empty cart). Real Black Friday traffic never shares carts across
// shoppers, so this matches production behavior far better than a small
// shared pool did.
function getUserForVU() {
  const num = ((__VU - 1) % 100 + 1).toString().padStart(3, '0');
  return { email: `loadtest${num}@example.com`, password: 'Password123!' };
}

// Real products from Catalog service (catalog-service.products in MongoDB).
// Cart Service requires the full item shape (productId, name, price, quantity)
// rather than just an ID — it doesn't look up product details itself.
const TEST_PRODUCTS = [
  { productId: '6a84fb76151a569d4cb853bb', name: 'Classic Leather Backpack', price: 89.99 },
  { productId: '6a84fb76151a569d4cb853bc', name: 'Wireless Noise-Cancelling Headphones', price: 199.99 },
  { productId: '6a84fb76151a569d4cb853bd', name: 'Organic Cotton T-Shirt', price: 24.99 },
  { productId: '6a84fb76151a569d4cb853be', name: 'Stainless Steel Water Bottle', price: 34.5 },
  { productId: '6a84fb76151a569d4cb853bf', name: 'Smart Fitness Watch', price: 149 },
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function () {
  const user = getUserForVU();
  const jsonHeaders = { headers: { 'Content-Type': 'application/json' } };

  // ── 1. Login ─────────────────────────────────────────────────────
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    jsonHeaders
  );

  const loginOk = check(loginRes, {
    'login: status is 200': (r) => r.status === 200,
    'login: token present': (r) => !!r.json('token'),
  });

  if (!loginOk) {
    // Bail out of this iteration cleanly rather than cascading failures
    sleep(1);
    return;
  }

  const token = loginRes.json('token');
  const userId = loginRes.json('user.id') || loginRes.json('userId');

  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  sleep(Math.random() * 2 + 1); // 1-3s: "reading the homepage" think time

  // ── 2. Add item to cart ──────────────────────────────────────────
  const product = randomFrom(TEST_PRODUCTS);
  const cartRes = http.post(
    `${BASE_URL}/cart/${userId}/items`,
    JSON.stringify({
      productId: product.productId,
      name: product.name,
      price: product.price,
      quantity: 1,
    }),
    authHeaders
  );

  check(cartRes, {
    'cart add: status is 200/201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(Math.random() * 2 + 1); // 1-3s: "browsing cart before checkout"

  // ── 3. Checkout ───────────────────────────────────────────────────
  const checkoutRes = http.post(
    `${BASE_URL}/orders/checkout`,
    JSON.stringify({
      userId,
      shippingAddress: {
        street: '123 Load Test St',
        city: 'Load City',
        state: 'LT',
        zip: '00000',
        country: 'USA',
      },
    }),
    authHeaders
  );

  const checkoutOk = check(checkoutRes, {
    'checkout: status is 200/201': (r) => r.status === 200 || r.status === 201,
    'checkout: orderId present': (r) => !!r.json('orderId') || !!r.json('id'),
  });

  if (!checkoutOk) {
    sleep(1);
    return;
  }

  const orderId = checkoutRes.json('orderId') || checkoutRes.json('id');

  sleep(Math.random() * 3 + 2); // 2-5s: "entering payment card details"

  // ── 4. Pay ────────────────────────────────────────────────────────
  const payRes = http.post(
    `${BASE_URL}/payments/charge`,
    JSON.stringify({
      orderId,
      amount: 100.0, // adjust to match a real checkout total if your API validates it
      currency: 'USD',
      cardToken: 'tok_test_visa',
    }),
    authHeaders
  );

  check(payRes, {
    'payment: status is 201': (r) => r.status === 201,
    'payment: succeeded': (r) => r.json('status') === 'success',
  });

  sleep(1); // brief pause before next iteration (VU "leaves" and a new one arrives)
}
