# Devi Videos — ready to deploy

## Included
- Responsive membership landing page
- Monthly ₹99 plan
- Premium ₹249 / 3 months plan
- Razorpay server-side order creation
- Razorpay payment signature verification
- Error handling that prevents `undefined` payment messages
- Render `/health` endpoint

## Render settings
Build Command: `npm install`
Start Command: `npm start`

Environment Variables:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

If those variables already exist in Render, EDIT their values. Do not create duplicate keys.

After changing environment variables, redeploy/restart.

## Test
Open `/health` on your Render domain. It should show `razorpayConfigured: true`.

Use Razorpay Test Mode first.

## Security note
The secret key is server-only. The browser receives only the key ID.

This starter records successful membership status in the browser for the demo. For a production paid-video service, add user authentication, a persistent database, protected video delivery, and Razorpay webhooks so paid access is maintained across devices and payment events.
