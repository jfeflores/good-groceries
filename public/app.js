(function () {
  "use strict";

  const DATA_KEY = "grocery-catalog-app-data-v1";
  const CART_KEY = "grocery-catalog-app-cart-v1";
  const THEME_KEY = "grocery-catalog-theme-v1";
  const CLOUD_STATE_ENDPOINT = "/api/state";
  const CLOUD_SAVE_DELAY = 700;
  const RETAILER_BATCH_SIZE = 20;

  const TIER_DEFINITIONS = {
    S: {
      short: "Highest-priority nutrition",
      detail:
        "Food Tier S is the highest priority in this tier model: unusually strong nutrition or evidence for its role. Choose it first when the budget permits.",
    },
    A: {
      short: "Strong regular choice",
      detail:
        "Food Tier A is a strong everyday choice with meaningful nutrition and a good fit in the plan. It may have a modest tradeoff compared with an S-tier alternative.",
    },
    B: {
      short: "Useful, with tradeoffs",
      detail:
        "Food Tier B is useful and acceptable, but it has lower nutritional priority or more tradeoffs for this plan. B does not mean unhealthy or bad.",
    },
  };

  const VERIFICATION_DEFINITIONS = {
    A: {
      short: "Strongly verified",
      detail:
        "Verification Grade A means a credible government or independent certification directly supports relevant production or sourcing claims, with evidence recorded in the catalog.",
    },
    B: {
      short: "Transparent, limited certification",
      detail:
        "Verification Grade B means the product is reasonably transparent or simple and key facts have a credible source, but strong third-party production certification is limited or absent.",
    },
    C: {
      short: "Insufficiently verified",
      detail:
        "Verification Grade C means important production claims lack enough independent support. The product may still be kept as a preference, but its claims need more scrutiny.",
    },
  };

  const BUDGET_NAMES = {
    50: "Emergency 50",
    80: "Regular 80",
    100: "Premium 100",
  };

  const PURCHASE_URL_OVERRIDES = {
    "wild-alaska-sockeye-salmon": "https://www.walmart.com/ip/895031780",
    "horizon-no-added-sugar-chocolate-milk": "https://www.walmart.com/ip/19187615549",
    "millville-old-fashioned-oats":
      "https://www.aldi.us/store/aldi/products/18647728-millville-hearty-100-whole-grain-old-fashioned-rolled-oats-42-oz",
    bananas: "https://www.walmart.com/ip/44390948",
    "c4-performance-energy": "https://www.walmart.com/ip/428615788",
  };

  const RETIRED_SEEDED_PRODUCT_IDS = new Set([
    "aldi-organic-bananas",
    "libbys-organic-pumpkin",
    "marketside-dungeness-crab",
    "marketside-ground-bison",
    "perdue-organic-chicken-thighs",
    "smuckers-natural-blueberry-spread",
    "tyson-fresh-chicken-thighs",
  ]);

  const REFRESHED_SEEDED_PRODUCT_IDS = new Set([
    "aqua-gems-large-raw-shrimp",
    "bananas",
    "c4-performance-energy",
    "fresh-organic-kiwi",
    "great-value-organic-beet-juice",
    "st-dalfour-blueberry-fruit-spread",
    "sunset-organic-tomatoes",
    "tyson-chicken-breast-value",
  ]);

  const VERSION_8_REFRESHED_SEEDED_PRODUCT_IDS = new Set([
    "jennie-o-ground-turkey",
  ]);

  const VERSION_9_REFRESHED_SEEDED_PRODUCT_IDS = new Set([
    "smuckers-natural-chunky-peanut-butter",
  ]);

  const VERSION_10_REFRESHED_SEEDED_PRODUCT_IDS = new Set([
    "simply-nature-organic-chicken-breast",
  ]);

  const elements = {
    productList: document.getElementById("product-list"),
    resultsCount: document.getElementById("results-count"),
    detailMedia: document.getElementById("detail-media"),
    detailTitle: document.getElementById("detail-title"),
    productDetail: document.getElementById("product-detail"),
    detailPanel: document.querySelector(".detail-panel"),
    budgetPlans: document.getElementById("budget-plans"),
    searchInput: document.getElementById("search-input"),
    categoryFilter: document.getElementById("category-filter"),
    storeFilter: document.getElementById("store-filter"),
    tierFilter: document.getElementById("tier-filter"),
    certificationFilter: document.getElementById("certification-filter"),
    choiceFilter: document.getElementById("choice-filter"),
    favoritesFilter: document.getElementById("favorites-filter"),
    availabilityFilter: document.getElementById("availability-filter"),
    clearFiltersButton: document.getElementById("clear-filters-button"),
    catalogSort: document.getElementById("catalog-sort"),
    themeToggle: document.getElementById("theme-toggle"),
    themeLabel: document.getElementById("theme-label"),
    headerCartButton: document.getElementById("header-cart-button"),
    headerCartCount: document.getElementById("header-cart-count"),
    miniCart: document.getElementById("mini-cart"),
    miniCartCount: document.getElementById("mini-cart-count"),
    miniCartUnit: document.getElementById("mini-cart-unit"),
    miniCartTotal: document.getElementById("mini-cart-total"),
    miniCartItems: document.getElementById("mini-cart-items"),
    expandCartButton: document.getElementById("expand-cart-button"),
    cartPage: document.getElementById("cart-page"),
    closeCartButton: document.getElementById("close-cart-button"),
    clearCartButton: document.getElementById("clear-cart-button"),
    fullCartItems: document.getElementById("full-cart-items"),
    fullCartTotal: document.getElementById("full-cart-total"),
    cartSort: document.getElementById("cart-sort"),
    cartLineSummary: document.getElementById("cart-line-summary"),
    budgetStatus: document.getElementById("budget-status"),
    storeBreakdown: document.getElementById("store-breakdown"),
    budgetDialog: document.getElementById("budget-dialog"),
    budgetDialogTitle: document.getElementById("budget-dialog-title"),
    budgetDialogSummary: document.getElementById("budget-dialog-summary"),
    budgetDialogItems: document.getElementById("budget-dialog-items"),
    budgetDialogLoad: document.getElementById("budget-dialog-load"),
    closeBudgetDialog: document.getElementById("close-budget-dialog"),
    imageDialog: document.getElementById("product-image-dialog"),
    imageDialogTitle: document.getElementById("product-image-dialog-title"),
    imageDialogImage: document.getElementById("product-image-dialog-image"),
    imageDialogCaption: document.getElementById("product-image-dialog-caption"),
    imageDialogLink: document.getElementById("product-image-dialog-link"),
    closeImageDialog: document.getElementById("close-product-image-dialog"),
    productDialog: document.getElementById("product-dialog"),
    productForm: document.getElementById("product-form"),
    syncListingsButton: document.getElementById("sync-listings-button"),
    tierLibraryButton: document.getElementById("tier-library-button"),
    tierLibraryDialog: document.getElementById("tier-library-dialog"),
    closeTierLibrary: document.getElementById("close-tier-library"),
    tierLibrarySummary: document.getElementById("tier-library-summary"),
    tierLibrarySearch: document.getElementById("tier-library-search"),
    tierLibraryFilter: document.getElementById("tier-library-filter"),
    tierLibraryItems: document.getElementById("tier-library-items"),
    toast: document.getElementById("toast"),
    cloudStatus: document.getElementById("cloud-status"),
    cloudStatusLabel: document.getElementById("cloud-status-label"),
    installAppButton: document.getElementById("install-app-button"),
    importButton: document.getElementById("import-button"),
    importFileInput: document.getElementById("import-file-input"),
  };

  const state = {
    data: loadCatalog(),
    cart: loadCart(),
    filters: {
      search: "",
      category: "All",
      store: "All",
      tier: "All",
      certification: "All",
      choice: "All",
      favoritesOnly: false,
      inStockOnly: false,
    },
    catalogSort: "quality-first",
    cartSort: "store",
    selectedProductId: null,
    detailTab: "overview",
    editingProductId: null,
    activeBudgetPlanId: null,
    budgetView: "simple",
    cartOpen: false,
    tierLibrarySearch: "",
    tierLibraryFilter: "All",
    bulkSyncing: false,
    bulkSyncCompleted: 0,
    bulkSyncTotal: 0,
    cloud: {
      ready: false,
      revision: 0,
      pendingCatalog: false,
      pendingCart: false,
      localDirty: false,
      saving: false,
      timer: null,
      lastSavedAt: "",
    },
  };

  let toastTimer = null;
  let cartCloseTimer = null;
  let lastCartTrigger = null;
  let deferredInstallPrompt = null;
  const pendingImageRefreshes = new Set();

  state.selectedProductId = state.data.products[0]?.id || null;

  bindEvents();
  render();
  initializeHostedApp();
  window.setTimeout(() => ensureProductImage(state.selectedProductId), 0);

  function bindEvents() {
    elements.searchInput.addEventListener("input", (event) => {
      state.filters.search = event.target.value.trim();
      renderQuickFilterState();
      renderProductList();
    });

    elements.categoryFilter.addEventListener("change", (event) => {
      state.filters.category = event.target.value;
      renderQuickFilterState();
      renderProductList();
    });

    elements.storeFilter.addEventListener("change", (event) => {
      state.filters.store = event.target.value;
      renderQuickFilterState();
      renderProductList();
    });

    elements.tierFilter.addEventListener("change", (event) => {
      state.filters.tier = event.target.value;
      renderQuickFilterState();
      renderProductList();
    });

    elements.certificationFilter.addEventListener("change", (event) => {
      state.filters.certification = event.target.value;
      renderQuickFilterState();
      renderProductList();
    });

    elements.choiceFilter.addEventListener("change", (event) => {
      state.filters.choice = event.target.value;
      renderQuickFilterState();
      renderProductList();
    });

    elements.favoritesFilter.addEventListener("click", () => {
      state.filters.favoritesOnly = !state.filters.favoritesOnly;
      renderQuickFilterState();
      renderProductList();
    });

    elements.availabilityFilter.addEventListener("click", () => {
      state.filters.inStockOnly = !state.filters.inStockOnly;
      renderQuickFilterState();
      renderProductList();
    });

    elements.clearFiltersButton.addEventListener("click", clearCatalogFilters);

    elements.catalogSort.addEventListener("change", (event) => {
      state.catalogSort = event.target.value;
      renderProductList();
    });

    elements.themeToggle.addEventListener("click", toggleTheme);

    elements.budgetPlans.addEventListener("click", (event) => {
      const previewButton = event.target.closest("[data-plan-preview]");
      const loadButton = event.target.closest("[data-plan-load]");

      if (previewButton) {
        openBudgetDialog(previewButton.dataset.planPreview);
      }

      if (loadButton) {
        loadPlanIntoCart(loadButton.dataset.planLoad);
      }
    });

    elements.productList.addEventListener("click", (event) => {
      const favoriteButton = event.target.closest("[data-toggle-favorite]");
      const addButton = event.target.closest("[data-add-product]");
      const selectButton = event.target.closest("[data-select-product]");

      if (favoriteButton) {
        toggleFavorite(favoriteButton.dataset.toggleFavorite);
        return;
      }

      if (addButton) {
        const product = getProductById(addButton.dataset.addProduct);
        if (product) {
          addToCart(product.id, product.defaultQuantity || 1);
        }
        return;
      }

      if (selectButton) {
        selectProduct(selectButton.dataset.selectProduct);
      }
    });

    elements.productDetail.addEventListener("click", (event) => {
      const tabButton = event.target.closest("[data-detail-tab]");
      const favoriteButton = event.target.closest("[data-toggle-favorite]");
      const addButton = event.target.closest("[data-detail-add]");
      const editButton = event.target.closest("[data-detail-edit]");
      const refreshButton = event.target.closest("[data-refresh-product]");
      const alternativeButton = event.target.closest("[data-select-alternative]");
      const replaceLinkButton = event.target.closest("[data-replace-link]");
      const removeBrokenButton = event.target.closest("[data-remove-broken]");

      if (favoriteButton) {
        toggleFavorite(favoriteButton.dataset.toggleFavorite);
      }

      if (tabButton) {
        state.detailTab = tabButton.dataset.detailTab;
        renderDetail();
      }

      if (addButton) {
        const product = getProductById(addButton.dataset.detailAdd);
        if (product) {
          addToCart(product.id, product.defaultQuantity || 1);
        }
      }

      if (editButton) {
        const product = getProductById(editButton.dataset.detailEdit);
        if (product) {
          openProductDialog(product);
        }
      }

      if (refreshButton) {
        refreshRetailerData(refreshButton.dataset.refreshProduct, { force: true });
      }

      if (alternativeButton) {
        selectProduct(alternativeButton.dataset.selectAlternative);
      }

      if (replaceLinkButton) {
        const product = getProductById(replaceLinkButton.dataset.replaceLink);
        if (product) {
          openProductDialog(product);
          window.requestAnimationFrame(() => {
            elements.productForm.querySelector('[name="purchaseUrl"]')?.focus();
          });
        }
      }

      if (removeBrokenButton) {
        removeBrokenProduct(removeBrokenButton.dataset.removeBroken);
      }
    });

    elements.detailMedia.addEventListener("click", (event) => {
      const imageButton = event.target.closest("[data-open-product-image]");
      if (imageButton) {
        openProductImage(imageButton.dataset.openProductImage);
      }
    });

    document.getElementById("edit-product-button").addEventListener("click", () => {
      const product = getSelectedProduct();
      if (product) {
        openProductDialog(product);
      }
    });

    document.getElementById("new-product-button").addEventListener("click", () => {
      openProductDialog();
    });

    document.getElementById("export-button").addEventListener("click", exportCatalog);
    elements.importButton.addEventListener("click", () => elements.importFileInput.click());
    elements.importFileInput.addEventListener("change", importCatalogBackup);
    document.getElementById("reset-button").addEventListener("click", resetCatalog);

    elements.headerCartButton.addEventListener("click", (event) => openFullCart(event.currentTarget));
    elements.expandCartButton.addEventListener("click", (event) => openFullCart(event.currentTarget));
    elements.closeCartButton.addEventListener("click", closeFullCart);
    elements.clearCartButton.addEventListener("click", clearCart);

    elements.fullCartItems.addEventListener("click", handleCartItemClick);
    elements.fullCartItems.addEventListener("change", handleCartQuantityInput);
    elements.cartSort.addEventListener("change", (event) => {
      state.cartSort = event.target.value;
      renderCart();
    });

    elements.syncListingsButton.addEventListener("click", syncAllRetailerData);
    elements.tierLibraryButton.addEventListener("click", openTierLibrary);
    elements.closeTierLibrary.addEventListener("click", closeTierLibrary);
    elements.tierLibrarySearch.addEventListener("input", (event) => {
      state.tierLibrarySearch = event.target.value.trim();
      renderTierLibrary();
    });
    elements.tierLibraryFilter.addEventListener("change", (event) => {
      state.tierLibraryFilter = event.target.value;
      renderTierLibrary();
    });
    elements.tierLibraryItems.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tier-select]");
      if (!button) {
        return;
      }
      closeTierLibrary();
      selectProduct(button.dataset.tierSelect);
      document.getElementById("catalog-heading").scrollIntoView({ behavior: "smooth" });
    });
    elements.tierLibraryDialog.addEventListener("click", (event) => {
      if (event.target === elements.tierLibraryDialog) {
        closeTierLibrary();
      }
    });

    elements.closeBudgetDialog.addEventListener("click", closeBudgetDialog);
    elements.budgetDialogLoad.addEventListener("click", () => {
      if (state.activeBudgetPlanId) {
        loadPlanIntoCart(state.activeBudgetPlanId);
        closeBudgetDialog();
      }
    });

    elements.budgetDialog.addEventListener("click", (event) => {
      const viewButton = event.target.closest("[data-budget-view]");
      if (viewButton) {
        state.budgetView = viewButton.dataset.budgetView;
        renderBudgetDialog();
      }

      if (event.target === elements.budgetDialog) {
        closeBudgetDialog();
      }
    });

    elements.closeImageDialog.addEventListener("click", closeProductImage);
    elements.imageDialog.addEventListener("click", (event) => {
      if (event.target === elements.imageDialog) {
        closeProductImage();
      }
    });
    elements.imageDialog.addEventListener("close", () => {
      elements.imageDialogImage.removeAttribute("src");
    });

    document.getElementById("close-dialog-button").addEventListener("click", closeProductDialog);
    document.getElementById("cancel-form-button").addEventListener("click", closeProductDialog);
    elements.productDialog.addEventListener("click", (event) => {
      if (event.target === elements.productDialog) {
        closeProductDialog();
      }
    });
    elements.productForm.addEventListener("submit", handleProductSave);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.cartOpen) {
        event.preventDefault();
        closeFullCart();
      }
    });

    document.addEventListener("error", handleProductImageError, true);

    window.addEventListener("online", () => {
      renderCloudStatus("saving", "Reconnecting");
      scheduleCloudSave({ immediate: true });
    });
    window.addEventListener("offline", () => renderCloudStatus("offline", "Offline changes"));
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      elements.installAppButton.hidden = false;
    });
    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      elements.installAppButton.hidden = true;
      showToast("Good Groceries installed.");
    });
    elements.installAppButton.addEventListener("click", installHostedApp);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushCloudState({ keepalive: true });
    });
  }

  function render() {
    renderTheme();
    renderFilters();
    renderBudgetPlans();
    renderProductList();
    renderDetail();
    renderCart();
    renderSyncButton();
  }

  function renderSyncButton() {
    elements.syncListingsButton.disabled = state.bulkSyncing;
    elements.syncListingsButton.textContent = state.bulkSyncing
      ? `Checking ${state.bulkSyncCompleted}/${state.bulkSyncTotal}`
      : "Refresh data & images";
    elements.syncListingsButton.setAttribute(
      "aria-label",
      state.bulkSyncing
        ? `Checking retailer listing ${state.bulkSyncCompleted} of ${state.bulkSyncTotal}`
        : "Refresh every exact Aldi and Walmart listing, price, availability, and product image"
    );
  }

  function renderTheme() {
    const isDark = document.documentElement.dataset.theme === "dark";
    elements.themeToggle.setAttribute("aria-pressed", String(isDark));
    elements.themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
    elements.themeLabel.textContent = isDark ? "Light mode" : "Dark mode";
  }

  function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(THEME_KEY, nextTheme);
    renderTheme();
  }

  async function initializeHostedApp() {
    renderCloudStatus(navigator.onLine ? "connecting" : "offline", navigator.onLine ? "Connecting" : "Offline changes");
    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installation support is optional; the hosted app still works online.
      });
    }

    if (!navigator.onLine) {
      state.cloud.ready = true;
      return;
    }

    try {
      const response = await fetch(CLOUD_STATE_ENDPOINT, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Cloud catalog is unavailable.");
      }

      state.cloud.revision = Number(payload.revision || 0);
      state.cloud.lastSavedAt = payload.updatedAt || "";
      if (payload.hasState && !state.cloud.localDirty) {
        if (payload.catalog?.products) {
          state.data = normalizeCatalog(payload.catalog);
          window.localStorage.setItem(DATA_KEY, JSON.stringify(state.data));
        }
        if (payload.cart && typeof payload.cart === "object" && !Array.isArray(payload.cart)) {
          state.cart = payload.cart;
          window.localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
        }
        if (!getProductById(state.selectedProductId)) {
          state.selectedProductId = state.data.products[0]?.id || null;
        }
        render();
      }
      state.cloud.ready = true;

      if (!payload.hasState || state.cloud.localDirty) {
        state.cloud.pendingCatalog = true;
        state.cloud.pendingCart = true;
        scheduleCloudSave({ immediate: true });
      } else {
        renderCloudStatus("saved", cloudSavedLabel());
      }
    } catch {
      state.cloud.ready = true;
      renderCloudStatus(navigator.onLine ? "error" : "offline", navigator.onLine ? "Cloud unavailable" : "Offline changes");
    }
  }

  function renderCloudStatus(status, label) {
    elements.cloudStatus.dataset.state = status;
    elements.cloudStatusLabel.textContent = label;
    elements.cloudStatus.title =
      status === "saved"
        ? "Your catalog and cart are saved to your private account."
        : status === "offline"
          ? "Changes are saved on this device and will sync when the connection returns."
          : status === "error"
            ? "Cloud saving is temporarily unavailable; this device still has your changes."
            : "Saving your private catalog and cart.";
  }

  function cloudSavedLabel() {
    if (!state.cloud.lastSavedAt) return "Saved to cloud";
    const saved = new Date(state.cloud.lastSavedAt);
    if (Number.isNaN(saved.getTime())) return "Saved to cloud";
    return `Saved ${saved.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }

  function scheduleCloudSave(options = {}) {
    if (options.catalog) state.cloud.pendingCatalog = true;
    if (options.cart) state.cloud.pendingCart = true;
    if (options.catalog || options.cart) state.cloud.localDirty = true;
    if (!state.cloud.ready) return;
    if (!navigator.onLine) {
      renderCloudStatus("offline", "Offline changes");
      return;
    }
    window.clearTimeout(state.cloud.timer);
    state.cloud.timer = window.setTimeout(() => flushCloudState(), options.immediate ? 0 : CLOUD_SAVE_DELAY);
    renderCloudStatus("saving", "Saving");
  }

  async function flushCloudState(options = {}) {
    if (!state.cloud.ready || state.cloud.saving || !navigator.onLine) return;
    if (!state.cloud.pendingCatalog && !state.cloud.pendingCart) return;
    window.clearTimeout(state.cloud.timer);

    const includeCatalog = state.cloud.pendingCatalog;
    const includeCart = state.cloud.pendingCart;
    state.cloud.pendingCatalog = false;
    state.cloud.pendingCart = false;
    state.cloud.saving = true;
    renderCloudStatus("saving", "Saving");

    const payload = { baseRevision: state.cloud.revision };
    if (includeCatalog) payload.catalog = state.data;
    if (includeCart) payload.cart = state.cart;

    try {
      let response = await fetch(CLOUD_STATE_ENDPOINT, {
        method: "PATCH",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: Boolean(options.keepalive),
      });
      let result = await response.json().catch(() => ({}));

      if (response.status === 409 && result.conflict) {
        state.cloud.revision = Number(result.revision || state.cloud.revision);
        payload.baseRevision = state.cloud.revision;
        response = await fetch(CLOUD_STATE_ENDPOINT, {
          method: "PATCH",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: Boolean(options.keepalive),
        });
        result = await response.json().catch(() => ({}));
      }

      if (!response.ok || !result.ok) throw new Error(result.error || "Cloud save failed.");
      state.cloud.revision = Number(result.revision || state.cloud.revision);
      state.cloud.lastSavedAt = result.updatedAt || new Date().toISOString();
      state.cloud.localDirty = false;
      renderCloudStatus("saved", cloudSavedLabel());
    } catch {
      if (includeCatalog) state.cloud.pendingCatalog = true;
      if (includeCart) state.cloud.pendingCart = true;
      renderCloudStatus(navigator.onLine ? "error" : "offline", navigator.onLine ? "Save pending" : "Offline changes");
    } finally {
      state.cloud.saving = false;
      if ((state.cloud.pendingCatalog || state.cloud.pendingCart) && navigator.onLine && !options.keepalive) {
        state.cloud.timer = window.setTimeout(() => flushCloudState(), 3000);
      }
    }
  }

  async function installHostedApp() {
    if (!deferredInstallPrompt) return;
    await deferredInstallPrompt.prompt();
    deferredInstallPrompt = null;
    elements.installAppButton.hidden = true;
  }

  function renderFilters() {
    renderSelect(elements.categoryFilter, getOptionList("category"), state.filters.category);
    renderSelect(elements.storeFilter, getOptionList("store"), state.filters.store);
    renderSelect(elements.tierFilter, ["All", "S", "A", "B"], state.filters.tier);

    const certifications = Array.from(
      new Set(
        state.data.products.flatMap((product) =>
          (product.certifications || []).map((item) => item.name).filter(Boolean)
        )
      )
    ).sort();

    renderSelect(
      elements.certificationFilter,
      ["All"].concat(certifications),
      state.filters.certification
    );
    elements.choiceFilter.value = state.filters.choice;
    elements.catalogSort.value = state.catalogSort;
    elements.cartSort.value = state.cartSort;

    renderQuickFilterState();
  }

  function renderQuickFilterState() {
    elements.favoritesFilter.classList.toggle("active", state.filters.favoritesOnly);
    elements.favoritesFilter.setAttribute("aria-pressed", String(state.filters.favoritesOnly));
    elements.availabilityFilter.classList.toggle("active", state.filters.inStockOnly);
    elements.availabilityFilter.setAttribute("aria-pressed", String(state.filters.inStockOnly));

    const activeFilterCount = [
      Boolean(state.filters.search),
      state.filters.category !== "All",
      state.filters.store !== "All",
      state.filters.tier !== "All",
      state.filters.certification !== "All",
      state.filters.choice !== "All",
      state.filters.favoritesOnly,
      state.filters.inStockOnly,
    ].filter(Boolean).length;
    elements.clearFiltersButton.disabled = activeFilterCount === 0;
    elements.clearFiltersButton.textContent = activeFilterCount
      ? `Clear filters (${activeFilterCount})`
      : "Clear filters";
  }

  function clearCatalogFilters() {
    state.filters = {
      search: "",
      category: "All",
      store: "All",
      tier: "All",
      certification: "All",
      choice: "All",
      favoritesOnly: false,
      inStockOnly: false,
    };
    elements.searchInput.value = "";
    renderFilters();
    renderProductList();
    elements.searchInput.focus();
  }

  function renderSelect(element, options, selectedValue) {
    element.innerHTML = "";
    options.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      option.selected = value === selectedValue;
      element.appendChild(option);
    });
  }

  function renderBudgetPlans() {
    elements.budgetPlans.innerHTML = state.data.budgetPlans
      .map((plan, index) => {
        const total = computePlanTotal(plan);
        const difference = plan.target - total;
        const status =
          difference >= 0
            ? `$${formatCurrency(difference)} under target`
            : `$${formatCurrency(Math.abs(difference))} over target`;

        return `
          <article class="budget-card" data-index="0${index + 1}">
            <div class="budget-card-top">
              <h3>${escapeHtml(plan.name)}</h3>
              <span class="budget-card-total">$${formatCurrency(total)}</span>
            </div>
            <div class="budget-copy">
              <p>${escapeHtml(plan.summary)}</p>
              <div class="budget-meta">
                <span>$${formatCurrency(plan.target)} target</span>
                <span>${escapeHtml(status)}</span>
                <span>${plan.items.length} products</span>
              </div>
            </div>
            <div class="budget-actions">
              <button class="secondary-button" type="button" data-plan-preview="${escapeAttribute(plan.id)}">View items</button>
              <button class="primary-button" type="button" data-plan-load="${escapeAttribute(plan.id)}">Load cart</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderProductList() {
    const products = getFilteredProducts();
    elements.resultsCount.textContent = `${products.length} of ${state.data.products.length} products`;

    if (products.length === 0) {
      elements.productList.innerHTML =
        '<div class="empty-state">No products match these filters. Clear one or adjust the search.</div>';
      return;
    }

    elements.productList.innerHTML = products
      .map((product) => {
        const selected = product.id === state.selectedProductId;
        const certificationNames = (product.certifications || []).map((item) => item.name);
        const certificationBadge = certificationNames[0]
          ? `<span class="certification-chip">${escapeHtml(certificationNames[0])}</span>`
          : "";

        return `
          <article class="product-card ${storeClass(product.store)}${selected ? " selected" : ""}">
            <div class="product-main">
              <div class="product-identification">
                <button class="product-thumbnail-button" type="button" data-select-product="${escapeAttribute(product.id)}" aria-label="Select ${escapeAttribute(product.name)}" aria-pressed="${selected}">
                  ${renderProductImage(product, "catalog")}
                </button>
                <button class="product-select" type="button" data-select-product="${escapeAttribute(product.id)}" aria-pressed="${selected}">
                  <span class="product-kicker">
                    <span>${escapeHtml(product.brand || product.store)}</span>
                    <span>${escapeHtml(product.category)}</span>
                  </span>
                  <span class="product-title" role="heading" aria-level="3">${escapeHtml(product.name)}</span>
                  <span class="product-subtitle">${escapeHtml(product.summary || "No summary recorded.")}</span>
                </button>
              </div>
              <div class="badge-row">
                ${renderStorePill(product.store)}
                ${renderChoiceBadge(product.choiceType)}
                ${renderTierBadge(product.foodTier)}
                ${renderVerificationBadge(product.verificationGrade)}
                ${certificationBadge}
                ${renderListingStatusChip(product, true)}
              </div>
            </div>
            <div class="product-side">
              <div class="product-side-top">
                ${renderFavoriteButton(product)}
                <div class="product-price">
                  <strong>${formatProductPrice(product)}</strong>
                  <span>${escapeHtml(product.size || "unit")}</span>
                </div>
              </div>
              <div class="product-actions">
                ${renderBuyLink(product, `Buy at ${product.store}`)}
                <button class="primary-button" type="button" data-add-product="${escapeAttribute(product.id)}">Add</button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function selectProduct(productId) {
    if (!getProductById(productId)) {
      return;
    }

    state.selectedProductId = productId;
    state.detailTab = "overview";
    renderProductList();
    renderDetail();
    elements.detailPanel.scrollTop = 0;
    ensureProductImage(productId);

    if (window.matchMedia("(max-width: 920px)").matches) {
      elements.detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function renderDetail() {
    const product = getSelectedProduct();
    if (!product) {
      elements.detailMedia.innerHTML = "";
      elements.detailTitle.textContent = "Choose a product";
      elements.productDetail.className = "product-detail empty-state";
      elements.productDetail.textContent =
        "Select a product to see pricing, nutrition, ingredients, certifications, and verification notes.";
      return;
    }

    elements.detailMedia.innerHTML = renderDetailImage(product);
    elements.detailTitle.textContent = product.name;
    elements.productDetail.className = "product-detail";
    elements.productDetail.innerHTML = `
      <div class="detail-identity">
        <div class="badge-row">
          ${renderStorePill(product.store)}
          ${renderChoiceBadge(product.choiceType)}
          ${renderTierBadge(product.foodTier)}
          ${renderVerificationBadge(product.verificationGrade)}
          ${renderListingStatusChip(product)}
        </div>
        <p>${escapeHtml(product.summary || "No summary recorded.")}</p>
        <div class="detail-actions">
          ${renderFavoriteButton(product, true)}
          <button class="primary-button" type="button" data-detail-add="${escapeAttribute(product.id)}">Add to cart</button>
          ${renderBuyLink(product, `Buy at ${product.store}`)}
          <button class="secondary-button" type="button" data-refresh-product="${escapeAttribute(product.id)}" ${product.retailerData?.status === "checking" ? "disabled" : ""}>${product.retailerData?.status === "checking" ? "Checking..." : "Pull retailer data"}</button>
          <button class="secondary-button" type="button" data-detail-edit="${escapeAttribute(product.id)}">Edit product</button>
        </div>
      </div>

      <div class="detail-tabs" role="tablist" aria-label="Product detail sections">
        <button
          class="detail-tab${state.detailTab === "overview" ? " active" : ""}"
          type="button"
          role="tab"
          aria-selected="${state.detailTab === "overview"}"
          data-detail-tab="overview"
        >Product details</button>
        <button
          class="detail-tab${state.detailTab === "notes" ? " active" : ""}"
          type="button"
          role="tab"
          aria-selected="${state.detailTab === "notes"}"
          data-detail-tab="notes"
        >Notes &amp; sources</button>
      </div>

      <div class="detail-tab-panel" role="tabpanel">
        ${state.detailTab === "notes" ? renderNotesTab(product) : renderOverviewTab(product)}
      </div>
    `;
  }

  function renderProductImage(product, variant = "catalog") {
    const imageUrl = getProductImageUrl(product);
    const classes = `product-image-frame image-${escapeAttribute(variant)}${imageUrl ? " has-image" : " no-image"}`;
    return `
      <span class="${classes}" data-image-frame>
        <span class="product-image-placeholder" aria-hidden="true">${escapeHtml(productInitials(product))}</span>
        ${
          imageUrl
            ? `<img src="${escapeAttribute(imageUrl)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-product-image />`
            : ""
        }
      </span>
    `;
  }

  function renderDetailImage(product) {
    const imageUrl = getProductImageUrl(product);
    if (!imageUrl) {
      const imageWasChecked = Object.prototype.hasOwnProperty.call(product.retailerData || {}, "imageUrl");
      return `
        <div class="detail-image-empty">
          ${renderProductImage(product, "detail")}
          <span>
            <strong>${imageWasChecked ? "No verified listing image" : "Image not pulled yet"}</strong>
            <small>${
              imageWasChecked
                ? `The matched ${escapeHtml(product.store)} page does not currently expose a usable product photo.`
                : "The exact retailer listing is checked automatically when this product is selected."
            }</small>
          </span>
        </div>
      `;
    }
    return `
      <button class="detail-image-button" type="button" data-open-product-image="${escapeAttribute(product.id)}" aria-label="View full image of ${escapeAttribute(product.name)}">
        ${renderProductImage(product, "detail")}
        <span class="image-expand-label">View full image</span>
      </button>
    `;
  }

  function renderFavoriteButton(product, labeled = false) {
    const active = Boolean(product.favorite);
    const accessibleLabel = active
      ? `Remove ${product.name} from favorites`
      : `Add ${product.name} to favorites`;
    return `
      <button
        class="favorite-button${active ? " active" : ""}${labeled ? " labeled" : ""}"
        type="button"
        data-toggle-favorite="${escapeAttribute(product.id)}"
        aria-pressed="${active}"
        aria-label="${escapeAttribute(accessibleLabel)}"
        title="${escapeAttribute(accessibleLabel)}"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4 4.4 13A5.2 5.2 0 0 1 12 5.9 5.2 5.2 0 0 1 19.6 13Z" /></svg>
        ${labeled ? `<span>${active ? "Favorited" : "Favorite"}</span>` : ""}
      </button>
    `;
  }

  function productInitials(product) {
    const words = String(product?.name || "Product").match(/[A-Za-z0-9]+/g) || ["P"];
    return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  }

  function getProductImageUrl(product) {
    const candidates = [product?.imageUrl, product?.retailerData?.imageUrl];
    return candidates.find((url) => isSafeHttpUrl(url)) || "";
  }

  function toggleFavorite(productId) {
    const product = getProductById(productId);
    if (!product) {
      return;
    }
    product.favorite = !product.favorite;
    persistCatalog();
    renderFilters();
    renderProductList();
    renderDetail();
    showToast(product.favorite ? `${product.name} added to favorites.` : `${product.name} removed from favorites.`);
  }

  async function ensureProductImage(productId) {
    const product = getProductById(productId);
    if (
      !product ||
      getProductImageUrl(product) ||
      pendingImageRefreshes.has(product.id) ||
      Object.prototype.hasOwnProperty.call(product.retailerData || {}, "imageUrl") ||
      ["broken", "mismatch", "marketplace"].includes(product.retailerData?.status)
    ) {
      return;
    }

    pendingImageRefreshes.add(product.id);
    try {
      await refreshRetailerData(product.id, { silent: true });
    } finally {
      pendingImageRefreshes.delete(product.id);
      renderProductList();
      renderDetail();
      renderCart();
    }
  }

  function openProductImage(productId) {
    const product = getProductById(productId);
    const imageUrl = getProductImageUrl(product);
    if (!product || !imageUrl) {
      return;
    }
    const purchaseUrl = getPurchaseUrl(product);
    elements.imageDialogTitle.textContent = product.name;
    elements.imageDialogImage.src = imageUrl;
    elements.imageDialogImage.alt = product.name;
    elements.imageDialogImage.hidden = false;
    elements.imageDialog.querySelector(".image-viewer-stage")?.classList.remove("image-load-error");
    elements.imageDialogCaption.textContent = `Exact image pulled from the matched ${product.store} product listing.`;
    elements.imageDialogLink.hidden = !purchaseUrl;
    if (purchaseUrl) {
      elements.imageDialogLink.href = purchaseUrl;
      elements.imageDialogLink.textContent = `Open at ${product.store}`;
    }
    elements.imageDialog.showModal();
  }

  function closeProductImage() {
    if (elements.imageDialog.open) {
      elements.imageDialog.close();
    }
  }

  function handleProductImageError(event) {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) {
      return;
    }
    if (!image.matches("[data-product-image]") && image !== elements.imageDialogImage) {
      return;
    }
    image.hidden = true;
    image.closest("[data-image-frame], .image-viewer-stage")?.classList.add("image-load-error");
    if (image === elements.imageDialogImage) {
      elements.imageDialogCaption.textContent = "This retailer image could not be loaded. Refresh the exact listing to retrieve its latest image.";
    }
  }

  function renderOverviewTab(product) {
    return `
      <div class="price-grid">
        ${renderPriceItem("Current price", formatUnitPrice(product, "/"))}
        ${renderPriceItem("Typical price", product.typicalPrice || "Not recorded")}
        ${renderPriceItem("Last checked", product.priceLastChecked || "Not recorded")}
        ${renderPriceItem("Category", product.category || "Not recorded")}
      </div>
      ${renderRetailerStatus(product)}
      ${renderAlternativeSection(product)}
      ${renderTierProfileSection(product)}
      ${renderCertificationSection(product)}
      ${renderMarketingSection(product.marketingClaims)}
      ${renderNutritionSection(product.nutrition)}
      ${renderListSection("Ingredients", product.ingredients, null, "No ingredients recorded.")}
      ${renderListSection("Additives", product.additives, formatAdditive, "No additives recorded.")}
      ${renderParagraphSection("Production / verification", product.productionNotes)}
    `;
  }

  function renderNotesTab(product) {
    const nutritionSource = product.nutrition?.sourceNote || "";
    return `
      ${renderListSection("Evidence notes", product.evidenceNotes, null, "No evidence notes recorded.")}
      ${renderParagraphSection("Personal notes", product.notes, "No personal notes recorded.")}
      ${renderParagraphSection("Nutrition source note", nutritionSource, "No nutrition source note recorded.")}
      ${renderSourceLinks(product.sourceLinks)}
    `;
  }

  function renderRetailerStatus(product) {
    const retailerData = product.retailerData || { status: "unchecked" };
    const status = retailerData.status || "unchecked";
    const messages = {
      unchecked: "This exact product link has not been pulled by the app yet.",
      checking: "Reading the current retailer listing...",
      current: "Exact retailer listing matched this product.",
      "out-of-stock": "The exact listing is valid, but the retailer currently reports it out of stock.",
      broken: "This product page is dead or no longer exposes a valid listing. Buy is disabled until the link is replaced.",
      mismatch: "The link resolves to a different product. No price or ingredient data was applied.",
      marketplace: "This Walmart page is fulfilled by a marketplace seller, not the local Walmart grocery catalog.",
      error: "The retailer could not be checked right now. Existing catalog data was left unchanged.",
    };
    const fetchedIngredients = retailerData.ingredients
      ? `<p><strong>Retailer ingredient text:</strong> ${escapeHtml(retailerData.ingredients)}</p>`
      : "";
    const labelLinks = [
      renderRetailerLabelLink(retailerData.nutritionLabelUrl, "Open nutrition label"),
      renderRetailerLabelLink(retailerData.ingredientLabelUrl, "Open ingredient label"),
    ].filter(Boolean);
    const details = [
      retailerData.listingName ? `Listing: ${retailerData.listingName}` : "",
      retailerData.seller ? `Seller: ${retailerData.seller}` : "",
      retailerData.availability ? `Status: ${formatAvailability(retailerData.availability)}` : "",
    ].filter(Boolean);
    const livePricing = [
      Number.isFinite(Number(retailerData.unitPrice)) && retailerData.priceUnit
        ? `Live unit price: $${formatCurrency(retailerData.unitPrice)}/${retailerData.priceUnit}`
        : "",
      Number.isFinite(Number(retailerData.listingPrice)) && retailerData.packageDescription
        ? `Retailer estimate: $${formatCurrency(retailerData.listingPrice)} per package`
        : "",
      retailerData.packageDescription || "",
    ].filter(Boolean);
    const verificationFacts = [
      retailerData.matchConfidence ? `Identity confidence: ${retailerData.matchConfidence}` : "",
      retailerData.sourceMethod ? `Source: ${retailerData.sourceMethod}` : "",
      retailerData.cached
        ? retailerData.stale
          ? "Using last verified data"
          : "Served from recent cache"
        : "",
      Number(retailerData.cacheAgeSeconds) > 0
        ? `Cache age: ${formatCacheAge(retailerData.cacheAgeSeconds)}`
        : "",
    ].filter(Boolean);
    const repairActions = ["broken", "mismatch", "marketplace"].includes(status)
      ? `
        <div class="retailer-repair-actions">
          <button class="secondary-button" type="button" data-replace-link="${escapeAttribute(product.id)}">Replace exact link</button>
          <button class="text-button danger-text" type="button" data-remove-broken="${escapeAttribute(product.id)}">Remove product</button>
        </div>
      `
      : "";

    return `
      <section class="detail-section retailer-status status-${escapeAttribute(status)}">
        <div class="retailer-status-head">
          <h4>Retailer link check</h4>
          ${renderListingStatusChip(product)}
        </div>
        <p>${escapeHtml(messages[status] || messages.error)}</p>
        ${details.length ? `<p class="retailer-facts">${escapeHtml(details.join(" · "))}</p>` : ""}
        ${livePricing.length ? `<p class="retailer-facts">${escapeHtml(livePricing.join(" · "))}</p>` : ""}
        ${verificationFacts.length ? `<p class="retailer-facts">${escapeHtml(verificationFacts.join(" · "))}</p>` : ""}
        ${retailerData.scope ? `<p class="claim-note">${escapeHtml(retailerData.scope)}</p>` : ""}
        ${retailerData.warning ? `<p class="claim-note">${escapeHtml(retailerData.warning)}</p>` : ""}
        ${retailerData.priceReview ? `<p class="retailer-error">${escapeHtml(retailerData.priceReview)}</p>` : ""}
        ${retailerData.error ? `<p class="retailer-error">${escapeHtml(retailerData.error)}</p>` : ""}
        ${fetchedIngredients}
        ${labelLinks.length ? `<div class="retailer-label-links">${labelLinks.join("")}</div>` : ""}
        ${repairActions}
      </section>
    `;
  }

  function renderRetailerLabelLink(url, label) {
    if (!isSafeHttpUrl(url)) {
      return "";
    }
    return `<a href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
  }

  function formatCacheAge(seconds) {
    const value = Math.max(0, Number(seconds) || 0);
    if (value < 60) return "under a minute";
    if (value < 3600) return `${Math.round(value / 60)} min`;
    if (value < 86400) return `${Math.round(value / 3600)} hr`;
    return `${Math.round(value / 86400)} days`;
  }

  function removeBrokenProduct(productId) {
    const product = getProductById(productId);
    if (!product || !["broken", "mismatch", "marketplace"].includes(product.retailerData?.status)) {
      return;
    }

    const confirmed = window.confirm(
      `Remove "${product.name}" from the product catalog? Its food remains visible as a missing option in the comprehensive tier list.`
    );
    if (!confirmed) {
      return;
    }

    state.data.products = state.data.products.filter((item) => item.id !== productId);
    state.data.budgetPlans = state.data.budgetPlans.map((plan) => ({
      ...plan,
      items: plan.items.filter((item) => item.productId !== productId),
    }));
    delete state.cart[productId];
    state.selectedProductId = state.data.products[0]?.id || null;
    persistCatalog();
    persistCart();
    render();
    showToast(`${product.name} removed; its tier-list gap remains visible.`);
  }

  function renderAlternativeSection(product) {
    if (!product.foodKey) {
      return `
        <section class="detail-section">
          <h4>Alternative</h4>
          <p>This is an optional or unpaired catalog product.</p>
        </section>
      `;
    }

    const alternatives = state.data.products.filter(
      (item) => item.foodKey === product.foodKey && item.id !== product.id
    );
    if (alternatives.length === 0) {
      return `
        <section class="detail-section alternative-section">
          <h4>Quality and price alternative</h4>
          <p>No honest second exact listing is recorded yet. The tier-list coverage view explains what is missing.</p>
        </section>
      `;
    }

    return `
      <section class="detail-section alternative-section">
        <h4>Quality and price alternatives</h4>
        <div class="alternative-list">
          ${alternatives
            .sort((left, right) => compareProducts(left, right, "quality-first"))
            .map(
              (item) => `
                <button class="alternative-button ${storeClass(item.store)}" type="button" data-select-alternative="${escapeAttribute(item.id)}">
                  <span>${escapeHtml(choiceLabel(item.choiceType))} · ${escapeHtml(item.store)}</span>
                  <strong>${escapeHtml(item.name)}</strong>
                  <b>${formatProductPrice(item)}</b>
                </button>
              `
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderTierProfileSection(product) {
    const profile = getTierProfile(product.foodKey);
    if (!profile) {
      return "";
    }
    return `
      <section class="detail-section tier-profile-section">
        <h4>Food tier context</h4>
        <p><strong>${escapeHtml(profile.name)} · Food Tier ${escapeHtml(profile.tier)}</strong></p>
        <p><strong>Key nutrients:</strong> ${escapeHtml(profile.nutrients)}</p>
        <p><strong>Why it is ranked here:</strong> ${escapeHtml(profile.tierRationale)}</p>
        ${profile.caution ? `<p class="tier-caution"><strong>Caution:</strong> ${escapeHtml(profile.caution)}</p>` : ""}
        <p class="claim-note">${escapeHtml(state.data.tierModelDisclaimer || "Food tier context is separate from product verification.")}</p>
      </section>
    `;
  }

  function renderPriceItem(label, value) {
    return `
      <div class="price-item">
        <strong>${escapeHtml(label)}</strong>
        <span>${escapeHtml(value)}</span>
      </div>
    `;
  }

  function renderCertificationSection(product) {
    const items = product.certifications || [];
    if (items.length === 0) {
      return `
        <section class="detail-section">
          <h4>Credible certifications</h4>
          <p>No credible third-party or government certification is recorded for this product.</p>
        </section>
      `;
    }

    const cards = items
      .map(
        (item) => `
          <div class="certification-card">
            <strong>${escapeHtml(item.name || "Certification")}</strong>
            <span>${escapeHtml([item.certifier, item.scope].filter(Boolean).join(" · "))}</span>
            ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
          </div>
        `
      )
      .join("");

    return `
      <section class="detail-section">
        <h4>Credible certifications</h4>
        ${cards}
      </section>
    `;
  }

  function renderMarketingSection(claims) {
    if (!claims || claims.length === 0) {
      return "";
    }

    return `
      <section class="detail-section">
        <h4>Marketing / label claims</h4>
        <p class="claim-note">These labels are descriptive claims, not independent certifications unless also listed above.</p>
        <div class="detail-chip-row">
          ${claims.map((item) => `<span class="claim-chip">${escapeHtml(item)}</span>`).join("")}
        </div>
      </section>
    `;
  }

  function renderNutritionSection(nutrition) {
    if (!nutrition) {
      return "";
    }

    return `
      <section class="detail-section">
        <h4>Nutrition</h4>
        <p>Per ${escapeHtml(nutrition.serving || "serving")}</p>
        <div class="nutrition-metrics">
          ${renderMetric("Calories", formatMetricValue(nutrition.calories))}
          ${renderMetric("Protein", formatMetricValue(nutrition.proteinG, "g"))}
          ${renderMetric("Carbs", formatMetricValue(nutrition.carbsG, "g"))}
          ${renderMetric("Fat", formatMetricValue(nutrition.fatG, "g"))}
          ${renderMetric("Fiber", formatMetricValue(nutrition.fiberG, "g"))}
          ${renderMetric("Sugar", formatMetricValue(nutrition.sugarG, "g"))}
          ${renderMetric("Sodium", formatMetricValue(nutrition.sodiumMg, "mg"))}
        </div>
      </section>
    `;
  }

  function renderMetric(label, value) {
    return `
      <div class="metric">
        <strong>${escapeHtml(label)}</strong>
        <span>${escapeHtml(value)}</span>
      </div>
    `;
  }

  function formatMetricValue(value, unit) {
    if (value === null || value === undefined || value === "") {
      return "Not recorded";
    }
    return `${value}${unit ? ` ${unit}` : ""}`;
  }

  function renderParagraphSection(title, content, emptyMessage) {
    if (!content && !emptyMessage) {
      return "";
    }

    return `
      <section class="detail-section">
        <h4>${escapeHtml(title)}</h4>
        <p>${escapeHtml(content || emptyMessage)}</p>
      </section>
    `;
  }

  function renderListSection(title, items, formatter, emptyMessage) {
    if (!items || items.length === 0) {
      return emptyMessage
        ? `<section class="detail-section"><h4>${escapeHtml(title)}</h4><p>${escapeHtml(emptyMessage)}</p></section>`
        : "";
    }

    const list = items
      .map((item) => `<li>${formatter ? formatter(item) : escapeHtml(String(item))}</li>`)
      .join("");

    return `<section class="detail-section"><h4>${escapeHtml(title)}</h4><ul>${list}</ul></section>`;
  }

  function renderSourceLinks(sourceLinks) {
    if (!sourceLinks || sourceLinks.length === 0) {
      return `
        <section class="detail-section">
          <h4>Sources</h4>
          <p>No source links recorded.</p>
        </section>
      `;
    }

    return `
      <section class="detail-section">
        <h4>Sources</h4>
        <div class="source-links">
          ${sourceLinks
            .filter((item) => item.url)
            .map(
              (item) =>
                `<a href="${escapeAttribute(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label || "Source")}</a>`
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function openTierLibrary() {
    state.tierLibrarySearch = "";
    state.tierLibraryFilter = "All";
    elements.tierLibrarySearch.value = "";
    elements.tierLibraryFilter.value = "All";
    renderTierLibrary();
    elements.tierLibraryDialog.showModal();
  }

  function closeTierLibrary() {
    if (elements.tierLibraryDialog.open) {
      elements.tierLibraryDialog.close();
    }
  }

  function getTierCoverage(profile) {
    if (profile.excluded) {
      return { status: "excluded", products: [], quality: null, cheapest: null };
    }
    const products = state.data.products.filter((product) => product.foodKey === profile.key);
    const quality = products.find((product) => ["quality", "both"].includes(product.choiceType)) || null;
    const cheapest = products.find((product) => ["cheapest", "both"].includes(product.choiceType)) || null;
    const distinctPair = quality && cheapest && quality.id !== cheapest.id;
    return {
      status: distinctPair ? "paired" : products.length ? "single" : "missing",
      products,
      quality,
      cheapest,
    };
  }

  function renderTierLibrary() {
    const profiles = state.data.tierLibrary || [];
    const coverageRows = profiles.map((profile) => ({ profile, ...getTierCoverage(profile) }));
    const counts = coverageRows.reduce((result, item) => {
      result[item.status] = (result[item.status] || 0) + 1;
      return result;
    }, {});
    elements.tierLibrarySummary.textContent = `${profiles.length} foods · ${counts.paired || 0} complete pairs · ${counts.single || 0} with one exact choice · ${counts.missing || 0} still needing verified local choices · ${counts.excluded || 0} excluded`;

    const search = state.tierLibrarySearch.toLowerCase();
    const visible = coverageRows.filter((item) => {
      const filterMatches =
        state.tierLibraryFilter === "All" || item.status === state.tierLibraryFilter;
      const haystack = [
        item.profile.name,
        item.profile.section,
        item.profile.tier,
        item.profile.nutrients,
        item.profile.tierRationale,
        ...item.products.flatMap((product) => [product.name, product.brand, product.store]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return filterMatches && (!search || haystack.includes(search));
    });

    if (visible.length === 0) {
      elements.tierLibraryItems.innerHTML =
        '<div class="empty-state">No tier-list foods match this search and coverage filter.</div>';
      return;
    }

    elements.tierLibraryItems.innerHTML = visible
      .map(({ profile, status, products, quality, cheapest }) => {
        const statusLabels = {
          paired: "Quality + cheapest ready",
          single: "One exact choice",
          missing: "Needs verified choices",
          excluded: "Excluded preference",
        };
        const uniqueProducts = Array.from(
          new Map([quality, cheapest, ...products].filter(Boolean).map((product) => [product.id, product])).values()
        );
        return `
          <article class="tier-library-row coverage-${escapeAttribute(status)}">
            <div class="tier-library-copy">
              <div class="badge-row">
                ${renderTierBadge(profile.tier)}
                <span class="coverage-chip">${escapeHtml(statusLabels[status])}</span>
                <span class="meta-pill">${escapeHtml(profile.category)}</span>
              </div>
              <h3>${escapeHtml(profile.name)}</h3>
              <p>${escapeHtml(profile.nutrients)}</p>
              ${profile.statusNote ? `<p class="tier-status-note">${escapeHtml(profile.statusNote)}</p>` : ""}
              ${status === "missing" ? '<p class="tier-status-note">No exact first-party Aldi/Walmart product pair has passed the catalog check yet. Seasonal or marketplace search results are not treated as local availability.</p>' : ""}
            </div>
            <div class="tier-library-choices">
              ${uniqueProducts
                .map(
                  (product) => `
                    <button class="tier-choice-button ${storeClass(product.store)}" type="button" data-tier-select="${escapeAttribute(product.id)}">
                      <span>${escapeHtml(choiceLabel(product.choiceType))} · ${escapeHtml(product.store)}</span>
                      <strong>${escapeHtml(product.name)}</strong>
                      <b>${formatProductPrice(product)}</b>
                    </button>
                  `
                )
                .join("")}
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderCart() {
    const entries = getCartEntries();
    const total = getCartTotal(entries);
    const unpricedCount = entries.filter((item) => !hasPrice(item.product)).length;
    const totalLabel = `$${formatCurrency(total)}${unpricedCount ? " + pending" : ""}`;

    elements.headerCartCount.textContent = String(entries.length);
    elements.miniCartCount.textContent = String(entries.length);
    elements.miniCartUnit.textContent = entries.length === 1 ? "item" : "items";
    elements.miniCartTotal.textContent = totalLabel;
    elements.fullCartTotal.textContent = totalLabel;
    elements.cartLineSummary.textContent = `${entries.length} product${entries.length === 1 ? "" : "s"} from ${getStoreCount(entries)} store${getStoreCount(entries) === 1 ? "" : "s"}${unpricedCount ? ` · ${unpricedCount} price${unpricedCount === 1 ? "" : "s"} pending` : ""}`;

    renderMiniCart(entries);
    renderFullCart(entries);
    renderBudgetStatus(total);
    renderStoreBreakdown(entries);
  }

  function renderMiniCart(entries) {
    if (entries.length === 0) {
      elements.miniCart.classList.remove("is-visible");
      elements.miniCart.setAttribute("aria-hidden", "true");
      window.setTimeout(() => {
        if (getCartEntries().length === 0) {
          elements.miniCart.hidden = true;
        }
      }, 260);
      return;
    }

    elements.miniCart.hidden = false;
    elements.miniCart.setAttribute("aria-hidden", "false");
    const miniEntries = [...entries].sort((left, right) => compareProducts(left.product, right.product, "store"));
    elements.miniCartItems.innerHTML = miniEntries
      .slice(0, 3)
      .map(
        ({ product, quantity }) => `
          <div class="mini-cart-row ${storeClass(product.store)}">
            <div class="mini-cart-product">
              ${renderProductImage(product, "mini")}
              <div>
                <strong>${escapeHtml(product.name)}</strong>
                <span>${escapeHtml(product.store)} · ${escapeHtml(quantityLabel(product, quantity))}</span>
              </div>
            </div>
            <b>${formatLinePrice(product, quantity)}</b>
          </div>
        `
      )
      .join("");

    if (entries.length > 3) {
      elements.miniCartItems.insertAdjacentHTML(
        "beforeend",
        `<p class="mini-cart-more">+${entries.length - 3} more product${entries.length - 3 === 1 ? "" : "s"}</p>`
      );
    }

    window.requestAnimationFrame(() => elements.miniCart.classList.add("is-visible"));
  }

  function renderFullCart(entries) {
    if (entries.length === 0) {
      elements.fullCartItems.innerHTML =
        '<div class="empty-state">Your cart is empty. Close this page and add a product or load a budget cart.</div>';
      return;
    }

    const sortedEntries = sortCartEntries(entries, state.cartSort);
    elements.fullCartItems.innerHTML = sortedEntries
      .map(({ product, quantity }) => {
        return `
          <article class="full-cart-row ${storeClass(product.store)}">
            <div class="cart-row-product">
              ${renderProductImage(product, "cart")}
              <div class="cart-row-main">
                <div class="cart-row-head">
                  <h3>${escapeHtml(product.name)}</h3>
                  <strong>${formatLinePrice(product, quantity)}</strong>
                </div>
                <p>${escapeHtml(product.store)} · ${escapeHtml(formatUnitPrice(product, "/"))}</p>
                <div class="badge-row">
                  ${renderStorePill(product.store)}
                  ${renderChoiceBadge(product.choiceType)}
                  ${renderTierBadge(product.foodTier)}
                  ${renderVerificationBadge(product.verificationGrade)}
                  ${(product.certifications || [])
                    .slice(0, 1)
                    .map((item) => `<span class="certification-chip">${escapeHtml(item.name)}</span>`)
                    .join("")}
                </div>
              </div>
            </div>
            <div class="cart-row-actions">
              <div class="qty-control" aria-label="Quantity for ${escapeAttribute(product.name)}">
                <button class="qty-button" type="button" data-qty-down="${escapeAttribute(product.id)}" aria-label="Decrease quantity">-</button>
                <input class="qty-input" type="number" min="0" step="${product.quantityStep || 1}" value="${formatQuantity(quantity)}" data-qty-input="${escapeAttribute(product.id)}" aria-label="Quantity" />
                <button class="qty-button" type="button" data-qty-up="${escapeAttribute(product.id)}" aria-label="Increase quantity">+</button>
              </div>
              ${renderBuyLink(product, `Buy at ${product.store}`)}
              <button class="remove-button" type="button" data-cart-remove="${escapeAttribute(product.id)}">Remove</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderBudgetStatus(total) {
    elements.budgetStatus.innerHTML = [50, 80, 100]
      .map((target) => {
        const difference = target - total;
        const ratio = Math.min((total / target) * 100, 100);
        const status =
          difference >= 0
            ? `$${formatCurrency(difference)} left`
            : `$${formatCurrency(Math.abs(difference))} over`;

        return `
          <div class="budget-progress">
            <div class="budget-progress-label">
              <strong>${escapeHtml(BUDGET_NAMES[target])}</strong>
              <span>${escapeHtml(status)}</span>
            </div>
            <div class="budget-progress-track" aria-hidden="true">
              <div class="budget-progress-fill${total > target ? " over" : ""}" style="width:${ratio}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderStoreBreakdown(entries) {
    const storeTotals = entries.reduce((totals, item) => {
      const store = item.product.store;
      totals[store] = totals[store] || { total: 0, pending: 0 };
      if (hasPrice(item.product)) {
        totals[store].total += Number(item.product.currentPrice) * item.quantity;
      } else {
        totals[store].pending += 1;
      }
      return totals;
    }, {});

    const preferredOrder = ["Aldi", "Walmart"];
    const stores = Object.keys(storeTotals).sort((left, right) => {
      const leftIndex = preferredOrder.indexOf(left);
      const rightIndex = preferredOrder.indexOf(right);
      const normalizedLeft = leftIndex === -1 ? 99 : leftIndex;
      const normalizedRight = rightIndex === -1 ? 99 : rightIndex;
      return normalizedLeft - normalizedRight || left.localeCompare(right);
    });

    elements.storeBreakdown.innerHTML = stores.length
      ? stores
          .map(
            (store) => `
              <div class="store-summary-row ${storeClass(store)}">
                ${renderStorePill(store)}
                <strong>$${formatCurrency(storeTotals[store].total)}${storeTotals[store].pending ? ` + ${storeTotals[store].pending} pending` : ""}</strong>
              </div>
            `
          )
          .join("")
      : '<p class="section-note">No store totals yet.</p>';
  }

  function handleCartItemClick(event) {
    const downButton = event.target.closest("[data-qty-down]");
    const upButton = event.target.closest("[data-qty-up]");
    const removeButton = event.target.closest("[data-cart-remove]");

    if (downButton) {
      changeCartByStep(downButton.dataset.qtyDown, -1);
    }
    if (upButton) {
      changeCartByStep(upButton.dataset.qtyUp, 1);
    }
    if (removeButton) {
      const product = getProductById(removeButton.dataset.cartRemove);
      updateCartQuantity(removeButton.dataset.cartRemove, 0);
      if (product) {
        showToast(`${product.name} removed.`);
      }
    }
  }

  function handleCartQuantityInput(event) {
    const input = event.target.closest("[data-qty-input]");
    if (!input) {
      return;
    }
    updateCartQuantity(input.dataset.qtyInput, Number(input.value));
  }

  function changeCartByStep(productId, direction) {
    const product = getProductById(productId);
    if (!product) {
      return;
    }
    const current = state.cart[productId] || 0;
    updateCartQuantity(productId, current + direction * (product.quantityStep || 1));
  }

  function addToCart(productId, quantity) {
    const product = getProductById(productId);
    if (!product) {
      return;
    }

    const current = state.cart[productId] || 0;
    state.cart[productId] = roundQuantity(current + quantity);
    persistCart();
    renderCart();
    nudgeMiniCart();
    showToast(`${product.name} added to your cart.`);
  }

  function updateCartQuantity(productId, quantity) {
    const normalized = roundQuantity(quantity);
    if (normalized <= 0) {
      delete state.cart[productId];
    } else {
      state.cart[productId] = normalized;
    }
    persistCart();
    renderCart();
  }

  function clearCart() {
    if (getCartEntries().length === 0) {
      return;
    }
    state.cart = {};
    persistCart();
    renderCart();
    showToast("Cart cleared.");
  }

  function nudgeMiniCart() {
    elements.miniCart.classList.remove("is-nudging");
    window.requestAnimationFrame(() => {
      void elements.miniCart.offsetWidth;
      elements.miniCart.classList.add("is-nudging");
    });
  }

  function openFullCart(trigger) {
    lastCartTrigger = trigger || document.activeElement;
    window.clearTimeout(cartCloseTimer);
    state.cartOpen = true;
    elements.cartPage.hidden = false;
    elements.cartPage.setAttribute("aria-hidden", "false");
    document.body.classList.add("cart-open");
    renderCart();

    window.requestAnimationFrame(() => {
      elements.cartPage.classList.add("is-open");
      window.setTimeout(() => elements.closeCartButton.focus(), 220);
    });
  }

  function closeFullCart() {
    if (!state.cartOpen) {
      return;
    }
    state.cartOpen = false;
    elements.cartPage.classList.remove("is-open");
    elements.cartPage.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cart-open");
    cartCloseTimer = window.setTimeout(() => {
      if (!state.cartOpen) {
        elements.cartPage.hidden = true;
      }
    }, 540);
    if (lastCartTrigger && typeof lastCartTrigger.focus === "function") {
      lastCartTrigger.focus();
    }
  }

  function openBudgetDialog(planId) {
    const plan = state.data.budgetPlans.find((item) => item.id === planId);
    if (!plan) {
      return;
    }
    state.activeBudgetPlanId = planId;
    state.budgetView = "simple";
    renderBudgetDialog();
    elements.budgetDialog.showModal();
  }

  function renderBudgetDialog() {
    const plan = state.data.budgetPlans.find((item) => item.id === state.activeBudgetPlanId);
    if (!plan) {
      return;
    }

    const total = computePlanTotal(plan);
    const difference = plan.target - total;
    elements.budgetDialogTitle.textContent = plan.name;
    elements.budgetDialogSummary.innerHTML = `
      <p>${escapeHtml(plan.summary)}<br>${plan.items.length} products · ${difference >= 0 ? `$${formatCurrency(difference)} under` : `$${formatCurrency(Math.abs(difference))} over`} the $${formatCurrency(plan.target)} target</p>
      <strong>$${formatCurrency(total)}</strong>
    `;

    elements.budgetDialog.querySelectorAll("[data-budget-view]").forEach((button) => {
      const active = button.dataset.budgetView === state.budgetView;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    elements.budgetDialogItems.innerHTML = plan.items
      .map((item) => {
        const product = getProductById(item.productId);
        if (!product) {
          return "";
        }

        const tier = TIER_DEFINITIONS[product.foodTier] || TIER_DEFINITIONS.B;
        const verification =
          VERIFICATION_DEFINITIONS[product.verificationGrade] || VERIFICATION_DEFINITIONS.C;
        const certifications = (product.certifications || []).map((entry) => entry.name);

        return `
          <article class="budget-item">
            <div class="budget-item-header">
              <div class="budget-item-product">
                ${renderProductImage(product, "budget")}
                <div class="budget-item-title">
                  <h3>${escapeHtml(product.name)}</h3>
                  <p>${escapeHtml(quantityLabel(product, item.quantity))} · ${escapeHtml(product.store)}</p>
                </div>
              </div>
              <div class="budget-item-price">
                <strong>${formatLinePrice(product, item.quantity)}</strong>
                <span>${escapeHtml(formatUnitPrice(product, "per"))}</span>
              </div>
            </div>
            <div class="budget-item-grades">
              ${renderTierBadge(product.foodTier)}
              ${renderVerificationBadge(product.verificationGrade)}
            </div>
            <p class="grade-caption">Nutrition: ${escapeHtml(tier.short)}. Production: ${escapeHtml(verification.short)}.</p>
            ${
              state.budgetView === "advanced"
                ? `
                  <div class="budget-item-advanced">
                    <p><strong>Why it is here:</strong> ${escapeHtml(product.summary || "No summary recorded.")}</p>
                    <p><strong>Credible certifications:</strong> ${escapeHtml(certifications.join(", ") || "None recorded")}</p>
                    <p><strong>Production check:</strong> ${escapeHtml(product.productionNotes || "No production note recorded.")}</p>
                    ${renderBuyLink(product, `Buy at ${product.store}`)}
                  </div>
                `
                : ""
            }
          </article>
        `;
      })
      .join("");
  }

  function closeBudgetDialog() {
    if (elements.budgetDialog.open) {
      elements.budgetDialog.close();
    }
    state.activeBudgetPlanId = null;
  }

  function loadPlanIntoCart(planId) {
    const plan = state.data.budgetPlans.find((item) => item.id === planId);
    if (!plan) {
      return;
    }

    state.cart = {};
    plan.items.forEach((item) => {
      if (getProductById(item.productId)) {
        state.cart[item.productId] = roundQuantity(item.quantity);
      }
    });
    persistCart();
    renderCart();
    nudgeMiniCart();
    showToast(`${plan.name} loaded into your cart.`);
  }

  function openProductDialog(product) {
    state.editingProductId = product ? product.id : null;
    document.getElementById("dialog-title").textContent = product ? "Edit product" : "Add product";

    const fields = {
      id: product?.id || "",
      name: product?.name || "",
      brand: product?.brand || "",
      store: product?.store || "Aldi",
      category: product?.category || "",
      currentPrice: product?.currentPrice ?? "",
      typicalPrice: product?.typicalPrice || "",
      size: product?.size || "",
      priceLastChecked: product?.priceLastChecked || "",
      purchaseUrl: product?.purchaseUrl || getExactRetailerSource(product) || "",
      imageUrl: product?.imageUrl || product?.retailerData?.imageUrl || "",
      foodKey: product?.foodKey || "",
      choiceType: product?.choiceType || "",
      foodTier: product?.foodTier || "A",
      verificationGrade: product?.verificationGrade || "B",
      quantityStep: product?.quantityStep ?? 1,
      defaultQuantity: product?.defaultQuantity ?? 1,
      summary: product?.summary || "",
      productionNotes: product?.productionNotes || "",
      notes: product?.notes || "",
      serving: product?.nutrition?.serving || "",
      calories: product?.nutrition?.calories ?? "",
      proteinG: product?.nutrition?.proteinG ?? "",
      carbsG: product?.nutrition?.carbsG ?? "",
      fatG: product?.nutrition?.fatG ?? "",
      fiberG: product?.nutrition?.fiberG ?? "",
      sugarG: product?.nutrition?.sugarG ?? "",
      sodiumMg: product?.nutrition?.sodiumMg ?? "",
      nutritionSourceNote: product?.nutrition?.sourceNote || "",
      certifications: (product?.certifications || [])
        .map((item) => [item.name, item.certifier, item.scope, item.note].filter(Boolean).join(" | "))
        .join("\n"),
      marketingClaims: (product?.marketingClaims || []).join("\n"),
      ingredients: (product?.ingredients || []).join("\n"),
      additives: (product?.additives || [])
        .map((item) => [item.name, item.note].filter(Boolean).join(" | "))
        .join("\n"),
      evidenceNotes: (product?.evidenceNotes || []).join("\n"),
      sourceLinks: (product?.sourceLinks || [])
        .map((item) => [item.label, item.url].filter(Boolean).join(" | "))
        .join("\n"),
    };

    const fieldMap = {
      name: "form-name",
      brand: "form-brand",
      store: "form-store",
      category: "form-category",
      currentPrice: "form-current-price",
      typicalPrice: "form-typical-price",
      size: "form-size",
      priceLastChecked: "form-price-date",
      purchaseUrl: "form-purchase-url",
      imageUrl: "form-image-url",
      foodKey: "form-food-key",
      choiceType: "form-choice-type",
      foodTier: "form-tier",
      verificationGrade: "form-grade",
      quantityStep: "form-step",
      defaultQuantity: "form-default-quantity",
      summary: "form-summary",
      productionNotes: "form-production",
      notes: "form-notes",
      serving: "form-serving",
      calories: "form-calories",
      proteinG: "form-protein",
      carbsG: "form-carbs",
      fatG: "form-fat",
      fiberG: "form-fiber",
      sugarG: "form-sugar",
      sodiumMg: "form-sodium",
      nutritionSourceNote: "form-nutrition-source",
      certifications: "form-certifications",
      marketingClaims: "form-marketing",
      ingredients: "form-ingredients",
      additives: "form-additives",
      evidenceNotes: "form-evidence",
      sourceLinks: "form-sources",
    };

    Object.entries(fields).forEach(([key, value]) => {
      const element = document.getElementById(fieldMap[key]);
      if (element) {
        element.value = value;
      }
    });

    document.getElementById("product-id").value = fields.id;
    elements.productDialog.showModal();
  }

  function closeProductDialog() {
    if (elements.productDialog.open) {
      elements.productDialog.close();
    }
    elements.productForm.reset();
    document.getElementById("product-id").value = "";
    state.editingProductId = null;
  }

  function handleProductSave(event) {
    event.preventDefault();

    const formData = new FormData(elements.productForm);
    const rawId = String(formData.get("id") || "");
    let id = rawId || slugify(String(formData.get("name") || ""));
    if (!rawId && getProductById(id)) {
      id = `${id}-${Date.now()}`;
    }

    const existingProduct = getProductById(id);
    const product = {
      id,
      name: String(formData.get("name") || "").trim(),
      brand: String(formData.get("brand") || "").trim(),
      store: String(formData.get("store") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      currentPrice: numberOrNull(formData.get("currentPrice")),
      typicalPrice: String(formData.get("typicalPrice") || "").trim(),
      size: String(formData.get("size") || "").trim(),
      priceLastChecked: String(formData.get("priceLastChecked") || "").trim(),
      purchaseUrl: String(formData.get("purchaseUrl") || "").trim(),
      imageUrl: String(formData.get("imageUrl") || "").trim(),
      imageSourceUrl: existingProduct?.imageSourceUrl || "",
      foodKey: String(formData.get("foodKey") || "").trim(),
      choiceType: String(formData.get("choiceType") || "").trim(),
      choiceRationale: existingProduct?.choiceRationale || "",
      foodTier: String(formData.get("foodTier") || "A").trim(),
      verificationGrade: String(formData.get("verificationGrade") || "B").trim(),
      quantityStep: Number(formData.get("quantityStep") || 1),
      defaultQuantity: Number(formData.get("defaultQuantity") || 1),
      summary: String(formData.get("summary") || "").trim(),
      productionNotes: String(formData.get("productionNotes") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
      nutrition: {
        serving: String(formData.get("serving") || "").trim(),
        calories: numberOrNull(formData.get("calories")),
        proteinG: numberOrNull(formData.get("proteinG")),
        carbsG: numberOrNull(formData.get("carbsG")),
        fatG: numberOrNull(formData.get("fatG")),
        fiberG: numberOrNull(formData.get("fiberG")),
        sugarG: numberOrNull(formData.get("sugarG")),
        sodiumMg: numberOrNull(formData.get("sodiumMg")),
        sourceNote: String(formData.get("nutritionSourceNote") || "").trim(),
      },
      ingredients: splitLines(formData.get("ingredients")),
      additives: splitLines(formData.get("additives")).map(parseAdditive),
      certifications: splitLines(formData.get("certifications")).map(parseCertification),
      marketingClaims: splitLines(formData.get("marketingClaims")),
      evidenceNotes: splitLines(formData.get("evidenceNotes")),
      sourceLinks: splitLines(formData.get("sourceLinks")).map(parseSourceLink),
      favorite: existingProduct?.favorite || false,
      retailerData:
        existingProduct?.purchaseUrl === String(formData.get("purchaseUrl") || "").trim()
          ? existingProduct?.retailerData || { status: "unchecked" }
          : { status: "unchecked" },
    };

    const existingIndex = state.data.products.findIndex((item) => item.id === id);
    if (existingIndex >= 0) {
      state.data.products[existingIndex] = product;
    } else {
      state.data.products.push(product);
    }

    state.selectedProductId = id;
    state.detailTab = "overview";
    persistCatalog();
    closeProductDialog();
    render();
    showToast(`${product.name} saved.`);
  }

  function exportCatalog() {
    const backup = {
      format: "good-groceries-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      catalog: state.data,
      cart: state.cart,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `good-groceries-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("Catalog and cart backup downloaded.");
  }

  async function importCatalogBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const importedCatalog = parsed?.format === "good-groceries-backup" ? parsed.catalog : parsed;
      const importedCart = parsed?.format === "good-groceries-backup" ? parsed.cart : {};
      if (!importedCatalog?.products || !Array.isArray(importedCatalog.products)) {
        throw new Error("This file does not contain a Good Groceries catalog.");
      }
      const confirmed = window.confirm(
        `Import ${importedCatalog.products.length} products and replace the catalog currently saved to this account?`
      );
      if (!confirmed) return;
      state.data = normalizeCatalog(importedCatalog);
      state.cart = importedCart && typeof importedCart === "object" && !Array.isArray(importedCart) ? importedCart : {};
      state.selectedProductId = state.data.products[0]?.id || null;
      persistCatalog();
      persistCart();
      render();
      showToast("Backup imported and queued for cloud save.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Backup could not be imported.");
    }
  }

  function resetCatalog() {
    const confirmed = window.confirm(
      "Reset all product edits and the cart back to the seeded grocery data?"
    );
    if (!confirmed) {
      return;
    }

    window.localStorage.removeItem(DATA_KEY);
    window.localStorage.removeItem(CART_KEY);
    state.data = normalizeCatalog(deepClone(window.DEFAULT_GROCERY_DATA));
    state.cart = {};
    state.selectedProductId = state.data.products[0]?.id || null;
    state.detailTab = "overview";
    persistCatalog();
    persistCart();
    render();
    showToast("Sample catalog restored.");
  }

  function getFilteredProducts() {
    return state.data.products
      .filter((product) => {
        const categoryMatches =
          state.filters.category === "All" || product.category === state.filters.category;
        const storeMatches = state.filters.store === "All" || product.store === state.filters.store;
        const tierMatches = state.filters.tier === "All" || product.foodTier === state.filters.tier;
        const certificationMatches =
          state.filters.certification === "All" ||
          (product.certifications || []).some(
            (item) => item.name === state.filters.certification
          );
        const choiceMatches =
          state.filters.choice === "All" ||
          (state.filters.choice === "optional"
            ? !product.choiceType
            : product.choiceType === state.filters.choice ||
              (product.choiceType === "both" && ["quality", "cheapest"].includes(state.filters.choice)));
        const favoriteMatches = !state.filters.favoritesOnly || Boolean(product.favorite);
        const availabilityMatches =
          !state.filters.inStockOnly || product.retailerData?.status === "current";

        return (
          matchesSearch(product, state.filters.search) &&
          categoryMatches &&
          storeMatches &&
          tierMatches &&
          certificationMatches &&
          choiceMatches &&
          favoriteMatches &&
          availabilityMatches
        );
      })
      .sort((left, right) => compareProducts(left, right, state.catalogSort));
  }

  function compareProducts(left, right, sortMode) {
    const storeOrder = { Aldi: 0, Walmart: 1 };
    const tierOrder = { S: 0, A: 1, B: 2 };
    const gradeOrder = { A: 0, B: 1, C: 2 };
    const choiceOrder = { quality: 0, both: 0, cheapest: 1 };
    const leftStore = storeOrder[left.store] ?? 2;
    const rightStore = storeOrder[right.store] ?? 2;
    const leftPrice = hasPrice(left) ? Number(left.currentPrice) : Number.POSITIVE_INFINITY;
    const rightPrice = hasPrice(right) ? Number(right.currentPrice) : Number.POSITIVE_INFINITY;
    const mode = sortMode || "store";

    if (mode === "price-low") {
      return leftPrice - rightPrice || left.name.localeCompare(right.name);
    }
    if (mode === "price-high") {
      const leftHigh = hasPrice(left) ? Number(left.currentPrice) : Number.NEGATIVE_INFINITY;
      const rightHigh = hasPrice(right) ? Number(right.currentPrice) : Number.NEGATIVE_INFINITY;
      return rightHigh - leftHigh || left.name.localeCompare(right.name);
    }
    if (mode === "tier") {
      return (tierOrder[left.foodTier] ?? 3) - (tierOrder[right.foodTier] ?? 3) ||
        (gradeOrder[left.verificationGrade] ?? 3) - (gradeOrder[right.verificationGrade] ?? 3) ||
        left.name.localeCompare(right.name);
    }
    if (mode === "verification") {
      return (gradeOrder[left.verificationGrade] ?? 3) - (gradeOrder[right.verificationGrade] ?? 3) ||
        (tierOrder[left.foodTier] ?? 3) - (tierOrder[right.foodTier] ?? 3) ||
        left.name.localeCompare(right.name);
    }
    if (mode === "name") {
      return left.name.localeCompare(right.name);
    }
    if (mode === "quality-first") {
      return (choiceOrder[left.choiceType] ?? 2) - (choiceOrder[right.choiceType] ?? 2) ||
        (tierOrder[left.foodTier] ?? 3) - (tierOrder[right.foodTier] ?? 3) ||
        (gradeOrder[left.verificationGrade] ?? 3) - (gradeOrder[right.verificationGrade] ?? 3) ||
        leftPrice - rightPrice ||
        leftStore - rightStore ||
        left.name.localeCompare(right.name);
    }
    return leftStore - rightStore || left.name.localeCompare(right.name);
  }

  function matchesSearch(product, search) {
    if (!search) {
      return true;
    }

    const haystack = [
      product.name,
      product.brand,
      product.store,
      product.category,
      product.summary,
      product.productionNotes,
      product.notes,
      product.foodTier,
      product.verificationGrade,
      product.choiceType,
      product.choiceRationale,
      getTierProfile(product.foodKey)?.nutrients,
      getTierProfile(product.foodKey)?.tierRationale,
      ...(product.ingredients || []),
      ...(product.marketingClaims || []),
      ...(product.evidenceNotes || []),
      ...(product.certifications || []).flatMap((item) => [item.name, item.certifier, item.scope]),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(search.toLowerCase());
  }

  function renderTierBadge(tier) {
    const normalizedTier = TIER_DEFINITIONS[tier] ? tier : "B";
    const definition = TIER_DEFINITIONS[normalizedTier];
    return `<span class="quality-badge food-tier" tabindex="0" title="${escapeAttribute(definition.detail)}" data-tooltip="${escapeAttribute(definition.detail)}" aria-label="${escapeAttribute(`Food Tier ${normalizedTier}: ${definition.detail}`)}">Food Tier ${escapeHtml(normalizedTier)}</span>`;
  }

  function renderVerificationBadge(grade) {
    const normalizedGrade = VERIFICATION_DEFINITIONS[grade] ? grade : "C";
    const definition = VERIFICATION_DEFINITIONS[normalizedGrade];
    return `<span class="quality-badge verification" tabindex="0" title="${escapeAttribute(definition.detail)}" data-tooltip="${escapeAttribute(definition.detail)}" aria-label="${escapeAttribute(`Verification Grade ${normalizedGrade}: ${definition.detail}`)}">Grade ${escapeHtml(normalizedGrade)}</span>`;
  }

  function renderStorePill(store) {
    return `<span class="meta-pill store-pill ${storeClass(store)}"><span class="store-dot" aria-hidden="true"></span>${escapeHtml(store || "Other")}</span>`;
  }

  function renderChoiceBadge(choiceType) {
    if (!choiceType) {
      return '<span class="choice-chip optional">Optional</span>';
    }
    const details = {
      quality: "Quality option: selected for the strongest credible production, ingredient, or sourcing evidence before price is optimized.",
      cheapest: "Cheapest option: the lowest checkout-price exact product found without hiding its production or ingredient tradeoffs.",
      both: "Best of both: one product currently provides the strongest evidence and the lowest defensible price, so it is not duplicated to create a fake alternative.",
    };
    return `<span class="choice-chip ${escapeAttribute(choiceType)}" tabindex="0" title="${escapeAttribute(details[choiceType] || "Catalog choice")}" data-tooltip="${escapeAttribute(details[choiceType] || "Catalog choice")}">${escapeHtml(choiceLabel(choiceType))}</span>`;
  }

  function choiceLabel(choiceType) {
    if (choiceType === "quality") {
      return "Quality";
    }
    if (choiceType === "cheapest") {
      return "Cheapest";
    }
    if (choiceType === "both") {
      return "Best of both";
    }
    return "Optional";
  }

  function renderListingStatusChip(product, compact) {
    const status = product.retailerData?.status || "unchecked";
    if (compact && status === "unchecked") {
      return "";
    }
    const labels = {
      unchecked: "Link not checked",
      checking: "Checking link",
      current: "Listing current",
      "out-of-stock": "Out of stock",
      broken: "Broken link",
      mismatch: "Wrong product",
      marketplace: "Marketplace only",
      error: "Check failed",
    };
    return `<span class="listing-status-chip status-${escapeAttribute(status)}">${escapeHtml(labels[status] || "Check needed")}</span>`;
  }

  function renderBuyLink(product, label) {
    const url = getPurchaseUrl(product);
    const blockedStatuses = ["broken", "mismatch", "marketplace"];
    if (!url || blockedStatuses.includes(product.retailerData?.status)) {
      return `<span class="buy-button disabled" aria-disabled="true">Exact link needed</span>`;
    }
    const visibleLabel = product.retailerData?.status === "out-of-stock" ? `View at ${product.store}` : label;
    return `<a class="buy-button" href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeAttribute(`${visibleLabel} in a new tab`)}">${escapeHtml(visibleLabel)}</a>`;
  }

  function getPurchaseUrl(product) {
    if (isExactRetailerUrl(product.purchaseUrl, product.store)) {
      return product.purchaseUrl;
    }

    const exactSource = getExactRetailerSource(product);
    if (exactSource) {
      return exactSource;
    }

    return "";
  }

  function getExactRetailerSource(product) {
    const links = (product?.sourceLinks || []).map((item) => item.url).filter(Boolean);
    if (product?.store === "Walmart") {
      return links.find((url) => /walmart\.com\/ip\//i.test(url)) || "";
    }
    if (product?.store === "Aldi") {
      return (
        links.find((url) => /aldi\.us\/(?:store\/aldi\/)?products\//i.test(url)) ||
        links.find((url) => /aldi\.us\/product\//i.test(url)) ||
        links.find((url) => /aldi\.us\/en\/products\/.+\/detail\//i.test(url)) ||
        ""
      );
    }
    return "";
  }

  function isExactRetailerUrl(url, store) {
    if (!url) {
      return false;
    }
    try {
      const parsed = new URL(url, window.location.href);
      if (store === "Walmart") {
        return /(^|\.)walmart\.com$/i.test(parsed.hostname) && /\/ip\//i.test(parsed.pathname);
      }
      if (store === "Aldi") {
        return /(^|\.)aldi\.us$/i.test(parsed.hostname) &&
          /\/(?:product|products|detail)\//i.test(parsed.pathname);
      }
      return false;
    } catch {
      return false;
    }
  }

  function isSafeHttpUrl(url) {
    if (!url) {
      return false;
    }
    try {
      const parsed = new URL(url, window.location.href);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }

  function normalizePriceUnit(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (["pound", "pounds"].includes(normalized)) {
      return "lb";
    }
    if (["ounce", "ounces"].includes(normalized)) {
      return "oz";
    }
    return normalized;
  }

  function getCatalogPriceUnit(product) {
    const match = String(product?.size || "").match(/\bper\s+(lb|pound|pounds|oz|ounce|ounces)\b/i);
    return normalizePriceUnit(match?.[1]);
  }

  function getRetailerCatalogPrice(product, payload) {
    const catalogUnit = getCatalogPriceUnit(product);
    const retailerUnit = normalizePriceUnit(payload.priceUnit);
    if (
      catalogUnit &&
      catalogUnit === retailerUnit &&
      Number.isFinite(Number(payload.unitPrice))
    ) {
      return Number(payload.unitPrice);
    }
    return Number.isFinite(Number(payload.price)) ? Number(payload.price) : null;
  }

  async function refreshRetailerData(productId, options = {}) {
    const silent = Boolean(options.silent);
    const product = getProductById(productId);
    if (!product) {
      return "missing";
    }
    const url = getPurchaseUrl(product);
    if (!url) {
      product.retailerData = {
        status: "broken",
        error: "No exact Aldi or Walmart product page is recorded.",
        checkedAt: new Date().toISOString(),
      };
      persistCatalog();
      if (!silent) {
        renderProductList();
        renderDetail();
        showToast("An exact retailer product link is required.");
      }
      return "broken";
    }

    product.retailerData = { ...(product.retailerData || {}), status: "checking", error: "" };
    if (!silent) {
      renderProductList();
      renderDetail();
    }

    try {
      const endpoint = new URL("/api/retailer-data", window.location.origin);
      endpoint.searchParams.set("url", url);
      endpoint.searchParams.set("expected", product.name);
      endpoint.searchParams.set("brand", product.brand || "");
      endpoint.searchParams.set("size", product.size || "");
      if (options.force) endpoint.searchParams.set("force", "1");
      const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => ({
        ok: false,
        error: "The app server returned an unreadable response.",
      }));
      return applyRetailerPayload(product, payload, { silent, persist: true, requestUrl: url });
    } catch {
      return applyRetailerPayload(
        product,
        { ok: false, broken: false, error: "The hosted retailer service is unavailable. Existing data was not changed." },
        { silent, persist: true, requestUrl: url }
      );
    }
  }

  function applyRetailerPayload(product, payload, options = {}) {
    const silent = Boolean(options.silent);
    const shouldPersist = options.persist !== false;
    const requestUrl = options.requestUrl || getPurchaseUrl(product);
    const attemptedAt = new Date().toISOString();

    if (!payload?.ok) {
      product.retailerData = {
        ...(product.retailerData || {}),
        status: payload?.broken ? "broken" : "error",
        error: payload?.error || "The retailer listing could not be checked.",
        lastAttemptAt: attemptedAt,
        retryAt: payload?.retryAt || "",
      };
      if (shouldPersist) persistCatalog();
      if (!silent) {
        render();
        showToast(payload?.broken ? "Broken retailer link marked." : "Retailer check could not finish; saved data was kept.");
      }
      return product.retailerData.status;
    }

    const isMarketplace =
      payload.retailer === "Walmart" &&
      payload.seller &&
      !["Walmart.com", "Walmart", "Walmart listing"].includes(payload.seller);
    let status = "current";
    if (!payload.matched) status = "mismatch";
    else if (isMarketplace) status = "marketplace";
    else if (/OUT|UNAVAILABLE|NOT_AVAILABLE/i.test(payload.availability || "")) status = "out-of-stock";

    const retailerCatalogPrice = getRetailerCatalogPrice(product, payload);
    const existingPrice = Number(product.currentPrice);
    const priceDifference =
      retailerCatalogPrice !== null && Number.isFinite(existingPrice) && existingPrice > 0
        ? Math.abs(retailerCatalogPrice - existingPrice) / existingPrice
        : 0;
    const highConfidence =
      payload.matchConfidence === "high" ||
      (!payload.matchConfidence && Number(payload.matchScore) >= 0.62);
    const supportedCurrency = !payload.currency || payload.currency === "USD";
    const priceNeedsReview =
      ["current", "out-of-stock"].includes(status) &&
      retailerCatalogPrice !== null &&
      (!highConfidence || !supportedCurrency || priceDifference > 0.6);

    product.retailerData = {
      status,
      listingName: payload.name || "",
      seller: payload.seller || "",
      availability: payload.availability || "",
      canonicalUrl: payload.canonicalUrl || requestUrl,
      ingredients: payload.ingredients || "",
      nutritionLabelUrl: payload.nutritionLabelUrl || "",
      ingredientLabelUrl: payload.ingredientLabelUrl || "",
      imageUrl: isSafeHttpUrl(payload.imageUrl) ? payload.imageUrl : "",
      imageCheckedAt: payload.checkedAt || attemptedAt,
      listingPrice: Number.isFinite(Number(payload.price)) ? Number(payload.price) : null,
      unitPrice: Number.isFinite(Number(payload.unitPrice)) ? Number(payload.unitPrice) : null,
      priceUnit: payload.priceUnit || "",
      priceDisplay: payload.priceDisplay || "",
      packageDescription: payload.packageDescription || "",
      checkedAt: payload.checkedAt || attemptedAt,
      lastAttemptAt: attemptedAt,
      scope: payload.scope || "",
      sourceMethod: payload.sourceMethod || "Retailer structured product data",
      matchScore: payload.matchScore,
      matchConfidence: payload.matchConfidence || "",
      matchReasons: Array.isArray(payload.matchReasons) ? payload.matchReasons : [],
      cached: Boolean(payload.cached),
      stale: Boolean(payload.stale),
      cacheAgeSeconds: Number(payload.cacheAgeSeconds || 0),
      warning: payload.warning || "",
      priceNeedsReview,
      priceReview:
        priceNeedsReview && retailerCatalogPrice !== null
          ? `A $${formatCurrency(retailerCatalogPrice)} retailer value was recorded but not applied automatically because the identity confidence or price change needs review.`
          : "",
      error:
        status === "mismatch"
          ? `Expected ${product.name}, but the retailer returned ${payload.name || "a different item"}.`
          : status === "marketplace"
            ? `Seller is ${payload.seller}; this is not treated as local Walmart inventory.`
            : "",
    };

    if (["current", "out-of-stock"].includes(status)) {
      if (retailerCatalogPrice !== null && !priceNeedsReview) {
        product.currentPrice = retailerCatalogPrice;
        product.priceLastChecked = String(payload.checkedAt || attemptedAt).slice(0, 10);
      }
      if (isExactRetailerUrl(payload.canonicalUrl, product.store)) product.purchaseUrl = payload.canonicalUrl;
      if (isSafeHttpUrl(payload.imageUrl)) {
        product.imageUrl = payload.imageUrl;
        product.imageSourceUrl = payload.canonicalUrl || requestUrl;
      }
    }

    if (shouldPersist) persistCatalog();
    if (!silent) {
      render();
      if (status === "current") {
        showToast(priceNeedsReview ? "Listing updated; unusual price held for review." : payload.cached ? "Verified cached listing loaded." : "Retailer listing, price, and image updated.");
      } else if (status === "out-of-stock") {
        showToast("Listing is valid but currently out of stock.");
      } else if (status === "mismatch") {
        showToast("Wrong product detected; catalog data was not replaced.");
      } else {
        showToast("Marketplace listing flagged; local-store Buy is disabled.");
      }
    }
    return status;
  }

  async function syncAllRetailerData() {
    if (state.bulkSyncing || state.data.products.length === 0) {
      return;
    }

    const products = state.data.products;
    const counts = {};
    state.bulkSyncing = true;
    state.bulkSyncCompleted = 0;
    state.bulkSyncTotal = products.length;
    renderSyncButton();

    try {
      for (let offset = 0; offset < products.length; offset += RETAILER_BATCH_SIZE) {
        const chunk = products.slice(offset, offset + RETAILER_BATCH_SIZE);
        const checkable = chunk.filter((product) => getPurchaseUrl(product));
        const missing = chunk.filter((product) => !getPurchaseUrl(product));
        missing.forEach((product) => {
          const status = applyRetailerPayload(
            product,
            { ok: false, broken: true, error: "No exact Aldi or Walmart product page is recorded." },
            { silent: true, persist: false }
          );
          counts[status] = (counts[status] || 0) + 1;
        });

        if (checkable.length) {
          checkable.forEach((product) => {
            product.retailerData = { ...(product.retailerData || {}), status: "checking", error: "" };
          });
          const response = await fetch("/api/retailer-data", {
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({
              items: checkable.map((product) => ({
                id: product.id,
                url: getPurchaseUrl(product),
                expectedName: product.name,
                expectedBrand: product.brand || "",
                expectedSize: product.size || "",
              })),
            }),
          });
          const payload = await response.json().catch(() => ({ ok: false, results: [] }));
          const resultById = new Map((payload.results || []).map((result) => [result.id, result]));
          checkable.forEach((product) => {
            const result = resultById.get(product.id) || {
              ok: false,
              broken: false,
              error: payload.error || "The batch listing check did not return this product.",
            };
            const status = applyRetailerPayload(product, result, {
              silent: true,
              persist: false,
              requestUrl: getPurchaseUrl(product),
            });
            counts[status] = (counts[status] || 0) + 1;
          });
        }

        state.bulkSyncCompleted += chunk.length;
        renderSyncButton();
      }
    } finally {
      state.bulkSyncing = false;
      persistCatalog();
      render();
    }

    const validCount = (counts.current || 0) + (counts["out-of-stock"] || 0);
    const actionCount =
      (counts.broken || 0) + (counts.mismatch || 0) + (counts.marketplace || 0);
    const failedCount = counts.error || 0;
    const summary = [`${validCount} valid`];
    if (actionCount) {
      summary.push(`${actionCount} need replacement`);
    }
    if (failedCount) {
      summary.push(`${failedCount} could not be checked`);
    }
    showToast(`Listing check complete: ${summary.join(", ")}.`);
  }

  function computePlanTotal(plan) {
    return plan.items.reduce((sum, item) => {
      const product = getProductById(item.productId);
      return product && hasPrice(product) ? sum + Number(product.currentPrice) * item.quantity : sum;
    }, 0);
  }

  function getCartEntries() {
    return Object.entries(state.cart)
      .map(([productId, quantity]) => ({ product: getProductById(productId), quantity }))
      .filter((item) => item.product && Number(item.quantity) > 0);
  }

  function sortCartEntries(entries, sortMode) {
    const sorted = [...entries];
    if (sortMode === "line-low" || sortMode === "line-high") {
      const direction = sortMode === "line-high" ? -1 : 1;
      return sorted.sort((left, right) => {
        const leftTotal = hasPrice(left.product)
          ? Number(left.product.currentPrice) * left.quantity
          : Number.POSITIVE_INFINITY;
        const rightTotal = hasPrice(right.product)
          ? Number(right.product.currentPrice) * right.quantity
          : Number.POSITIVE_INFINITY;
        if (!Number.isFinite(leftTotal) || !Number.isFinite(rightTotal)) {
          return Number.isFinite(leftTotal) ? -1 : Number.isFinite(rightTotal) ? 1 : 0;
        }
        return direction * (leftTotal - rightTotal) || left.product.name.localeCompare(right.product.name);
      });
    }
    return sorted.sort((left, right) => compareProducts(left.product, right.product, sortMode));
  }

  function getCartTotal(entries) {
    return entries.reduce(
      (sum, item) =>
        hasPrice(item.product)
          ? sum + Number(item.product.currentPrice) * item.quantity
          : sum,
      0
    );
  }

  function getStoreCount(entries) {
    return new Set(entries.map((item) => item.product.store)).size;
  }

  function quantityLabel(product, quantity) {
    const formattedQuantity = formatQuantity(quantity);
    const size = product.size || "unit";
    if (/per lb|per pound/i.test(size)) {
      return `${formattedQuantity} lb`;
    }
    if (Number(quantity) === 1) {
      return `1 × ${size}`;
    }
    return `${formattedQuantity} × ${size}`;
  }

  function getSelectedProduct() {
    return getProductById(state.selectedProductId);
  }

  function getProductById(productId) {
    return state.data.products.find((product) => product.id === productId) || null;
  }

  function getTierProfile(foodKey) {
    if (!foodKey) {
      return null;
    }
    return (state.data.tierLibrary || []).find((profile) => profile.key === foodKey) || null;
  }

  function getOptionList(fieldName) {
    return ["All"].concat(
      Array.from(
        new Set(state.data.products.map((product) => product[fieldName]).filter(Boolean))
      ).sort()
    );
  }

  function loadCatalog() {
    const saved = window.localStorage.getItem(DATA_KEY);
    if (!saved) {
      return normalizeCatalog(deepClone(window.DEFAULT_GROCERY_DATA));
    }

    try {
      return normalizeCatalog(JSON.parse(saved));
    } catch {
      return normalizeCatalog(deepClone(window.DEFAULT_GROCERY_DATA));
    }
  }

  function normalizeCatalog(data) {
    const normalized = data && typeof data === "object" ? data : {};
    const previousVersion = Number(normalized.version || 1);
    const defaults = deepClone(window.DEFAULT_GROCERY_DATA);
    const currentVersion = Number(defaults.version || 14);
    const defaultProducts = new Map(
      (defaults.products || []).map((product) => [product.id, product])
    );
    normalized.products = Array.isArray(normalized.products) ? normalized.products : [];
    normalized.budgetPlans = Array.isArray(normalized.budgetPlans) ? normalized.budgetPlans : [];

    if (previousVersion < 6) {
      normalized.products = normalized.products.filter(
        (product) => !RETIRED_SEEDED_PRODUCT_IDS.has(product.id)
      );
    }

    normalized.products = normalized.products.map((product) => {
      const seeded = defaultProducts.get(product.id) || {};
      const refreshSeededProduct =
        (previousVersion < 7 && REFRESHED_SEEDED_PRODUCT_IDS.has(product.id)) ||
        (previousVersion < 8 && VERSION_8_REFRESHED_SEEDED_PRODUCT_IDS.has(product.id)) ||
        (previousVersion < 9 && VERSION_9_REFRESHED_SEEDED_PRODUCT_IDS.has(product.id)) ||
        (previousVersion < 10 && VERSION_10_REFRESHED_SEEDED_PRODUCT_IDS.has(product.id));
      if (refreshSeededProduct && seeded.id) {
        return {
          ...deepClone(seeded),
          favorite: typeof product.favorite === "boolean" ? product.favorite : seeded.favorite,
          retailerData: { status: "unchecked" },
        };
      }
      const storedPurchaseUrl =
        product.purchaseUrl || seeded.purchaseUrl || PURCHASE_URL_OVERRIDES[product.id] || "";
      const repairInvalidSeededUrl =
        PURCHASE_URL_OVERRIDES[product.id] &&
        !isExactRetailerUrl(storedPurchaseUrl, product.store || seeded.store);
      const migratedPurchaseUrl =
        (previousVersion < currentVersion || repairInvalidSeededUrl) &&
        PURCHASE_URL_OVERRIDES[product.id]
          ? PURCHASE_URL_OVERRIDES[product.id]
          : storedPurchaseUrl;
      const purchaseUrlChanged = migratedPurchaseUrl !== (product.purchaseUrl || "");
      const storedRetailerData = purchaseUrlChanged
        ? { status: "unchecked" }
        : product.retailerData || seeded.retailerData || { status: "unchecked" };
      const retailerData =
        previousVersion < 12 &&
        storedRetailerData.status === "broken" &&
        isExactRetailerUrl(migratedPurchaseUrl, product.store || seeded.store)
          ? { ...storedRetailerData, status: "unchecked", error: "" }
          : storedRetailerData;
      return {
        ...seeded,
        ...product,
        foodKey: product.foodKey || seeded.foodKey || "",
        choiceType: product.choiceType || seeded.choiceType || "",
        choiceRationale: product.choiceRationale || seeded.choiceRationale || "",
        currentPrice: product.currentPrice ?? seeded.currentPrice ?? null,
        typicalPrice: product.typicalPrice || seeded.typicalPrice || "Not recorded",
        priceLastChecked: product.priceLastChecked || seeded.priceLastChecked || "Not recorded",
        imageUrl: product.imageUrl || seeded.imageUrl || "",
        imageSourceUrl: product.imageSourceUrl || seeded.imageSourceUrl || "",
        purchaseUrl: migratedPurchaseUrl,
        retailerData,
        nutrition:
          previousVersion < 2 && product.id === "wild-alaska-sockeye-salmon"
            ? { ...(product.nutrition || seeded.nutrition || {}), calories: 150 }
            : product.nutrition || seeded.nutrition,
        ingredients: Array.isArray(product.ingredients)
          ? product.ingredients
          : Array.isArray(seeded.ingredients)
            ? seeded.ingredients
            : [],
        additives: Array.isArray(product.additives)
          ? product.additives
          : Array.isArray(seeded.additives)
            ? seeded.additives
            : [],
        certifications: Array.isArray(product.certifications)
          ? product.certifications
          : Array.isArray(seeded.certifications)
            ? seeded.certifications
            : [],
        marketingClaims: Array.isArray(product.marketingClaims)
          ? product.marketingClaims
          : Array.isArray(seeded.marketingClaims)
            ? seeded.marketingClaims
            : [],
        evidenceNotes: Array.isArray(product.evidenceNotes)
          ? product.evidenceNotes
          : Array.isArray(seeded.evidenceNotes)
            ? seeded.evidenceNotes
            : [],
        sourceLinks: Array.isArray(product.sourceLinks)
          ? product.sourceLinks
          : Array.isArray(seeded.sourceLinks)
            ? seeded.sourceLinks
            : [],
      };
    });

    if (previousVersion < currentVersion) {
      const savedIds = new Set(normalized.products.map((product) => product.id));
      normalized.products.push(
        ...(defaults.products || []).filter((product) => !savedIds.has(product.id))
      );
    }

    normalized.budgetPlans = normalized.budgetPlans.map((plan) => {
      let items = Array.isArray(plan.items) ? plan.items : [];
      if (previousVersion < 2 && Number(plan.target) === 100) {
        items = items.map((item) => {
          if (item.productId === "simply-nature-organic-chicken-breast") {
            return { ...item, quantity: 2 };
          }
          if (item.productId === "great-value-mixed-vegetables") {
            return { ...item, quantity: 1 };
          }
          return item;
        });
      }

      if (previousVersion < 10) {
        const chickenQuantities = { 50: 1.75, 80: 2, 100: 1.5 };
        items = items.map((item) =>
          item.productId === "simply-nature-organic-chicken-breast"
            ? { ...item, quantity: chickenQuantities[Number(plan.target)] || item.quantity }
            : item
        );
      }

      return {
        ...plan,
        name: BUDGET_NAMES[Number(plan.target)] || plan.name,
        items,
      };
    });

    normalized.tierLibrary = Array.isArray(defaults.tierLibrary) ? defaults.tierLibrary : [];
    normalized.tierModelDisclaimer = defaults.tierModelDisclaimer || "";
    delete normalized.tierProfileDisclaimer;
    normalized.version = currentVersion;

    return normalized;
  }

  function loadCart() {
    const saved = window.localStorage.getItem(CART_KEY);
    if (!saved) {
      return {};
    }

    try {
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function persistCatalog() {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(state.data));
    scheduleCloudSave({ catalog: true });
  }

  function persistCart() {
    window.localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
    scheduleCloudSave({ cart: true });
  }

  function parseCertification(line) {
    const [name, certifier, scope, note] = line.split("|").map((item) => item.trim());
    return {
      name: name || "",
      certifier: certifier || "",
      scope: scope || "",
      note: note || "",
    };
  }

  function parseAdditive(line) {
    const [name, note] = line.split("|").map((item) => item.trim());
    return { name: name || "", note: note || "" };
  }

  function parseSourceLink(line) {
    const [label, url] = line.split("|").map((item) => item.trim());
    return { label: label || url || "Source", url: url || "" };
  }

  function splitLines(value) {
    return String(value || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function formatAdditive(item) {
    return escapeHtml([item.name, item.note].filter(Boolean).join(" — "));
  }

  function storeClass(store) {
    if (store === "Aldi") {
      return "store-aldi";
    }
    if (store === "Walmart") {
      return "store-walmart";
    }
    return "store-other";
  }

  function hasPrice(product) {
    return product && product.currentPrice !== null && product.currentPrice !== "" && Number.isFinite(Number(product.currentPrice));
  }

  function formatProductPrice(product) {
    return hasPrice(product) ? `$${formatCurrency(product.currentPrice)}` : "Pull price";
  }

  function formatUnitPrice(product, separator = "/") {
    const size = String(product?.size || "unit").replace(/^per\s+/i, "");
    return `${formatProductPrice(product)} ${separator} ${size}`;
  }

  function formatLinePrice(product, quantity) {
    return hasPrice(product)
      ? `$${formatCurrency(Number(product.currentPrice) * Number(quantity || 0))}`
      : "Price pending";
  }

  function formatAvailability(value) {
    return String(value || "")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
  }

  function formatCurrency(value) {
    return Number(value || 0).toFixed(2);
  }

  function formatQuantity(value) {
    const number = Number(value || 0);
    return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(2)));
  }

  function roundQuantity(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function numberOrNull(value) {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function slugify(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
