import {
  initAuth,
  getCurrentUser,
  USER_ROLES,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  resetPassword,
  logoutUser
} from "./auth.js";
import {
  loadProducts,
  getProducts,
  setCategoryFilter,
  setSearchFilter,
  renderProducts
} from "./products.js";
import {
  initCart,
  addToCart,
  removeFromCart,
  updateItemQuantity,
  getCartTotals,
  submitOrder,
  updateCartUI
} from "./cart.js";
import { db, collection, query, where, getDocs } from "./firebase-config.js";

let selectedProductForCustomization = null;
let currentCustomQty = 1;
let uploadedFileBase64 = null;
let currentAuthTab = "login";

window.showToast = (message, type = "info") => {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "single-toast";
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 250);
  }, 3000);
};

const updateAuthHeaderUI = (userState) => {
  const badge = document.getElementById("userStatusBadge");
  const badgeText = document.getElementById("userStatusText");
  const authBtn = document.getElementById("authBtn");
  const authBtnText = document.getElementById("authBtnText");
  const adminLinkBtn = document.getElementById("adminLinkBtn");

  if (!badge || !authBtn) return;

  if (userState.user) {
    if (userState.role === USER_ROLES.ADMIN) {
      badge.className = "user-status-pill status-calligrapher";
      badgeText.textContent = "الإدارة";
      if (adminLinkBtn) adminLinkBtn.style.display = "inline-flex";
    } else if (userState.role === USER_ROLES.CALLIGRAPHER) {
      badge.className = "user-status-pill status-calligrapher";
      badgeText.textContent = "مطابع وشركات (جملة)";
      if (adminLinkBtn) adminLinkBtn.style.display = "none";
    } else {
      badge.className = "user-status-pill status-retail";
      badgeText.textContent = userState.profile?.displayName || "أفراد وعملاء";
      if (adminLinkBtn) adminLinkBtn.style.display = "none";
    }

    authBtnText.textContent = "خروج";
    authBtn.onclick = async () => {
      await logoutUser();
      window.showToast("تم تسجيل الخروج", "info");
    };
  } else {
    badge.className = "user-status-pill status-retail";
    badgeText.textContent = "أفراد وعملاء";
    if (adminLinkBtn) adminLinkBtn.style.display = "none";
    authBtnText.textContent = "تسجيل الدخول";
    authBtn.onclick = () => window.openAuthModal();
  }

  renderProducts();
  updateCartUI();
};

window.openCustomizationModal = (productId) => {
  const products = getProducts();
  const prod = products.find((p) => p.id === productId);
  if (!prod) return;

  selectedProductForCustomization = prod;
  currentCustomQty = 1;
  uploadedFileBase64 = null;

  const modal = document.getElementById("customizationModal");
  const modalTitle = document.getElementById("custModalTitle");
  const summary = document.getElementById("custModalSummary");
  const textInput = document.getElementById("custTextInput");
  const qtyEl = document.getElementById("modalQtyNum");
  const priceEl = document.getElementById("modalTotalPrice");
  const previewArea = document.getElementById("filePreviewArea");
  const fileInput = document.getElementById("custFileInput");

  if (fileInput) fileInput.value = "";
  if (previewArea) previewArea.style.display = "none";
  if (textInput) {
    textInput.value = "";
    textInput.placeholder = prod.customTextPlaceholder || "اكتب الأسماء أو البيانات المطلوب طباعتها هنا...";
  }

  const { role } = getCurrentUser();
  const activePrice = role === USER_ROLES.CALLIGRAPHER ? prod.wholesalePrice : prod.retailPrice;

  modalTitle.textContent = `طلب وتخصيص: ${prod.name}`;
  summary.innerHTML = `
    <div style="display: flex; gap: 0.85rem; align-items: center; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 0.75rem; border-radius: 8px;">
      <img src="${prod.image}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 6px;" alt="${prod.name}">
      <div>
        <h4 style="font-size: 0.95rem; font-weight: 800; color: #0F172A;">${prod.name}</h4>
        <div style="color: #A17C17; font-weight: 800; font-size: 0.95rem;">السعر: ${activePrice} ج.م ${
    role === USER_ROLES.CALLIGRAPHER ? "(سعر جملة)" : ""
  }</div>
        <div style="font-size: 0.75rem; color: #64748B;">المتبقي في المخزن: ${prod.stock} ${prod.unit || "قطعة"}</div>
      </div>
    </div>
  `;

  if (qtyEl) qtyEl.textContent = "1";
  if (priceEl) priceEl.textContent = `${activePrice} ج.م`;

  modal.classList.add("active");
};

window.closeCustomizationModal = () => {
  const modal = document.getElementById("customizationModal");
  if (modal) modal.classList.remove("active");
  selectedProductForCustomization = null;
};

window.modalChangeQty = (delta) => {
  if (!selectedProductForCustomization) return;
  const newQty = currentCustomQty + delta;
  if (newQty >= 1 && newQty <= (selectedProductForCustomization.stock || 999)) {
    currentCustomQty = newQty;
    const qtyEl = document.getElementById("modalQtyNum");
    const priceEl = document.getElementById("modalTotalPrice");
    const { role } = getCurrentUser();
    const activePrice =
      role === USER_ROLES.CALLIGRAPHER
        ? selectedProductForCustomization.wholesalePrice
        : selectedProductForCustomization.retailPrice;

    if (qtyEl) qtyEl.textContent = currentCustomQty;
    if (priceEl) priceEl.textContent = `${(activePrice * currentCustomQty).toLocaleString()} ج.م`;
  }
};

window.handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 8 * 1024 * 1024) {
    window.showToast("حجم الملف يجب ألا يتجاوز 8 ميجابايت", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedFileBase64 = e.target.result;
    const previewArea = document.getElementById("filePreviewArea");
    const previewImg = document.getElementById("filePreviewImg");
    if (previewArea && previewImg) {
      previewImg.src = uploadedFileBase64;
      previewArea.style.display = "inline-block";
    }
    window.showToast("تم إرفاق ملف التصميم بنجاح", "success");
  };
  reader.readAsDataURL(file);
};

window.clearUploadedFile = () => {
  uploadedFileBase64 = null;
  const previewArea = document.getElementById("filePreviewArea");
  const fileInput = document.getElementById("custFileInput");
  if (fileInput) fileInput.value = "";
  if (previewArea) previewArea.style.display = "none";
};

window.handleAddToCartCustom = (event) => {
  event.preventDefault();
  if (!selectedProductForCustomization) return;

  const textInput = document.getElementById("custTextInput");
  const customText = textInput ? textInput.value : "";

  addToCart(selectedProductForCustomization, currentCustomQty, customText, uploadedFileBase64);
  window.closeCustomizationModal();
  window.toggleCartDrawer(true);
};

window.quickAddToCart = (productId) => {
  const products = getProducts();
  const prod = products.find((p) => p.id === productId);
  if (prod) {
    addToCart(prod, 1, "", null);
  }
};

window.toggleCartDrawer = (forceOpen = false) => {
  const drawer = document.getElementById("cartDrawer");
  if (!drawer) return;

  if (forceOpen) {
    drawer.classList.add("active");
  } else {
    drawer.classList.toggle("active");
  }
};

window.changeCartItemQty = (cartItemId, newQty) => {
  updateItemQuantity(cartItemId, newQty);
};

window.removeCartItem = (cartItemId) => {
  removeFromCart(cartItemId);
};

window.openCheckoutModal = () => {
  window.toggleCartDrawer(false);
  const checkoutModal = document.getElementById("checkoutModal");
  const totalEl = document.getElementById("checkoutFinalTotal");
  const { subtotal } = getCartTotals();

  if (totalEl) totalEl.textContent = `${subtotal.toLocaleString()} ج.م`;

  const { user, profile } = getCurrentUser();
  if (user && profile) {
    const nameInput = document.getElementById("checkoutName");
    const phoneInput = document.getElementById("checkoutPhone1");
    const addressInput = document.getElementById("checkoutAddress");
    if (nameInput && profile.displayName) nameInput.value = profile.displayName;
    if (phoneInput && profile.phone) phoneInput.value = profile.phone;
    if (addressInput && profile.address) addressInput.value = profile.address;
  }

  if (checkoutModal) checkoutModal.classList.add("active");
};

window.closeCheckoutModal = () => {
  const checkoutModal = document.getElementById("checkoutModal");
  if (checkoutModal) checkoutModal.classList.remove("active");
};

window.handleFinalCheckout = async (event) => {
  event.preventDefault();
  const btn = document.getElementById("checkoutSubmitBtn");
  if (btn) btn.disabled = true;

  const customerData = {
    name: document.getElementById("checkoutName").value.trim(),
    phone1: document.getElementById("checkoutPhone1").value.trim(),
    phone2: document.getElementById("checkoutPhone2").value.trim(),
    address: document.getElementById("checkoutAddress").value.trim(),
    notes: document.getElementById("checkoutNotes").value.trim()
  };

  try {
    const order = await submitOrder(customerData);
    window.closeCheckoutModal();
    window.showToast(`تم إرسال طلبكم بنجاح برقم: ${order.orderNumber}`, "success");

    const trackInput = document.getElementById("trackOrderInput");
    if (trackInput) trackInput.value = order.orderNumber;
    window.openTrackOrderModal();
    window.searchTrackOrder(order.orderNumber);
  } catch (err) {
    window.showToast(err.message || "حدث خطأ أثناء إرسال الطلب", "error");
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.openAuthModal = () => {
  const modal = document.getElementById("authModal");
  if (modal) modal.classList.add("active");
};

window.closeAuthModal = () => {
  const modal = document.getElementById("authModal");
  if (modal) modal.classList.remove("active");
};

window.switchAuthTab = (tab) => {
  currentAuthTab = tab;
  const loginBtn = document.getElementById("tabLoginBtn");
  const regBtn = document.getElementById("tabRegisterBtn");
  const nameGroup = document.getElementById("regNameGroup");
  const calligrapherGroup = document.getElementById("regCalligrapherGroup");
  const forgotRow = document.getElementById("authForgotRow");
  const submitBtn = document.getElementById("authSubmitBtn");
  const modalTitle = document.getElementById("authModalTitle");

  if (tab === "login") {
    loginBtn.style.borderBottom = "2px solid var(--primary-gold)";
    loginBtn.style.color = "var(--primary-gold-dark)";
    regBtn.style.borderBottom = "none";
    regBtn.style.color = "var(--text-muted)";
    if (nameGroup) nameGroup.style.display = "none";
    if (calligrapherGroup) calligrapherGroup.style.display = "none";
    if (forgotRow) forgotRow.style.display = "flex";
    if (submitBtn) submitBtn.textContent = "تسجيل الدخول";
    if (modalTitle) modalTitle.textContent = "تسجيل الدخول إلى حسابك";
  } else {
    regBtn.style.borderBottom = "2px solid var(--primary-gold)";
    regBtn.style.color = "var(--primary-gold-dark)";
    loginBtn.style.borderBottom = "none";
    loginBtn.style.color = "var(--text-muted)";
    if (nameGroup) nameGroup.style.display = "block";
    if (calligrapherGroup) calligrapherGroup.style.display = "block";
    if (forgotRow) forgotRow.style.display = "none";
    if (submitBtn) submitBtn.textContent = "إنشاء حساب جديد";
    if (modalTitle) modalTitle.textContent = "إنشاء حساب جديد في الوكالة";
  }
};

window.handleEmailAuth = async (event) => {
  event.preventDefault();
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const submitBtn = document.getElementById("authSubmitBtn");
  if (submitBtn) submitBtn.disabled = true;

  try {
    if (currentAuthTab === "login") {
      await loginWithEmail(email, password);
      window.showToast("تم تسجيل الدخول بنجاح", "success");
    } else {
      const displayName = document.getElementById("authDisplayName").value.trim();
      const isCalligrapherReq = document.getElementById("authRequestCalligrapher").checked;
      await registerWithEmail(
        email,
        password,
        displayName,
        "",
        isCalligrapherReq ? USER_ROLES.CALLIGRAPHER : USER_ROLES.RETAIL
      );
      window.showToast(
        isCalligrapherReq
          ? "تم إنشاء الحساب وسيتم تفعيل سعر الجملة بعد اعتماد الإدارة"
          : "تم إنشاء الحساب بنجاح",
        "success"
      );
    }
    window.closeAuthModal();
  } catch (err) {
    window.showToast(err.message || "فشل تسجيل الدخول", "error");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
};

window.handleGoogleAuth = async () => {
  try {
    await loginWithGoogle();
    window.showToast("تم الدخول بحساب Google بنجاح", "success");
    window.closeAuthModal();
  } catch (err) {
    window.showToast("تعذر الدخول بحساب Google: " + err.message, "error");
  }
};

window.handleForgotPassword = async () => {
  const email = document.getElementById("authEmail").value.trim();
  if (!email) {
    window.showToast("اكتب بريدك الإلكتروني أولاً في خانة البريد", "error");
    return;
  }
  try {
    await resetPassword(email);
    window.showToast("تم إرسال رابط إعادة تعيين كلمة المرور لبريدك", "success");
  } catch (err) {
    window.showToast("تعذر الإرسال: " + err.message, "error");
  }
};

window.openTrackOrderModal = () => {
  const modal = document.getElementById("trackModal");
  if (modal) modal.classList.add("active");
};

window.closeTrackModal = () => {
  const modal = document.getElementById("trackModal");
  if (modal) modal.classList.remove("active");
};

window.searchTrackOrder = async (directNumber = null) => {
  const input = document.getElementById("trackOrderInput");
  const orderNum = directNumber || (input ? input.value.trim() : "");
  const resultArea = document.getElementById("trackResultArea");
  if (!orderNum || !resultArea) return;

  resultArea.innerHTML = `<div style="text-align: center; padding: 1.5rem; color: #64748B;"><i class="fa-solid fa-spinner fa-spin"></i> جاري البحث...</div>`;

  try {
    const q = query(collection(db, "orders"), where("orderNumber", "==", orderNum));
    const snap = await getDocs(q);

    if (snap.empty) {
      resultArea.innerHTML = `
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 1.5rem; text-align: center; border-radius: 8px;">
          <i class="fa-solid fa-circle-question" style="font-size: 1.75rem; color: #A17C17; margin-bottom: 0.5rem;"></i>
          <p style="font-weight: 700; color: #0F172A;">لم يتم العثور على طلب برقم: ${orderNum}</p>
        </div>
      `;
      return;
    }

    const orderData = snap.docs[0].data();
    const statusMap = {
      pending: { title: "طلبكم قيد المراجعة والتأكيد", color: "#A17C17" },
      processing: { title: "تم قبول الطلب - جاري الطباعة والتنفيذ", color: "#0284C7" },
      ready: { title: "الطلب جاهز للاستلام", color: "#7C3AED" },
      completed: { title: "تم تسليم الطلب بنجاح", color: "#16A34A" }
    };

    const statusInfo = statusMap[orderData.status] || statusMap.pending;

    resultArea.innerHTML = `
      <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; padding: 1.25rem; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong style="color: #A17C17; font-size: 1.05rem;">رقم الطلب: ${orderData.orderNumber}</strong>
          <span style="font-size: 0.8rem; color: #64748B;">${new Date(orderData.createdAt).toLocaleDateString("ar-EG")}</span>
        </div>

        <div style="margin-bottom: 1rem; padding: 0.75rem; background: #FFFFFF; border-radius: 6px; border: 1px solid #E2E8F0;">
          <div style="font-weight: 800; color: ${statusInfo.color}; font-size: 0.95rem;">${statusInfo.title}</div>
        </div>

        ${
          orderData.estimatedDate
            ? `<div style="background: #FEF3C7; border: 1px solid #FDE68A; padding: 0.6rem; border-radius: 6px; font-size: 0.88rem; color: #92400E; margin-bottom: 0.75rem;">
                <i class="fa-regular fa-calendar-check ml-1"></i> موعد الاستلام المحدد: <strong>${orderData.estimatedDate}</strong>
               </div>`
            : `<div style="font-size: 0.82rem; color: #64748B; margin-bottom: 0.75rem;">المدة التقديرية: ${orderData.estimatedDuration || "2 - 3 أيام"}</div>`
        }

        <div style="font-size: 0.85rem; line-height: 1.8;">
          <div><strong>الاسم:</strong> ${orderData.customerName}</div>
          <div><strong>العنوان:</strong> ${orderData.address}</div>
          <div><strong>الإجمالي:</strong> <strong style="color: #A17C17;">${orderData.totalPrice} ج.م</strong></div>
        </div>
      </div>
    `;
  } catch (e) {
    resultArea.innerHTML = `<div style="color: #DC2626; font-size: 0.85rem;">تعذر جلب حالة الطلب حالياً.</div>`;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initAuth((userState) => {
    updateAuthHeaderUI(userState);
  });

  loadProducts();
  initCart();

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      setSearchFilter(e.target.value);
    });
  }

  const chips = document.querySelectorAll(".category-tab-btn");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const cat = chip.getAttribute("data-cat");
      setCategoryFilter(cat);
    });
  });
});
