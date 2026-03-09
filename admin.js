const KEYS = { products: "pv_products", orders: "pv_orders" };
const ADMIN = { username: "admin username", password: "admin12345678", session: "pv_admin_session" };
const ITEM_STATUS = ["order", "shipped", "out_for_delivery", "delivered", "cancelled"];

const defaultProducts = [
  {
    id: "p1",
    name: "ZamGlow Pearl Drop Earrings",
    desc: "Elegant pearl drop earrings for party and daily wear.",
    longDesc: "Premium anti-tarnish pearl drop earrings.",
    brand: "ZamGlow ✨",
    category: "Earrings",
    highlights: ["Anti-tarnish", "Lightweight"],
    price: 499,
    stock: 40,
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "p2",
    name: "ZamGlow Hoop Earrings",
    desc: "Trendy hoops with glossy finish.",
    longDesc: "Classic hoop design.",
    brand: "ZamGlow ✨",
    category: "Earrings",
    highlights: ["Skin safe", "Daily wear"],
    price: 299,
    stock: 55,
    image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=80",
  },
];

const $ = (s) => document.querySelector(s);
const getJSON = (k, f) => {
  try {
    const d = localStorage.getItem(k);
    return d ? JSON.parse(d) : f;
  } catch {
    return f;
  }
};
const setJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

let products = getJSON(KEYS.products, defaultProducts);
let orders = getJSON(KEYS.orders, []);
if (!localStorage.getItem(KEYS.products)) setJSON(KEYS.products, defaultProducts);

function normalize() {
  let changed = false;
  orders.forEach((o) =>
    o.items.forEach((i) => {
      if (!i.itemId) i.itemId = `ITM${Date.now()}${Math.random().toString(36).slice(2, 6)}`, (changed = true);
      if (!i.trackingId) i.trackingId = `ZGTRK${Date.now()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`, (changed = true);
      if (!i.status) i.status = "order", (changed = true);
      if (!i.cancelRequest) i.cancelRequest = "none", (changed = true);
      if (!i.cancelMessage) i.cancelMessage = "", (changed = true);
      if (!i.statusHistory) i.statusHistory = { order: o.createdAt || new Date().toISOString() }, (changed = true);
    })
  );
  if (changed) setJSON(KEYS.orders, orders);
}
normalize();

const isLoggedIn = () => localStorage.getItem(ADMIN.session) === "1";
function showPanel() {
  $("#adminLogin").classList.add("hidden");
  $("#adminPanel").classList.remove("hidden");
  $("#adminSignOut").classList.remove("hidden");
  renderProducts();
  renderItems();
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
  } else {
    $("#adminMsg").textContent = "Invalid admin credentials.";
  }
};
$("#adminSignOut").onclick = () => {
  localStorage.removeItem(ADMIN.session);
  showLogin();
};

function renderProducts() {
  const w = $("#productsAdminList");
  w.innerHTML = "";
  products.forEach((p) => {
    const r = document.createElement("div");
    r.className = "card";
    r.style.marginBottom = "0.6rem";
    r.innerHTML = `<div class='product-admin-row'><img src='${p.image}' class='thumb'/><div><input data-field='name' data-id='${p.id}' value='${p.name}'/><textarea data-field='desc' data-id='${p.id}'>${p.desc}</textarea><textarea data-field='longDesc' data-id='${p.id}'>${p.longDesc || ""}</textarea><input data-field='brand' data-id='${p.id}' value='${p.brand || ""}'/><input data-field='category' data-id='${p.id}' value='${p.category || ""}'/><input data-field='highlights' data-id='${p.id}' value='${(p.highlights || []).join(", ")}'/><div class='inline-inputs'><label>₹ <input type='number' min='1' data-field='price' data-id='${p.id}' value='${p.price}'/></label><label>Stock <input type='number' min='0' data-field='stock' data-id='${p.id}' value='${p.stock}'/></label></div><div class='inline-inputs'><button class='btn btn-light' data-save-id='${p.id}'>Save Changes</button><button class='btn btn-light' data-delete-id='${p.id}'>Delete Product</button></div></div></div>`;
    w.appendChild(r);
  });

  w.querySelectorAll("button[data-save-id]").forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.saveId;
      const p = products.find((x) => x.id === id);
      if (!p) return;
      w.querySelectorAll(`[data-id='${id}']`).forEach((f) => {
        const k = f.dataset.field;
        if (["price", "stock"].includes(k)) p[k] = Number(f.value);
        else if (k === "highlights") p.highlights = f.value.split(",").map((v) => v.trim()).filter(Boolean);
        else p[k] = f.value.trim();
      });
      setJSON(KEYS.products, products);
      renderProducts();
    };
  });
  w.querySelectorAll("button[data-delete-id]").forEach((b) => {
    b.onclick = () => {
      products = products.filter((p) => p.id !== b.dataset.deleteId);
      setJSON(KEYS.products, products);
      renderProducts();
    };
  });
}

function summary(rows) {
  const c = { order: 0, shipped: 0, out_for_delivery: 0, delivered: 0, cancelled: 0 };
  rows.forEach(({ i }) => (c[i.status] = (c[i.status] || 0) + 1));
  $("#statusSummary").innerHTML = Object.entries(c)
    .map(([k, v]) => `<div class='summary-chip'><strong>${v}</strong><span>${k.replaceAll("_", " ")}</span></div>`)
    .join("");
}

function updateStatus(orderId, itemId, status) {
  const o = orders.find((x) => x.id === orderId);
  const i = o?.items.find((x) => x.itemId === itemId);
  if (!i) return;
  i.status = status;
  i.statusHistory = i.statusHistory || {};
  i.statusHistory[status] = new Date().toISOString();
  if (status === "cancelled") {
    i.cancelRequest = "accepted";
    i.cancelMessage = "Cancelled by admin";
  }
  setJSON(KEYS.orders, orders);
  renderItems();
}

function resolveCancel(orderId, itemId, action) {
  const o = orders.find((x) => x.id === orderId);
  const i = o?.items.find((x) => x.itemId === itemId);
  if (!i) return;
  if (action === "accept") {
    i.cancelRequest = "accepted";
    i.cancelMessage = "Cancellation approved";
    i.status = "cancelled";
    i.statusHistory = i.statusHistory || {};
    i.statusHistory.cancelled = new Date().toISOString();
  } else {
    const reason = prompt("Write reason for decline:", "Product already shipped");
    if (!reason) return;
    i.cancelRequest = "declined";
    i.cancelMessage = reason;
  }
  setJSON(KEYS.orders, orders);
  renderItems();
}

function deleteCancelled(orderId, itemId) {
  const o = orders.find((x) => x.id === orderId);
  if (!o) return;
  o.items = o.items.filter((i) => !(i.itemId === itemId && i.status === "cancelled"));
  if (!o.items.length) orders = orders.filter((x) => x.id !== orderId);
  setJSON(KEYS.orders, orders);
  renderItems();
}

function viewDetails(order) {
  const detail = document.createElement("div");
  detail.className = "admin-order-detail";
  detail.innerHTML = `
    <p><strong>Order ID:</strong> ${order.id}</p>
    <p><strong>User:</strong> ${order.userName}</p>
    <p><strong>Email:</strong> ${order.userEmail}</p>
    <p><strong>Phone:</strong> ${order.phone}</p>
    <p><strong>Address:</strong> ${order.address?.line || ""}, ${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.pincode || ""}</p>
    <p><strong>Instruction:</strong> ${order.address?.instruction || "-"}</p>
    <p><strong>Payment:</strong> ${order.payment || "cod"}</p>
    <p><strong>Total:</strong> ₹${order.total}</p>
    <p><strong>Created At:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
    <p><strong>All Items:</strong><br>${order.items.map((x) => `${x.name} x${x.qty} (${x.status})`).join("<br>")}</p>
  `;
  return detail;
}

function renderItems() {
  const l = $("#orderItemList");
  l.innerHTML = "";
  const q = $("#orderSearch").value.toLowerCase().trim();
  const f = $("#statusFilter").value;
  const rows = [];
  orders.forEach((o) => o.items.forEach((i) => rows.push({ o, i })));
  summary(rows);

  rows
    .reverse()
    .filter(({ o, i }) => {
      const t = `${o.id} ${o.userName} ${o.userEmail} ${o.phone} ${i.name}`.toLowerCase();
      return (!q || t.includes(q)) && (f === "all" || i.status === f);
    })
    .forEach(({ o, i }) => {
      const c = document.createElement("div");
      c.className = "card admin-order-item";
      c.innerHTML = `
        <p><strong>Order:</strong> ${o.id}</p>
        <p><strong>Tracking ID:</strong> ${i.trackingId}</p>
        <p><strong>User:</strong> ${o.userName} (${o.userEmail} | ${o.phone})</p>
        <p><strong>Address:</strong> ${o.address?.line || ""}, ${o.address?.city || ""}, ${o.address?.state || ""} - ${o.address?.pincode || ""}</p>
        <p><strong>Product:</strong> ${i.name} x ${i.qty}</p>
        <p><strong>Status:</strong> <span class='badge'>${i.status.replaceAll("_", " ")}</span></p>
        <div class='inline-inputs'><button class='btn btn-light view-detail'>View Detail</button></div>
        <div class='order-full-detail hidden'></div>
        <label>Update Status</label>
        <select class='item-status'>${ITEM_STATUS.map((s) => `<option value='${s}' ${i.status === s ? "selected" : ""}>${s.replaceAll("_", " ")}</option>`).join("")}</select>
        <div class='cancel-admin-box ${i.cancelRequest === "pending" ? "pending" : ""}'>
          <p><strong>Cancel Request:</strong> ${i.cancelRequest}</p>
          <p>${i.cancelMessage || "No note"}</p>
          <div class='inline-inputs'>
            <button class='btn btn-light a' ${i.cancelRequest !== "pending" ? "disabled" : ""}>Accept</button>
            <button class='btn btn-light d' ${i.cancelRequest !== "pending" ? "disabled" : ""}>Decline</button>
            <button class='btn btn-light x' ${i.status !== "cancelled" ? "disabled" : ""}>Delete Cancelled</button>
          </div>
        </div>`;

      const detailWrap = c.querySelector(".order-full-detail");
      const detailNode = viewDetails(o);
      c.querySelector(".view-detail").onclick = () => {
        detailWrap.classList.toggle("hidden");
        if (!detailWrap.hasChildNodes()) detailWrap.appendChild(detailNode);
      };

      c.querySelector(".item-status").onchange = (e) => updateStatus(o.id, i.itemId, e.target.value);
      c.querySelector(".a").onclick = () => resolveCancel(o.id, i.itemId, "accept");
      c.querySelector(".d").onclick = () => resolveCancel(o.id, i.itemId, "decline");
      c.querySelector(".x").onclick = () => deleteCancelled(o.id, i.itemId);
      l.appendChild(c);
    });

  if (!l.innerHTML) l.innerHTML = "<p>No order items found.</p>";
}

$("#orderSearch").oninput = renderItems;
$("#statusFilter").onchange = renderItems;

$("#productForm").onsubmit = async (e) => {
  e.preventDefault();
  const file = $("#pImage");
  let image = "https://via.placeholder.com/500x300?text=Earrings";
  if (file.files && file.files[0]) {
    image = await new Promise((r) => {
      const rd = new FileReader();
      rd.onload = () => r(rd.result);
      rd.readAsDataURL(file.files[0]);
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

$("#clearOrders").onclick = () => {
  orders = [];
  setJSON(KEYS.orders, orders);
  renderItems();
};

$("#resetDemoData").onclick = () => {
  products = [...defaultProducts];
  setJSON(KEYS.products, products);
  renderProducts();
};

window.addEventListener("storage", () => {
  products = getJSON(KEYS.products, []);
  orders = getJSON(KEYS.orders, []);
  normalize();
  if (isLoggedIn()) {
    renderProducts();
    renderItems();
  }
});

setInterval(() => {
  const p = getJSON(KEYS.products, []);
  const o = getJSON(KEYS.orders, []);
  if (JSON.stringify(p) !== JSON.stringify(products)) {
    products = p;
    if (isLoggedIn()) renderProducts();
  }
  if (JSON.stringify(o) !== JSON.stringify(orders)) {
    orders = o;
    normalize();
    if (isLoggedIn()) renderItems();
  }
}, 1500);

if (isLoggedIn()) showPanel();
else showLogin();
