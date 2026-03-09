const KEYS = { products: "pv_products", orders: "pv_orders" };
const ADMIN = { username: "admin username", password: "admin12345678", session: "pv_admin_session" };
const ITEM_STATUS = ["order", "shipped", "out_for_delivery", "delivered", "cancelled"];

const defaultProducts = [
  {
    id: "p1",
    name: "ZamGlow Pearl Drop Earrings",
    desc: "Elegant pearl drop earrings for party and daily wear.",
    longDesc: "Premium anti-tarnish pearl drop earrings with lightweight comfort and elegant shine.",
    brand: "ZamGlow ✨",
    category: "Earrings",
    highlights: ["Anti-tarnish", "Lightweight", "Premium finish"],
    price: 499,
    stock: 40,
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "p2",
    name: "ZamGlow Hoop Earrings",
    desc: "Trendy hoops with glossy finish.",
    longDesc: "Classic hoop design with smooth lock and skin-safe polish for all-day use.",
    brand: "ZamGlow ✨",
    category: "Earrings",
    highlights: ["Skin safe", "Glossy finish", "Daily wear"],
    price: 299,
    stock: 55,
    image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=80",
  },
];

const $ = (s) => document.querySelector(s);
function getJSON(key, fallback) { try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; } catch { return fallback; } }
function setJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

let products = getJSON(KEYS.products, defaultProducts);
let orders = getJSON(KEYS.orders, []);
if (!localStorage.getItem(KEYS.products)) setJSON(KEYS.products, defaultProducts);

function normalizeOrders() {
  let changed = false;
  orders.forEach((o) => {
    o.items.forEach((i) => {
      if (!i.status) { i.status = "order"; changed = true; }
      if (!i.cancelRequest) { i.cancelRequest = "none"; changed = true; }
      if (!i.cancelMessage) { i.cancelMessage = ""; changed = true; }
    });
  });
  if (changed) setJSON(KEYS.orders, orders);
}
normalizeOrders();

function isLoggedIn() { return localStorage.getItem(ADMIN.session) === "1"; }
function showPanel() {
  $("#adminLogin").classList.add("hidden");
  $("#adminPanel").classList.remove("hidden");
  $("#adminSignOut").classList.remove("hidden");
  renderProducts();
  renderOrderItems();
}
function showLogin() {
  $("#adminLogin").classList.remove("hidden");
  $("#adminPanel").classList.add("hidden");
  $("#adminSignOut").classList.add("hidden");
}

$("#adminLoginForm").onsubmit = (e) => {
  e.preventDefault();
  const u = $("#adminEmail").value.trim().toLowerCase();
  const p = $("#adminPassword").value;
  if (u === ADMIN.username && p === ADMIN.password) {
    localStorage.setItem(ADMIN.session, "1");
    $("#adminMsg").textContent = "";
    showPanel();
  } else $("#adminMsg").textContent = "Invalid admin credentials.";
};
$("#adminSignOut").onclick = () => { localStorage.removeItem(ADMIN.session); showLogin(); };

function renderProducts() {
  const wrap = $("#productsAdminList");
  wrap.innerHTML = "";
  products.forEach((p) => {
    const row = document.createElement("div");
    row.className = "card";
    row.style.marginBottom = "0.6rem";
    row.innerHTML = `
      <div class="product-admin-row">
        <img src="${p.image}" alt="${p.name}" class="thumb" />
        <div>
          <input data-field="name" data-id="${p.id}" value="${p.name}" />
          <textarea data-field="desc" data-id="${p.id}">${p.desc}</textarea>
          <textarea data-field="longDesc" data-id="${p.id}">${p.longDesc || ""}</textarea>
          <input data-field="brand" data-id="${p.id}" value="${p.brand || ""}" />
          <input data-field="category" data-id="${p.id}" value="${p.category || ""}" />
          <input data-field="highlights" data-id="${p.id}" value="${(p.highlights || []).join(", ")}" />
          <div class="inline-inputs">
            <label>₹ <input type="number" min="1" data-field="price" data-id="${p.id}" value="${p.price}" /></label>
            <label>Stock <input type="number" min="0" data-field="stock" data-id="${p.id}" value="${p.stock}" /></label>
          </div>
          <div class="inline-inputs">
            <button class="btn btn-light" data-save-id="${p.id}">Save Changes</button>
            <button class="btn btn-light" data-delete-id="${p.id}">Delete Product</button>
          </div>
        </div>
      </div>`;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll("button[data-save-id]").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.saveId;
      const product = products.find((x) => x.id === id);
      if (!product) return;
      wrap.querySelectorAll(`[data-id='${id}']`).forEach((f) => {
        const key = f.dataset.field;
        if (["price", "stock"].includes(key)) product[key] = Number(f.value);
        else if (key === "highlights") product.highlights = f.value.split(",").map((v) => v.trim()).filter(Boolean);
        else product[key] = f.value.trim();
      });
      setJSON(KEYS.products, products);
      renderProducts();
    };
  });
  wrap.querySelectorAll("button[data-delete-id]").forEach((btn) => {
    btn.onclick = () => {
      products = products.filter((p) => p.id !== btn.dataset.deleteId);
      setJSON(KEYS.products, products);
      renderProducts();
    };
  });
}

function renderSummary(rows) {
  const counts = { order: 0, shipped: 0, out_for_delivery: 0, delivered: 0, cancelled: 0 };
  rows.forEach(({ item }) => counts[item.status] = (counts[item.status] || 0) + 1);
  $("#statusSummary").innerHTML = Object.entries(counts)
    .map(([k, v]) => `<div class='summary-chip'><strong>${v}</strong><span>${k.replaceAll("_", " ")}</span></div>`)
    .join("");
}

function updateItemStatus(orderId, productId, status) {
  const order = orders.find((o) => o.id === orderId);
  const item = order?.items.find((i) => i.productId === productId);
  if (!item) return;
  item.status = status;
  if (status === "cancelled") {
    item.cancelRequest = "accepted";
    item.cancelMessage = "Cancelled by admin.";
  }
  setJSON(KEYS.orders, orders);
  renderOrderItems();
}

function resolveCancel(orderId, productId, action) {
  const order = orders.find((o) => o.id === orderId);
  const item = order?.items.find((i) => i.productId === productId);
  if (!item) return;
  if (action === "accept") {
    item.cancelRequest = "accepted";
    item.cancelMessage = "Cancellation approved.";
    item.status = "cancelled";
  } else {
    const reason = prompt("Write reason for decline:", "Product already shipped");
    if (!reason) return;
    item.cancelRequest = "declined";
    item.cancelMessage = reason;
  }
  setJSON(KEYS.orders, orders);
  renderOrderItems();
}

function deleteCancelledItem(orderId, productId) {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;
  const before = order.items.length;
  order.items = order.items.filter((i) => !(i.productId === productId && i.status === "cancelled"));
  if (!order.items.length) orders = orders.filter((o) => o.id !== orderId);
  if (before !== order.items.length || !order.items.length) {
    setJSON(KEYS.orders, orders);
    renderOrderItems();
  }
}

function renderOrderItems() {
  const list = $("#orderItemList");
  list.innerHTML = "";
  const q = $("#orderSearch").value.toLowerCase().trim();
  const filter = $("#statusFilter").value;
  const rows = [];
  orders.forEach((order) => order.items.forEach((item) => rows.push({ order, item })));
  renderSummary(rows);

  rows.reverse().filter(({ order, item }) => {
    const t = `${order.id} ${order.userName} ${order.userEmail} ${item.name}`.toLowerCase();
    return (!q || t.includes(q)) && (filter === "all" || item.status === filter);
  }).forEach(({ order, item }) => {
    const card = document.createElement("div");
    card.className = "card admin-order-item";
    card.innerHTML = `
      <p><strong>Order:</strong> ${order.id}</p>
      <p><strong>User:</strong> ${order.userName} (${order.userEmail})</p>
      <p><strong>Product:</strong> ${item.name} x ${item.qty}</p>
      <p><strong>Status:</strong> <span class='badge'>${item.status.replaceAll("_", " ")}</span></p>
      <label>Update Status</label>
      <select class='item-status'>${ITEM_STATUS.map((s) => `<option value='${s}' ${item.status === s ? "selected" : ""}>${s.replaceAll("_", " ")}</option>`).join("")}</select>
      <div class='cancel-admin-box ${item.cancelRequest === "pending" ? "pending" : ""}'>
        <p><strong>Cancel Request:</strong> ${item.cancelRequest}</p>
        <p>${item.cancelMessage || "No note"}</p>
        <div class='inline-inputs'>
          <button class='btn btn-light accept-cancel' ${item.cancelRequest !== "pending" ? "disabled" : ""}>Accept</button>
          <button class='btn btn-light decline-cancel' ${item.cancelRequest !== "pending" ? "disabled" : ""}>Decline</button>
          <button class='btn btn-light delete-cancelled' ${item.status !== "cancelled" ? "disabled" : ""}>Delete Cancelled</button>
        </div>
      </div>`;
    card.querySelector(".item-status").onchange = (e) => updateItemStatus(order.id, item.productId, e.target.value);
    card.querySelector(".accept-cancel").onclick = () => resolveCancel(order.id, item.productId, "accept");
    card.querySelector(".decline-cancel").onclick = () => resolveCancel(order.id, item.productId, "decline");
    card.querySelector(".delete-cancelled").onclick = () => deleteCancelledItem(order.id, item.productId);
    list.appendChild(card);
  });

  if (!list.innerHTML) list.innerHTML = "<p>No order items found.</p>";
}

$("#orderSearch").oninput = renderOrderItems;
$("#statusFilter").onchange = renderOrderItems;

$("#productForm").onsubmit = async (e) => {
  e.preventDefault();
  const file = $("#pImage");
  let image = "https://via.placeholder.com/500x300?text=Earrings";
  if (file.files && file.files[0]) {
    image = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(file.files[0]);
    });
  }

  products.push({
    id: `p${Date.now()}`,
    name: $("#pName").value.trim(),
    desc: $("#pDesc").value.trim(),
    longDesc: $("#pLongDesc").value.trim(),
    brand: $("#pBrand").value.trim() || "ZamGlow ✨",
    category: $("#pCategory").value.trim() || "Earrings",
    highlights: $("#pHighlights").value.split(",").map((v) => v.trim()).filter(Boolean),
    price: Number($("#pPrice").value),
    stock: Number($("#pStock").value),
    image,
  });
  setJSON(KEYS.products, products);
  e.target.reset();
  renderProducts();
};

$("#clearOrders").onclick = () => { orders = []; setJSON(KEYS.orders, orders); renderOrderItems(); };
$("#resetDemoData").onclick = () => { products = [...defaultProducts]; setJSON(KEYS.products, products); renderProducts(); };

window.addEventListener("storage", () => {
  products = getJSON(KEYS.products, []);
  orders = getJSON(KEYS.orders, []);
  normalizeOrders();
  if (isLoggedIn()) { renderProducts(); renderOrderItems(); }
});

setInterval(() => {
  const lp = getJSON(KEYS.products, []);
  const lo = getJSON(KEYS.orders, []);
  if (JSON.stringify(lp) !== JSON.stringify(products)) { products = lp; if (isLoggedIn()) renderProducts(); }
  if (JSON.stringify(lo) !== JSON.stringify(orders)) { orders = lo; normalizeOrders(); if (isLoggedIn()) renderOrderItems(); }
}, 1500);

if (isLoggedIn()) showPanel();
else showLogin();
