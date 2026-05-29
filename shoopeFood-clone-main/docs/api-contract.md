# API Contract

This document standardizes the API format for the GrabFood clone to ensure frontend and backend are perfectly aligned.

## 1. Global Response Structure

### 1.1 Success Response

All successful API calls (200, 201) MUST return this structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50
  } // Only present for paginated responses
}
```

### 1.2 Error Response

All failed API calls (4xx, 5xx) MUST return this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... } // Optional: specific validation errors or field details
  }
}
```

## 2. Standard HTTP Status Codes

- `200 OK`: Request successful.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation errors or invalid payload.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Authenticated but lack permission (e.g., Driver trying to create an order).
- `404 Not Found`: Resource does not exist (e.g., `ORDER_NOT_FOUND`).
- `409 Conflict`: Invalid state transition or duplicate resource (e.g., `INVALID_ORDER_STATUS_TRANSITION`).
- `500 Internal Server Error`: Unhandled server exception.

## 3. Order Endpoints

### 3.1 Create Order

`POST /api/orders`

**Payload:**

```json
{
  "restaurantId": 1,
  "paymentMethod": "CASH", // or "E_WALLET"
  "idempotencyKey": "uuid-v4-string",
  "items": [
    {
      "foodId": 10,
      "quantity": 2
    },
    {
      "foodId": 11,
      "quantity": 1
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 123,
    "status": "PENDING",
    "total": 150000,
    "subtotal": 120000,
    "shippingFee": 30000,
    "paymentStatus": "PENDING",
    "createdAt": "2026-05-29T10:00:00Z"
  }
}
```

### 3.2 Update Order Status

`PUT /api/orders/:id/status`

**Payload:**

```json
{
  "status": "CONFIRMED"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "id": 123,
    "status": "CONFIRMED"
  }
}
```

## 4. Order Status Transition Matrix

To guarantee system consistency, an order can only transition based on this state machine:

| Current Status | Allowed Next Statuses | Actor |
| --- | --- | --- |
| `PENDING` | `CONFIRMED`, `CANCELLED` | Merchant / Customer |
| `CONFIRMED` | `PREPARING`, `CANCELLED` | Merchant |
| `PREPARING` | `DELIVERING`, `CANCELLED` | Merchant |
| `DELIVERING` | `COMPLETED` | Driver |
| `COMPLETED` | None (Terminal) | - |
| `CANCELLED` | None (Terminal) | - |

**Error Handling:**
If an invalid transition is attempted (e.g., `COMPLETED` -> `PENDING`), the system MUST return `409 Conflict`:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ORDER_STATUS_TRANSITION",
    "message": "Cannot change order from COMPLETED to PENDING"
  }
}
```

## 5. Payment Endpoints

### 5.1 Callback from Payment Gateway

`POST /api/payments/callback`

**Payload:**

```json
{
  "paymentId": "pay_123",
  "gatewayRef": "gw_abc987",
  "status": "SUCCESS" // or "FAILED"
}
```

**Behavior:**
- If `SUCCESS`: Payment status becomes `SUCCESS`.
- If `FAILED`: Payment status becomes `FAILED`. (Order might stay `PENDING_PAYMENT` or transition to `CANCELLED` based on business rule).

## 6. Tracking & Socket Endpoints

### 6.1 Get Order Tracking (REST)

`GET /api/orders/:id/tracking`

**Response:**

```json
{
  "success": true,
  "message": "Tracking retrieved",
  "data": {
    "orderId": 123,
    "status": "DELIVERING",
    "driverId": 5,
    "location": {
      "lat": 10.762622,
      "lng": 106.660172
    },
    "estimatedArrivalTime": "2026-05-29T10:45:00Z"
  }
}
```

### 6.2 Socket Events

**Client to Server:**
- `subscribe_order` (payload: `{ "orderId": 123 }`)
- `update_location` (payload: `{ "orderId": 123, "lat": 10.1, "lng": 106.1 }`) - Driver only

**Server to Client:**
- `order_status_updated` (payload: `{ "orderId": 123, "newStatus": "CONFIRMED" }`)
- `driver_location_updated` (payload: `{ "orderId": 123, "lat": 10.1, "lng": 106.1 }`)
