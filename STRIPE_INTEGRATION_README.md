# Stripe Integration for ITAM SaaS

This document explains how to set up and use the Stripe integration for subscription management in your ITAM SaaS application.

## Overview

The Stripe integration provides:
- Subscription management (create, update, cancel)
- Payment processing
- Customer portal access
- Webhook handling for real-time updates
- Usage tracking and limits enforcement

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/itam_saas

# Server Configuration
PORT=5000
JWT_SECRET=your_jwt_secret_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (will be created by setup script)
STRIPE_BASIC_PRICE_ID=price_your_basic_plan_price_id_here
STRIPE_PROFESSIONAL_PRICE_ID=price_your_professional_plan_price_id_here
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_plan_price_id_here
```

### 3. Set Up Stripe Products and Prices

Run the setup script to create products and prices in Stripe:

```bash
npm run setup-stripe
```

This script will:
- Create products for each subscription plan
- Create monthly recurring prices
- Output the price IDs to add to your `.env` file

### 4. Configure Webhooks

1. Go to your Stripe Dashboard
2. Navigate to Developers > Webhooks
3. Add endpoint: `https://your-domain.com/api/webhook/stripe`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook secret to your `.env` file

### 5. Set Up Organizations

Run the organization setup script:

```bash
npm run setup-orgs
```

## Pricing Plans

The system includes four subscription plans:

| Plan | Price | Max Assets | Features |
|------|-------|------------|----------|
| Free | $0 | 10 | Basic scanning |
| Basic | $29/month | 100 | Basic scanning, Advanced analytics |
| Professional | $99/month | 500 | All Basic + API access, Priority support |
| Enterprise | $299/month | 2000 | All Professional + Custom branding |

## API Endpoints

### Public Endpoints

#### GET /api/subscription/plans
Get available pricing plans.

### Protected Endpoints (Require Authentication)

#### GET /api/subscription/details
Get current subscription details.

#### GET /api/subscription/usage
Get usage statistics.

#### POST /api/subscription/checkout
Create a checkout session for subscription.

**Request Body:**
```json
{
  "planName": "basic",
  "successUrl": "https://your-domain.com/success",
  "cancelUrl": "https://your-domain.com/cancel"
}
```

#### POST /api/subscription/change-plan
Change subscription plan.

**Request Body:**
```json
{
  "planName": "professional"
}
```

#### POST /api/subscription/cancel
Cancel subscription.

**Request Body:**
```json
{
  "cancelAtPeriodEnd": true
}
```

#### POST /api/subscription/reactivate
Reactivate a cancelled subscription.

#### GET /api/subscription/portal
Get customer portal URL.

### Webhook Endpoints

#### POST /api/webhook/stripe
Handle Stripe webhook events.

## Frontend Integration

### 1. Install Stripe.js

Add Stripe.js to your frontend:

```html
<script src="https://js.stripe.com/v3/"></script>
```

### 2. Create Checkout Session

```javascript
const createCheckoutSession = async (planName) => {
  try {
    const response = await fetch('/api/subscription/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        planName,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscription/cancel`
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
  }
};
```

### 3. Handle Subscription Management

```javascript
// Get subscription details
const getSubscriptionDetails = async () => {
  const response = await fetch('/api/subscription/details', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Change plan
const changePlan = async (planName) => {
  const response = await fetch('/api/subscription/change-plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ planName })
  });
  return response.json();
};

// Access customer portal
const openCustomerPortal = async () => {
  const response = await fetch('/api/subscription/portal', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (data.success) {
    window.location.href = data.url;
  }
};
```

## Database Schema Updates

The organization model has been updated to include Stripe fields:

```javascript
subscription: {
  // ... existing fields ...
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  stripePriceId: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean
}
```

## Middleware Integration

The subscription limits are automatically enforced through middleware:

- `checkSubscriptionLimits`: Verifies subscription status and enforces asset limits
- `addOrganizationContext`: Adds organization context to requests
- `filterByOrganization`: Filters data by organization

## Testing

### Test Webhook Endpoint

```bash
curl http://localhost:5000/api/webhook/test
```

### Test Subscription Endpoints

1. Create a test organization
2. Use the Stripe test keys
3. Test with Stripe's test card numbers

## Troubleshooting

### Common Issues

1. **Webhook signature verification failed**
   - Check that `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure webhook endpoint is accessible

2. **Price ID not found**
   - Run `npm run setup-stripe` to create prices
   - Verify price IDs in `.env` file

3. **Subscription not updating**
   - Check webhook endpoint configuration
   - Verify webhook events are being received

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=stripe:*
```

## Security Considerations

1. **Webhook Verification**: Always verify webhook signatures
2. **Environment Variables**: Keep Stripe keys secure
3. **HTTPS**: Use HTTPS in production for webhook endpoints
4. **Rate Limiting**: Implement rate limiting for API endpoints

## Production Deployment

1. Switch to Stripe live keys
2. Update webhook endpoints to production URLs
3. Set up monitoring for webhook failures
4. Configure proper error handling and logging

## Support

For issues with:
- **Stripe Integration**: Check Stripe documentation and logs
- **API Endpoints**: Review server logs and API responses
- **Database Issues**: Check MongoDB connection and schema
