# BayonHub API Setup

## Database Setup

BayonHub uses PostgreSQL through Prisma. Search suggestions and ranked listing
search require these PostgreSQL extensions:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
```

Fresh databases should apply the Prisma migration chain before running the API:

```bash
npx prisma migrate deploy
npx prisma generate
```

The migration `20260513010000_enable_pg_trgm_extension` installs the required
extensions. On startup, the search router verifies `pg_trgm` and logs a critical
message if the extension is missing.
