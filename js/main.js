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
const googleProvider = new firebase.auth.GoogleAuthProvider();

const DEFAULT_CATEGORIES = [
  { id: "all", name: "جميع الأقسام", icon: "fa-border-all" },
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

const INITIAL_PRODUCTS = [
  {
    id: "prod-shield-mem-01",
    name: "درع كريستال شرفي تذكاري محفور بالليزر مع علبة قطيفة",
    category: "memorial-shields",
    retailPrice: 190,
    wholesalePrice: 135,
    stock: 45,
    unit: "قطعة",
    description: "كريستال K9 نقي عالي البريق، حفر ليزر ثلاثي الأبعاد أو طباعة UV ملونة مقاومة للخدش.",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
    badge: "فخامة"
  },
  {
    id: "prod-flag-01",
    name: "أعلام شركات ومؤسسات قماش ستان فاخر دبل فيس مع سارية",
    category: "flags",
    retailPrice: 160,
    wholesalePrice: 110,
    stock: 75,
    unit: "علم كامل",
    description: "طباعة ديجيتال سبلميشن ألوان زاهية ومقاومة للشمس والغسيل مع شراشيب ذهبية وقاعدة مكتبية أو أرضية.",
    image: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=800&q=80",
    badge: "ستان ملكي"
  },
  {
    id: "prod-cert-01",
    name: "شهادة تقدير كوشيه فاخرة مع غلاف جلدي مذهب",
    category: "certificates",
    retailPrice: 45,
    wholesalePrice: 28,
    stock: 120,
    unit: "قطعة",
    description: "ورق كوشيه 350 جرام مع بصمة ذهبية حرارية، غلاف كرتوني فاخر مبطن بالجلد الأسود أو الكحلي.",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80",
    badge: "الأكثر طلباً"
  },
  {
    id: "prod-cutting-01",
    name: "قص وتقطيع وتفريغ ليزر وراوتر CNC للأكريليك والخشب",
    category: "cutting",
    retailPrice: 95,
    wholesalePrice: 65,
    stock: 300,
    unit: "متر طولي / تفريغ",
    description: "تفريغ حروف بارزة وأشكال هندسية بدقة ليزر متناهية على خامات الأكريليك، MDF، والخشب الطبيعي.",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    badge: "دقة ليزر"
  },
  {
    id: "prod-shield-hon-01",
    name: "درع خشبي ملكي فاخر مطعم بالنحاس المطلي بالذهب للتكريم",
    category: "honor-shields",
    retailPrice: 220,
    wholesalePrice: 160,
    stock: 30,
    unit: "قطعة",
    description: "خشب زان طبيعي بتشطيب فاخر مع صفيحة نحاسية محفورة ومطلية بالذهب تدوم لسنوات.",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
    badge: "حصري"
  },
  {
    id: "prod-uniform-01",
    name: "تيشرت ويونيفورم شركات قطن 100% مع طباعة DTF حرارية",
    category: "uniforms",
    retailPrice: 130,
    wholesalePrice: 85,
    stock: 180,
    unit: "قطعة",
    description: "قطن ميلتون مصري فائق النعومة، طباعة DTF عالية الثبات تقاوم الغسيل المتكرر دون بهتان.",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    badge: "قطن 100%"
  },
  {
    id: "prod-mug-01",
    name: "مج سحري حراري وهدايا دعائية بطباعة سبلميشن بالصورة والاسم",
    category: "mugs-gifts",
    retailPrice: 65,
    wholesalePrice: 40,
    stock: 150,
    unit: "قطعة",
    description: "مج سيراميك أسود يتغير لونه ويظهر التصميم المخصص بوضوح عند سكب المشروبات الساخنة.",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    badge: "هدايا مميزة"
  },
  {
    id: "prod-card-01",
    name: "كروت شخصية بيزنس كارد فاخرة (1000 كارت سلوفان مطفي)",
    category: "cards-prints",
    retailPrice: 180,
    wholesalePrice: 125,
    stock: 90,
    unit: "علبة 1000 كارت",
    description: "ورق كوشيه 350 جرام، طباعة وجهين بألوان دقيقة مع طبقة سلوفان غير لامع لحماية الكارت.",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
    badge: "عرض 1000 كارت"
  },
  {
    id: "prod-logo-ad-01",
    name: "يافطة بنر خارجي فليكس ورول اب ستاند إعلاني متنقل",
    category: "logos-ads",
    retailPrice: 380,
    wholesalePrice: 290,
    stock: 40,
    unit: "ستاند كامل",
    description: "هيكل ألومنيوم ثقيل مع طباعة سلوفان غير عاكسة وحقيبة قماشية مبطنة للحمل في المعارض والفعاليات.",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
    badge: "الأكثر مبيعاً"
  },
  {
    id: "prod-stamp-01",
    name: "أختام أوتوماتيك وسريلات فلاش ليزر عالية الدقة",
    category: "serials-stamps",
    retailPrice: 85,
    wholesalePrice: 55,
    stock: 110,
    unit: "ختم كامل",
    description: "ماكينات أختام أوتوماتيك نمساوية مع حفر رابر أو فلاش بالليزر لبصمة واضحة ونقية بدون تلطيخ.",
    image: "https://images.unsplash.com/photo-1583521214690-73421a1829a9?auto=format&fit=crop&w=800&q=80",
    badge: "فلاش ليزر"
  }
];

let currentUser = null;
let currentRole = "retail";
let userProfile = null;

let products = [...INITIAL_PRODUCTS];
let categories = [...DEFAULT_CATEGORIES];
let activeCategory = "all";
let searchFilter = "";

let cart = [];
const CART_KEY = "fiky_cart_store";
const LOCAL_SESSION_KEY = "fiky_local_session";

let selectedProd = null;
let modalQty = 1;
let uploadedFile = null;

let activeAuthMode = "retail";
let retailSubTab = "login";

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
  }, 3500);
};

function initCartFromStorage() {
  try {
    const data = localStorage.getItem(CART_KEY);
    if (data) cart = JSON.parse(data);
  } catch (e) {
    cart = [];
  }
  updateCartDisplay();
}

function saveCartToStorage() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartDisplay();
}

function updateCartDisplay() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const badge = document.getElementById("headerCartCount");
  if (badge) {
    badge.textContent = totalCount;
    badge.style.display = totalCount > 0 ? "inline-flex" : "none";
  }

  const subtotalEl = document.getElementById("cartSubtotal");
  const countEl = document.getElementById("cartTotalCount");
  if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString()} ج.م`;
  if (countEl) countEl.textContent = `${totalCount} قطعة`;

  const drawerList = document.getElementById("cartDrawerItems");
  const emptyState = document.getElementById("cartEmptyState");
  const cartFooter = document.getElementById("cartFooter");

  if (drawerList && emptyState && cartFooter) {
    if (cart.length === 0) {
      drawerList.innerHTML = "";
      emptyState.style.display = "block";
      cartFooter.style.display = "none";
    } else {
      emptyState.style.display = "none";
      cartFooter.style.display = "block";
      drawerList.innerHTML = cart.map(item => `
        <div style="display: flex; gap: 0.75rem; padding-bottom: 0.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #E2E8F0;">
          <img src="${item.image}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px;" alt="${item.name}">
          <div style="flex: 1;">
            <div style="font-weight: 800; font-size: 0.9rem; color: #0F172A; margin-bottom: 0.2rem;">${item.name}</div>
            <div style="font-size: 0.85rem; color: #C59B27; font-weight: 800;">${item.price} ج.م × ${item.quantity} = ${(item.price * item.quantity).toLocaleString()} ج.م</div>
            ${item.customText ? `<div style="font-size: 0.78rem; color: #64748B; margin-top: 0.2rem;">نص: "${item.customText}"</div>` : ""}
            ${item.uploadedFile ? `<div style="font-size: 0.75rem; color: #0284C7;"><i class="fa-solid fa-image"></i> تم إرفاق ملف</div>` : ""}
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.4rem;">
              <div class="stepper-clean" style="transform: scale(0.85); transform-origin: right center;">
                <button type="button" class="stepper-btn" onclick="updateItemQty('${item.cartId}', ${item.quantity - 1})">-</button>
                <span class="stepper-num">${item.quantity}</span>
                <button type="button" class="stepper-btn" onclick="updateItemQty('${item.cartId}', ${item.quantity + 1})">+</button>
              </div>
              <button style="background: none; border: none; color: #DC2626; cursor: pointer; font-size: 0.85rem;" onclick="removeCartItem('${item.cartId}')" title="حذف">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `).join("");
    }
  }
}

window.toggleCartDrawer = function() {
  if (!currentUser) {
    window.showToast("الرجاء تسجيل الدخول أولاً لعرض عربة التسوق");
    setTimeout(() => window.openAuthModal(), 300);
    return;
  }
  const drawer = document.getElementById("cartDrawer");
  if (drawer) drawer.classList.toggle("active");
};

window.updateItemQty = function(cartId, qty) {
  const item = cart.find(i => i.cartId === cartId);
  if (item) {
    if (qty > 0) item.quantity = qty;
    else cart = cart.filter(i => i.cartId !== cartId);
    saveCartToStorage();
  }
};

window.removeCartItem = function(cartId) {
  cart = cart.filter(i => i.cartId !== cartId);
  saveCartToStorage();
  window.showToast("تم حذف الصنف من العربة");
};

window.quickAddToCart = function(prodId) {
  if (!currentUser) {
    window.showToast("الرجاء تسجيل الدخول أولاً لإضافة منتجات للعربة");
    setTimeout(() => window.openAuthModal(), 300);
    return;
  }

  const p = products.find(i => i.id === prodId);
  if (!p) return;
  const isWholesale = currentRole === "calligrapher";
  const price = isWholesale ? p.wholesalePrice : p.retailPrice;

  cart.push({
    cartId: "c_" + Date.now() + Math.random().toString(36).substr(2, 4),
    id: p.id,
    name: p.name,
    price: price,
    quantity: 1,
    image: p.image,
    customText: "",
    uploadedFile: null,
    unit: p.unit || "قطعة"
  });
  saveCartToStorage();
  window.showToast("تمت الإضافة لعربة التسوق بنجاح");
};

window.openCustomizationModal = function(prodId) {
  if (!currentUser) {
    window.showToast("الرجاء تسجيل الدخول أولاً لطلب وتخصيص المنتجات");
    setTimeout(() => window.openAuthModal(), 300);
    return;
  }

  const p = products.find(i => i.id === prodId);
  if (!p) return;
  selectedProd = p;
  modalQty = 1;
  uploadedFile = null;

  const title = document.getElementById("custModalTitle");
  const summary = document.getElementById("custModalSummary");
  const textInput = document.getElementById("custTextInput");
  const qtyNum = document.getElementById("modalQtyNum");
  const totalPrice = document.getElementById("modalTotalPrice");
  const fileInput = document.getElementById("custFileInput");
  const filePreviewArea = document.getElementById("filePreviewArea");

  if (fileInput) fileInput.value = "";
  if (filePreviewArea) filePreviewArea.style.display = "none";
  if (textInput) textInput.value = "";

  const isWholesale = currentRole === "calligrapher";
  const price = isWholesale ? p.wholesalePrice : p.retailPrice;

  if (title) title.textContent = `طلب وتخصيص: ${p.name}`;
  if (summary) {
    summary.innerHTML = `
      <div style="display: flex; gap: 0.85rem; align-items: center; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 0.75rem; border-radius: 8px;">
        <img src="${p.image}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 6px;" alt="${p.name}">
        <div>
          <h4 style="font-size: 0.95rem; font-weight: 800; color: #0F172A;">${p.name}</h4>
          <div style="color: #A17C17; font-weight: 800; font-size: 0.95rem;">السعر: ${price} ج.م ${isWholesale ? "(سعر جملة)" : ""}</div>
          <div style="font-size: 0.75rem; color: #64748B;">المتبقي في المخزن: ${p.stock} ${p.unit || "قطعة"}</div>
        </div>
      </div>
    `;
  }

  if (qtyNum) qtyNum.textContent = "1";
  if (totalPrice) totalPrice.textContent = `${price} ج.م`;

  const modal = document.getElementById("customizationModal");
  if (modal) modal.classList.add("active");
};

window.closeCustomizationModal = function() {
  const modal = document.getElementById("customizationModal");
  if (modal) modal.classList.remove("active");
  selectedProd = null;
};

window.modalChangeQty = function(delta) {
  if (!selectedProd) return;
  const newQty = modalQty + delta;
  if (newQty >= 1 && newQty <= (selectedProd.stock || 999)) {
    modalQty = newQty;
    const isWholesale = currentRole === "calligrapher";
    const price = isWholesale ? selectedProd.wholesalePrice : selectedProd.retailPrice;
    document.getElementById("modalQtyNum").textContent = modalQty;
    document.getElementById("modalTotalPrice").textContent = `${(price * modalQty).toLocaleString()} ج.م`;
  }
};

window.handleFileSelect = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    uploadedFile = evt.target.result;
    document.getElementById("filePreviewImg").src = uploadedFile;
    document.getElementById("filePreviewArea").style.display = "inline-block";
    window.showToast("تم اختيار ملف التصميم بنجاح");
  };
  reader.readAsDataURL(file);
};

window.clearUploadedFile = function() {
  uploadedFile = null;
  document.getElementById("custFileInput").value = "";
  document.getElementById("filePreviewArea").style.display = "none";
};

window.handleAddToCartCustom = function(e) {
  e.preventDefault();
  if (!selectedProd) return;
  const customText = document.getElementById("custTextInput").value.trim();
  const isWholesale = currentRole === "calligrapher";
  const price = isWholesale ? selectedProd.wholesalePrice : selectedProd.retailPrice;

  cart.push({
    cartId: "c_" + Date.now() + Math.random().toString(36).substr(2, 4),
    id: selectedProd.id,
    name: selectedProd.name,
    price: price,
    quantity: modalQty,
    image: selectedProd.image,
    customText: customText,
    uploadedFile: uploadedFile,
    unit: selectedProd.unit || "قطعة"
  });

  saveCartToStorage();
  window.closeCustomizationModal();
  window.toggleCartDrawer();
  window.showToast("تمت إضافة طلبك المخصص لعربة التسوق");
};

let uploadedReceiptFile = null;
let selectedPayMethod = "vodafone_cash";

window.selectPaymentMethod = function(method) {
  selectedPayMethod = method;
  const vodaCard = document.getElementById("payMethodVodaCard");
  const instaCard = document.getElementById("payMethodInstaCard");
  const vodaBox = document.getElementById("vodafoneCashBox");
  const instaBox = document.getElementById("instapayBox");
  const radioVoda = document.getElementById("payRadioVoda");
  const radioInsta = document.getElementById("payRadioInsta");

  if (method === "vodafone_cash") {
    if (vodaCard) vodaCard.classList.add("active");
    if (instaCard) instaCard.classList.remove("active");
    if (vodaBox) vodaBox.style.display = "block";
    if (instaBox) instaBox.style.display = "none";
    if (radioVoda) radioVoda.checked = true;
  } else {
    if (instaCard) instaCard.classList.add("active");
    if (vodaCard) vodaCard.classList.remove("active");
    if (instaBox) instaBox.style.display = "block";
    if (vodaBox) vodaBox.style.display = "none";
    if (radioInsta) radioInsta.checked = true;
  }
};

window.copyPaymentNumber = function(text, btn) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      const origHtml = btn.innerHTML;
      btn.innerHTML = `<i class="fa-solid fa-check"></i> تم النسخ!`;
      btn.style.background = "#16A34A";
      setTimeout(() => {
        btn.innerHTML = origHtml;
        btn.style.background = "";
      }, 2000);
      window.showToast("تم نسخ الرقم بنجاح");
    }).catch(() => {
      window.showToast(`الرقم: ${text}`);
    });
  } else {
    window.showToast(`الرقم: ${text}`);
  }
};

window.handleReceiptFileSelect = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    uploadedReceiptFile = evt.target.result;
    const imgEl = document.getElementById("receiptPreviewImg");
    const areaEl = document.getElementById("receiptPreviewArea");
    if (imgEl) imgEl.src = uploadedReceiptFile;
    if (areaEl) areaEl.style.display = "inline-block";
    window.showToast("تم إرفاق إيصال التحويل بنجاح");
  };
  reader.readAsDataURL(file);
};

window.clearReceiptFile = function() {
  uploadedReceiptFile = null;
  const fileInput = document.getElementById("paymentReceiptInput");
  const areaEl = document.getElementById("receiptPreviewArea");
  if (fileInput) fileInput.value = "";
  if (areaEl) areaEl.style.display = "none";
};

window.openCheckoutModal = function() {
  window.toggleCartDrawer();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalEl = document.getElementById("checkoutFinalTotal");
  const totalVodaEl = document.getElementById("checkoutTotalVoda");
  const totalInstaEl = document.getElementById("checkoutTotalInsta");

  const formattedTotal = `${subtotal.toLocaleString()} ج.م`;
  if (totalEl) totalEl.textContent = formattedTotal;
  if (totalVodaEl) totalVodaEl.textContent = formattedTotal;
  if (totalInstaEl) totalInstaEl.textContent = formattedTotal;

  window.selectPaymentMethod(selectedPayMethod || "vodafone_cash");

  if (currentUser && userProfile) {
    if (document.getElementById("checkoutName") && userProfile.displayName) {
      document.getElementById("checkoutName").value = userProfile.displayName;
    }
    if (document.getElementById("checkoutPhone1") && userProfile.phone) {
      document.getElementById("checkoutPhone1").value = userProfile.phone;
    }
  }

  const modal = document.getElementById("checkoutModal");
  if (modal) modal.classList.add("active");
};

window.closeCheckoutModal = function() {
  const modal = document.getElementById("checkoutModal");
  if (modal) modal.classList.remove("active");
};

window.handleFinalCheckout = async function(e) {
  e.preventDefault();
  if (cart.length === 0) {
    window.showToast("عربة التسوق فارغة");
    return;
  }

  const name = document.getElementById("checkoutName").value.trim();
  const phone1 = document.getElementById("checkoutPhone1").value.trim();
  const phone2 = document.getElementById("checkoutPhone2").value.trim();
  const address = document.getElementById("checkoutAddress").value.trim();
  const notes = document.getElementById("checkoutNotes").value.trim();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const orderNumber = "FK-" + Math.floor(100000 + Math.random() * 900000);

  const payMethodTitle = selectedPayMethod === "instapay" ? "انستاباي InstaPay" : "فودافون كاش";

  const orderPayload = {
    orderNumber,
    customerName: name,
    phone1,
    phone2,
    address,
    notes,
    items: cart,
    itemsCount: totalCount,
    totalPrice: subtotal,
    isCalligrapherOrder: currentRole === "calligrapher",
    paymentMethod: selectedPayMethod,
    paymentMethodTitle: payMethodTitle,
    paymentReceipt: uploadedReceiptFile || null,
    paymentStatus: uploadedReceiptFile ? "تم إرفاق الإيصال" : "بانتظار التحويل",
    status: "pending",
    estimatedDuration: "2 - 3 أيام عمل",
    estimatedDate: "",
    createdAt: new Date().toISOString()
  };

  const submitBtn = document.getElementById("checkoutSubmitBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري حفظ وإرسال الطلب...`;
  }

  try {
    await db.collection("orders").add(orderPayload);

    for (const item of cart) {
      if (!item.id) continue;
      try {
        const pRef = db.collection("products").doc(item.id);
        const pSnap = await pRef.get();
        if (pSnap.exists) {
          const curStock = Number(pSnap.data().stock) || 0;
          const newStock = Math.max(0, curStock - (Number(item.quantity) || 1));
          await pRef.update({ stock: newStock });
        }
      } catch (err) {
        console.warn(err);
      }
    }
  } catch (err) {
    console.warn(err);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fa-solid fa-check-circle"></i> تأكيد وإرسال الطلب للوكالة`;
    }
  }

  cart = [];
  uploadedReceiptFile = null;
  const receiptInput = document.getElementById("paymentReceiptInput");
  if (receiptInput) receiptInput.value = "";
  const receiptPreview = document.getElementById("receiptPreviewArea");
  if (receiptPreview) receiptPreview.style.display = "none";

  saveCartToStorage();
  window.closeCheckoutModal();
  window.showToast(`تم إرسال طلبكم بنجاح برقم: ${orderNumber}`);

  document.getElementById("trackOrderInput").value = orderNumber;
  window.openTrackOrderModal();
  window.searchTrackOrder(orderNumber);
};

window.openAuthModal = function(preferCalligrapher = false) {
  const modal = document.getElementById("authModal");
  if (modal) {
    modal.classList.add("active");
    if (preferCalligrapher) {
      setAuthMode('calligrapher');
    } else {
      setAuthMode('retail');
    }
  }
};

window.closeAuthModal = function() {
  const modal = document.getElementById("authModal");
  if (modal) modal.classList.remove("active");
};

window.handleAuthButtonClick = function() {
  if (currentUser) {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    auth.signOut().catch(() => {});
    applyUserSession(null);
    window.showToast("تم تسجيل الخروج");
  } else {
    window.openAuthModal();
  }
};

window.setAuthMode = function(mode) {
  activeAuthMode = mode;
  const retailBtn = document.getElementById("authModeRetailBtn");
  const calBtn = document.getElementById("authModeCalBtn");
  const retailSection = document.getElementById("retailAuthSection");
  const calSection = document.getElementById("calligrapherAuthSection");

  if (mode === "retail") {
    retailBtn.classList.add("active");
    calBtn.classList.remove("active");
    retailSection.style.display = "block";
    calSection.style.display = "none";
  } else {
    calBtn.classList.add("active");
    retailBtn.classList.remove("active");
    calSection.style.display = "block";
    retailSection.style.display = "none";
  }
};

window.switchRetailSubTab = function(tab) {
  retailSubTab = tab;
  const loginBtn = document.getElementById("tabRetailLogin");
  const regBtn = document.getElementById("tabRetailRegister");
  const nameGroup = document.getElementById("retailNameGroup");
  const confirmPassGroup = document.getElementById("retailConfirmPassGroup");
  const forgotRow = document.getElementById("retailForgotRow");
  const submitBtn = document.getElementById("retailSubmitBtn");

  if (tab === "login") {
    loginBtn.style.borderBottom = "2px solid var(--primary-gold)";
    loginBtn.style.color = "var(--primary-gold-dark)";
    regBtn.style.borderBottom = "none";
    regBtn.style.color = "var(--text-muted)";
    nameGroup.style.display = "none";
    confirmPassGroup.style.display = "none";
    forgotRow.style.display = "flex";
    submitBtn.textContent = "تسجيل الدخول";
  } else {
    regBtn.style.borderBottom = "2px solid var(--primary-gold)";
    regBtn.style.color = "var(--primary-gold-dark)";
    loginBtn.style.borderBottom = "none";
    loginBtn.style.color = "var(--text-muted)";
    nameGroup.style.display = "block";
    confirmPassGroup.style.display = "block";
    forgotRow.style.display = "none";
    submitBtn.textContent = "إنشاء حساب جديد";
  }
};

function applyUserSession(session) {
  currentUser = session;
  const badge = document.getElementById("userStatusBadge");
  const badgeText = document.getElementById("userStatusText");
  const authBtnText = document.getElementById("authBtnText");
  const adminLinkBtn = document.getElementById("adminLinkBtn");

  if (session) {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
    userProfile = session;
    currentRole = session.role || "retail";

    if (currentRole === "admin") {
      badge.className = "user-status-pill status-calligrapher";
      badgeText.textContent = "مدير الوكالة";
      if (adminLinkBtn) adminLinkBtn.style.display = "inline-flex";
    } else if (currentRole === "staff" || currentRole === "orders_staff") {
      badge.className = "user-status-pill status-calligrapher";
      badgeText.textContent = "مسؤول الطلبات";
      if (adminLinkBtn) adminLinkBtn.style.display = "inline-flex";
    } else if (currentRole === "calligrapher") {
      badge.className = "user-status-pill status-calligrapher";
      badgeText.textContent = `مطابع/شركات: ${session.displayName || session.name || "معتمد"}`;
      if (adminLinkBtn) adminLinkBtn.style.display = "none";
    } else {
      badge.className = "user-status-pill status-retail";
      badgeText.textContent = session.displayName || "أفراد وعملاء";
      if (adminLinkBtn) adminLinkBtn.style.display = "none";
    }

    authBtnText.textContent = "خروج";
  } else {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    currentRole = "retail";
    userProfile = null;
    badge.className = "user-status-pill status-retail";
    badgeText.textContent = "أفراد وعملاء";
    authBtnText.textContent = "تسجيل الدخول";
    if (adminLinkBtn) adminLinkBtn.style.display = "none";
  }

  renderProductsList();
}

window.handleRetailAuthSubmit = async function(e) {
  e.preventDefault();
  const email = document.getElementById("retailEmail").value.trim().toLowerCase();
  const password = document.getElementById("retailPassword").value;
  const submitBtn = document.getElementById("retailSubmitBtn");
  submitBtn.disabled = true;

  if (email === "admin@gmail.com" && (password === "superadmin10" || password === "12345678")) {
    const adminSession = {
      uid: "admin_fixed",
      email: "admin@gmail.com",
      displayName: "مدير الوكالة",
      role: "admin",
      isAdmin: true
    };
    applyUserSession(adminSession);
    window.closeAuthModal();
    window.showToast("مرحباً بك يا مدير الوكالة");
    submitBtn.disabled = false;
    return;
  }

  try {
    const calSnap = await db.collection("calligraphers").where("email", "==", email).get();
    if (!calSnap.empty) {
      const calData = calSnap.docs[0].data();
      if (calData.password === password) {
        applyUserSession({
          uid: calData.id || "cal_" + Date.now(),
          email: calData.email,
          displayName: calData.name,
          role: "calligrapher",
          isCalligrapher: true
        });
        window.closeAuthModal();
        window.showToast(`مرحباً بك أستاذ ${calData.name}، تم تفعيل أسعار الجملة`);
        submitBtn.disabled = false;
        return;
      }
    }
  } catch (err) {}

  if (retailSubTab === "login") {
    try {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      const u = cred.user;
      applyUserSession({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || u.email.split("@")[0],
        role: "retail"
      });
      window.closeAuthModal();
      window.showToast("تم تسجيل الدخول بنجاح");
    } catch (err) {
      try {
        const uDoc = await db.collection("users").doc(email.replace(/[@.]/g, "_")).get();
        if (uDoc.exists && uDoc.data().password === password) {
          const ud = uDoc.data();
          applyUserSession({
            uid: ud.uid || email,
            email: ud.email,
            displayName: ud.displayName || "عميل",
            role: ud.role || "retail"
          });
          window.closeAuthModal();
          window.showToast("تم تسجيل الدخول بنجاح");
          submitBtn.disabled = false;
          return;
        }
      } catch (e2) {}

      window.showToast("بيانات الدخول غير صحيحة، أو يمكنك إنشاء حساب جديد بالضغط على (حساب جديد)");
    } finally {
      submitBtn.disabled = false;
    }
  } else {
    const displayName = document.getElementById("retailDisplayName").value.trim();
    const confirmPass = document.getElementById("retailConfirmPassword").value;

    if (password !== confirmPass) {
      window.showToast("كلمتا المرور غير متطابقتين");
      submitBtn.disabled = false;
      return;
    }

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      const u = cred.user;
      const userObj = {
        uid: u.uid,
        email: u.email,
        displayName: displayName || email.split("@")[0],
        role: "retail",
        isCalligrapher: false,
        createdAt: new Date().toISOString()
      };
      await db.collection("users").doc(u.uid).set(userObj);
      applyUserSession(userObj);
      window.closeAuthModal();
      window.showToast("تم إنشاء الحساب بنجاح");
    } catch (err) {
      const userObj = {
        uid: "user_" + Date.now(),
        email: email,
        password: password,
        displayName: displayName || email.split("@")[0],
        role: "retail",
        isCalligrapher: false,
        createdAt: new Date().toISOString()
      };
      try {
        await db.collection("users").doc(email.replace(/[@.]/g, "_")).set(userObj);
      } catch (e3) {}
      applyUserSession(userObj);
      window.closeAuthModal();
      window.showToast("تم إنشاء الحساب بنجاح ومرحباً بك");
    } finally {
      submitBtn.disabled = false;
    }
  }
};

window.handleCalligrapherAuthSubmit = async function(e) {
  e.preventDefault();
  const email = document.getElementById("calLoginEmail").value.trim().toLowerCase();
  const password = document.getElementById("calLoginPassword").value.trim();
  const submitBtn = document.getElementById("calSubmitBtn");
  submitBtn.disabled = true;

  if (email === "admin@gmail.com" && (password === "superadmin10" || password === "12345678")) {
    const adminSession = {
      uid: "admin_fixed",
      email: "admin@gmail.com",
      displayName: "مدير الوكالة",
      role: "admin",
      isAdmin: true
    };
    applyUserSession(adminSession);
    window.closeAuthModal();
    window.showToast("مرحباً بك يا مدير الوكالة");
    submitBtn.disabled = false;
    return;
  }

  try {
    const snap = await db.collection("calligraphers").where("email", "==", email).get();

    if (!snap.empty) {
      const calData = snap.docs[0].data();
      if (calData.password === password) {
        const calSession = {
          uid: calData.id || "cal_" + Date.now(),
          email: calData.email,
          displayName: calData.name,
          role: "calligrapher",
          isCalligrapher: true
        };
        applyUserSession(calSession);
        window.closeAuthModal();
        window.showToast(`مرحباً بك أستاذ ${calData.name}، تم تفعيل أسعار الجملة`);
        submitBtn.disabled = false;
        return;
      }
    }

    const cred = await auth.signInWithEmailAndPassword(email, password);
    const u = cred.user;
    applyUserSession({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName || "مطبعة / شركة",
      role: "calligrapher"
    });
    window.closeAuthModal();
    window.showToast("تم تفعيل أسعار الجملة بنجاح");
  } catch (err) {
    window.showToast("بيانات دخول المطبعة / الشركة غير صحيحة، يرجى مراجعة إدارة الوكالة");
  } finally {
    submitBtn.disabled = false;
  }
};

window.handleGoogleAuth = async function() {
  try {
    const res = await auth.signInWithPopup(googleProvider);
    const u = res.user;
    const userDoc = await db.collection("users").doc(u.uid).get();
    let role = "retail";
    if (userDoc.exists) {
      role = userDoc.data().role || "retail";
    } else {
      await db.collection("users").doc(u.uid).set({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || u.email.split("@")[0],
        role: "retail",
        createdAt: new Date().toISOString()
      });
    }

    applyUserSession({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName || u.email.split("@")[0],
      role: role
    });
    window.showToast("تم الدخول بحساب Google بنجاح");
    window.closeAuthModal();
  } catch (err) {
    window.showToast("تسجيل الدخول عبر Google يتطلب تشغيل الموقع على رابط استضافة، يمكنك الدخول ببريدك الإلكتروني مباشرة");
  }
};

window.openForgotModal = function() {
  window.closeAuthModal();
  const emailVal = document.getElementById("retailEmail") ? document.getElementById("retailEmail").value.trim() : "";
  if (document.getElementById("forgotEmailInput") && emailVal) {
    document.getElementById("forgotEmailInput").value = emailVal;
  }
  document.getElementById("forgotModal").classList.add("active");
};

window.closeForgotModal = function() {
  document.getElementById("forgotModal").classList.remove("active");
};

window.handleForgotSubmit = async function(e) {
  e.preventDefault();
  const email = document.getElementById("forgotEmailInput").value.trim();
  if (!email) return;

  try {
    await auth.sendPasswordResetEmail(email);
  } catch (err) {}

  window.closeForgotModal();
  window.showToast(`تم إرسال رابط ورمز استعادة كلمة المرور إلى البريد: ${email}`);
};

window.openTrackOrderModal = function() {
  const modal = document.getElementById("trackModal");
  if (modal) modal.classList.add("active");
};

window.closeTrackModal = function() {
  const modal = document.getElementById("trackModal");
  if (modal) modal.classList.remove("active");
};

window.searchTrackOrder = async function(directNumber = null) {
  const input = document.getElementById("trackOrderInput");
  const orderNum = directNumber || (input ? input.value.trim() : "");
  const resultArea = document.getElementById("trackResultArea");
  if (!orderNum || !resultArea) return;

  resultArea.innerHTML = `<div style="text-align: center; padding: 1.5rem; color: #64748B;"><i class="fa-solid fa-spinner fa-spin"></i> جاري البحث عن الطلب...</div>`;

  try {
    const snap = await db.collection("orders").where("orderNumber", "==", orderNum).get();
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

    const s = statusMap[orderData.status] || statusMap.pending;

    resultArea.innerHTML = `
      <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; padding: 1.25rem; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong style="color: #A17C17; font-size: 1.05rem;">رقم الطلب: ${orderData.orderNumber}</strong>
          <span style="font-size: 0.8rem; color: #64748B;">${new Date(orderData.createdAt).toLocaleDateString("ar-EG")}</span>
        </div>

        <div style="margin-bottom: 1rem; padding: 0.75rem; background: #FFFFFF; border-radius: 6px; border: 1px solid #E2E8F0;">
          <div style="font-weight: 800; color: ${s.color}; font-size: 0.95rem;">${s.title}</div>
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
  } catch (err) {
    resultArea.innerHTML = `<div style="color: #DC2626; font-size: 0.85rem;">تعذر جلب حالة الطلب.</div>`;
  }
};

window.filterCategory = function(catId, btn) {
  activeCategory = catId;
  document.querySelectorAll(".category-tab-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderProductsList();
};

window.handleSearchInput = function(query) {
  searchFilter = query.trim().toLowerCase();
  renderProductsList();
};

function renderProductsList() {
  const container = document.getElementById("productsGrid");
  if (!container) return;

  const isWholesale = currentRole === "calligrapher";

  let filtered = products.filter(item => {
    const matchCat = activeCategory === "all" || item.category === activeCategory;
    const matchQ = !searchFilter || item.name.toLowerCase().includes(searchFilter) || (item.description && item.description.toLowerCase().includes(searchFilter));
    return matchCat && matchQ;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #64748B;">
        <i class="fa-solid fa-box-open" style="font-size: 2.5rem; margin-bottom: 0.5rem; color: #CBD5E1;"></i>
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0F172A;">لا توجد أصناف مطابقة للبحث</h3>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const price = isWholesale ? p.wholesalePrice : p.retailPrice;
    return `
      <div class="item-card" data-id="${p.id}">
        <div class="item-card-image-wrap">
          <img src="${p.image}" alt="${p.name}" loading="lazy" class="item-card-image" onerror="this.src='https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=600&q=80'">
          ${p.badge ? `<span class="item-card-badge">${p.badge}</span>` : ""}
          <span class="item-card-stock">متبقي: ${p.stock} ${p.unit || "قطعة"}</span>
        </div>
        
        <div class="item-card-body">
          <h3 class="item-card-title">${p.name}</h3>
          <p class="item-card-desc">${p.description || ""}</p>
          
          <div class="item-card-footer">
            <div class="price-row">
              <div>
                <span class="price-val">${price}</span>
                <span class="price-unit">ج.م / ${p.unit || "قطعة"}</span>
              </div>
              ${
                isWholesale
                  ? `<span class="tag-wholesale">سعر جملة</span>`
                  : `<span style="font-size: 0.75rem; color: #94A3B8;">سعر قطاعي</span>`
              }
            </div>

            <div class="item-actions">
              <button class="btn btn-gold btn-order" onclick="openCustomizationModal('${p.id}')">
                <i class="fa-solid fa-pen-to-square"></i> طلب وتخصيص
              </button>
              <button class="btn btn-navy btn-quick-cart" onclick="quickAddToCart('${p.id}')" title="إضافة سريعة للسلة">
                <i class="fa-solid fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

async function loadCategoriesFromFirestore() {
  try {
    const snap = await db.collection("categories").get();
    const hasOldCategories = !snap.empty && snap.docs.some(d => ["banners", "tshirts", "shields"].includes(d.id));
    
    if (snap.empty || hasOldCategories) {
      // Clean obsolete categories and save new 10 categories
      if (hasOldCategories) {
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit().catch(() => {});
      }
      categories = [...DEFAULT_CATEGORIES];
      for (const c of DEFAULT_CATEGORIES) {
        if (c.id !== "all") {
          db.collection("categories").doc(c.id).set(c).catch(() => {});
        }
      }
    } else {
      categories = [{ id: "all", name: "جميع الأقسام", icon: "fa-border-all" }];
      snap.forEach(d => categories.push({ id: d.id, ...d.data() }));
    }
  } catch (e) {
    categories = [...DEFAULT_CATEGORIES];
  }
  renderCategoryChips();
}

function renderCategoryChips() {
  const wrapper = document.getElementById("categoryChips");
  if (!wrapper) return;

  wrapper.innerHTML = categories.map(c => `
    <button class="category-tab-btn ${c.id === activeCategory ? 'active' : ''}" onclick="filterCategory('${c.id}', this)">
      <i class="fa-solid ${c.icon || 'fa-box'}"></i> ${c.name}
    </button>
  `).join("");
}

function loadProductsFromFirestore() {
  db.collection("products").onSnapshot(async (snapshot) => {
    if (!snapshot.empty) {
      products = [];
      snapshot.forEach(d => products.push({ id: d.id, ...d.data() }));
    } else {
      for (const p of INITIAL_PRODUCTS) {
        await db.collection("products").doc(p.id).set(p);
      }
      products = [...INITIAL_PRODUCTS];
    }
    renderProductsList();
  }, (err) => {
    console.warn(err);
    products = [...INITIAL_PRODUCTS];
    renderProductsList();
  });
}

function restoreSession() {
  try {
    const saved = localStorage.getItem(LOCAL_SESSION_KEY);
    if (saved) {
      const s = JSON.parse(saved);
      applyUserSession(s);
      return true;
    }
  } catch (e) {}
  return false;
}

document.addEventListener("DOMContentLoaded", () => {
  initCartFromStorage();
  loadCategoriesFromFirestore();
  loadProductsFromFirestore();

  const restored = restoreSession();
  if (!restored) {
    auth.onAuthStateChanged(user => {
      if (user) {
        const uEmail = (user.email || "").toLowerCase();
        if (uEmail === "admin@gmail.com" || uEmail === "admin@elfeqy.com") {
          applyUserSession({
            uid: user.uid,
            email: user.email,
            displayName: "مدير الوكالة",
            role: "admin",
            isAdmin: true
          });
        } else {
          applyUserSession({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split("@")[0],
            role: "retail"
          });
        }
      } else {
        if (!localStorage.getItem(LOCAL_SESSION_KEY)) {
          applyUserSession(null);
        }
      }
    });
  }
});
