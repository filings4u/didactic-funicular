/* ============================================================
   SCREENINGS4U — FAQ MANAGEMENT

   Backend:
   admin-content-actions

   Existing contract:
   - kind: "faq"
   - action: "list"
   - action: "save"
   - action: "delete"
   ============================================================ */

(() => {
  "use strict";

  let db = null;
  let items = [];
  let current = null;

  const kind =
    document.body.dataset.kind ||
    "faq";

  const E = {};

  document.addEventListener(
    "DOMContentLoaded",
    init
  );


  async function init() {
    cache();
    bind();

    try {
      db = await getClient();

      if (!db) {
        throw new Error(
          "Supabase client not found."
        );
      }

      await load();

    } catch (error) {
      console.error(
        "[Admin FAQs]",
        error
      );

      message(
        error?.message ||
        "Unable to load FAQs.",
        "error"
      );
    }
  }


  function cache() {
    [
      "refreshBtn",
      "newBtn",
      "search",
      "statusFilter",
      "categoryFilter",

      "total",
      "published",
      "draft",
      "featuredCount",

      "faqBody",
      "emptyState",
      "message",

      "editorModal",
      "editorModalTitle",
      "editorModalSubtitle",

      "question",
      "slug",
      "category",
      "tags",

      "editor",
      "editorToolbar",
      "blockFormat",
      "linkBtn",
      "clearFormatBtn",

      "seoTitle",
      "seoDescription",
      "seoTitleCount",
      "seoDescriptionCount",
      "seoSlugPreview",
      "seoTitlePreview",
      "seoDescriptionPreview",

      "status",
      "featured",
      "sortOrder",
      "web",
      "customer",
      "employer",

      "summaryStatus",
      "summaryCategory",
      "summaryWords",
      "summarySortOrder",
      "summaryUpdated",

      "previewBtn",
      "previewModal",
      "previewCategory",
      "previewQuestion",
      "previewAnswer",

      "saveDraftBtn",
      "saveBtn"
    ].forEach(
      (id) => {
        E[id] =
          document.getElementById(
            id
          );
      }
    );
  }


  function bind() {
    E.search?.addEventListener(
      "input",
      draw
    );

    E.statusFilter?.addEventListener(
      "change",
      draw
    );

    E.categoryFilter?.addEventListener(
      "change",
      draw
    );

    E.refreshBtn?.addEventListener(
      "click",
      load
    );

    E.newBtn?.addEventListener(
      "click",
      () => openEditor()
    );

    E.faqBody?.addEventListener(
      "click",
      handleTableClick
    );

    document
      .querySelectorAll(
        "[data-close-editor]"
      )
      .forEach(
        (button) =>
          button.addEventListener(
            "click",
            closeEditor
          )
      );

    document
      .querySelectorAll(
        "[data-close-preview]"
      )
      .forEach(
        (button) =>
          button.addEventListener(
            "click",
            closePreview
          )
      );

    E.question?.addEventListener(
      "input",
      handleQuestionInput
    );

    E.slug?.addEventListener(
      "input",
      updateSeoPreview
    );

    E.category?.addEventListener(
      "input",
      updateSummary
    );

    E.status?.addEventListener(
      "change",
      updateSummary
    );

    E.sortOrder?.addEventListener(
      "input",
      updateSummary
    );

    E.seoTitle?.addEventListener(
      "input",
      updateSeoPreview
    );

    E.seoDescription?.addEventListener(
      "input",
      updateSeoPreview
    );

    E.editor?.addEventListener(
      "input",
      updateSummary
    );

    E.blockFormat?.addEventListener(
      "change",
      () => {
        command(
          "formatBlock",
          E.blockFormat.value
        );
      }
    );

    E.editorToolbar
      ?.querySelectorAll(
        "[data-command]"
      )
      .forEach(
        (button) =>
          button.addEventListener(
            "click",
            () =>
              command(
                button.dataset.command
              )
          )
      );

    E.linkBtn?.addEventListener(
      "click",
      insertLink
    );

    E.clearFormatBtn?.addEventListener(
      "click",
      () =>
        command(
          "removeFormat"
        )
    );

    E.previewBtn?.addEventListener(
      "click",
      openPreview
    );

    E.saveDraftBtn?.addEventListener(
      "click",
      () => save("draft")
    );

    E.saveBtn?.addEventListener(
      "click",
      () => save()
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape") {
          return;
        }

        if (
          E.previewModal &&
          !E.previewModal.hidden
        ) {
          closePreview();
          return;
        }

        if (
          E.editorModal &&
          !E.editorModal.hidden
        ) {
          closeEditor();
        }
      }
    );
  }


  async function getClient() {
    for (
      let i = 0;
      i < 40;
      i += 1
    ) {
      try {
        if (
          typeof window
            .getScreenings4uSupabase ===
          "function"
        ) {
          const client =
            await window
              .getScreenings4uSupabase();

          if (client?.functions) {
            return client;
          }
        }

        if (
          window
            .screenings4uSupabase
            ?.functions
        ) {
          return window
            .screenings4uSupabase;
        }

        if (
          window
            .supabaseClient
            ?.functions
        ) {
          return window
            .supabaseClient;
        }

      } catch (_) {}

      await delay(75);
    }

    return null;
  }


  async function call(body) {
    const {
      data,
      error
    } = await db.functions.invoke(
      "admin-content-actions",
      {
        body: {
          kind,
          ...body
        }
      }
    );

    if (error) {
      let text =
        error.message ||
        "Content action failed.";

      try {
        const payload =
          await error.context
            ?.clone?.()
            .json();

        if (payload?.error) {
          text =
            payload.error;
        }
      } catch (_) {}

      throw new Error(text);
    }

    if (data?.error) {
      throw new Error(
        data.error
      );
    }

    return data || {};
  }


  async function load() {
    setRefreshBusy(true);

    try {
      const data =
        await call({
          action: "list"
        });

      items =
        Array.isArray(data.items)
          ? data.items
          : [];

      updateStats();
      updateCategoryFilter();
      draw();

    } catch (error) {
      console.error(
        "[Load FAQs]",
        error
      );

      message(
        error?.message ||
        "Unable to load FAQs.",
        "error"
      );

    } finally {
      setRefreshBusy(false);
    }
  }


  function updateStats() {
    E.total.textContent =
      String(
        items.length
      );

    E.published.textContent =
      String(
        items.filter(
          (item) =>
            item.status ===
            "published"
        ).length
      );

    E.draft.textContent =
      String(
        items.filter(
          (item) =>
            item.status ===
            "draft"
        ).length
      );

    E.featuredCount.textContent =
      String(
        items.filter(
          (item) =>
            Boolean(item.featured)
        ).length
      );
  }


  function updateCategoryFilter() {
    if (!E.categoryFilter) {
      return;
    }

    const selected =
      E.categoryFilter.value;

    const categories =
      [
        ...new Set(
          items
            .map(
              (item) =>
                String(
                  item.category ||
                  ""
                ).trim()
            )
            .filter(Boolean)
        )
      ].sort(
        (a,b) =>
          a.localeCompare(b)
      );

    E.categoryFilter.innerHTML =
      '<option value="">All categories</option>' +
      categories
        .map(
          (category) =>
            `<option value="${esc(category)}">${esc(category)}</option>`
        )
        .join("");

    if (
      categories.includes(
        selected
      )
    ) {
      E.categoryFilter.value =
        selected;
    }
  }


  function draw() {
    const query =
      String(
        E.search?.value ||
        ""
      )
        .trim()
        .toLowerCase();

    const status =
      E.statusFilter
        ?.value ||
      "";

    const category =
      E.categoryFilter
        ?.value ||
      "";

    const filtered =
      items.filter(
        (item) => {
          if (
            status &&
            item.status !==
            status
          ) {
            return false;
          }

          if (
            category &&
            item.category !==
            category
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const haystack =
            [
              item.question,
              item.slug,
              item.category,
              item.status,
              ...(Array.isArray(item.tags)
                ? item.tags
                : [])
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return haystack.includes(
            query
          );
        }
      );

    E.faqBody.innerHTML =
      filtered
        .map(
          (item) => `
            <tr>
              <td>
                <div class="faq-question">
                  <strong>${esc(item.question || "Untitled FAQ")}</strong>
                  <small>/${esc(item.slug || "")}</small>
                </div>
              </td>

              <td>${esc(item.category || "—")}</td>

              <td>
                <span class="faq-pill ${escClass(item.status)}">
                  ${esc(human(item.status || "draft"))}
                </span>
              </td>

              <td>
                ${
                  item.featured
                    ? '<span class="faq-featured">Featured</span>'
                    : "—"
                }
              </td>

              <td>
                ${
                  item.show_website === false
                    ? "Hidden"
                    : "Visible"
                }
              </td>

              <td>${esc(formatDate(item.updated_at))}</td>

              <td>
                <div class="faq-table-actions">
                  <button
                    class="faq-button secondary"
                    type="button"
                    data-edit="${esc(item.id)}"
                  >
                    Edit
                  </button>

                  <button
                    class="faq-button secondary"
                    type="button"
                    data-preview="${esc(item.id)}"
                  >
                    Preview
                  </button>

                  <button
                    class="faq-button danger"
                    type="button"
                    data-delete="${esc(item.id)}"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          `
        )
        .join("");

    if (E.emptyState) {
      E.emptyState.hidden =
        filtered.length > 0;
    }
  }


  async function handleTableClick(
    event
  ) {
    const edit =
      event.target.closest(
        "[data-edit]"
      );

    if (edit) {
      const item =
        findItem(
          edit.dataset.edit
        );

      if (item) {
        openEditor(item);
      }

      return;
    }

    const preview =
      event.target.closest(
        "[data-preview]"
      );

    if (preview) {
      const item =
        findItem(
          preview.dataset.preview
        );

      if (item) {
        openPreview(item);
      }

      return;
    }

    const remove =
      event.target.closest(
        "[data-delete]"
      );

    if (remove) {
      await deleteFaq(
        remove.dataset.delete,
        remove
      );
    }
  }


  function findItem(id) {
    return items.find(
      (item) =>
        String(item.id) ===
        String(id)
    );
  }


  function openEditor(
    item = null
  ) {
    current = item;

    E.editorModalTitle.textContent =
      item
        ? "Edit FAQ"
        : "New FAQ";

    E.editorModalSubtitle.textContent =
      item
        ? "Update the question, answer, SEO, and publishing settings."
        : "Create a clear, helpful answer for your website visitors.";

    E.question.value =
      item?.question ||
      "";

    E.slug.value =
      item?.slug ||
      "";

    E.category.value =
      item?.category ||
      "";

    E.tags.value =
      Array.isArray(item?.tags)
        ? item.tags.join(", ")
        : "";

    E.editor.innerHTML =
      item?.answer_html ||
      "";

    E.seoTitle.value =
      item?.seo_title ||
      "";

    E.seoDescription.value =
      item?.seo_description ||
      "";

    E.status.value =
      item?.status ||
      "draft";

    E.featured.value =
      String(
        Boolean(
          item?.featured
        )
      );

    E.sortOrder.value =
      Number.isFinite(
        Number(
          item?.sort_order
        )
      )
        ? Number(
            item?.sort_order
          )
        : 0;

    E.web.checked =
      item
        ? item.show_website !==
          false
        : true;

    E.customer.checked =
      item
        ? item.show_customer_portal !==
          false
        : false;

    E.employer.checked =
      item
        ? item.show_employer_portal !==
          false
        : false;

    E.summaryUpdated.textContent =
      item?.updated_at
        ? formatDate(
            item.updated_at
          )
        : "Not saved";

    updateSeoPreview();
    updateSummary();

    E.editorModal.hidden =
      false;

    E.editorModal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "faq-modal-open"
    );

    window.setTimeout(
      () =>
        E.question?.focus(),
      50
    );
  }


  function closeEditor() {
    E.editorModal.hidden =
      true;

    E.editorModal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "faq-modal-open"
    );

    current = null;
  }


  function handleQuestionInput() {
    if (!current) {
      E.slug.value =
        slugify(
          E.question.value
        );
    }

    updateSeoPreview();
    updateSummary();
  }


  function updateSeoPreview() {
    const seoTitle =
      E.seoTitle.value.trim() ||
      E.question.value.trim() ||
      "Your FAQ question";

    const seoDescription =
      E.seoDescription.value.trim() ||
      stripHtml(
        E.editor.innerHTML
      ).slice(
        0,
        160
      ) ||
      "Your FAQ SEO description will appear here.";

    E.seoTitleCount.textContent =
      String(
        E.seoTitle.value.length
      );

    E.seoDescriptionCount.textContent =
      String(
        E.seoDescription.value.length
      );

    E.seoSlugPreview.textContent =
      E.slug.value.trim() ||
      slugify(
        E.question.value
      ) ||
      "your-question";

    E.seoTitlePreview.textContent =
      seoTitle;

    E.seoDescriptionPreview.textContent =
      seoDescription;
  }


  function updateSummary() {
    E.summaryStatus.textContent =
      human(
        E.status?.value ||
        "draft"
      );

    E.summaryCategory.textContent =
      E.category
        ?.value
        .trim() ||
      "Uncategorized";

    E.summaryWords.textContent =
      String(
        wordCount(
          E.editor?.innerText ||
          ""
        )
      );

    E.summarySortOrder.textContent =
      String(
        Number(
          E.sortOrder?.value ||
          0
        ) || 0
      );

    updateSeoPreview();
  }


  function command(
    name,
    value = null
  ) {
    E.editor?.focus();

    document.execCommand(
      name,
      false,
      value
    );

    updateSummary();
  }


  function insertLink() {
    const value =
      window.prompt(
        "Enter link URL:"
      );

    if (!value) {
      return;
    }

    command(
      "createLink",
      value
    );
  }


  function openPreview(
    item = null
  ) {
    const question =
      item?.question ||
      E.question.value.trim() ||
      "FAQ Question";

    const category =
      item?.category ||
      E.category.value.trim() ||
      "Uncategorized";

    const answer =
      item?.answer_html ||
      E.editor.innerHTML ||
      "";

    E.previewCategory.textContent =
      category;

    E.previewQuestion.textContent =
      question;

    E.previewAnswer.innerHTML =
      answer;

    E.previewModal.hidden =
      false;

    E.previewModal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "faq-modal-open"
    );
  }


  function closePreview() {
    E.previewModal.hidden =
      true;

    E.previewModal.setAttribute(
      "aria-hidden",
      "true"
    );

    if (
      E.editorModal.hidden
    ) {
      document.body.classList.remove(
        "faq-modal-open"
      );
    }
  }


  async function save(
    forcedStatus = null
  ) {
    const question =
      E.question.value.trim();

    if (!question) {
      message(
        "FAQ question is required.",
        "error"
      );

      E.question.focus();
      return;
    }

    const status =
      forcedStatus ||
      E.status.value;

    const record = {
      id:
        current?.id,

      question,

      slug:
        E.slug.value.trim() ||
        slugify(question),

      category:
        E.category.value.trim() ||
        null,

      tags:
        E.tags.value
          .split(",")
          .map(
            (value) =>
              value.trim()
          )
          .filter(Boolean),

      status,

      featured:
        E.featured.value ===
        "true",

      answer_html:
        E.editor.innerHTML,

      sort_order:
        Number(
          E.sortOrder.value ||
          0
        ) || 0,

      seo_title:
        E.seoTitle.value.trim() ||
        null,

      seo_description:
        E.seoDescription.value.trim() ||
        null,

      show_website:
        E.web.checked,

      show_customer_portal:
        E.customer.checked,

      show_employer_portal:
        E.employer.checked
    };

    setSaveBusy(true);

    try {
      await call({
        action: "save",
        record
      });

      closeEditor();

      message(
        status === "draft"
          ? "FAQ draft saved."
          : "FAQ saved.",
        "ok"
      );

      await load();

    } catch (error) {
      console.error(
        "[Save FAQ]",
        error
      );

      message(
        error?.message ||
        "Unable to save FAQ.",
        "error"
      );

    } finally {
      setSaveBusy(false);
    }
  }


  async function deleteFaq(
    id,
    button
  ) {
    const item =
      findItem(id);

    if (!item) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${item.question || "this FAQ"}"?`
      );

    if (!confirmed) {
      return;
    }

    if (button) {
      button.disabled =
        true;
    }

    try {
      await call({
        action: "delete",
        id: item.id
      });

      items =
        items.filter(
          (value) =>
            String(value.id) !==
            String(item.id)
        );

      updateStats();
      updateCategoryFilter();
      draw();

      message(
        "FAQ deleted.",
        "ok"
      );

    } catch (error) {
      console.error(
        "[Delete FAQ]",
        error
      );

      message(
        error?.message ||
        "Unable to delete FAQ.",
        "error"
      );

      if (button) {
        button.disabled =
          false;
      }
    }
  }


  function setRefreshBusy(
    busy
  ) {
    if (!E.refreshBtn) {
      return;
    }

    E.refreshBtn.disabled =
      busy;

    E.refreshBtn.textContent =
      busy
        ? "Refreshing..."
        : "Refresh";
  }


  function setSaveBusy(
    busy
  ) {
    [
      E.saveDraftBtn,
      E.saveBtn
    ]
      .filter(Boolean)
      .forEach(
        (button) => {
          button.disabled =
            busy;
        }
      );

    if (E.saveDraftBtn) {
      E.saveDraftBtn.textContent =
        busy
          ? "Saving..."
          : "Save Draft";
    }

    if (E.saveBtn) {
      E.saveBtn.textContent =
        busy
          ? "Saving..."
          : "Save FAQ";
    }
  }


  function slugify(value) {
    return String(
      value ||
      ""
    )
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );
  }


  function wordCount(value) {
    const text =
      String(
        value ||
        ""
      ).trim();

    if (!text) {
      return 0;
    }

    return text
      .split(/\s+/)
      .filter(Boolean)
      .length;
  }


  function stripHtml(value) {
    const element =
      document.createElement(
        "div"
      );

    element.innerHTML =
      String(
        value ||
        ""
      );

    return (
      element.textContent ||
      element.innerText ||
      ""
    );
  }


  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleString(
      [],
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    );
  }


  function human(value) {
    return String(
      value ||
      ""
    )
      .replace(
        /_/g,
        " "
      )
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }


  function escClass(value) {
    return String(
      value ||
      ""
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9_-]/g,
        ""
      );
  }


  function esc(value) {
    return String(
      value ??
      ""
    )
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }


  function message(
    text,
    type = "ok"
  ) {
    if (!E.message) {
      return;
    }

    E.message.textContent =
      text;

    E.message.className =
      `faq-message show ${type}`;

    window.clearTimeout(
      message.timer
    );

    message.timer =
      window.setTimeout(
        () => {
          E.message
            ?.classList
            .remove("show");
        },
        5000
      );
  }


  function delay(milliseconds) {
    return new Promise(
      (resolve) =>
        window.setTimeout(
          resolve,
          milliseconds
        )
    );
  }

})();
