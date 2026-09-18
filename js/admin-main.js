const firebaseConfig = {
  apiKey: "AIzaSyA6oBUDbrw6KE9rMWNwUCRbD5GLWTLWYnI",
  authDomain: "fiky-76be6.firebaseapp.com",
  projectId: "fiky-76be6",
  storageBucket: "fiky-76be6.firebasestorage.app",
  messagingSenderId: "863714423614",
  appId: "1:863714423614:web:1c19bb0d111a47d3ea326f",
  measurementId: "G-3GY9Z98HMH"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

const DEFAULT_CATEGORIES = [
  { id: "memorial-shields", name: "دروع تذكارية", icon: "fa-trophy" },
  { id: "flags", name: "الأعلام", icon: "fa-flag" },
  { id: "certificates", name: "شهادات تقدير", icon: "fa-certificate" },
  { id: "cutting", name: "قص وتقطيع", icon: "fa-scissors" },
  { id: "honor-shields", name: "دروع تكريم", icon: "fa-award" },
  { id: "uniforms", name: "اليونيفورم", icon: "fa-shirt" },
  { id: "mugs-gifts", name: "المجات والهدايا", icon: "fa-mug-hot" },
  { id: "cards-prints", name: "كروت ومطبوعات", icon: "fa-id-card" },
  { id: "logos-ads", name: "لوجوهات وإعلانات", icon: "fa-bullhorn" },
  { id: "serials-stamps", name: "السريلات والأختام", icon: "fa-stamp" }
];

let ordersList = [];
let productsList = [];
let categoriesList = [];
let calligraphersList = [];
let currentManagedOrder = null;
let currentAdminRole = "admin"; // "admin" or "staff"

window.showToast = function(msg) {
  const box = document.getElementById("toastContainer");
  if (!box) return;
  const t = document.createElement("div");
  t.className = "single-toast";
  t.innerHTML = `<span>${msg}</span>`;
  box.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, 3000);
};

window.handleAdminGateLogin = async function(e) {
  e.preventDefault();
  const email = document.getElementById("adminGateEmail").value.trim().toLowerCase();
  const password = document.getElementById("adminGatePassword").value.trim();
  const btn = document.getElementById("adminGateSubmitBtn");
  btn.disabled = true;

  // 1. Check Full Admin Quick Access
  if (
    (email === "admin@gmail.com" || email === "admin@elfeqy.com" || email === "admin@fiky.com") &&
    (password === "superadmin10" || password === "12345678")
  ) {
    unlockAdminView("admin");
    window.showToast("مرحباً بك يا مدير الوكالة في لوحة الإدارة الكاملة");
    btn.disabled = false;
    return;
  }

  // 2. Check Dedicated Orders Staff Quick Access
  if (
    (email === "orders@fiky.com" || email === "staff@fiky.com" || email === "orders@gmail.com") &&
    (password === "orders1234" || password === "12345678")
  ) {
    unlockAdminView("staff");
    window.showToast("مرحباً بك في لوحة متابعة الطلبات");
    btn.disabled = false;
    return;
  }

  // 3. Check Firebase Auth & Firestore Roles
  try {
    const res = await auth.signInWithEmailAndPassword(email, password);
    const u = res.user;
    const uEmail = (u.email || "").toLowerCase();

    if (uEmail === "admin@gmail.com" || uEmail === "admin@elfeqy.com" || uEmail === "admin@fiky.com") {
      unlockAdminView("admin");
      window.showToast("مرحباً بك في لوحة الإدارة");
    } else {
      const snap = await db.collection("users").doc(u.uid).get();
      if (snap.exists) {
        const uData = snap.data();
        if (uData.role === "admin" || uData.isAdmin) {
          unlockAdminView("admin");
          window.showToast("مرحباً بك في لوحة الإدارة");
        } else if (uData.role === "staff" || uData.role === "orders_staff") {
          unlockAdminView("staff");
          window.showToast("مرحباً بك في لوحة متابعة الطلبات");
        } else {
          await auth.signOut();
          window.showToast("هذا الحساب ليس لديه صلاحيات الإدارة أو متابعة الطلبات");
        }
      } else {
        await auth.signOut();
        window.showToast("هذا الحساب ليس لديه صلاحيات");
      }
    }
  } catch (err) {
    // Check if staff user was created directly in Firestore users collection
    try {
      const uDoc = await db.collection("users").doc(email.replace(/[@.]/g, "_")).get();
      if (uDoc.exists && uDoc.data().password === password) {
        const ud = uDoc.data();
        if (ud.role === "staff" || ud.role === "orders_staff") {
          unlockAdminView("staff");
          window.showToast("مرحباً بك في لوحة متابعة الطلبات");
          btn.disabled = false;
          return;
        } else if (ud.role === "admin" || ud.isAdmin) {
          unlockAdminView("admin");
          window.showToast("مرحباً بك في لوحة الإدارة");
          btn.disabled = false;
          return;
        }
      }
    } catch (e2) {}

    window.showToast("بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور.");
  } finally {
    btn.disabled = false;
  }
};

window.handleAdminLogout = async function() {
  await auth.signOut().catch(() => {});
  lockAdminView();
  window.showToast("تم تسجيل الخروج");
};

function unlockAdminView(role = "admin") {
  currentAdminRole = role;
  document.getElementById("adminGateModal").style.display = "none";
  document.getElementById("adminMainWrapper").style.display = "block";

  const isStaffOnly = role === "staff" || role === "orders_staff";

  // Hide or show admin-only features for staff
  document.querySelectorAll(".admin-only-item").forEach(el => {
    el.style.display = isStaffOnly ? "none" : "flex";
  });

  const revCard = document.getElementById("statCardRevenue");
  const ratioCard = document.getElementById("statCardWholesaleRatio");
  if (revCard) revCard.style.display = isStaffOnly ? "none" : "flex";
  if (ratioCard) ratioCard.style.display = isStaffOnly ? "none" : "flex";

  const topTitle = document.getElementById("adminTopbarTitle");
  const topSub = document.getElementById("adminTopbarSubtitle");
  const roleBadge = document.getElementById("adminRoleBadgeText");
  const sidebarRoleText = document.getElementById("sidebarUserRoleText");

  if (isStaffOnly) {
    if (topTitle) topTitle.textContent = "بوابة موظف متابعة الطلبات";
    if (topSub) topSub.textContent = "متابعة الطلبات الواردة، مراجعة إيصالات فودافون كاش / انستاباي، والتنفيذ والتسليم";
    if (roleBadge) roleBadge.textContent = "موظف متابعة الطلبات";
    if (sidebarRoleText) sidebarRoleText.textContent = "موظف متابعة الطلبات";
  } else {
    if (topTitle) topTitle.textContent = "مركز إدارة الوكالة (المدير العام)";
    if (topSub) topSub.textContent = "متابعة فورية للطلبات، المنتجات، المبيعات، والشركات";
    if (roleBadge) roleBadge.textContent = "مدير الوكالة";
    if (sidebarRoleText) sidebarRoleText.textContent = "لوحة التحكم الكاملة";
  }

  // Switch strictly to orders
  window.switchAdminTab('orders', document.getElementById("navTabOrders"));

  setupLiveOrders();
  if (!isStaffOnly) {
    loadCategoriesAdmin();
    loadProductsAdmin();
    loadCalligraphersAdmin();
  }
}

function lockAdminView() {
  document.getElementById("adminGateModal").style.display = "flex";
  document.getElementById("adminMainWrapper").style.display = "none";
}

window.toggleMobileSidebar = function() {
  const sidebar = document.getElementById("adminSidebar");
  if (sidebar) sidebar.classList.toggle("mobile-open");
};

window.switchAdminTab = function(tab, btn) {
  if ((currentAdminRole === "staff" || currentAdminRole === "orders_staff") && tab !== "orders") {
    window.showToast("صلاحيات هذا الحساب مخصصة لمتابعة الطلبات فقط");
    return;
  }

  document.querySelectorAll(".admin-nav-item").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  const sidebar = document.getElementById("adminSidebar");
  if (sidebar) sidebar.classList.remove("mobile-open");

  const tabOrders = document.getElementById("tabContentOrders");
  const tabProds = document.getElementById("tabContentProducts");
  const tabCats = document.getElementById("tabContentCategories");
  const tabWholesale = document.getElementById("tabContentCalligraphers");

  if (tabOrders) tabOrders.style.display = tab === "orders" ? "block" : "none";
  if (tabProds) tabProds.style.display = tab === "products" ? "block" : "none";
  if (tabCats) tabCats.style.display = tab === "categories" ? "block" : "none";
  if (tabWholesale) tabWholesale.style.display = tab === "calligraphers" ? "block" : "none";
};

window.filterOrdersStatus = function(status, btn) {
  btn.parentElement.querySelectorAll(".btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderOrdersTable(status);
};

function setupLiveOrders() {
  db.collection("orders").onSnapshot(snapshot => {
    ordersList = [];
    snapshot.forEach(doc => {
      ordersList.push({ id: doc.id, ...doc.data() });
    });
    ordersList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    renderOrdersTable();
    updateAnalytics();
  }, err => {
    console.warn(err);
  });
}

function updateAnalytics() {
  const totalRev = ordersList.reduce((sum, o) => sum + (o.status !== "cancelled" ? (o.totalPrice || 0) : 0), 0);
  const totalPieces = ordersList.reduce((sum, o) => sum + (o.itemsCount || 0), 0);
  const pendingOrders = ordersList.filter(o => o.status === "pending" || !o.status).length;
  const wholesaleOrders = ordersList.filter(o => o.isCalligrapherOrder).length;
  const retailOrders = ordersList.length - wholesaleOrders;

  const revEl = document.getElementById("statTotalRevenue");
  const piecesEl = document.getElementById("statTotalPieces");
  const pendingEl = document.getElementById("statPendingOrders");
  const ratioEl = document.getElementById("statWholesaleRatio");

  if (revEl) revEl.textContent = `${totalRev.toLocaleString()} ج.م`;
  if (piecesEl) piecesEl.textContent = `${totalPieces} قطعة`;
  if (pendingEl) pendingEl.textContent = `${pendingOrders} طلب`;
  if (ratioEl) ratioEl.textContent = `${wholesaleOrders} جملة / ${retailOrders} قطاعي`;
}

function renderOrdersTable(statusFilter = "all") {
  const tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;

  let list = ordersList;
  if (statusFilter !== "all") {
    list = ordersList.filter(o => o.status === statusFilter);
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: #64748B;"><i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; color: #CBD5E1;"></i>لا توجد طلبات في هذا القسم</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(order => {
    const statusMap = {
      pending: { label: "قيد المراجعة", class: "status-pending" },
      processing: { label: "جاري التنفيذ", class: "status-processing" },
      ready: { label: "جاهز للتسليم", class: "status-ready" },
      completed: { label: "تم التسليم", class: "status-completed" },
      cancelled: { label: "ملغي", class: "status-cancelled" }
    };

    const s = statusMap[order.status] || statusMap.pending;
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString("ar-EG") : "اليوم";

    // Payment display
    const isVoda = order.paymentMethod === "vodafone_cash";
    const isInsta = order.paymentMethod === "instapay";
    const payBadgeClass = isVoda ? "badge-voda" : (isInsta ? "badge-insta" : "badge-general");
    const payTitle = order.paymentMethodTitle || (isVoda ? "فودافون كاش" : (isInsta ? "انستاباي" : "دفع إلكتروني"));
    const hasReceipt = !!order.paymentReceipt;

    return `
      <tr class="order-row ${order.isCalligrapherOrder ? "row-calligrapher" : ""}">
        <td>
          <strong style="color: #0F172A; font-size: 0.95rem;">${order.orderNumber || order.id.slice(0, 8)}</strong>
          ${order.isCalligrapherOrder ? `<span class="badge-calligrapher-tag">مطابع / شركات</span>` : `<span class="badge-retail-tag">أفراد وعملاء</span>`}
          <div style="font-size: 0.75rem; color: #64748B; margin-top: 0.2rem;"><i class="fa-regular fa-clock"></i> ${dateStr}</div>
        </td>
        <td>
          <div style="font-weight: 800; color: #0F172A;">${order.customerName || "عميل"}</div>
          <div><a href="tel:${order.phone1}" style="color: #0284C7; text-decoration: none; font-weight: 700;"><i class="fa-solid fa-phone"></i> ${order.phone1}</a></div>
          ${order.phone2 ? `<div style="font-size: 0.75rem; color: #64748B;">هاتف 2: ${order.phone2}</div>` : ""}
          <div style="font-size: 0.78rem; color: #475569; margin-top: 0.2rem;"><i class="fa-solid fa-location-dot" style="color: #EF4444;"></i> ${order.address || ""}</div>
          ${order.notes ? `<div style="font-size: 0.75rem; color: #D97706; margin-top: 0.2rem;"><i class="fa-solid fa-comment-dots"></i> ${order.notes}</div>` : ""}
        </td>
        <td>
          <div>
            ${(order.items || []).map(item => `
              <div class="order-item-pill">
                <strong>${item.name}</strong> (${item.quantity} ${item.unit || "قطع"})
                ${item.customText ? `<div class="item-custom-note">نص: "${item.customText}"</div>` : ""}
                ${item.uploadedFile ? `<button type="button" class="btn-view-design" onclick="previewUploadedDesign('${item.uploadedFile}')"><i class="fa-solid fa-image"></i> تصميم العميل</button>` : ""}
              </div>
            `).join("")}
          </div>
        </td>
        <td>
          <strong style="color: #A17C17; font-size: 1.1rem; display: block; margin-bottom: 0.35rem;">${order.totalPrice?.toLocaleString() || 0} ج.م</strong>
          <span class="pay-method-badge ${payBadgeClass}">
            ${isVoda ? '<i class="fa-solid fa-mobile-screen-button"></i>' : (isInsta ? '<i class="fa-solid fa-building-columns"></i>' : '<i class="fa-solid fa-credit-card"></i>')}
            ${payTitle}
          </span>
          <div style="margin-top: 0.4rem;">
            ${hasReceipt ? `
              <button type="button" class="btn btn-sm btn-outline-receipt" onclick="previewPaymentReceipt('${order.id}')">
                <i class="fa-solid fa-receipt"></i> معاينة إيصال التحويل
              </button>
            ` : `
              <span style="font-size: 0.72rem; color: #94A3B8;"><i class="fa-solid fa-circle-exclamation"></i> بدون إيصال</span>
            `}
          </div>
          ${order.paymentStatus ? `<div style="font-size: 0.75rem; color: #16A34A; font-weight: 700; margin-top: 0.25rem;">${order.paymentStatus}</div>` : ""}
        </td>
        <td>
          <span class="status-badge ${s.class}">${s.label}</span>
          ${order.estimatedDate ? `<div style="font-size: 0.75rem; color: #A17C17; font-weight: 700; margin-top: 0.35rem;"><i class="fa-regular fa-calendar-check"></i> ${order.estimatedDate}</div>` : `<div style="font-size: 0.75rem; color: #64748B; margin-top: 0.35rem;">${order.estimatedDuration || ""}</div>`}
        </td>
        <td>
          <div class="table-actions-flex">
            <button class="btn btn-sm btn-navy" onclick="openManageOrderModal('${order.id}')" title="إدارة الطلب">
              <i class="fa-solid fa-pen-to-square"></i> إدارة
            </button>
            <a href="https://wa.me/2${order.phone1?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`مرحباً ${order.customerName}، بخصوص طلبكم رقم ${order.orderNumber} من وكالة الفقي للطباعة.`)}" target="_blank" class="btn btn-sm btn-whatsapp" title="تواصل واتساب">
              <i class="fa-brands fa-whatsapp"></i>
            </a>
            <button class="btn btn-sm" style="background: #EF4444; color: #FFFFFF;" onclick="deleteOrderAdmin('${order.id}')" title="حذف الطلب">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

window.previewUploadedDesign = function(imgData) {
  const modal = document.getElementById("designPreviewModal");
  const img = document.getElementById("modalFullDesignImg");
  const btn = document.getElementById("btnDownloadDesign");
  if (img) img.src = imgData;
  if (btn) btn.href = imgData;
  if (modal) modal.classList.add("active");
};

window.previewPaymentReceipt = function(orderId) {
  const order = ordersList.find(o => o.id === orderId);
  if (!order || !order.paymentReceipt) {
    window.showToast("لا يوجد إيصال مرفق لهذا الطلب");
    return;
  }

  const modal = document.getElementById("receiptPreviewModal");
  const img = document.getElementById("modalFullReceiptImg");
  const btn = document.getElementById("btnDownloadReceipt");
  const infoEl = document.getElementById("receiptModalInfo");

  if (img) img.src = order.paymentReceipt;
  if (btn) btn.href = order.paymentReceipt;
  if (infoEl) {
    infoEl.innerHTML = `
      <div style="font-weight: 800; color: #0F172A; margin-bottom: 0.25rem;">إيصال تحويل الطلب: <span style="color: #A17C17;">${order.orderNumber}</span></div>
      <div style="font-size: 0.85rem; color: #475569;">العميل: <strong>${order.customerName}</strong> | المبلغ: <strong>${order.totalPrice?.toLocaleString()} ج.م</strong> | طريقة الدفع: <strong>${order.paymentMethodTitle || order.paymentMethod}</strong></div>
    `;
  }
  if (modal) modal.classList.add("active");
};

window.openManageOrderModal = function(orderId) {
  const modal = document.getElementById("manageOrderModal");
  const o = ordersList.find(i => i.id === orderId);
  if (!o) return;

  currentManagedOrder = o;
  document.getElementById("manageOrderId").value = orderId;
  document.getElementById("manageOrderStatus").value = o.status || "pending";
  if (document.getElementById("managePaymentStatus")) {
    document.getElementById("managePaymentStatus").value = o.paymentStatus || (o.paymentReceipt ? "تم إرفاق الإيصال - قيد المراجعة" : "بانتظار التحويل");
  }
  document.getElementById("manageOrderDuration").value = o.estimatedDuration || "2 - 3 أيام عمل";
  document.getElementById("manageOrderDate").value = o.estimatedDate || "";
  document.getElementById("manageOrderAdminNotes").value = o.adminNotes || "";

  modal.classList.add("active");
};

window.closeManageOrderModal = function() {
  document.getElementById("manageOrderModal").classList.remove("active");
  currentManagedOrder = null;
};

window.saveOrderStatusSubmit = async function(e) {
  e.preventDefault();
  const orderId = document.getElementById("manageOrderId").value;
  const status = document.getElementById("manageOrderStatus").value;
  const paymentStatus = document.getElementById("managePaymentStatus") ? document.getElementById("managePaymentStatus").value : "";
  const duration = document.getElementById("manageOrderDuration").value;
  const date = document.getElementById("manageOrderDate").value;
  const notes = document.getElementById("manageOrderAdminNotes").value;

  try {
    const wasAlreadyCancelled = currentManagedOrder?.status === "cancelled";
    const alreadyRestored = currentManagedOrder?.stockRestored === true;

    if (status === "cancelled" && !wasAlreadyCancelled && !alreadyRestored) {
      const items = currentManagedOrder?.items || [];
      for (const item of items) {
        try {
          if (!item.id && !item.productId) continue;
          const pId = item.id || item.productId;
          const pRef = db.collection("products").doc(pId);
          const pDoc = await pRef.get();
          if (pDoc.exists) {
            const curStock = Number(pDoc.data().stock) || 0;
            const newStock = curStock + (Number(item.quantity) || 1);
            await pRef.update({ stock: newStock });
          }
        } catch (stockErr) {
          console.warn(stockErr);
        }
      }
    }

    await db.collection("orders").doc(orderId).update({
      status,
      paymentStatus,
      estimatedDuration: duration,
      estimatedDate: date,
      adminNotes: notes,
      updatedAt: new Date().toISOString(),
      ...(status === "cancelled" && !wasAlreadyCancelled && !alreadyRestored ? { stockRestored: true } : {})
    });
    window.showToast("تم تحديث حالة الطلب بنجاح");
    window.closeManageOrderModal();
  } catch (err) {
    window.showToast("فشل تحديث الطلب");
  }
};

window.deleteOrderAdmin = async function(orderId) {
  const targetId = orderId || (currentManagedOrder ? currentManagedOrder.id : null);
  if (!targetId) return;

  if (!confirm("هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً من السجل؟")) return;

  try {
    const targetOrder = ordersList.find(o => o.id === targetId);
    if (targetOrder && targetOrder.status !== "cancelled" && !targetOrder.stockRestored) {
      const returnStock = confirm("هل ترغب في إعادة كميات المنتجات الخاصة بهذا الطلب إلى المخزون قبل الحذف؟");
      if (returnStock) {
        const items = targetOrder.items || [];
        for (const item of items) {
          if (!item.id && !item.productId) continue;
          try {
            const pId = item.id || item.productId;
            const pRef = db.collection("products").doc(pId);
            const pDoc = await pRef.get();
            if (pDoc.exists) {
              const curStock = Number(pDoc.data().stock) || 0;
              const newStock = curStock + (Number(item.quantity) || 1);
              await pRef.update({ stock: newStock });
            }
          } catch (eStock) {
            console.warn(eStock);
          }
        }
      }
    }

    await db.collection("orders").doc(targetId).delete();
    window.closeManageOrderModal();
    window.showToast("تم حذف الطلب نهائياً من السجل");
  } catch (err) {
    window.showToast("فشل حذف الطلب");
  }
};

window.printCurrentOrderReceipt = function() {
  if (!currentManagedOrder) return;
  const o = currentManagedOrder;
  const container = document.getElementById("printableInvoice");
  if (!container) return;

  const isWholesale = o.isCalligrapherOrder;
  const itemsHtml = (o.items || []).map((item, idx) => `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 8px; text-align: center;">${idx + 1}</td>
      <td style="padding: 8px;">
        <strong>${item.name}</strong>
        ${item.customText ? `<div style="font-size: 11px; color: #555;">ملاحظات/نص: ${item.customText}</div>` : ""}
      </td>
      <td style="padding: 8px; text-align: center;">${item.quantity} ${item.unit || "قطعة"}</td>
      <td style="padding: 8px; text-align: center;">${item.price} ج.م</td>
      <td style="padding: 8px; text-align: center;">${item.price * item.quantity} ج.م</td>
    </tr>
  `).join("");

  container.innerHTML = `
    <div style="border: 2px solid #0F172A; padding: 20px; max-width: 700px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #C59B27; padding-bottom: 15px; margin-bottom: 20px;">
        <div>
          <h2 style="margin: 0; color: #0F172A; font-size: 22px;">وكالة الفقي للدعاية والإعلان</h2>
          <p style="margin: 3px 0 0; font-size: 12px; color: #666;">تحت إشراف وإدارة: د/ محمد الفقي وأولاده</p>
          <p style="margin: 3px 0 0; font-size: 12px; color: #666;">هاتف وواتساب: 01021800199</p>
        </div>
        <div style="text-align: left;">
          <h3 style="margin: 0; color: #A17C17;">إيصال تسليم طلب</h3>
          <div style="font-size: 14px; font-weight: bold; margin-top: 5px;">رقم: ${o.orderNumber || o.id}</div>
          <div style="font-size: 11px; color: #777;">التاريخ: ${new Date(o.createdAt || Date.now()).toLocaleDateString("ar-EG")}</div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; background: #f9f9f9; padding: 10px; border-radius: 6px; margin-bottom: 20px; font-size: 13px;">
        <div>
          <div><strong>العميل / الجهة:</strong> ${o.customerName}</div>
          <div><strong>الهاتف:</strong> ${o.phone1} ${o.phone2 ? " / " + o.phone2 : ""}</div>
          <div><strong>العنوان:</strong> ${o.address || "استلام من المقر"}</div>
        </div>
        <div style="text-align: left;">
          <div><strong>نوع الطلب:</strong> ${isWholesale ? "مطابع وشركات" : "أفراد وعملاء"}</div>
          <div><strong>طريقة الدفع:</strong> ${o.paymentMethodTitle || o.paymentMethod || "كاش"}</div>
          <div><strong>موعد الاستلام:</strong> ${o.estimatedDate || o.estimatedDuration || "فوري"}</div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
        <thead>
          <tr style="background: #0F172A; color: #FFF;">
            <th style="padding: 8px; width: 40px;">#</th>
            <th style="padding: 8px; text-align: right;">الصنف والمواصفات</th>
            <th style="padding: 8px; text-align: center;">الكمية</th>
            <th style="padding: 8px; text-align: center;">السعر</th>
            <th style="padding: 8px; text-align: center;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr style="background: #FFFBEB; font-weight: bold; font-size: 14px; border-top: 2px solid #C59B27;">
            <td colspan="4" style="padding: 10px; text-align: left;">المبلغ الإجمالي المستحق:</td>
            <td style="padding: 10px; text-align: center; color: #A17C17;">${o.totalPrice?.toLocaleString()} ج.م</td>
          </tr>
        </tfoot>
      </table>

      ${o.adminNotes ? `<div style="font-size: 12px; color: #555; margin-bottom: 20px;"><strong>ملاحظات التنفيذ:</strong> ${o.adminNotes}</div>` : ""}

      <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 12px; border-top: 1px dashed #ccc; padding-top: 15px;">
        <div>توقيع المستلم: ..............................</div>
        <div>ختم وتوقيع الإدارة: ..............................</div>
      </div>
    </div>
  `;

  container.style.display = "block";
  window.print();
  setTimeout(() => {
    container.style.display = "none";
  }, 1000);
};

// =================== PRODUCTS ADMIN ===================
async function loadProductsAdmin() {
  try {
    const snap = await db.collection("products").get();
    productsList = [];
    snap.forEach(d => productsList.push({ id: d.id, ...d.data() }));
    renderProductsAdminTable();
  } catch (e) {
    console.warn(e);
  }
}

function renderProductsAdminTable() {
  const tbody = document.getElementById("adminProductsTableBody");
  if (!tbody) return;

  if (productsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #64748B;">لا توجد منتجات مسجلة</td></tr>`;
    return;
  }

  tbody.innerHTML = productsList.map(p => `
    <tr>
      <td>
        <img src="${p.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #E2E8F0;" alt="${p.name}">
      </td>
      <td>
        <strong style="color: #0F172A;">${p.name}</strong>
        <div style="font-size: 0.75rem; color: #64748B;">القسم: ${p.category} | ${p.unit || "قطعة"}</div>
      </td>
      <td><span style="font-weight: 700; color: #0F172A;">${p.retailPrice} ج.م</span></td>
      <td><span style="font-weight: 800; color: #A17C17;">${p.wholesalePrice} ج.م</span></td>
      <td><span class="badge-stock ${p.stock < 10 ? 'low' : ''}">${p.stock}</span></td>
      <td>
        <div class="table-actions-flex">
          <button class="btn btn-sm btn-navy" onclick="openEditProductModal('${p.id}')"><i class="fa-solid fa-pen"></i> تعديل</button>
          <button class="btn btn-sm" style="background: #EF4444; color: #FFF;" onclick="deleteProductAdmin('${p.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join("");
}

window.openAddProductModal = function() {
  document.getElementById("prodFormId").value = "";
  document.getElementById("prodFormName").value = "";
  document.getElementById("prodFormUnit").value = "قطعة";
  document.getElementById("prodFormRetailPrice").value = "";
  document.getElementById("prodFormWholesalePrice").value = "";
  document.getElementById("prodFormStock").value = "100";
  document.getElementById("prodFormBadge").value = "";
  document.getElementById("prodFormImageUrl").value = "";
  document.getElementById("prodFormDesc").value = "";
  document.getElementById("adminProdImgPreviewWrap").style.display = "none";
  populateCategorySelect();
  document.getElementById("productFormModal").classList.add("active");
};

window.openEditProductModal = function(prodId) {
  const p = productsList.find(i => i.id === prodId);
  if (!p) return;
  document.getElementById("prodFormId").value = p.id;
  document.getElementById("prodFormName").value = p.name || "";
  document.getElementById("prodFormUnit").value = p.unit || "قطعة";
  document.getElementById("prodFormRetailPrice").value = p.retailPrice || "";
  document.getElementById("prodFormWholesalePrice").value = p.wholesalePrice || "";
  document.getElementById("prodFormStock").value = p.stock || 0;
  document.getElementById("prodFormBadge").value = p.badge || "";
  document.getElementById("prodFormImageUrl").value = p.image || "";
  document.getElementById("prodFormDesc").value = p.description || "";
  populateCategorySelect(p.category);

  if (p.image) {
    document.getElementById("adminProdImgPreview").src = p.image;
    document.getElementById("adminProdImgPreviewWrap").style.display = "block";
  } else {
    document.getElementById("adminProdImgPreviewWrap").style.display = "none";
  }
  document.getElementById("productFormModal").classList.add("active");
};

window.closeProductFormModal = function() {
  document.getElementById("productFormModal").classList.remove("active");
};

function populateCategorySelect(selectedCat = "") {
  const select = document.getElementById("prodFormCategory");
  if (!select) return;
  const cats = categoriesList.length ? categoriesList : DEFAULT_CATEGORIES;
  select.innerHTML = cats.map(c => `
    <option value="${c.id}" ${c.id === selectedCat ? "selected" : ""}>${c.name}</option>
  `).join("");
}

window.handleAdminProductImage = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    document.getElementById("prodFormImageUrl").value = evt.target.result;
    document.getElementById("adminProdImgPreview").src = evt.target.result;
    document.getElementById("adminProdImgPreviewWrap").style.display = "block";
  };
  reader.readAsDataURL(file);
};

window.saveProductSubmit = async function(e) {
  e.preventDefault();
  const id = document.getElementById("prodFormId").value || "prod_" + Date.now();
  const name = document.getElementById("prodFormName").value.trim();
  const category = document.getElementById("prodFormCategory").value;
  const unit = document.getElementById("prodFormUnit").value.trim() || "قطعة";
  const retailPrice = Number(document.getElementById("prodFormRetailPrice").value) || 0;
  const wholesalePrice = Number(document.getElementById("prodFormWholesalePrice").value) || 0;
  const stock = Number(document.getElementById("prodFormStock").value) || 0;
  const badge = document.getElementById("prodFormBadge").value.trim();
  const image = document.getElementById("prodFormImageUrl").value.trim() || "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=600&q=80";
  const description = document.getElementById("prodFormDesc").value.trim();

  const payload = {
    id,
    name,
    category,
    unit,
    retailPrice,
    wholesalePrice,
    stock,
    badge,
    image,
    description
  };

  try {
    await db.collection("products").doc(id).set(payload);
    await loadProductsAdmin();
    window.closeProductFormModal();
    window.showToast("تم حفظ الصنف بنجاح");
  } catch (err) {
    window.showToast("فشل حفظ الصنف");
  }
};

window.deleteProductAdmin = async function(prodId) {
  if (!confirm("هل أنت متأكد من رغبتك في حذف هذا الصنف؟")) return;
  try {
    await db.collection("products").doc(prodId).delete();
    await loadProductsAdmin();
    window.showToast("تم حذف الصنف");
  } catch (e) {
    window.showToast("فشل حذف الصنف");
  }
};

// =================== CATEGORIES ADMIN ===================
async function loadCategoriesAdmin() {
  try {
    const snap = await db.collection("categories").get();
    const hasOldCategories = !snap.empty && snap.docs.some(d => ["banners", "tshirts", "shields"].includes(d.id));

    if (snap.empty || hasOldCategories) {
      if (hasOldCategories) {
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit().catch(() => {});
      }
      categoriesList = [...DEFAULT_CATEGORIES];
      for (const c of DEFAULT_CATEGORIES) {
        db.collection("categories").doc(c.id).set(c).catch(() => {});
      }
    } else {
      categoriesList = [];
      snap.forEach(d => categoriesList.push({ id: d.id, ...d.data() }));
    }
    renderCategoriesAdminTable();
  } catch (e) {
    categoriesList = [...DEFAULT_CATEGORIES];
    renderCategoriesAdminTable();
  }
}

function renderCategoriesAdminTable() {
  const tbody = document.getElementById("adminCategoriesTableBody");
  if (!tbody) return;

  tbody.innerHTML = categoriesList.map(c => `
    <tr>
      <td><i class="fa-solid ${c.icon || 'fa-box'}" style="font-size: 1.25rem; color: #C59B27;"></i></td>
      <td><strong style="color: #0F172A;">${c.name}</strong></td>
      <td><span style="font-family: monospace; color: #64748B;">${c.id}</span></td>
      <td>
        <button class="btn btn-sm btn-navy" onclick="deleteCategoryAdmin('${c.id}')"><i class="fa-solid fa-trash"></i> حذف</button>
      </td>
    </tr>
  `).join("");
}

window.openAddCategoryModal = function() {
  document.getElementById("catFormName").value = "";
  document.getElementById("categoryFormModal").classList.add("active");
};

window.closeCategoryFormModal = function() {
  document.getElementById("categoryFormModal").classList.remove("active");
};

window.saveCategorySubmit = async function(e) {
  e.preventDefault();
  const name = document.getElementById("catFormName").value.trim();
  const icon = document.getElementById("catFormIcon").value;
  const id = "cat_" + Date.now();

  try {
    await db.collection("categories").doc(id).set({ id, name, icon });
    await loadCategoriesAdmin();
    window.closeCategoryFormModal();
    window.showToast("تم إضافة القسم بنجاح");
  } catch (err) {
    window.showToast("فشل إضافة القسم");
  }
};

window.deleteCategoryAdmin = async function(catId) {
  if (!confirm("هل أنت متأكد من رغبتك في حذف هذا القسم؟")) return;
  try {
    await db.collection("categories").doc(catId).delete();
    await loadCategoriesAdmin();
    window.showToast("تم حذف القسم");
  } catch (e) {
    window.showToast("فشل حذف القسم");
  }
};

// =================== WHOLESALE ACCOUNTS (مطابع وشركات) ADMIN ===================
async function loadCalligraphersAdmin() {
  try {
    const snap = await db.collection("calligraphers").get();
    calligraphersList = [];
    snap.forEach(d => calligraphersList.push({ id: d.id, ...d.data() }));
    renderCalligraphersAdminTable();
  } catch (e) {
    console.warn(e);
  }
}

function renderCalligraphersAdminTable() {
  const tbody = document.getElementById("adminCalligraphersTableBody");
  if (!tbody) return;

  if (calligraphersList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #64748B;">لا توجد مطابع أو شركات مسجلة. اضغط "إضافة حساب مطبعة / شركة جديد" بالأعلى لإنشاء حساب.</td></tr>`;
    return;
  }

  tbody.innerHTML = calligraphersList.map(c => `
    <tr>
      <td>
        <strong style="color: #0F172A;">${c.displayName || c.name || "مطبعة / شركة"}</strong>
      </td>
      <td><span style="color: #0284C7; font-weight: 700;">${c.email}</span></td>
      <td><span style="font-family: monospace; background: #F1F5F9; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700;">${c.password || "••••••••"}</span></td>
      <td>${c.phone || "غير مسجل"}</td>
      <td>
        <button class="btn btn-sm btn-navy" onclick="deleteCalligrapherAdmin('${c.id}', '${c.email}')"><i class="fa-solid fa-trash"></i> حذف الحساب</button>
      </td>
    </tr>
  `).join("");
}

window.openAddCalligrapherModal = function() {
  document.getElementById("calligrapherAdminForm").reset();
  document.getElementById("calligrapherFormModal").classList.add("active");
};

window.closeCalligrapherFormModal = function() {
  document.getElementById("calligrapherFormModal").classList.remove("active");
};

window.saveCalligrapherSubmit = async function(e) {
  e.preventDefault();
  const name = document.getElementById("calFormName").value.trim();
  const email = document.getElementById("calFormEmail").value.trim().toLowerCase();
  const password = document.getElementById("calFormPassword").value.trim();
  const phone = document.getElementById("calFormPhone").value.trim();
  const btn = document.getElementById("calFormSubmitBtn");
  btn.disabled = true;

  try {
    const id = "cal_" + Date.now();
    const payload = {
      id,
      name,
      displayName: name,
      email,
      password,
      phone,
      role: "calligrapher",
      isCalligrapher: true,
      createdAt: new Date().toISOString()
    };

    await db.collection("calligraphers").doc(id).set(payload);
    await db.collection("users").doc(email.replace(/[@.]/g, "_")).set(payload);

    await loadCalligraphersAdmin();
    window.closeCalligrapherFormModal();
    window.showToast(`تم إنشاء حساب المطبعة / الشركة (${name}) بنجاح ويمكنهم الدخول فوراً`);
  } catch (err) {
    window.showToast(err.message || "فشل إنشاء الحساب");
  } finally {
    btn.disabled = false;
  }
};

window.deleteCalligrapherAdmin = async function(calId, email) {
  if (!confirm("هل أنت متأكد من رغبتك في حذف هذا الحساب؟")) return;
  try {
    await db.collection("calligraphers").doc(calId).delete();
    if (email) {
      await db.collection("users").doc(email.replace(/[@.]/g, "_")).delete().catch(() => {});
    }
    await loadCalligraphersAdmin();
    window.showToast("تم حذف حساب المطبعة / الشركة");
  } catch (err) {
    window.showToast("فشل الحذف");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(user => {
    if (user) {
      const uEmail = (user.email || "").toLowerCase();
      if (uEmail === "admin@gmail.com" || uEmail === "admin@elfeqy.com" || uEmail === "admin@fiky.com") {
        unlockAdminView("admin");
      } else if (uEmail === "orders@fiky.com" || uEmail === "staff@fiky.com") {
        unlockAdminView("staff");
      } else {
        db.collection("users").doc(user.uid).get().then(snap => {
          if (snap.exists) {
            const r = snap.data().role;
            if (r === "admin" || snap.data().isAdmin) {
              unlockAdminView("admin");
            } else if (r === "staff" || r === "orders_staff") {
              unlockAdminView("staff");
            } else {
              lockAdminView();
            }
          } else {
            lockAdminView();
          }
        }).catch(() => lockAdminView());
      }
    } else {
      lockAdminView();
    }
  });
});
