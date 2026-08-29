/* ============================================================
   SCREENINGS4U
   CUSTOMER NOTIFICATIONS
   customer-notifications.js

   UI + STATE MANAGEMENT ONLY.
   Supabase notification wiring will be added later.
   ============================================================ */

(function () {
  "use strict";


  const state = {
    notifications: [],
    activeCategory: "all",
    activeType: "all"
  };


  document.addEventListener(
    "DOMContentLoaded",
    initializeCustomerNotifications
  );


  function initializeCustomerNotifications() {
    bindControls();
    loadNotifications();
  }


  function bindControls() {
    document
      .querySelectorAll("[data-notification-filter]")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          state.activeCategory =
            button.dataset.notificationFilter || "all";

          updateActiveFilterButton(button);
          renderNotifications();
        });
      });


    const typeFilter = document.getElementById(
      "notifications-type-filter"
    );

    if (typeFilter) {
      typeFilter.addEventListener("change", function () {
        state.activeType = typeFilter.value || "all";
        renderNotifications();
      });
    }


    const markAllButton = document.getElementById(
      "mark-all-read"
    );

    if (markAllButton) {
      markAllButton.addEventListener(
        "click",
        markAllAsRead
      );
    }


    const refreshButton = document.getElementById(
      "notifications-refresh"
    );

    if (refreshButton) {
      refreshButton.addEventListener(
        "click",
        loadNotifications
      );
    }
  }


  async function loadNotifications() {
    setLoading(true);

    /*
      SUPABASE WIRING POINT

      Retrieve notifications belonging only to the authenticated
      customer from the existing `notifications` table.

      RLS must enforce ownership and account access.

      Suggested fields to map during wiring:
      - id
      - title
      - message/body
      - notification_type
      - read_at or is_read
      - created_at
      - action URL / related entity, when available

      No fake customer notifications are intentionally loaded here.
    */

    await wait(300);

    state.notifications = [];

    updateCounts();
    renderNotifications();

    setLoading(false);
  }


  function getFilteredNotifications() {
    return state.notifications.filter(function (notification) {
      const type =
        notification.type ||
        notification.notification_type ||
        "account";

      const isRead = Boolean(
        notification.is_read ||
        notification.read_at
      );


      let categoryMatch = true;

      if (state.activeCategory === "unread") {
        categoryMatch = !isRead;
      } else if (state.activeCategory !== "all") {
        categoryMatch = type === state.activeCategory;
      }


      const typeMatch =
        state.activeType === "all" ||
        type === state.activeType;

      return categoryMatch && typeMatch;
    });
  }


  function renderNotifications() {
    const list = document.getElementById(
      "notifications-list"
    );

    const empty = document.getElementById(
      "notifications-empty"
    );

    const resultCount = document.getElementById(
      "notifications-result-count"
    );

    if (!list || !empty) {
      return;
    }


    const notifications =
      getFilteredNotifications();


    list.innerHTML = "";


    if (!notifications.length) {
      list.hidden = true;
      empty.hidden = false;

      if (resultCount) {
        resultCount.textContent =
          state.notifications.length
            ? "No notifications match your current filters."
            : "You are all caught up.";
      }

      return;
    }


    empty.hidden = true;
    list.hidden = false;


    if (resultCount) {
      resultCount.textContent =
        notifications.length +
        (notifications.length === 1
          ? " notification"
          : " notifications");
    }


    notifications.forEach(function (notification) {
      list.appendChild(
        createNotificationRow(notification)
      );
    });
  }


  function createNotificationRow(notification) {
    const row = document.createElement("article");

    const isRead = Boolean(
      notification.is_read ||
      notification.read_at
    );

    const type =
      notification.type ||
      notification.notification_type ||
      "account";


    row.className =
      "customer-notification-row" +
      (!isRead ? " is-unread" : "");


    row.innerHTML = [
      '<div class="customer-notification-indicator"></div>',
      '<div class="customer-notification-details">',
      '<div class="customer-notification-title"></div>',
      '<div class="customer-notification-message"></div>',
      "</div>",
      '<div class="customer-notification-actions-inline">',
      '<span class="customer-notification-date"></span>',
      !isRead
        ? '<button type="button" class="customer-notification-read">Mark read</button>'
        : "",
      "</div>"
    ].join("");


    const indicator =
      row.querySelector(
        ".customer-notification-indicator"
      );

    indicator.innerHTML = notificationIcon(type);

    if (type === "results") {
      indicator.classList.add("is-results");
    }

    if (!isRead) {
      const dot = document.createElement("span");
      dot.className = "customer-notification-dot";
      indicator.appendChild(dot);
    }


    row.querySelector(
      ".customer-notification-title"
    ).textContent =
      notification.title || "Account Update";


    row.querySelector(
      ".customer-notification-message"
    ).textContent =
      notification.message ||
      notification.body ||
      "You have a new update available.";


    row.querySelector(
      ".customer-notification-date"
    ).textContent =
      formatDate(notification.created_at);


    const markReadButton =
      row.querySelector(
        ".customer-notification-read"
      );

    if (markReadButton) {
      markReadButton.addEventListener(
        "click",
        function () {
          markNotificationAsRead(notification.id);
        }
      );
    }


    return row;
  }


  function updateCounts() {
    const notifications =
      state.notifications;

    const unread = notifications.filter(function (item) {
      return !(
        item.is_read ||
        item.read_at
      );
    }).length;


    const orders = notifications.filter(function (item) {
      const type =
        item.type ||
        item.notification_type;

      return type === "orders";
    }).length;


    const account = notifications.filter(function (item) {
      const type =
        item.type ||
        item.notification_type;

      return type === "account";
    }).length;


    setText(
      "notifications-total",
      notifications.length
    );

    setText(
      "notifications-unread",
      unread
    );

    setText(
      "notifications-orders",
      orders
    );

    setText(
      "notifications-account",
      account
    );
  }


  function markNotificationAsRead(notificationId) {
    if (!notificationId) {
      return;
    }


    /*
      FUTURE SUPABASE UPDATE:

      Update the authenticated customer's notification record.

      Example intent:
      UPDATE notifications
      SET read_at = NOW()
      WHERE id = notificationId
    */


    state.notifications =
      state.notifications.map(function (notification) {
        if (notification.id === notificationId) {
          return Object.assign(
            {},
            notification,
            {
              is_read: true,
              read_at: new Date().toISOString()
            }
          );
        }

        return notification;
      });


    updateCounts();
    renderNotifications();
  }


  function markAllAsRead() {
    /*
      FUTURE SUPABASE UPDATE:

      Mark all unread notifications belonging to the authenticated
      customer as read in one secure operation.
    */


    state.notifications =
      state.notifications.map(function (notification) {
        return Object.assign(
          {},
          notification,
          {
            is_read: true,
            read_at:
              notification.read_at ||
              new Date().toISOString()
          }
        );
      });


    updateCounts();
    renderNotifications();
  }


  function updateActiveFilterButton(activeButton) {
    document
      .querySelectorAll("[data-notification-filter]")
      .forEach(function (button) {
        button.classList.toggle(
          "active",
          button === activeButton
        );
      });
  }


  function setLoading(isLoading) {
    const loading = document.getElementById(
      "notifications-loading"
    );

    const list = document.getElementById(
      "notifications-list"
    );

    const empty = document.getElementById(
      "notifications-empty"
    );

    const refresh = document.getElementById(
      "notifications-refresh"
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
      refresh.classList.toggle(
        "is-loading",
        isLoading
      );

      refresh.disabled = isLoading;
    }
  }


  function notificationIcon(type) {
    if (type === "orders") {
      return [
        '<svg viewBox="0 0 24 24" aria-hidden="true">',
        '<path d="M4 7h16l-1 13H5z"></path>',
        '<path d="M9 7a3 3 0 0 1 6 0"></path>',
        "</svg>"
      ].join("");
    }


    if (type === "results") {
      return [
        '<svg viewBox="0 0 24 24" aria-hidden="true">',
        '<path d="M7 3h7l4 4v14H7z"></path>',
        '<path d="M14 3v5h5"></path>',
        '<path d="m9 14 2 2 4-4"></path>',
        "</svg>"
      ].join("");
    }


    if (type === "documents") {
      return [
        '<svg viewBox="0 0 24 24" aria-hidden="true">',
        '<path d="M7 3h7l4 4v14H7z"></path>',
        '<path d="M14 3v5h5"></path>',
        '<path d="M9 13h6"></path>',
        "</svg>"
      ].join("");
    }


    if (type === "billing") {
      return [
        '<svg viewBox="0 0 24 24" aria-hidden="true">',
        '<rect x="5" y="3" width="14" height="18" rx="2"></rect>',
        '<path d="M8 7h8"></path>',
        '<path d="M8 11h8"></path>',
        '<path d="M8 15h4"></path>',
        "</svg>"
      ].join("");
    }


    return [
      '<svg viewBox="0 0 24 24" aria-hidden="true">',
      '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>',
      '<path d="M10 21h4"></path>',
      "</svg>"
    ].join("");
  }


  function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Just now";
    }


    const now = Date.now();
    const difference = now - date.getTime();


    if (difference < 60 * 1000) {
      return "Just now";
    }

    if (difference < 60 * 60 * 1000) {
      const minutes =
        Math.floor(
          difference / (60 * 1000)
        );

      return minutes + "m ago";
    }

    if (difference < 24 * 60 * 60 * 1000) {
      const hours =
        Math.floor(
          difference / (60 * 60 * 1000)
        );

      return hours + "h ago";
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
