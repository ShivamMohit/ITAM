# Quick Start Guide - ITAM SaaS with Stripe

## 🚨 **Current Issue: Network Error**

The error you're seeing is because the frontend is trying to connect to the backend API, but the backend server isn't running. Here's how to fix it:

## 🛠 **Step 1: Start the Backend Server**

Open a new terminal and run:

```bash
cd server
npm install
npm run dev
```

You should see:
```
Connected to MongoDB
Server running on http://localhost:3000
```

## 🛠 **Step 2: Start the Frontend**

Open another terminal and run:

```bash
cd client
npm install
npm run dev
```

You should see:
```
Ready - started server on 0.0.0.0:3001
```

## 🛠 **Step 3: Set Up Environment Variables**

### Backend (.env file in server directory):
```env
MONGODB_URI=mongodb://localhost:27017/itam
JWT_SECRET=your_jwt_secret_here
PORT=3000

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (run npm run setup-stripe to get these)
STRIPE_BASIC_PRICE_ID=price_xxx
STRIPE_PROFESSIONAL_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxx
```

### Frontend (.env.local file in client directory):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## 🛠 **Step 4: Set Up Stripe (Optional for Testing)**

If you want to test the Stripe integration:

1. Create a Stripe account at https://stripe.com
2. Get your test API keys from the Stripe Dashboard
3. Run the setup script:
```bash
cd server
npm run setup-stripe
```

## 🎯 **What's Fixed**

✅ **Network Error Resolution**: The frontend now gracefully handles backend unavailability
✅ **Fallback Data**: Shows demo subscription data when backend is offline
✅ **Better Error Messages**: Clear indication when backend needs to be started
✅ **Demo Mode**: You can test the UI even without the backend running

## 🧪 **Testing the Frontend**

1. **Without Backend**: Visit `http://localhost:3001/subscription` - you'll see demo data
2. **With Backend**: Start the server first, then visit the same URL for real data

## 📱 **Available Pages**

- **Pricing Plans**: `http://localhost:3001/subscription`
- **Subscription Dashboard**: `http://localhost:3001/subscription/dashboard`
- **Success Page**: `http://localhost:3001/subscription/success`
- **Cancel Page**: `http://localhost:3001/subscription/cancel`

## 🔧 **Troubleshooting**

### If you still see network errors:

1. **Check if backend is running**:
   ```bash
   curl http://localhost:3000/api/subscription/plans
   ```

2. **Check CORS settings** in `server/index.js`

3. **Verify environment variables** are set correctly

4. **Check MongoDB connection** - make sure MongoDB is running

### If frontend won't start:

1. **Clear Next.js cache**:
   ```bash
   cd client
   rm -rf .next
   npm run dev
   ```

2. **Reinstall dependencies**:
   ```bash
   cd client
   rm -rf node_modules package-lock.json
   npm install
   ```

## 🎉 **Success Indicators**

✅ Backend shows "Connected to MongoDB" and "Server running on http://localhost:3000"
✅ Frontend shows "Ready - started server on 0.0.0.0:3001"
✅ No network errors in browser console
✅ Subscription pages load with data (demo or real)

## 🚀 **Next Steps**

1. **Test the UI**: Navigate through all subscription pages
2. **Set up Stripe**: Add your Stripe keys for payment testing
3. **Customize**: Modify plans, features, and styling
4. **Deploy**: Set up production environment

The frontend is now resilient to backend issues and will work in demo mode! 🎉
