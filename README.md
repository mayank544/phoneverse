# ZamGlow ✨ Earrings Store Demo

Features:
- Earrings-focused storefront branded as **ZamGlow ✨**.
- Admin is not exposed in store navbar.
- Admin login is handled from sign-in using:
  - Username: `admin username`
  - Password: `admin12345678`
- My Orders with per-product tracking and cancellation requests.
- Cart quantity +/- and delete controls.
- Delivery rule: `₹40` below `₹500`, free above/equal `₹500`.
- Tax fixed to `₹0`.
- Stock label rules:
  - `In Stock` when stock > 10
  - `Only X left` when stock <= 10
- Stock auto-updates after successful order placement.
- Admin can:
  - Manage unlimited products
  - Update per-item order status
  - Accept/decline cancellation with reason
  - Delete cancelled product items from order list
  - Filter and view status summaries

## Run
```bash
python3 -m http.server 4173
```
Open:
- Store: `http://localhost:4173/index.html`
- Product detail: `http://localhost:4173/product-detail.html?id=p1`
- Admin: `http://localhost:4173/admin.html`
