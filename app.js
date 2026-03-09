const KEYS = {
  products: "pv_products",
  users: "pv_users",
  currentUser: "pv_current_user",
  carts: "pv_carts",
  orders: "pv_orders",
};

const ADMIN = { username: "admin username", password: "admin12345678", session: "pv_admin_session" };
const FLOW = ["order", "shipped", "out_for_delivery", "delivered"];

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
const $$ = (s) => document.querySelectorAll(s);
const getJSON = (k, f) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : f;
  } catch {
    return f;
  }
};
const setJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

function init() {
  if (!localStorage.getItem(KEYS.products)) setJSON(KEYS.products, defaultProducts);
  if (!localStorage.getItem(KEYS.users)) setJSON(KEYS.users, []);
  if (!localStorage.getItem(KEYS.carts)) setJSON(KEYS.carts, {});
  if (!localStorage.getItem(KEYS.orders)) setJSON(KEYS.orders, []);
}
init();

const state = {
  products: getJSON(KEYS.products, []),
  users: getJSON(KEYS.users, []),
  carts: getJSON(KEYS.carts, {}),
  orders: getJSON(KEYS.orders, []),
  currentUser: getJSON(KEYS.currentUser, null),
  currentAddress: null,
};

const pages = { store: $("#storePage"), checkout: $("#checkoutPage"), orders: $("#ordersPage") };
const save = () => {
  setJSON(KEYS.products, state.products);
  setJSON(KEYS.users, state.users);
  setJSON(KEYS.carts, state.carts);
  setJSON(KEYS.orders, state.orders);
  setJSON(KEYS.currentUser, state.currentUser);
};
const uid = () => state.currentUser?.email || "guest";
function cart() {
  state.carts[uid()] = state.carts[uid()] || [];
  return state.carts[uid()];
}

function newId(prefix) {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function normalize() {
  let changed = false;
  state.orders.forEach((o) => {
    o.items.forEach((i) => {
      if (!i.itemId) i.itemId = newId("ITM"), (changed = true);
      if (!i.trackingId) i.trackingId = newId("ZGTRK"), (changed = true);
      if (!i.status) i.status = "order", (changed = true);
      if (!i.cancelRequest) i.cancelRequest = "none", (changed = true);
      if (!i.cancelMessage) i.cancelMessage = "", (changed = true);
      if (!i.statusHistory) i.statusHistory = { order: o.createdAt || new Date().toISOString() }, (changed = true);
      if (!i.expectedDelivery) {
        const d = new Date(o.createdAt || Date.now());
        d.setDate(d.getDate() + 7);
        i.expectedDelivery = d.toDateString();
        changed = true;
      }
    });
  });
  if (changed) save();
}
normalize();

const stockText = (s) => (s > 10 ? "In Stock" : s > 0 ? `Only ${s} left` : "Out of Stock");

function authUI() {
  $("#authBtn").textContent = state.currentUser ? `Sign Out (${state.currentUser.name})` : "Sign In";
}

function ensureAuth() {
  if (state.currentUser) return true;
  $("#authSection").classList.remove("hidden");
  $("#authMsg").textContent = "Please sign in first.";
  return false;
}

function showPage(name) {
  Object.values(pages).forEach((p) => p.classList.add("hidden"));
  pages[name].classList.remove("hidden");
}

function totals() {
  const sub = cart().reduce((a, i) => {
    const p = state.products.find((x) => x.id === i.productId);
    return p ? a + p.price * i.qty : a;
  }, 0);
  const del = sub > 0 && sub < 500 ? 40 : 0;
  return { sub, del, total: sub + del };
}

function renderProducts() {
  const q = $("#searchInput").value.toLowerCase().trim();
  const g = $("#productGrid");
  g.innerHTML = "";
  state.products
    .filter((p) => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
    .forEach((p) => {
      const n = $("#productCardTpl").content.firstElementChild.cloneNode(true);
      n.querySelector(".product-image").src = p.image;
      n.querySelector(".product-title").textContent = p.name;
      n.querySelector(".product-desc").textContent = p.desc;
      n.querySelector(".product-price").textContent = p.price;
      n.querySelector(".stock-label").textContent = stockText(p.stock);
      const disabled = p.stock <= 0;
      n.querySelectorAll("button").forEach((b) => (b.disabled = disabled));
      n.querySelector(".view-btn").onclick = () => (location.href = `product-detail.html?id=${encodeURIComponent(p.id)}`);
      n.querySelector(".cart-btn").onclick = () => addToCart(p.id, 1);
      n.querySelector(".buy-btn").onclick = () => {
        addToCart(p.id, 1);
        showCheckout();
      };
      g.appendChild(n);
    });
}

function addToCart(id, qty) {
  const p = state.products.find((x) => x.id === id);
  if (!p || p.stock < qty) return alert("Out of stock");
  const c = cart();
  const ex = c.find((x) => x.productId === id);
  if (ex) ex.qty = Math.min(ex.qty + qty, p.stock);
  else c.push({ productId: id, qty });
  save();
  renderCartCount();
  if (!pages.checkout.classList.contains("hidden")) renderCheckout();
}

function renderCartCount() {
  $("#cartCount").textContent = cart().reduce((a, i) => a + i.qty, 0);
}

function updateQty(id, qty) {
  const p = state.products.find((x) => x.id === id);
  const i = cart().find((x) => x.productId === id);
  if (!p || !i) return;
  i.qty = Math.max(1, Math.min(qty, p.stock));
  save();
  renderCartCount();
  renderCheckout();
}

function deleteCart(id) {
  state.carts[uid()] = cart().filter((x) => x.productId !== id);
  save();
  renderCartCount();
  renderCheckout();
}

function showCheckout() {
  if (!ensureAuth()) return;
  $("#authSection").classList.add("hidden");
  showPage("checkout");
  renderCheckout();
}

function renderCheckout() {
  const w = $("#cartItems");
  w.innerHTML = "";
  if (!cart().length) w.innerHTML = "<p>Your cart is empty.</p>";
  cart().forEach((i) => {
    const p = state.products.find((x) => x.id === i.productId);
    if (!p) return;
    const r = document.createElement("div");
    r.className = "cart-row";
    r.innerHTML = `<div><strong>${p.name}</strong><p>₹${p.price} x ${i.qty} = ₹${p.price * i.qty}</p></div>
    <div class='cart-actions'><button class='btn btn-light m'>-</button><span>${i.qty}</span><button class='btn btn-light p'>+</button><button class='btn btn-light d'>Delete</button></div>`;
    r.querySelector(".m").onclick = () => updateQty(i.productId, i.qty - 1);
    r.querySelector(".p").onclick = () => updateQty(i.productId, i.qty + 1);
    r.querySelector(".d").onclick = () => deleteCart(i.productId);
    w.appendChild(r);
  });
  const t = totals();
  $("#cartSubtotal").textContent = t.sub;
  $("#deliveryCharge").textContent = t.del;
  $("#taxCharge").textContent = 0;
  $("#cartTotal").textContent = t.total;
}

const fmt = (ts) => new Date(ts).toLocaleString();

function activate(container, status) {
  const ix = FLOW.indexOf(status);
  container.querySelectorAll(".step").forEach((s, i) => s.classList.toggle("active", i <= ix));
}

function requestCancel(orderId, itemId) {
  const o = state.orders.find((x) => x.id === orderId);
  const i = o?.items.find((x) => x.itemId === itemId);
  if (!i || i.cancelRequest !== "none") return;
  if (["delivered", "cancelled"].includes(i.status)) return alert("Cannot cancel now");
  i.cancelRequest = "pending";
  i.cancelMessage = "Request sent";
  save();
  renderOrders();
}

function deleteOrderItem(orderId, itemId) {
  const o = state.orders.find((x) => x.id === orderId);
  if (!o) return;
  o.items = o.items.filter((i) => i.itemId !== itemId);
  if (!o.items.length) state.orders = state.orders.filter((x) => x.id !== orderId);
  save();
  renderOrders();
}

function renderOrders() {
  if (!ensureAuth()) return;
  showPage("orders");
  const list = $("#ordersList");
  list.innerHTML = "";

  const rows = [];
  state.orders
    .filter((o) => o.userEmail === uid())
    .slice()
    .reverse()
    .forEach((o) => o.items.forEach((i) => rows.push({ o, i })));

  if (!rows.length) return (list.innerHTML = "<div class='card'><p>No orders yet.</p></div>");

  rows.forEach(({ o, i }) => {
    const c = $("#orderCardTpl").content.firstElementChild.cloneNode(true);
    c.querySelector(".order-id").textContent = `Order ID: ${o.id}`;
    c.querySelector(".tracking-id").textContent = i.trackingId;
    c.querySelector(".order-item").textContent = i.name;
    c.querySelector(".order-status").textContent = i.status.replaceAll("_", " ");
    c.querySelector(".order-qty").textContent = i.qty;
    c.querySelector(".order-price").textContent = i.price;
    c.querySelector(".order-contact").textContent = `${o.userEmail} | ${o.phone}`;
    c.querySelector(".expected-delivery").textContent = i.expectedDelivery;
    const addr = `${o.address?.line || ""}, ${o.address?.city || ""}, ${o.address?.state || ""} - ${o.address?.pincode || ""}`;
    const addressP = document.createElement("p");
    addressP.innerHTML = `<strong>Address:</strong> ${addr}`;
    c.insertBefore(addressP, c.querySelector(".cancel-note"));

    const t = c.querySelector(".mini-track");
    const tl = c.querySelector(".timeline");
    c.querySelector(".track-btn").onclick = () => {
      t.classList.toggle("hidden");
      tl.classList.toggle("hidden");
      activate(t, i.status);
      tl.innerHTML = FLOW.map((s) => `<p><strong>${s.replaceAll("_", " ")}:</strong> ${i.statusHistory[s] ? fmt(i.statusHistory[s]) : "-"}</p>`).join("");
    };

    const cancelBtn = c.querySelector(".cancel-btn");
    cancelBtn.onclick = () => requestCancel(o.id, i.itemId);

    const deleteBtn = c.querySelector(".delete-btn");
    if (["delivered", "cancelled"].includes(i.status)) {
      deleteBtn.classList.remove("hidden");
      deleteBtn.onclick = () => deleteOrderItem(o.id, i.itemId);
    }

    const note = c.querySelector(".cancel-note");
    if (i.cancelRequest === "pending") {
      note.textContent = "Cancellation pending";
      note.classList.remove("hidden");
      cancelBtn.disabled = true;
    } else if (i.cancelRequest === "declined") {
      note.textContent = `Declined: ${i.cancelMessage}`;
      note.classList.remove("hidden");
      cancelBtn.disabled = true;
    } else if (i.cancelRequest === "accepted" || i.status === "cancelled") {
      note.textContent = "Product cancelled";
      note.classList.remove("hidden");
      cancelBtn.disabled = true;
    }

    list.appendChild(c);
  });
}

$("#authBtn").onclick = () => {
  if (state.currentUser) {
    state.currentUser = null;
    save();
    authUI();
    renderCartCount();
    $("#authSection").classList.add("hidden");
    $("#authMsg").textContent = "";
    showPage("store");
    return;
  }
  $("#authSection").classList.remove("hidden");
};

$("#goHome").onclick = () => {
  $("#authSection").classList.add("hidden");
  showPage("store");
};
$("#goCheckout").onclick = showCheckout;
$("#goOrders").onclick = renderOrders;
$("#searchInput").oninput = renderProducts;

$$(".tab").forEach((t) => {
  t.onclick = () => {
    $$(".tab").forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    $("#signinForm").classList.toggle("hidden", t.dataset.tab !== "signin");
    $("#signupForm").classList.toggle("hidden", t.dataset.tab !== "signup");
    $("#authMsg").textContent = "";
  };
});

$("#signupForm").onsubmit = (e) => {
  e.preventDefault();
  const name = $("#signupName").value.trim();
  const email = $("#signupEmail").value.trim().toLowerCase();
  const phone = $("#signupPhone").value.trim();
  const password = $("#signupPassword").value;
  if (!name || !email || !phone || !password) return ($("#authMsg").textContent = "All fields required");
  if (state.users.some((u) => u.email === email)) return ($("#authMsg").textContent = "Account exists");
  state.users.push({ name, email, phone, password });
  state.currentUser = { name, email, phone };
  save();
  authUI();
  renderCartCount();
  $("#authSection").classList.add("hidden");
};

$("#signinForm").onsubmit = (e) => {
  e.preventDefault();
  const u = $("#signinEmail").value.trim().toLowerCase();
  const pw = $("#signinPassword").value;
  if (u === ADMIN.username && pw === ADMIN.password) {
    localStorage.setItem(ADMIN.session, "1");
    location.href = "admin.html";
    return;
  }
  const usr = state.users.find((x) => x.email === u && x.password === pw);
  if (!usr) return ($("#authMsg").textContent = "Invalid email or password");
  state.currentUser = { name: usr.name, email: usr.email, phone: usr.phone };
  save();
  authUI();
  renderCartCount();
  $("#authSection").classList.add("hidden");
};

$("#addressForm").onsubmit = (e) => {
  e.preventDefault();
  state.currentAddress = {
    name: $("#addrName").value.trim(),
    phone: $("#addrPhone").value.trim(),
    line: $("#addrLine").value.trim(),
    city: $("#addrCity").value.trim(),
    state: $("#addrState").value.trim(),
    pincode: $("#addrPincode").value.trim(),
    instruction: $("#addrInstruction").value.trim(),
  };
  $("#addressPreview").innerHTML = `<strong>Address Added</strong><p>${state.currentAddress.name} (${state.currentAddress.phone})</p><p>${state.currentAddress.line}, ${state.currentAddress.city}, ${state.currentAddress.state} - ${state.currentAddress.pincode}</p>`;
  $("#addressPreview").classList.remove("hidden");
  $("#placeOrderBtn").disabled = false;
};

$("#placeOrderBtn").onclick = () => {
  if (!ensureAuth()) return;
  if (!cart().length) return alert("Cart empty");
  if (!state.currentAddress) return alert("Add address first");

  const t = totals();
  const created = new Date().toISOString();
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const expected = d.toDateString();

  const items = [];
  for (const c of cart()) {
    const p = state.products.find((x) => x.id === c.productId);
    if (!p || p.stock < c.qty) return alert(`Stock issue for ${p?.name || c.productId}`);
    p.stock -= c.qty;
    items.push({
      itemId: newId("ITM"),
      trackingId: newId("ZGTRK"),
      productId: p.id,
      name: p.name,
      qty: c.qty,
      unitPrice: p.price,
      price: p.price * c.qty,
      status: "order",
      cancelRequest: "none",
      cancelMessage: "",
      statusHistory: { order: created },
      expectedDelivery: expected,
    });
  }

  state.orders.push({
    id: newId("ZG"),
    userEmail: uid(),
    userName: state.currentUser.name,
    phone: state.currentUser.phone,
    items,
    subtotal: t.sub,
    deliveryCharge: t.del,
    tax: 0,
    total: t.total,
    address: state.currentAddress,
    payment: "cod",
    createdAt: created,
  });

  state.carts[uid()] = [];
  save();
  renderProducts();
  renderCartCount();
  renderOrders();
};

window.addEventListener("storage", () => {
  state.products = getJSON(KEYS.products, []);
  state.orders = getJSON(KEYS.orders, []);
  state.carts = getJSON(KEYS.carts, {});
  normalize();
  renderProducts();
  renderCartCount();
});

setInterval(() => {
  const p = getJSON(KEYS.products, []);
  const o = getJSON(KEYS.orders, []);
  if (JSON.stringify(p) !== JSON.stringify(state.products)) {
    state.products = p;
    renderProducts();
  }
  if (JSON.stringify(o) !== JSON.stringify(state.orders)) {
    state.orders = o;
    normalize();
    if (!$("#ordersPage").classList.contains("hidden")) renderOrders();
  }
}, 1500);

authUI();
renderProducts();
renderCartCount();
showPage("store");
