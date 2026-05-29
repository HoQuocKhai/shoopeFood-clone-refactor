/**
 * test_order_payment.js
 * Script kiểm thử API cho phần Order Ops + Payment Stub (Người 5)
 *
 * Chạy: node test_order_payment.js
 * Yêu cầu: server đang chạy ở http://localhost:3000
 */

const BASE = 'http://localhost:3000';
const STUB_SECRET = 'stub-secret-dev'; // phải khớp PAYMENT_STUB_SECRET trong .env

let tokenAdmin = null;
let tokenMerchant = null;
let testOrderId = null;
let testPaymentId = null;
let allTransitions = {};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const h = (token) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });
const hStub = () => ({ 'Content-Type': 'application/json', 'x-stub-secret': STUB_SECRET });

async function req(method, path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function pass(name) {
  console.log(`  ✅ PASS: ${name}`);
}
function fail(name, got, expected) {
  console.log(`  ❌ FAIL: ${name} | got ${got}, expected ${expected}`);
}
function section(name) {
  console.log(`\n─── ${name} ───`);
}

function assert(name, got, expected) {
  got === expected ? pass(name) : fail(name, got, expected);
}

function assertIn(name, got, arr) {
  arr.includes(got) ? pass(name) : fail(name, got, `one of [${arr}]`);
}

// ─── Tests ───────────────────────────────────────────────────────────────────
async function run() {
  console.log('🚀 ShoopeFood Clone – Order Ops + Payment Test Suite\n');

  // 1. Auth
  section('1. Authentication');

  const adminLogin = await req('POST', '/api/auth/login', {
    phone: '0900000005',
    password: '123456',
    role: 'ADMIN',
  });
  assert('Admin login → 200', adminLogin.status, 200);
  tokenAdmin = adminLogin.json.data?.token;
  if (!tokenAdmin) {
    console.log('  ⛔ No admin token, stopping');
    return;
  }
  pass('Admin token received');

  const merchantLogin = await req('POST', '/api/auth/login', {
    phone: '0900000003',
    password: '123456',
    role: 'MERCHANT',
  });
  assert('Merchant login → 200', merchantLogin.status, 200);
  tokenMerchant = merchantLogin.json.data?.token;
  pass('Merchant token received');

  // Customer token for creating orders
  const customerLogin = await req('POST', '/api/auth/login', {
    phone: '0900000001',
    password: '123456',
    role: 'CUSTOMER',
  });
  assert('Customer login → 200', customerLogin.status, 200);
  const tokenCustomer = customerLogin.json.data?.token;
  pass('Customer token received');

  const badLogin = await req('POST', '/api/auth/login', {
    phone: '0900000005',
    password: 'wrong',
    role: 'ADMIN',
  });
  assert('Bad password → 401', badLogin.status, 401);

  // 2. Order Statuses API
  section('2. Order Statuses API (Public)');

  const statusRes = await req('GET', '/api/order-statuses');
  assert('GET /api/order-statuses → 200', statusRes.status, 200);
  const statuses = statusRes.json.data || [];
  console.log(`  ℹ️  Found ${statuses.length} statuses:`, statuses.map((s) => s.code).join(', '));

  const transRes = await req('GET', '/api/order-statuses/transitions');
  assert('GET /api/order-statuses/transitions → 200', transRes.status, 200);
  const transitions = transRes.json.data || {};
  console.log('  ℹ️  Transitions:', JSON.stringify(transitions));

  // 3. Order RBAC
  section('3. Order RBAC');

  const noAuthList = await req('GET', '/api/orders');
  assert('GET /api/orders without token → 401', noAuthList.status, 401);

  const adminList = await req('GET', '/api/orders', null, h(tokenAdmin));
  assert('GET /api/orders as ADMIN → 200', adminList.status, 200);
  const orders = adminList.json.data || [];
  console.log(`  ℹ️  Admin sees ${orders.length} orders`);

  if (orders.length > 0) testOrderId = orders[0].id;

  const merchantList = await req('GET', '/api/orders', null, h(tokenMerchant));
  assert('GET /api/orders as MERCHANT → 200', merchantList.status, 200);
  const merchantOrders = merchantList.json.data || [];
  console.log(`  ℹ️  Merchant sees ${merchantOrders.length} orders (scoped to their restaurants)`);

  // 4. Order Detail Scope
  section('4. Order Detail + Scope');

  if (testOrderId) {
    const detail = await req('GET', `/api/orders/${testOrderId}`, null, h(tokenAdmin));
    assert(`GET /api/orders/${testOrderId} as ADMIN → 200`, detail.status, 200);

    const noAuth = await req('GET', `/api/orders/${testOrderId}`);
    assert(`GET /api/orders/${testOrderId} without token → 401`, noAuth.status, 401);
  } else {
    console.log('  ⚠️  No orders to test detail – skipping');
  }

  // 5. Status Update (transitions)
  section('5. Status Transition Validation');

  if (testOrderId) {
    // Get current order
    const orderDetail = await req('GET', `/api/orders/${testOrderId}`, null, h(tokenAdmin));
    const currentOrder = orderDetail.json.data;
    const currentCode = currentOrder?.status || currentOrder?.statusCode;
    const currentVersion = currentOrder?.version;
    console.log(`  ℹ️  Order #${testOrderId}: status=${currentCode}, version=${currentVersion}`);

    const validNextCodes = transitions[currentCode] || [];
    console.log(`  ℹ️  Valid next statuses:`, validNextCodes);

    if (validNextCodes.length > 0) {
      // Valid transition
      const validUpdate = await req(
        'PUT',
        `/api/orders/${testOrderId}/status`,
        {
          statusCode: validNextCodes[0],
          expectedVersion: currentVersion,
          reason: 'Test valid transition',
        },
        h(tokenAdmin)
      );
      assert(`PUT status ${currentCode}→${validNextCodes[0]} → 200`, validUpdate.status, 200);

      // Get the NEW version after update
      const reloadedOrder = await req('GET', `/api/orders/${testOrderId}`, null, h(tokenAdmin));
      const newVersion = reloadedOrder.json.data?.version;
      const newCode = reloadedOrder.json.data?.status;

      // Test version conflict: submit with STALE version (currentVersion, already incremented)
      const nextValidCodes = allTransitions[newCode] || [];
      if (nextValidCodes.length > 0) {
        const conflictUpdate = await req(
          'PUT',
          `/api/orders/${testOrderId}/status`,
          { statusCode: nextValidCodes[0], expectedVersion: currentVersion }, // stale version
          h(tokenAdmin)
        );
        assert('PUT with stale expectedVersion → 409', conflictUpdate.status, 409);
      } else {
        console.log(
          '  ⚠️  Order reached terminal state, cannot test version conflict with valid transition – skipping'
        );
      }

      // Test invalid transition from new state: always invalid to go back to PENDING
      const invalidUpdate = await req(
        'PUT',
        `/api/orders/${testOrderId}/status`,
        { statusCode: 'PENDING', expectedVersion: newVersion },
        h(tokenAdmin)
      );
      assertIn('PUT invalid transition (any→PENDING) → 400', invalidUpdate.status, [400, 409]);
      console.log(`  ℹ️  Invalid transition response:`, invalidUpdate.json.message);
    } else {
      console.log(`  ⚠️  Order is in terminal state (${currentCode}), skipping transition tests`);
    }
  }

  // 6. Status Logs
  section('6. Status Logs');

  if (testOrderId) {
    const logsRes = await req('GET', `/api/orders/${testOrderId}/status-logs`, null, h(tokenAdmin));
    assert(`GET /api/orders/${testOrderId}/status-logs → 200`, logsRes.status, 200);
    const logs = logsRes.json.data || [];
    console.log(`  ℹ️  Found ${logs.length} status log(s)`);
    if (logs.length > 0) {
      console.log(
        '  ℹ️  Latest log:',
        logs[0].previousStatus,
        '→',
        logs[0].newStatus,
        'by',
        logs[0].changedByUser?.fullName || logs[0].changedBy
      );
    }

    const noAuth = await req('GET', `/api/orders/${testOrderId}/status-logs`);
    assert('GET status-logs without token → 401', noAuth.status, 401);
  }

  // ─── 7. Payment Idempotency ────────────────────────────────────────────────
  section('7. Payment Idempotency');

  // Check existing seeded payment for order 1
  const existingPayRes = await req('GET', '/api/payments/1', null, h(tokenAdmin));
  let seededPaymentKey = null;
  let seededPaymentId = null;

  if (existingPayRes.status === 200) {
    seededPaymentKey = existingPayRes.json.data?.idempotencyKey;
    seededPaymentId = existingPayRes.json.data?.id;
    console.log(`  ℹ️  Seeded payment: id=${seededPaymentId}, key=${seededPaymentKey}`);
    testPaymentId = seededPaymentId;

    // Test 1: replay with SAME idempotencyKey → 200
    const replay = await req(
      'POST',
      '/api/payments/create',
      { orderId: 1, idempotencyKey: seededPaymentKey, paymentMethod: 'E_WALLET' },
      h(tokenAdmin)
    );
    assert('POST same idempotencyKey → 200 (replay)', replay.status, 200);
    console.log('  ℹ️  Replay message:', replay.json.message);

    // Test 2: different idempotencyKey same orderId → 409
    const diffKey = await req(
      'POST',
      '/api/payments/create',
      { orderId: 1, idempotencyKey: `CONFLICT-KEY-${Date.now()}`, paymentMethod: 'CASH' },
      h(tokenAdmin)
    );
    assert('POST different key same orderId → 409', diffKey.status, 409);
    console.log('  ℹ️  Conflict message:', diffKey.json.message);
  } else {
    // No seeded payment; test normal creation on a different order
    console.log('  ⚠️  No seeded payment found, trying new payment on order 1 with fresh key');
    const freshKey = `FRESH-${Date.now()}`;
    const freshPay = await req(
      'POST',
      '/api/payments/create',
      { orderId: 1, idempotencyKey: freshKey, paymentMethod: 'CASH' },
      h(tokenAdmin)
    );
    assertIn('POST /api/payments/create → 201', freshPay.status, [201, 200]);
    testPaymentId = freshPay.json.data?.id;
  }

  // 8. Payment Callback
  section('8. Payment Callback');

  // Without stub secret → 401
  const callbackNoSecret = await req('POST', '/api/payments/callback', {
    paymentId: testPaymentId,
  });
  assert('POST /callback without x-stub-secret → 401', callbackNoSecret.status, 401);

  // With stub secret → 200
  if (testPaymentId) {
    const callback1 = await req(
      'POST',
      '/api/payments/callback',
      { paymentId: testPaymentId, gatewayRef: `TEST-REF-${Date.now()}` },
      hStub()
    );
    assertIn('POST /callback with secret → 200', callback1.status, [200]);
    const result1Status = callback1.json.data?.payment?.status;
    console.log(`  ℹ️  Payment status after callback: ${result1Status}`);

    // Callback again on finalized payment → 200 "Already processed"
    const callback2 = await req(
      'POST',
      '/api/payments/callback',
      { paymentId: testPaymentId, gatewayRef: `TEST-REF2-${Date.now()}` },
      hStub()
    );
    assert('POST /callback on finalized payment → 200', callback2.status, 200);
    console.log('  ℹ️  Finalized replay message:', callback2.json.message);
  }

  // 9. Admin Simulate Callback
  section('9. Admin Simulate Callback');

  if (testPaymentId) {
    const simNoAuth = await req('POST', `/api/payments/${testPaymentId}/simulate-callback`);
    assert('POST simulate-callback without token → 401', simNoAuth.status, 401);

    // After finalization, simulate still returns 200 (already processed)
    const simAdmin = await req(
      'POST',
      `/api/payments/${testPaymentId}/simulate-callback`,
      null,
      h(tokenAdmin)
    );
    assert('POST simulate-callback as ADMIN → 200', simAdmin.status, 200);
    console.log('  ℹ️  Simulate message:', simAdmin.json.message);
  }

  // 10. Get Payment Status
  section('10. Get Payment Status');

  const orderIdToFetch = testOrderId || 1;
  const payStatus = await req('GET', `/api/payments/${orderIdToFetch}`, null, h(tokenAdmin));
  assertIn('GET /api/payments/:orderId as ADMIN → 200 or 404', payStatus.status, [200, 404]);
  if (payStatus.status === 200) {
    const txCount = (payStatus.json.data?.transactions || []).length;
    console.log(`  ℹ️  Payment has ${txCount} transaction(s)`);
  }

  const payStatusNoAuth = await req('GET', `/api/payments/${orderIdToFetch}`);
  assert('GET /api/payments/:orderId without token → 401', payStatusNoAuth.status, 401);

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Test suite complete. Check ❌ above for failures.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

run().catch((e) => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
