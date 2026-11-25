#!/bin/sh
set -e

echo "[BrewLite API] Syncing Prisma schema to PostgreSQL..."
npx prisma db push --skip-generate

PRODUCT_COUNT=$(node -e 'const { PrismaClient } = require("@prisma/client"); const p = new PrismaClient(); p.product.count().then((c) => { console.log(c); return p.$disconnect(); }).catch((e) => { console.error(e); process.exit(1); });')

if [ "$PRODUCT_COUNT" = "0" ]; then
  echo "[BrewLite API] Database is empty, running initial seed..."
  npx ts-node ./prisma/seed.ts
else
  echo "[BrewLite API] Existing products found ($PRODUCT_COUNT), skipping seed."
fi

echo "[BrewLite API] Starting NestJS server..."
exec node dist/main.js
