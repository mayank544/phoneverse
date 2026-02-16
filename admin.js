const KEYS = {
  products: "pv_products",
  orders: "pv_orders",
};

const ADMIN = {
  email: "mayank75033@gmail.com",
  password: "m7503315833",
  session: "pv_admin_session",
};

const ITEM_STATUS = ["order", "shipped", "out_for_delivery", "delivered", "cancelled"];

const defaultProducts = [
  {
    id: "p1",
    name: "PhoneVerse SmartWatch Pro",
    desc: "AMOLED display, Bluetooth calling, health monitor.",
    longDesc: "SmartWatch Pro gives you fitness, notifications, and all-day comfort with premium finish.",
    brand: "PhoneVerse",
    category: "Wearables",
    highlights: ["1.96 inch AMOLED", "Bluetooth calling", "Health & sleep tracking"],
    price: 2999,
    stock: 40,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "p2",
    name: "Wireless Earbuds X2",
    desc: "ENC mic, deep bass, 30H battery life.",
    longDesc: "Earbuds X2 delivers stable connection, clear calling and powerful bass in compact design.",
    brand: "PhoneVerse",
    category: "Audio",
    highlights: ["ENC mic", "30-hour battery", "Fast pairing"],
    price: 1799,
    stock: 55,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
  },
];

const $ = (s) => document.querySelector(s);
function getJSON(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}
function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let products = getJSON(KEYS.products, defaultProducts);
let orders = getJSON(KEYS.orders, []);

if (!localStorage.getItem(KEYS.products)) setJSON(KEYS.products, defaultProducts);

function normalizeOrders() {
  let changed = false;
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (!item.status) {
        item.status = "order";
        changed = true;
      }
      if (!item.cancelRequest) {
        item.cancelRequest = "none";
        changed = true;
      }
      if (!item.cancelMessage) {
        item.cancelMessage = "";
        changed = true;
      }
    });
  });
  if (changed) setJSON(KEYS.orders, orders);
}
normalizeOrders();

function isLoggedIn() {
  return localStorage.getItem(ADMIN.session) === "1";
}

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

$("#adminLoginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("#adminEmail").value.trim().toLowerCase();
  const pass = $("#adminPassword").value;
  if (email === ADMIN.email && pass === ADMIN.password) {
    localStorage.setItem(ADMIN.session, "1");
    $("#adminMsg").textContent = "";
    showPanel();
  } else {
    $("#adminMsg").textContent = "Invalid admin credentials.";
  }
});

$("#adminSignOut").addEventListener("click", () => {
  localStorage.removeItem(ADMIN.session);
  showLogin();
});

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
          <input data-field="brand" data-id="${p.id}" value="${p.brand || ""}" placeholder="Brand" />
          <input data-field="category" data-id="${p.id}" value="${p.category || ""}" placeholder="Category" />
          <input data-field="highlights" data-id="${p.id}" value="${(p.highlights || []).join(", ")}" placeholder="Highlights comma separated" />
          <div class="inline-inputs">
            <label>₹ <input type="number" min="1" data-field="price" data-id="${p.id}" value="${p.price}" /></label>
            <label>Stock <input type="number" min="0" data-field="stock" data-id="${p.id}" value="${p.stock}" /></label>
          </div>
          <div class="inline-inputs">
            <button class="btn btn-light" data-save-id="${p.id}">Save Changes</button>
            <button class="btn btn-light" data-delete-id="${p.id}">Delete Product</button>
          </div>
        </div>
      </div>
    `;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll("button[data-save-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.saveId;
      const product = products.find((x) => x.id === id);
      if (!product) return;
      const fields = wrap.querySelectorAll(`[data-id='${id}']`);
      fields.forEach((f) => {
        const key = f.dataset.field;
        if (key === "price" || key === "stock") product[key] = Number(f.value);
        else if (key === "highlights") product.highlights = f.value.split(",").map((v) => v.trim()).filter(Boolean);
        else product[key] = f.value.trim();
      });
      setJSON(KEYS.products, products);
      renderProducts();
    });
  });

  wrap.querySelectorAll("button[data-delete-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.deleteId;
      products = products.filter((p) => p.id !== id);
      setJSON(KEYS.products, products);
      renderProducts();
    });
  });
}

function updateItemStatus(orderId, productId, status) {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;
  const item = order.items.find((i) => i.productId === productId);
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
  if (!order) return;
  const item = order.items.find((i) => i.productId === productId);
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

function renderOrderItems() {
  const list = $("#orderItemList");
  list.innerHTML = "";
  const q = $("#orderSearch").value.toLowerCase().trim();
  const filter = $("#statusFilter").value;

  const rows = [];
  orders.forEach((order) => {
    order.items.forEach((item) => rows.push({ order, item }));
  });

  rows
    .reverse()
    .filter(({ order, item }) => {
      const text = `${order.id} ${order.userName} ${order.userEmail} ${item.name}`.toLowerCase();
      const matchQuery = !q || text.includes(q);
      const matchStatus = filter === "all" || item.status === filter;
      return matchQuery && matchStatus;
    })
    .forEach(({ order, item }) => {
      const card = document.createElement("div");
      card.className = "card admin-order-item";
      card.innerHTML = `
        <p><strong>Order:</strong> ${order.id}</p>
        <p><strong>User:</strong> ${order.userName} (${order.userEmail})</p>
        <p><strong>Product:</strong> ${item.name} x ${item.qty}</p>
        <p><strong>Current Status:</strong> <span class="badge">${item.status.replaceAll("_", " ")}</span></p>
        <label>Update Status</label>
        <select class="item-status">
          ${ITEM_STATUS.map((s) => `<option value="${s}" ${item.status === s ? "selected" : ""}>${s.replaceAll("_", " ")}</option>`).join("")}
        </select>
        <div class="cancel-admin-box ${item.cancelRequest === "pending" ? "pending" : ""}">
          <p><strong>Cancel Request:</strong> ${item.cancelRequest}</p>
          <p>${item.cancelMessage || "No note"}</p>
          <div class="inline-inputs">
            <button class="btn btn-light accept-cancel" ${item.cancelRequest !== "pending" ? "disabled" : ""}>Accept</button>
            <button class="btn btn-light decline-cancel" ${item.cancelRequest !== "pending" ? "disabled" : ""}>Decline</button>
          </div>
        </div>
      `;

      card.querySelector(".item-status").addEventListener("change", (e) => updateItemStatus(order.id, item.productId, e.target.value));
      card.querySelector(".accept-cancel").addEventListener("click", () => resolveCancel(order.id, item.productId, "accept"));
      card.querySelector(".decline-cancel").addEventListener("click", () => resolveCancel(order.id, item.productId, "decline"));
      list.appendChild(card);
    });

  if (!list.innerHTML) list.innerHTML = `<p>No order items found.</p>`;
}

$("#orderSearch").addEventListener("input", renderOrderItems);
$("#statusFilter").addEventListener("change", renderOrderItems);

$("#productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const imageInput = $("#pImage");
  let image = "https://via.placeholder.com/500x300?text=Product";
  if (imageInput.files && imageInput.files[0]) {
    image = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(imageInput.files[0]);
    });
  }

  const product = {
    id: `p${Date.now()}`,
    name: $("#pName").value.trim(),
    desc: $("#pDesc").value.trim(),
    longDesc: $("#pLongDesc").value.trim(),
    brand: $("#pBrand").value.trim(),
    category: $("#pCategory").value.trim(),
    highlights: $("#pHighlights").value.split(",").map((v) => v.trim()).filter(Boolean),
    price: Number($("#pPrice").value),
    stock: Number($("#pStock").value),
    image,
  };

  products.push(product);
  setJSON(KEYS.products, products);
  e.target.reset();
  renderProducts();
});

$("#clearOrders").addEventListener("click", () => {
  orders = [];
  setJSON(KEYS.orders, orders);
  renderOrderItems();
});

$("#resetDemoData").addEventListener("click", () => {
  products = [...defaultProducts];
  setJSON(KEYS.products, products);
  renderProducts();
});

window.addEventListener("storage", () => {
  products = getJSON(KEYS.products, []);
  orders = getJSON(KEYS.orders, []);
  normalizeOrders();
  if (isLoggedIn()) {
    renderProducts();
    renderOrderItems();
  }
});

setInterval(() => {
  const latestOrders = getJSON(KEYS.orders, []);
  if (JSON.stringify(latestOrders) !== JSON.stringify(orders)) {
    orders = latestOrders;
    normalizeOrders();
    if (isLoggedIn()) renderOrderItems();
  }
}, 1500);

if (isLoggedIn()) showPanel();
else showLogin();
