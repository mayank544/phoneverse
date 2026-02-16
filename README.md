# PhoneVerse Dropshipping Demo

Updated Amazon-style front-end demo with:
- Main store page with search, view detail (separate page), add to cart, buy now.
- My Orders page with each ordered product shown separately.
- "Track Package" button on each ordered product card.
- "Request Cancellation" on each ordered product with admin approval flow.
- Cart quantity increase/decrease, delete item, and dynamic pricing.
- Delivery charge rule: `₹40` if subtotal `< ₹500`, otherwise free.
- Tax always `₹0`.
- Admin page with per-product order status updates and cancellation accept/decline with reason.

## Run
```bash
python3 -m http.server 4173
```
Open:
- Store: `http://localhost:4173/index.html`
- Product detail: `http://localhost:4173/product-detail.html?id=p1`
- Admin: `http://localhost:4173/admin.html`

## Admin Login
- Email: `mayank75033@gmail.com`
- Password: `m7503315833`
