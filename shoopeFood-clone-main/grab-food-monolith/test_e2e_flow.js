/**
 * test_e2e_flow.js
 * Comprehensive end-to-end API test simulation for core business flows:
 * Admin, Merchant, Customer, Driver, and Payment.
 */

const BASE = 'http://localhost:3000';
const STUB_SECRET = process.env.PAYMENT_STUB_SECRET || 'stub-secret-dev';

// Tokens and state
let tokens = { ADMIN: null, MERCHANT: null, CUSTOMER: null, DRIVER: null };
let state = {
  restaurantId: null,
  categoryId: null,
  foodId: null,
  orderId: null,
  paymentId: null,
};

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

function assert(name, got, expected, json = {}) {
  if (got === expected) {
    pass(name);
  } else {
    fail(name, got, expected);
    console.log('Response:', json);
    process.exit(1);
  }
}
function assertIn(name, got, expectedArr, json = {}) {
  if (expectedArr.includes(got)) {
    pass(name);
  } else {
    fail(name, got, `one of [${expectedArr}]`);
    console.log('Response:', json);
    process.exit(1);
  }
}

async function run() {
  console.log('🚀 E2E API Flow Simulation Starting\n');

  // 1. Auth Login
  section('1. Authentication');
  const roles = [
    { role: 'ADMIN', phone: '0900000005', pass: '123456' },
    { role: 'MERCHANT', phone: '0900000003', pass: '123456' },
    { role: 'CUSTOMER', phone: '0900000001', pass: '123456' },
    { role: 'DRIVER', phone: '0900000004', pass: '123456' },
  ];

  for (const r of roles) {
    const login = await req('POST', '/api/auth/login', {
      phone: r.phone,
      password: r.pass,
      role: r.role,
    });
    assert(`${r.role} login -> 200`, login.status, 200);
    tokens[r.role] = login.json.data.token;
  }

  // 2. Merchant/Admin Flow (Create Restaurant & Menu)
  section('2. Restaurant & Menu Creation');
  const rName = `E2E Restaurant ${Date.now()}`;
  const rCreate = await req(
    'POST',
    '/api/restaurants',
    {
      ownerId: 3, // Merchant ID from seeds
      name: rName,
      address: '123 Test St',
      latitude: 10.1,
      longitude: 106.1,
      openingTime: '07:00:00',
      closingTime: '22:00:00',
      isOpen: true,
    },
    h(tokens.MERCHANT)
  );
  assert('Create Restaurant -> 201', rCreate.status, 201);
  state.restaurantId = rCreate.json.data.id;

  const rApprove = await req(
    'POST',
    `/api/restaurants/${state.restaurantId}/approve`,
    {
      status: 'APPROVED',
    },
    h(tokens.ADMIN)
  );
  assert('Approve Restaurant -> 200', rApprove.status, 200);

  const catCreate = await req(
    'POST',
    '/api/categories',
    {
      restaurantId: state.restaurantId,
      name: 'E2E Category',
    },
    h(tokens.MERCHANT)
  );
  assert('Create Category -> 201', catCreate.status, 201);
  state.categoryId = catCreate.json.data.id;

  const foodCreate = await req(
    'POST',
    '/api/foods',
    {
      categoryId: state.categoryId,
      name: 'E2E Food',
      price: 50000,
      isAvailable: true,
      defaultQuantity: 100,
      currentQuantity: 100,
    },
    h(tokens.MERCHANT)
  );
  assert('Create Food -> 201', foodCreate.status, 201);
  state.foodId = foodCreate.json.data.id;

  // 3. Customer Flow (Create Order)
  section('3. Customer Ordering');
  const orderCreate = await req(
    'POST',
    '/api/orders',
    {
      restaurantId: state.restaurantId,
      customerId: 1, // CUSTOMER role ID
      receiverName: 'Test Customer',
      receiverPhone: '0900000001',
      receiverAddress: '456 Delivery St',
      receiverLat: 10.2,
      receiverLng: 106.2,
      distanceKm: 2.5,
      items: [{ foodId: state.foodId, quantity: 2, price: 50000 }], // Total: 100000
      paymentMethod: 'E_WALLET',
    },
    h(tokens.CUSTOMER)
  );
  assert('Create Order -> 201', orderCreate.status, 201, orderCreate.json);
  state.orderId = orderCreate.json.data?.id;

  // Verify order status
  const orderDetails = await req('GET', `/api/orders/${state.orderId}`, null, h(tokens.CUSTOMER));
  assert('Customer Views Order -> 200', orderDetails.status, 200);
  assert(
    'Order is PENDING',
    orderDetails.json.data.status || orderDetails.json.data.statusCode,
    'PENDING'
  );

  // 4. Payment Flow
  section('4. Payment Setup');
  const payCreate = await req(
    'POST',
    '/api/payments/create',
    {
      orderId: state.orderId,
      idempotencyKey: `E2E-PAY-${Date.now()}`,
      paymentMethod: 'E_WALLET',
    },
    h(tokens.CUSTOMER)
  );
  assertIn('Create Payment -> 200 or 201', payCreate.status, [200, 201]);
  state.paymentId = payCreate.json.data.id;

  const callback = await req(
    'POST',
    '/api/payments/callback',
    {
      paymentId: state.paymentId,
      gatewayRef: `GW-${Date.now()}`,
    },
    hStub()
  );
  assert('Payment Callback -> 200', callback.status, 200);

  // 5. Merchant confirms order
  section('5. Order Processing');
  const oBeforeConfirm = await req('GET', `/api/orders/${state.orderId}`, null, h(tokens.MERCHANT));
  const oVersionBeforeConfirm = oBeforeConfirm.json.data.version || 0;

  const oConfirm = await req(
    'PUT',
    `/api/orders/${state.orderId}/status`,
    {
      statusCode: 'CONFIRMED',
      expectedVersion: oVersionBeforeConfirm,
    },
    h(tokens.MERCHANT)
  );
  assert('Merchant confirms order -> 200', oConfirm.status, 200);

  // 6. Driver Flow
  section('6. Driver Delivery');
  const dAssign = await req(
    'PUT',
    `/api/orders/${state.orderId}`,
    {
      driverId: 4, // Driver ID from seeds
    },
    h(tokens.ADMIN)
  );
  assert('Admin assigns driver -> 200', dAssign.status, 200);

  const oBeforePick = await req('GET', `/api/orders/${state.orderId}`, null, h(tokens.DRIVER));
  const oPick = await req(
    'PUT',
    `/api/orders/${state.orderId}/status`,
    {
      statusCode: 'PICKING_UP',
      expectedVersion: oBeforePick.json.data.version || 0,
    },
    h(tokens.DRIVER)
  );
  assert('Driver picking up -> 200', oPick.status, 200, oPick.json);

  const oBeforeDeliver = await req('GET', `/api/orders/${state.orderId}`, null, h(tokens.DRIVER));
  const oDelivering = await req(
    'PUT',
    `/api/orders/${state.orderId}/status`,
    {
      statusCode: 'DELIVERING',
      expectedVersion: oBeforeDeliver.json.data.version || 0,
    },
    h(tokens.DRIVER)
  );
  assert('Driver delivering -> 200', oDelivering.status, 200, oDelivering.json);

  const oBeforeComplete = await req('GET', `/api/orders/${state.orderId}`, null, h(tokens.DRIVER));
  const oComplete = await req(
    'PUT',
    `/api/orders/${state.orderId}/status`,
    {
      statusCode: 'COMPLETED',
      expectedVersion: oBeforeComplete.json.data.version || 0,
    },
    h(tokens.DRIVER)
  );
  assert('Driver completed -> 200', oComplete.status, 200, oComplete.json);

  // Summary
  section('Final Verification');
  const finalOrder = await req('GET', `/api/orders/${state.orderId}`, null, h(tokens.CUSTOMER));
  assert(
    'Final order status is COMPLETED',
    finalOrder.json.data.status || finalOrder.json.data.statusCode,
    'COMPLETED'
  );

  console.log('\n✅ E2E FLOW PASSED SUCCESSFULLY');
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
