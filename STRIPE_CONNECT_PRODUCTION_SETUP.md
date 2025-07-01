# Stripe Connect Production Setup Guide

This guide walks through setting up Stripe Connect for production deployment of KerbDrop.

## 1. Stripe Dashboard Setup

### Create Stripe Connect Application

1. **Log into Stripe Dashboard**
   - Go to [dashboard.stripe.com](https://dashboard.stripe.com)
   - Switch to your production account

2. **Enable Connect**
   - Navigate to "Connect" in the left sidebar
   - Click "Get started" if not already enabled

3. **Configure Connect Settings**

   ```
   Application Name: KerbDrop
   Application Type: Platform or marketplace
   Industry: E-commerce
   ```

4. **Branding Setup**
   - Upload your logo (512x512px recommended)
   - Set brand colors
   - Add business description

### Configure Application Settings

1. **Platform Settings**

   ```
   Platform URL: https://kerbdrop.com
   Privacy Policy: https://kerbdrop.com/privacy
   Terms of Service: https://kerbdrop.com/terms
   Support Email: support@kerbdrop.com
   ```

2. **Redirect URIs**

   ```
   https://kerbdrop.com/seller/onboarding
   https://kerbdrop.com/auth/stripe/callback
   ```

3. **Webhook Endpoints**

   ```
   Production: https://api.kerbdrop.com/api/payments/webhooks/stripe
   ```

   **Events to Listen For:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `account.application.deauthorized`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`

## 2. Environment Configuration

### Production Environment Variables

```env
# Stripe Connect Configuration
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_CONNECT_CLIENT_ID=ca_your_connect_client_id_here

# Application Fee Configuration
STRIPE_APPLICATION_FEE_PERCENT=0.029    # 2.9%
STRIPE_APPLICATION_FEE_FIXED=30         # 30 cents

# Security
NODE_ENV=production
API_BASE_URL=https://api.kerbdrop.com
CLIENT_URL=https://kerbdrop.com

# Database (Production)
DATABASE_URL=postgresql://user:password@prod-host:5432/kerbdrop_prod
REDIS_URL=redis://redis-host:6379/0
```

### Security Considerations

1. **API Key Management**
   - Store keys in secure environment variable service
   - Rotate keys regularly
   - Never commit keys to version control
   - Use different keys for staging/production

2. **Webhook Security**
   - Always verify webhook signatures
   - Use HTTPS for all webhook endpoints
   - Implement replay attack protection

## 3. Database Production Setup

### Migration Scripts

```sql
-- Production database initialization
-- Run these migrations in order

-- 1. Create production tables
\i database/migrations/001_create_payment_methods.sql
\i database/migrations/002_create_orders.sql
\i database/migrations/003_create_subscriptions.sql
\i database/migrations/004_create_referrals.sql
\i database/migrations/005_create_connect_accounts.sql

-- 2. Create indexes for performance
\i database/migrations/006_create_indexes.sql

-- 3. Set up triggers and constraints
\i database/migrations/007_create_triggers.sql
```

### Backup Strategy

```bash
# Daily automated backups
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "backups/kerbdrop_${DATE}.sql"

# Keep 30 days of backups
find backups/ -name "kerbdrop_*.sql" -mtime +30 -delete
```

## 4. Deployment Configuration

### Docker Configuration

```dockerfile
# Dockerfile.production
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Set production environment
ENV NODE_ENV=production

EXPOSE 8000

CMD ["npm", "start"]
```

### Docker Compose (Production)

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.production
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: kerbdrop_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

## 5. SSL and Security Setup

### Nginx Configuration

```nginx
# nginx.conf
upstream app {
    server app:8000;
}

server {
    listen 80;
    server_name api.kerbdrop.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.kerbdrop.com;

    ssl_certificate /etc/ssl/certs/kerbdrop.crt;
    ssl_certificate_key /etc/ssl/certs/kerbdrop.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location /api/payments/webhooks/stripe {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeout for webhook processing
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
    }

    location /api/ {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 6. Monitoring Setup

### Health Checks

```javascript
// health-check.js
const express = require("express");
const router = express.Router();

router.get("/health", async (req, res) => {
  try {
    // Check database connection
    await db.raw("SELECT 1");

    // Check Stripe connectivity
    await stripe.balance.retrieve();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        stripe: "connected",
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
```

### Logging Configuration

```javascript
// logger.js
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "kerbdrop-api" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

module.exports = logger;
```

## 7. Performance Optimization

### Database Optimization

```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders(created_at);
CREATE INDEX CONCURRENTLY idx_payment_methods_user_default ON payment_methods(user_id, is_default) WHERE is_default = true;
CREATE INDEX CONCURRENTLY idx_subscriptions_active ON subscriptions(user_id, status) WHERE status = 'active';

-- Analyze tables for query optimization
ANALYZE orders;
ANALYZE payment_methods;
ANALYZE subscriptions;
```

### Redis Caching

```javascript
// cache.js
const redis = require("redis");
const client = redis.createClient(process.env.REDIS_URL);

const cache = {
  async get(key) {
    try {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  },

  async set(key, data, ttl = 3600) {
    try {
      await client.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error("Cache set error:", error);
    }
  },

  async del(key) {
    try {
      await client.del(key);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  },
};

module.exports = cache;
```

## 8. Error Handling and Alerting

### Error Tracking

```javascript
// error-handler.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

const errorHandler = (err, req, res, next) => {
  // Log error
  console.error("Error:", err);

  // Send to Sentry
  Sentry.captureException(err);

  // Don't expose internal errors in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(err.status || 500).json({
    error: message,
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;
```

### Alerting Rules

```yaml
# alerting-rules.yml
groups:
  - name: kerbdrop-api
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected

      - alert: PaymentFailureSpike
        expr: rate(stripe_payment_failures_total[5m]) > 0.2
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: Payment failure rate spike

      - alert: DatabaseConnectionIssue
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: Database connection lost
```

## 9. Testing in Production

### Smoke Tests

```bash
#!/bin/bash
# smoke-test.sh

BASE_URL="https://api.kerbdrop.com"

echo "Running production smoke tests..."

# Health check
curl -f "$BASE_URL/health" || exit 1

# Create test payment intent
curl -f -X POST "$BASE_URL/api/payments/create-payment-intent" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "usd"}' || exit 1

echo "Smoke tests passed!"
```

### Load Testing

```javascript
// load-test.js (using k6)
import http from "k6/http";
import { check } from "k6";

export let options = {
  stages: [
    { duration: "2m", target: 100 },
    { duration: "5m", target: 100 },
    { duration: "2m", target: 0 },
  ],
};

export default function () {
  let response = http.post(
    "https://api.kerbdrop.com/api/payments/create-payment-intent",
    JSON.stringify({
      amount: 2999,
      currency: "usd",
      reference: `load_test_${Date.now()}`,
    }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });
}
```

## 10. Go-Live Checklist

### Pre-Launch

- [ ] All Stripe webhook endpoints configured
- [ ] SSL certificates installed and validated
- [ ] Database migrations completed
- [ ] Environment variables set
- [ ] Monitoring and alerting configured
- [ ] Backup procedures tested
- [ ] Load testing completed
- [ ] Security audit completed

### Launch Day

- [ ] Switch DNS to production servers
- [ ] Monitor error rates and performance
- [ ] Test critical payment flows
- [ ] Verify webhook delivery
- [ ] Check database connections
- [ ] Monitor system resources

### Post-Launch

- [ ] 24-hour monitoring period
- [ ] Performance baseline establishment
- [ ] User feedback collection
- [ ] Issue tracking and resolution
- [ ] Documentation updates

## 11. Ongoing Maintenance

### Daily Tasks

- Monitor payment success rates
- Check system health metrics
- Review error logs
- Verify webhook deliveries

### Weekly Tasks

- Database performance review
- Security patch updates
- Backup verification
- Performance optimization

### Monthly Tasks

- Stripe API updates
- Security audit
- Capacity planning
- User experience review

---

This production setup guide ensures a secure, scalable, and maintainable Stripe Connect implementation for KerbDrop's marketplace platform.
