# GrabFood Clone

A monolithic GrabFood clone refactored with a Feature-Based Clean Architecture.

## Prerequisites

- Node.js (v18+)
- MySQL (v8+)

## Setup Backend

1. Navigate to the backend directory:
   ```bash
   cd grab-food-monolith
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update the database credentials.
   ```bash
   cp .env.example .env
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## Setup Frontend

1. Navigate to the frontend directory:
   ```bash
   cd client/fe_fegrapfood
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Development Commands
- **Lint**: `npm run lint`
- **Format**: `npm run format` (Format code using Prettier)
- **Type Check (Frontend)**: `npm run build`
