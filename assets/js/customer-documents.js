/* ============================================================
   SCREENINGS4U
   CUSTOMER DOCUMENTS
   customer-documents.js

   UI + FILTERING ONLY.
   Secure Supabase document wiring will be added later.
   ============================================================ */

(function () {
  "use strict";

  const state = {
    documents: [],
    filteredDocuments: []
  };


  document.addEventListener(
    "DOMContentLoaded",
    initializeCustomerDocuments
  );


  function initializeCustomerDocuments() {
    bindControls();
    loadDocuments();
  }


  function bindControls() {
    const search = document.getElementById("documents-search");
    const typeFilter = document.getElementById(
      "documents-type-filter"
    );
    const sort = document.getElementById("documents-sort");
    const refresh = document.getElementById(
      "documents-refresh"
    );

    if (search) {
      search.addEventListener("input", applyFilters);
    }

    if (typeFilter) {
      typeFilter.addEventListener("change", applyFilters);
    }

    if (sort) {
      sort.addEventListener("change", applyFilters);
    }

    if (refresh) {
      refresh.addEventListener("click", loadDocuments);
    }
  }


  async function loadDocuments() {
    setLoading(true);

    /*
      SUPABASE WIRING POINT

      This page should eventually retrieve only document records that
      belong to the authenticated customer.

      Expected sources may include:
      - documents
      - document_versions
      - document_links

      Access control must be enforced by RLS and authenticated queries.
      No sample customer documents are intentionally used here.
    */

    await wait(300);

    state.documents = [];
    applyFilters();

    setLoading(false);
  }


  function applyFilters() {
    const searchValue = (
      document.getElementById("documents-search")?.value || ""
    ).trim().toLowerCase();

    const selectedType =
      document.getElementById("documents-type-filter")?.value ||
      "all";

    const sortValue =
      document.getElementById("documents-sort")?.value ||
      "newest";


    let documents = state.documents.filter(function (document) {
      const searchableText = [
        document.name,
        document.type,
        document.description
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue ||
        searchableText.includes(searchValue);

      const matchesType =
        selectedType === "all" ||
        document.type === selectedType;

      return matchesSearch && matchesType;
    });


    documents.sort(function (a, b) {
      if (sortValue === "name") {
        return String(a.name).localeCompare(String(b.name));
      }

      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();

      return sortValue === "oldest"
        ? aDate - bDate
        : bDate - aDate;
    });


    state.filteredDocuments = documents;

    updateSummary();
    renderDocuments();
  }


  function renderDocuments() {
    const list = document.getElementById("documents-list");
    const empty = document.getElementById("documents-empty");
    const resultCount = document.getElementById(
      "documents-result-count"
    );

    if (!list || !empty) {
      return;
    }

    list.innerHTML = "";


    if (!state.filteredDocuments.length) {
      list.hidden = true;
      empty.hidden = false;

      if (resultCount) {
        resultCount.textContent =
          state.documents.length
            ? "No documents match your current filters."
            : "No documents are currently available.";
      }

      return;
    }


    empty.hidden = true;
    list.hidden = false;

    if (resultCount) {
      resultCount.textContent =
        state.filteredDocuments.length +
        (state.filteredDocuments.length === 1
          ? " document available"
          : " documents available");
    }


    state.filteredDocuments.forEach(function (document) {
      list.appendChild(createDocumentRow(document));
    });
  }


  function createDocumentRow(document) {
    const row = document.createElement("article");
    row.className = "customer-document-row";

    row.innerHTML = [
      '<div class="customer-document-icon">',
      documentIcon(),
      "</div>",
      '<div class="customer-document-details">',
      '<div class="customer-document-name"></div>',
      '<div class="customer-document-meta"></div>',
      "</div>",
      '<span class="customer-document-type"></span>',
      '<button type="button" class="customer-document-download">',
      "Download",
      "</button>"
    ].join("");


    row.querySelector(".customer-document-name").textContent =
      document.name || "Untitled Document";

    row.querySelector(".customer-document-meta").textContent =
      formatDate(document.created_at);

    row.querySelector(".customer-document-type").textContent =
      formatType(document.type);


    row.querySelector(".customer-document-download")
      .addEventListener(
        "click",
        function () {
          handleDocumentDownload(document);
        }
      );

    return row;
  }


  function handleDocumentDownload(document) {
    /*
      FUTURE IMPLEMENTATION:

      Use the secure document/version/link workflow to obtain an
      authorized file URL for this specific authenticated customer.
    */

    if (!document || !document.id) {
      window.alert(
        "Secure document downloads will be connected during portal wiring."
      );

      return;
    }
  }


  function updateSummary() {
    const total = state.documents.length;

    const recentThreshold =
      Date.now() - (7 * 24 * 60 * 60 * 1000);

    const recent = state.documents.filter(function (document) {
      const timestamp = new Date(
        document.created_at || 0
      ).getTime();

      return timestamp >= recentThreshold;
    }).length;

    setText("documents-total-count", total);
    setText("documents-new-count", recent);
  }


  function setLoading(isLoading) {
    const loading = document.getElementById("documents-loading");
    const list = document.getElementById("documents-list");
    const empty = document.getElementById("documents-empty");
    const refresh = document.getElementById(
      "documents-refresh"
    );

    if (loading) {
      loading.hidden = !isLoading;
    }

    if (isLoading) {
      if (list) {
        list.hidden = true;
      }

      if (empty) {
        empty.hidden = true;
      }
    }

    if (refresh) {
      refresh.classList.toggle("is-loading", isLoading);
      refresh.disabled = isLoading;
    }
  }


  function formatType(type) {
    const types = {
      receipt: "Receipt",
      authorization: "Authorization",
      form: "Form",
      other: "Document"
    };

    return types[type] || "Document";
  }


  function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    ).format(date);
  }


  function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = String(value);
    }
  }


  function documentIcon() {
    return [
      '<svg viewBox="0 0 24 24" aria-hidden="true">',
      '<path d="M7 3h7l4 4v14H7z"></path>',
      '<path d="M14 3v5h5"></path>',
      '<path d="M9 13h6"></path>',
      '<path d="M9 17h5"></path>',
      "</svg>"
    ].join("");
  }


  function wait(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

})();
