import {
  db,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "./firebase-config.js";
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from "./data-seed.js";
import { getCurrentUser, USER_ROLES } from "./auth.js";

let ordersList = [];
let productsList = [];
let usersList = [];
let unsubscribeOrders = null;

export const initAdminDashboard = async () => {
  setupOrdersListener();
  await loadAdminProducts();
  await loadAdminUsers();
  calculateAnalytics();
};

export const setupOrdersListener = () => {
  try {
    const ordersQuery = query(collection(db, "orders"));
    unsubscribeOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        ordersList = [];
        snapshot.forEach((d) => {
          ordersList.push({ id: d.id, ...d.data() });
        });
        ordersList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        renderOrdersTable();
        calculateAnalytics();
      },
      (error) => {
        console.warn("Orders listener error:", error);
      }
    );
  } catch (err) {
    console.error("Failed to setup orders listener:", err);
  }
};

export const loadAdminProducts = async () => {
  try {
    const snap = await getDocs(collection(db, "products"));
    productsList = [];
    if (snap.empty) {
      productsList = [...INITIAL_PRODUCTS];
    } else {
      snap.forEach((d) => productsList.push({ id: d.id, ...d.data() }));
    }
    renderProductsTable();
  } catch (e) {
    productsList = [...INITIAL_PRODUCTS];
    renderProductsTable();
  }
};

export const loadAdminUsers = async () => {
  try {
    const snap = await getDocs(collection(db, "users"));
    usersList = [];
    snap.forEach((d) => usersList.push({ id: d.id, ...d.data() }));
    renderUsersTable();
  } catch (e) {
    usersList = [];
  }
};

export const calculateAnalytics = () => {
  const totalRevenue = ordersList.reduce((sum, o) => sum + (o.status !== "cancelled" ? (o.totalPrice || 0) : 0), 0);
  const totalPiecesSold = ordersList.reduce((sum, o) => {
    if (o.status === "cancelled") return sum;
    return sum + (o.itemsCount || o.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0);
  }, 0);
  const pendingOrders = ordersList.filter((o) => o.status === "pending" || !o.status).length;
  const processingOrders = ordersList.filter((o) => o.status === "processing").length;
  const completedOrders = ordersList.filter((o) => o.status === "completed" || o.status === "ready").length;

  const wholesaleOrders = ordersList.filter((o) => o.isCalligrapherOrder).length;
  const retailOrders = ordersList.length - wholesaleOrders;

  const revEl = document.getElementById("statTotalRevenue");
  const piecesEl = document.getElementById("statTotalPieces");
  const pendingEl = document.getElementById("statPendingOrders");
  const compEl = document.getElementById("statCompletedOrders");
  const wholesaleRatioEl = document.getElementById("statWholesaleRatio");

  if (revEl) revEl.textContent = `${totalRevenue.toLocaleString()} ج.م`;
  if (piecesEl) piecesEl.textContent = `${totalPiecesSold} قطعة`;
  if (pendingEl) pendingEl.textContent = `${pendingOrders} طلب`;
  if (compEl) compEl.textContent = `${completedOrders} طلب`;
  if (wholesaleRatioEl) wholesaleRatioEl.textContent = `${wholesaleOrders} جملة / ${retailOrders} قطاعي`;
};

export const renderOrdersTable = (statusFilter = "all") => {
  const tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;

  let list = ordersList;
  if (statusFilter !== "all") {
    list = ordersList.filter((o) => o.status === statusFilter);
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4">لا توجد طلبات في هذا القسم حالياً</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((order) => {
      const statusMap = {
        pending: { label: "قيد المراجعة والتأكيد", class: "status-pending" },
        processing: { label: "تم القبول - جاري التنفيذ", class: "status-processing" },
        ready: { label: "جاهز للتسليم / الشحن", class: "status-ready" },
        completed: { label: "تم التسليم بنجاح", class: "status-completed" },
        cancelled: { label: "ملغي", class: "status-cancelled" }
      };

      const currentStatus = statusMap[order.status] || statusMap.pending;
      const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString("ar-EG") : "اليوم";

      return `
      <tr class="order-row ${order.isCalligrapherOrder ? "row-calligrapher" : ""}">
        <td>
          <strong>${order.orderNumber || order.id.slice(0, 8)}</strong>
          ${order.isCalligrapherOrder ? `<span class="badge-calligrapher-tag">خطاط / جملة</span>` : ""}
          <div class="order-date-sub">${dateStr}</div>
        </td>
        <td>
          <div class="client-name font-bold">${order.customerName || "عميل بدون اسم"}</div>
          <div class="client-phone"><a href="tel:${order.phone1}"><i class="fa-solid fa-phone"></i> ${order.phone1}</a></div>
          ${order.phone2 ? `<div class="client-phone-secondary text-muted"><i class="fa-solid fa-phone-flip"></i> ${order.phone2}</div>` : ""}
          <div class="client-address text-sm"><i class="fa-solid fa-location-dot"></i> ${order.address || "العنوان غير محدد"}</div>
        </td>
        <td>
          <div class="order-items-preview">
            ${(order.items || [])
              .map(
                (item) => `
              <div class="order-item-pill">
                <span class="font-medium">${item.name}</span> (${item.quantity} ${item.unit || "قطع"})
                ${item.customText ? `<div class="item-custom-note"><i class="fa-solid fa-quote-right"></i> ${item.customText}</div>` : ""}
                ${
                  item.uploadedImage
                    ? `<button class="btn-view-design" onclick="window.previewUploadedDesign('${item.uploadedImage}')"><i class="fa-solid fa-image"></i> عرض التصميم</button>`
                    : ""
                }
              </div>
            `
              )
              .join("")}
          </div>
        </td>
        <td class="font-bold text-primary">${order.totalPrice?.toLocaleString() || 0} ج.م</td>
        <td>
          <span class="status-badge ${currentStatus.class}">${currentStatus.label}</span>
          ${order.estimatedDuration ? `<div class="text-xs text-muted mt-1"><i class="fa-regular fa-clock"></i> ${order.estimatedDuration}</div>` : ""}
          ${order.estimatedDate ? `<div class="text-xs font-semibold text-accent mt-0.5"><i class="fa-regular fa-calendar-check"></i> ${order.estimatedDate}</div>` : ""}
        </td>
        <td>
          <div class="table-actions-flex">
            <button class="btn btn-sm btn-manage-order" onclick="window.openManageOrderModal('${order.id}')" title="تعديل الحالة وتحديد موعد التسليم">
              <i class="fa-solid fa-sliders"></i> إدارة الطلب
            </button>
            <a href="https://wa.me/2${order.phone1?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `مرحباً بك ${order.customerName}، بخصوص طلبكم رقم ${order.orderNumber} من وكالة الفقي للطباعة.`
      )}" target="_blank" class="btn btn-sm btn-whatsapp" title="تواصل واتساب">
              <i class="fa-brands fa-whatsapp"></i>
            </a>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
};

export const updateOrderStatusAndTimeline = async (orderId, newStatus, estimatedDuration, estimatedDate, adminNotes = "") => {
  try {
    const orderDocRef = doc(db, "orders", orderId);
    await updateDoc(orderDocRef, {
      status: newStatus,
      estimatedDuration: estimatedDuration || "2 - 3 أيام عمل",
      estimatedDate: estimatedDate || "",
      adminNotes: adminNotes,
      updatedAt: new Date().toISOString()
    });
    window.showToast("تم تحديث حالة الطلب وموعد التسليم بنجاح", "success");
  } catch (err) {
    console.error("Error updating order:", err);
    window.showToast("حدث خطأ أثناء التحديث", "error");
  }
};

export const renderProductsTable = () => {
  const tbody = document.getElementById("adminProductsTableBody");
  if (!tbody) return;

  if (productsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">لا توجد منتجات مسجلة</td></tr>`;
    return;
  }

  tbody.innerHTML = productsList
    .map((p) => {
      return `
      <tr>
        <td>
          <img src="${p.image}" alt="${p.name}" class="admin-prod-thumb" onerror="this.src='https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=200&q=80'">
        </td>
        <td>
          <strong>${p.name}</strong>
          <div class="text-xs text-muted">${p.category || "عام"}</div>
        </td>
        <td class="font-bold text-success">${p.retailPrice} ج.م</td>
        <td class="font-bold text-warning">${p.wholesalePrice} ج.م</td>
        <td>
          <span class="stock-pill ${p.stock < 15 ? "stock-pill-low" : ""}">${p.stock} ${p.unit || "قطعة"}</span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="window.editProductModal('${p.id}')">
            <i class="fa-solid fa-pen"></i> تعديل
          </button>
          <button class="btn btn-sm btn-danger-outline" onclick="window.deleteProductAdmin('${p.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
    })
    .join("");
};

export const saveProductAdmin = async (productData) => {
  try {
    const prodId = productData.id || "prod_" + Date.now();
    await setDoc(doc(db, "products", prodId), { ...productData, id: prodId });
    await loadAdminProducts();
    window.showToast("تم حفظ المنتج بنجاح", "success");
  } catch (err) {
    console.error("Error saving product:", err);
    window.showToast("فشل حفظ المنتج", "error");
  }
};

export const deleteProductAdmin = async (productId) => {
  if (!confirm("هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟")) return;
  try {
    await deleteDoc(doc(db, "products", productId));
    await loadAdminProducts();
    window.showToast("تم حذف المنتج", "info");
  } catch (err) {
    console.error("Error deleting product:", err);
    window.showToast("فشل حذف المنتج", "error");
  }
};

export const renderUsersTable = () => {
  const tbody = document.getElementById("adminUsersTableBody");
  if (!tbody) return;

  if (usersList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">لا يوجد مستخدمون مسجلون بعد</td></tr>`;
    return;
  }

  tbody.innerHTML = usersList
    .map((u) => {
      const isCalligrapher = u.isCalligrapher || u.role === USER_ROLES.CALLIGRAPHER;
      return `
      <tr>
        <td>
          <strong>${u.displayName || "مستخدم"}</strong>
          <div class="text-xs text-muted">${u.email || ""}</div>
        </td>
        <td>${u.phone || "غير مسجل"}</td>
        <td>
          ${
            isCalligrapher
              ? `<span class="badge-status-approved"><i class="fa-solid fa-check"></i> مطابع وشركات (جملة)</span>`
              : `<span class="badge-status-retail">أفراد وعملاء (قطاعي)</span>`
          }
          ${u.calligrapherRequested && !isCalligrapher ? `<div class="badge-requested">طلب اعتماد مطبعة / شركة</div>` : ""}
        </td>
        <td>
          <button class="btn btn-sm ${isCalligrapher ? "btn-outline-warning" : "btn-primary"}" onclick="window.toggleCalligrapherStatus('${u.uid}', ${!isCalligrapher})">
            ${isCalligrapher ? '<i class="fa-solid fa-user-xmark"></i> إلغاء سعر الجملة' : '<i class="fa-solid fa-building-user"></i> اعتماد مطبعة / شركة (جملة)'}
          </button>
        </td>
      </tr>
    `;
    })
    .join("");
};

export const toggleCalligrapherStatus = async (uid, shouldBeCalligrapher) => {
  try {
    await updateDoc(doc(db, "users", uid), {
      isCalligrapher: shouldBeCalligrapher,
      role: shouldBeCalligrapher ? USER_ROLES.CALLIGRAPHER : USER_ROLES.RETAIL
    });
    await loadAdminUsers();
    window.showToast(shouldBeCalligrapher ? "تم اعتماد الحساب كمطبعة / شركة وتفعيل أسعار الجملة" : "تم تحويل الحساب إلى أفراد وعملاء", "success");
  } catch (err) {
    console.error("Error updating user status:", err);
    window.showToast("فشل تحديث صلاحيات الحساب", "error");
  }
};
