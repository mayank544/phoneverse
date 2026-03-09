# ZamGlow ✨ Earrings Store Demo

Features:
- Mobile-friendly ZamGlow ✨ storefront.
- Customer sign-up/sign-in, cart, checkout, My Orders.
- Per-product tracking with status timeline timestamps.
- Expected delivery date shown (+7 days from order date).
- Per-item unique tracking IDs.
- Cart quantity +/- and delete.
- Delivery rule: `₹40` below `₹500`, else free. Tax always `₹0`.
- Stock labels: `In Stock` (>10), `Only X left` (<=10).
- Stock auto-reduces after order.
- Integrated admin panel with product CRUD, order status update, cancellation approval/decline, and delete cancelled items.

## Run
```bash
python3 -m http.server 4173
```
Open:
- Store: `http://localhost:4173/index.html`
- Product detail: `http://localhost:4173/product-detail.html?id=p1`
- Admin: `http://localhost:4173/admin.html`
