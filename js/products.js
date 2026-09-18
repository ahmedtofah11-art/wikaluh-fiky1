import { db, collection, getDocs, onSnapshot, doc, setDoc } from "./firebase-config.js";
import { INITIAL_PRODUCTS } from "./data-seed.js";
import { getCurrentUser, USER_ROLES } from "./auth.js";

let productsList = [];
let activeCategory = "all";
let searchQuery = "";

export const getProducts = () => productsList;

export const loadProducts = () => {
  onSnapshot(collection(db, "products"), async (snapshot) => {
    if (snapshot.empty) {
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, "products", prod.id), prod);
      }
      productsList = [...INITIAL_PRODUCTS];
    } else {
      productsList = [];
      snapshot.forEach((docSnap) => {
        productsList.push({ id: docSnap.id, ...docSnap.data() });
      });
    }
    renderProducts();
  }, (err) => {
    console.warn(err);
    if (productsList.length === 0) {
      productsList = [...INITIAL_PRODUCTS];
      renderProducts();
    }
  });
  return productsList;
};

export const setCategoryFilter = (catId) => {
  activeCategory = catId;
  renderProducts();
};

export const setSearchFilter = (query) => {
  searchQuery = query.trim().toLowerCase();
  renderProducts();
};

export const renderProducts = () => {
  const container = document.getElementById("productsGrid");
  if (!container) return;

  const { role } = getCurrentUser();
  const isCalligrapher = role === USER_ROLES.CALLIGRAPHER;

  let filtered = productsList.filter((item) => {
    const matchCategory = activeCategory === "all" || item.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery) ||
      (item.description && item.description.toLowerCase().includes(searchQuery));
    return matchCategory && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #64748B;">
        <i class="fa-solid fa-box-open" style="font-size: 2.5rem; margin-bottom: 0.5rem; color: #CBD5E1;"></i>
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0F172A;">لا توجد أصناف مطابقة للبحث</h3>
        <p style="font-size: 0.85rem;">يمكنك اختيار قسم آخر أو تغيير كلمة البحث</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((product) => {
      const activePrice = isCalligrapher ? product.wholesalePrice : product.retailPrice;

      return `
      <div class="item-card" data-id="${product.id}">
        <div class="item-card-image-wrap">
          <img src="${product.image}" alt="${product.name}" loading="lazy" class="item-card-image" onerror="this.src='https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=600&q=80'">
          ${product.badge ? `<span class="item-card-badge">${product.badge}</span>` : ""}
          <span class="item-card-stock">متبقي: ${product.stock} ${product.unit || "قطعة"}</span>
        </div>
        
        <div class="item-card-body">
          <h3 class="item-card-title">${product.name}</h3>
          <p class="item-card-desc">${product.description || ""}</p>
          
          <div class="item-card-footer">
            <div class="price-row">
              <div>
                <span class="price-val">${activePrice}</span>
                <span class="price-unit">ج.م / ${product.unit || "قطعة"}</span>
              </div>
              ${
                isCalligrapher
                  ? `<span class="tag-wholesale">سعر جملة</span>`
                  : `<span style="font-size: 0.75rem; color: #94A3B8;">سعر قطاعي</span>`
              }
            </div>

            <div class="item-actions">
              <button class="btn btn-gold btn-order" onclick="window.openCustomizationModal('${product.id}')">
                <i class="fa-solid fa-pen-to-square"></i> طلب وتخصيص
              </button>
              <button class="btn btn-navy btn-quick-cart" onclick="window.quickAddToCart('${product.id}')" title="إضافة سريعة للسلة">
                <i class="fa-solid fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
};
