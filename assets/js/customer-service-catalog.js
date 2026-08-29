/* ============================================================
   SCREENINGS4U
   CUSTOMER SERVICE CATALOG
   customer-service-catalog.js

   Catalog UI + filtering only.

   Products table is being removed from the platform architecture.
   During wiring, this page should use the final service catalog
   source that powers screenings4u.com checkout.
   ============================================================ */

(function () {
  "use strict";

  const state = {
    services: [],
    category: "all",
    search: "",
    sort: "featured"
  };


  document.addEventListener(
    "DOMContentLoaded",
    initializeCustomerCatalog
  );


  function initializeCustomerCatalog() {
    bindControls();
    loadCatalog();
  }


  function bindControls() {
    const search = document.getElementById("catalog-search");
    const sort = document.getElementById("catalog-sort");
    const clear = document.getElementById(
      "catalog-clear-filters"
    );
    const emptyClear = document.getElementById(
      "catalog-empty-clear"
    );
    const filterToggle = document.getElementById(
      "catalog-filter-toggle"
    );


    if (search) {
      search.addEventListener("input", function () {
        state.search = search.value.trim().toLowerCase();
        renderCatalog();
      });
    }


    if (sort) {
      sort.addEventListener("change", function () {
        state.sort = sort.value || "featured";
        renderCatalog();
      });
    }


    document
      .querySelectorAll("[data-category]")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          state.category =
            button.dataset.category || "all";

          updateActiveCategory();
          renderCatalog();

          closeMobileFilters();
        });
      });


    [clear, emptyClear].forEach(function (button) {
      if (button) {
        button.addEventListener(
          "click",
          clearFilters
        );
      }
    });


    if (filterToggle) {
      filterToggle.addEventListener(
        "click",
        toggleMobileFilters
      );
    }
  }


  async function loadCatalog() {
    setLoading(true);

    /*
      FINAL WIRING POINT

      The customer catalog should connect to the same source of truth
      used by screenings4u.com.

      The platform architecture is moving away from `products`.

      This page should NOT create a separate disconnected catalog.

      Recommended flow:
      1. Load active services available for direct customer purchase.
      2. Display the service details and current checkout price.
      3. Send the customer into the main Screenings4u checkout flow.
      4. After payment, the resulting order becomes available in the
         customer portal.

      Training may be included as a purchasable catalog category, but
      course access and learning remain in training.screenings4u.com.
    */

    await wait(300);

    state.services = [];

    updateCategoryCounts();
    renderCatalog();

    setLoading(false);
  }


  function getFilteredServices() {
    let services = state.services.filter(
      function (service) {
        const categoryMatch =
          state.category === "all" ||
          service.category === state.category;

        const searchableText = [
          service.name,
          service.description,
          service.category
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const searchMatch =
          !state.search ||
          searchableText.includes(state.search);

        return categoryMatch && searchMatch;
      }
    );


    services.sort(function (a, b) {
      if (state.sort === "name") {
        return String(a.name).localeCompare(
          String(b.name)
        );
      }

      if (state.sort === "price-low") {
        return numericPrice(a) - numericPrice(b);
      }

      if (state.sort === "price-high") {
        return numericPrice(b) - numericPrice(a);
      }

      return (
        Number(a.featured_rank || 999999) -
        Number(b.featured_rank || 999999)
      );
    });


    return services;
  }


  function renderCatalog() {
    const grid = document.getElementById("catalog-grid");
    const empty = document.getElementById("catalog-empty");
    const resultCount = document.getElementById(
      "catalog-result-count"
    );

    if (!grid || !empty) {
      return;
    }


    const services = getFilteredServices();

    grid.innerHTML = "";


    if (!services.length) {
      grid.hidden = true;
      empty.hidden = false;

      if (resultCount) {
        resultCount.textContent =
          state.services.length
            ? "No services match your current search."
            : "No services are currently available in the portal catalog.";
      }

      return;
    }


    empty.hidden = true;
    grid.hidden = false;

    if (resultCount) {
      resultCount.textContent =
        services.length +
        (services.length === 1
          ? " service available"
          : " services available");
    }


    services.forEach(function (service) {
      grid.appendChild(
        createServiceCard(service)
      );
    });
  }


  function createServiceCard(service) {
    const card = document.createElement("article");
    card.className = "customer-catalog-card";

    const category =
      service.category || "other";


    card.innerHTML = [
      '<div class="customer-catalog-card-top">',
      '<div class="customer-catalog-icon"></div>',
      '<span class="customer-catalog-badge"></span>',
      "</div>",

      '<div class="customer-catalog-card-body">',
      "<h3></h3>",
      "<p></p>",
      "</div>",

      '<div class="customer-catalog-card-footer">',
      '<div class="customer-catalog-price"></div>',
      '<button type="button" class="customer-catalog-buy">',
      "Purchase",
      "</button>",
      "</div>"
    ].join("");


    const icon = card.querySelector(
      ".customer-catalog-icon"
    );

    icon.innerHTML = serviceIcon(category);

    if (category === "training") {
      icon.classList.add("is-training");
    }


    card.querySelector(
      ".customer-catalog-badge"
    ).textContent =
      formatCategory(category);


    card.querySelector("h3").textContent =
      service.name || "Screening Service";


    card.querySelector("p").textContent =
      service.description ||
      "Service details will be available during checkout.";


    card.querySelector(
      ".customer-catalog-price"
    ).innerHTML =
      formatPrice(service.price);


    card.querySelector(
      ".customer-catalog-buy"
    ).addEventListener(
      "click",
      function () {
        beginPurchase(service);
      }
    );


    return card;
  }


  function beginPurchase(service) {
    /*
      FINAL CHECKOUT WIRING

      This should route the customer into the main website's checkout
      flow with the selected service.

      Do not duplicate payment processing inside the portal.

      The exact URL or checkout handoff will be added once the main
      website catalog and checkout functions are wired.
    */

    if (!service || !service.id) {
      window.alert(
        "Service purchasing will be connected to the main Screenings4u checkout flow during wiring."
      );

      return;
    }
  }


  function updateCategoryCounts() {
    const categories = [
      "all",
      "drug-alcohol",
      "background",
      "physical",
      "training",
      "other"
    ];


    categories.forEach(function (category) {
      const count =
        category === "all"
          ? state.services.length
          : state.services.filter(function (service) {
              return service.category === category;
            }).length;

      setText(
        "catalog-count-" + category,
        count
      );
    });
  }


  function updateActiveCategory() {
    document
      .querySelectorAll("[data-category]")
      .forEach(function (button) {
        button.classList.toggle(
          "active",
          button.dataset.category === state.category
        );
      });
  }


  function clearFilters() {
    state.category = "all";
    state.search = "";
    state.sort = "featured";


    const search =
      document.getElementById("catalog-search");

    const sort =
      document.getElementById("catalog-sort");


    if (search) {
      search.value = "";
    }

    if (sort) {
      sort.value = "featured";
    }


    updateActiveCategory();
    renderCatalog();
    closeMobileFilters();
  }


  function toggleMobileFilters() {
    const sidebar =
      document.getElementById("catalog-sidebar");

    if (sidebar) {
      sidebar.classList.toggle("is-open");
    }
  }


  function closeMobileFilters() {
    const sidebar =
      document.getElementById("catalog-sidebar");

    if (sidebar) {
      sidebar.classList.remove("is-open");
    }
  }


  function setLoading(isLoading) {
    const loading =
      document.getElementById("catalog-loading");

    const grid =
      document.getElementById("catalog-grid");

    const empty =
      document.getElementById("catalog-empty");


    if (loading) {
      loading.hidden = !isLoading;
    }


    if (isLoading) {
      if (grid) {
        grid.hidden = true;
      }

      if (empty) {
        empty.hidden = true;
      }
    }
  }


  function numericPrice(service) {
    return Number(service.price || 0);
  }


  function formatPrice(price) {
    if (
      price === null ||
      price === undefined ||
      price === ""
    ) {
      return '<span>Price shown at checkout</span>';
    }

    const numeric =
      Number(price);

    if (Number.isNaN(numeric)) {
      return '<span>Price shown at checkout</span>';
    }

    return (
      new Intl.NumberFormat(
        "en-US",
        {
          style: "currency",
          currency: "USD"
        }
      ).format(numeric)
    );
  }


  function formatCategory(category) {
    const labels = {
      "drug-alcohol": "Drug & Alcohol",
      background: "Background",
      physical: "Physical",
      training: "Training",
      other: "Service"
    };

    return labels[category] || "Service";
  }


  function serviceIcon(category) {
    if (category === "training") {
      return [
        '<svg viewBox="0 0 24 24" aria-hidden="true">',
        '<path d="M4 6h16v12H4z"></path>',
        '<path d="m10 9 5 3-5 3z"></path>',
        "</svg>"
      ].join("");
    }

    if (category === "background") {
      return [
        '<svg viewBox="0 0 24 24" aria-hidden="true">',
        '<circle cx="12" cy="8" r="3"></circle>',
        '<path d="M6 21v-2a6 6 0 0 1 12 0v2"></path>',
        "</svg>"
      ].join("");
    }

    if (category === "physical") {
      return [
        '<svg viewBox="0 0 24 24" aria-hidden="true">',
        '<path d="M12 21V3"></path>',
        '<path d="M7 8h10"></path>',
        '<path d="M8 16h8"></path>',
        "</svg>"
      ].join("");
    }

    return [
      '<svg viewBox="0 0 24 24" aria-hidden="true">',
      '<path d="M12 21s7-3.5 7-10V5l-7-3-7 3v6c0 6.5 7 10 7 10z"></path>',
      '<path d="m9 12 2 2 4-4"></path>',
      "</svg>"
    ].join("");
  }


  function setText(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent =
        String(value);
    }
  }


  function wait(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(
        resolve,
        milliseconds
      );
    });
  }

})();
