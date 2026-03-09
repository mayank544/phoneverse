# ZamGlow ✨ Earrings Store Demo

Features:
- Mobile-friendly ZamGlow ✨ storefront.
- Customer sign-up/sign-in, cart, checkout, My Orders.
- Admin redirect from store sign-in using username/password (same credentials on admin page).
- My Orders shows tracking ID, contact, address, expected delivery and status timestamps.
- Per-item unique tracking IDs.
- Cart quantity +/- and delete.
- Delivery rule: `₹40` below `₹500`, else free. Tax always `₹0`.
- Stock labels: `In Stock` (>10), `Only X left` (<=10).
- Stock auto-reduces after order.
- Admin panel has View Detail per order item with full customer/order information, status updates, cancellation actions, and delete cancelled option.

## Run
```bash
python3 -m http.server 4173
```
Open:
- Store: `http://localhost:4173/index.html`
- Product detail: `http://localhost:4173/product-detail.html?id=p1`
- Admin: `http://localhost:4173/admin.html`
