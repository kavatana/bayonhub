#!/bin/sh
npx prisma migrate deploy
# Seeds must never run on production startup.
# To seed manually: NODE_ENV=development npx prisma db seed
node dist/server.js
