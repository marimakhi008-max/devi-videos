# Devi Videos — Membership Website

## Run locally
1. Install Node.js 18+.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Add your Razorpay **test** keys to `.env`.
5. Run `npm start`.
6. Open `http://localhost:3000`.

## Included
- Tamil/English membership landing page
- Monthly / 3-month / yearly plans
- Email-based demo login
- Razorpay order creation and server-side signature verification
- SQLite membership database
- Member dashboard and expiry date

## Production checklist
- Use Razorpay live keys only after completing merchant/KYC setup.
- Add HTTPS, a real email/OTP authentication system, CSRF/rate-limit protections, backups and secure session storage.
- Store videos behind authenticated server/CDN access; do not expose private video URLs in public HTML.
- Configure Razorpay webhooks and reconcile payment/refund/renewal events.
- Add your business contact, refund policy, privacy policy, terms and age/content policy appropriate to your content.
