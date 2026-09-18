import { db, collection, addDoc, doc, updateDoc, getDoc, increment } from "./firebase-config.js";
import { getCurrentUser, USER_ROLES } from "./auth.js";
import { getProducts } from "./products.js";

const CART_STORAGE_KEY = "fiky_agency_cart";
let cartItems = [];

export const initCart = () => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      cartItems = JSON.parse(saved);
    }
  } catch (e) {
    cartItems = [];
  }
  updateCartUI();
};

export const getCartItems = () => cartItems;

const saveCart = () => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  updateCartUI();
};

export const addToCart = (product, quantity = 1, customText = "", uploadedImage = null) => {
  const { role } = getCurrentUser();
  const isCalligrapher = role === USER_ROLES.CALLIGRAPHER;
  const unitPrice = isCalligrapher ? product.wholesalePrice : product.retailPrice;

  const cartItemId = "cart_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);

  cartItems.push({
    cartItemId,
    productId: product.id,
    name: product.name,
    category: product.category,
    unitPrice,
    originalPrice: product.retailPrice,
    isWholesalePrice: isCalligrapher,
    quantity: parseInt(quantity) || 1,
    image: product.image,
    customText: customText.trim(),
    uploadedImage: uploadedImage || null,
    unit: product.unit || "قطعة"
  });

  saveCart();
  window.showToast("تمت إضافة المنتج إلى سلة المشتريات", "success");
};

export const removeFromCart = (cartItemId) => {
  cartItems = cartItems.filter((item) => item.cartItemId !== cartItemId);
  saveCart();
  window.showToast("تم حذف العنصر من السلة", "info");
};

export const updateItemQuantity = (cartItemId, newQty) => {
  const item = cartItems.find((i) => i.cartItemId === cartItemId);
  if (item) {
    const qty = parseInt(newQty);
    if (qty > 0) {
      item.quantity = qty;
    } else {
      cartItems = cartItems.filter((i) => i.cartItemId !== cartItemId);
    }
    saveCart();
  }
};

export const clearCart = () => {
  cartItems = [];
  saveCart();
};

export const getCartTotals = () => {
  const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, totalItemsCount };
};

export const updateCartUI = () => {
  const countBadges = document.querySelectorAll(".cart-count-badge");
  const { subtotal, totalItemsCount } = getCartTotals();

  countBadges.forEach((b) => {
    b.textContent = totalItemsCount;
    b.style.display = totalItemsCount > 0 ? "inline-flex" : "none";
  });

  const cartDrawerList = document.getElementById("cartDrawerItems");
  const cartSubtotalEl = document.getElementById("cartSubtotal");
  const cartTotalCountEl = document.getElementById("cartTotalCount");
  const cartEmptyState = document.getElementById("cartEmptyState");
  const cartFooter = document.getElementById("cartFooter");

  if (cartSubtotalEl) cartSubtotalEl.textContent = `${subtotal.toLocaleString()} ج.م`;
  if (cartTotalCountEl) cartTotalCountEl.textContent = `${totalItemsCount} قطعة`;

  if (cartDrawerList && cartEmptyState && cartFooter) {
    if (cartItems.length === 0) {
      cartDrawerList.innerHTML = "";
      cartEmptyState.style.display = "flex";
      cartFooter.style.display = "none";
    } else {
      cartEmptyState.style.display = "none";
      cartFooter.style.display = "block";

      cartDrawerList.innerHTML = cartItems
        .map((item) => {
          return `
          <div class="cart-item-row" data-cart-id="${item.cartItemId}">
            <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
            <div class="cart-item-details">
              <h4 class="cart-item-title">${item.name}</h4>
              <div class="cart-item-price-line">
                <span class="cart-item-price">${item.unitPrice} ج.م</span>
                ${item.isWholesalePrice ? `<span class="badge-wholesale-mini">جملة</span>` : ""}
              </div>
              ${
                item.customText
                  ? `<div class="cart-custom-text-preview"><i class="fa-solid fa-quote-right"></i> "${item.customText}"</div>`
                  : ""
              }
              ${
                item.uploadedImage
                  ? `<div class="cart-uploaded-img-preview"><i class="fa-solid fa-image"></i> تم إرفاق ملف تصميم</div>`
                  : ""
              }
              <div class="cart-item-qty-row">
                <div class="qty-control">
                  <button type="button" class="qty-btn" onclick="window.changeCartItemQty('${item.cartItemId}', ${item.quantity - 1})">-</button>
                  <span class="qty-num">${item.quantity}</span>
                  <button type="button" class="qty-btn" onclick="window.changeCartItemQty('${item.cartItemId}', ${item.quantity + 1})">+</button>
                </div>
                <button class="cart-remove-btn" onclick="window.removeCartItem('${item.cartItemId}')" title="حذف من السلة">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        `;
        })
        .join("");
    }
  }
};

export const submitOrder = async (customerData) => {
  if (cartItems.length === 0) {
    throw new Error("السلة فارغة حالياً");
  }

  const { user, role } = getCurrentUser();
  const { subtotal, totalItemsCount } = getCartTotals();
  const orderNumber = "FK-" + Math.floor(100000 + Math.random() * 900000);

  const orderPayload = {
    orderNumber,
    userId: user ? user.uid : null,
    userEmail: user ? user.email : customerData.email || "",
    userRole: role,
    isCalligrapherOrder: role === USER_ROLES.CALLIGRAPHER,
    customerName: customerData.name,
    phone1: customerData.phone1,
    phone2: customerData.phone2 || "",
    address: customerData.address,
    cityRegion: customerData.cityRegion || "المنطقة المحلية",
    customerNotes: customerData.notes || "",
    items: cartItems,
    itemsCount: totalItemsCount,
    totalPrice: subtotal,
    status: "pending",
    statusArabic: "قيد المراجعة والتجهيز",
    estimatedDuration: "2 - 3 أيام عمل",
    estimatedDate: "",
    adminNotes: "",
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, "orders"), orderPayload);

    for (const item of cartItems) {
      try {
        if (!item.productId) continue;
        const productRef = doc(db, "products", item.productId);
        const pSnap = await getDoc(productRef);
        if (pSnap.exists()) {
          const curStock = Number(pSnap.data().stock) || 0;
          const newStock = Math.max(0, curStock - (Number(item.quantity) || 1));
          await updateDoc(productRef, { stock: newStock });
        } else {
          await updateDoc(productRef, { stock: increment(-(Number(item.quantity) || 1)) });
        }
      } catch (stockErr) {
        console.warn(stockErr);
      }
    }

    clearCart();
    return { id: docRef.id, ...orderPayload };
  } catch (error) {
    console.error(error);
    clearCart();
    return { id: "local_" + Date.now(), ...orderPayload };
  }
};
