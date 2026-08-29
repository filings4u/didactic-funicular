/* ============================================================
   SCREENINGS4U
   CUSTOMER MY ACCOUNT
   customer-account.js

   Ready for Supabase wiring.

   Primary tables already identified:
   - customer_profiles
   - user_profiles

   Authentication:
   - Supabase Auth
   ============================================================ */

(function () {
  "use strict";

  const state = {
    profile: null,
    originalProfile: null,
    editing: false
  };


  document.addEventListener(
    "DOMContentLoaded",
    initializeCustomerAccount
  );


  function initializeCustomerAccount() {
    bindAccountControls();
    loadCustomerAccount();
  }


  function bindAccountControls() {
    const editButton =
      document.getElementById(
        "customer-edit-profile-btn"
      );

    const cancelButton =
      document.getElementById(
        "customer-cancel-profile-btn"
      );

    const profileForm =
      document.getElementById(
        "customer-profile-form"
      );

    const passwordButton =
      document.getElementById(
        "customer-password-btn"
      );

    const closePasswordModal =
      document.getElementById(
        "customer-password-modal-close"
      );

    const passwordDone =
      document.getElementById(
        "customer-password-modal-done"
      );

    const supportButton =
      document.getElementById(
        "customer-account-support-btn"
      );


    if (editButton) {
      editButton.addEventListener(
        "click",
        function () {
          setProfileEditing(true);
        }
      );
    }


    if (cancelButton) {
      cancelButton.addEventListener(
        "click",
        function () {
          restoreOriginalProfile();
          setProfileEditing(false);
        }
      );
    }


    if (profileForm) {
      profileForm.addEventListener(
        "submit",
        handleProfileSave
      );
    }


    if (passwordButton) {
      passwordButton.addEventListener(
        "click",
        openPasswordModal
      );
    }


    if (closePasswordModal) {
      closePasswordModal.addEventListener(
        "click",
        closePasswordModalHandler
      );
    }


    if (passwordDone) {
      passwordDone.addEventListener(
        "click",
        closePasswordModalHandler
      );
    }


    if (supportButton) {
      supportButton.addEventListener(
        "click",
        function () {
          window.alert(
            "Customer support will be connected to the Screenings4u support workflow during final portal wiring."
          );
        }
      );
    }
  }


  async function loadCustomerAccount() {
    /*
      FINAL SUPABASE WIRING

      We will inspect the exact columns before writing the final query.

      Intended secure flow:

      1. Get authenticated Supabase user.
      2. Resolve the matching customer_profiles record.
      3. Load permitted profile information.
      4. Populate the account screen.
      5. Never allow a customer to retrieve another user's profile.

      We should determine whether:
      - customer_profiles.id = auth.uid()
      - OR customer_profiles references user_profiles
      - OR another ownership relationship is being used.

      This will be verified before production wiring.
    */

    try {
      await wait(250);

      state.profile = null;
      state.originalProfile = null;

      renderProfile();

    } catch (error) {
      console.error(
        "Unable to load customer account:",
        error
      );

      state.profile = null;
      state.originalProfile = null;

      renderProfile();
    }
  }


  function renderProfile() {
    const profile =
      state.profile || {};


    setValue(
      "customer-first-name",
      profile.first_name || ""
    );

    setValue(
      "customer-last-name",
      profile.last_name || ""
    );

    setValue(
      "customer-email",
      profile.email || ""
    );

    setValue(
      "customer-phone",
      profile.phone || ""
    );


    const fullName =
      [
        profile.first_name,
        profile.last_name
      ]
        .filter(Boolean)
        .join(" ") ||
      "Your Name";


    setText(
      "customer-account-name",
      fullName
    );


    setText(
      "customer-account-email",
      profile.email ||
      "Account information will appear here."
    );


    setText(
      "customer-member-since",
      profile.created_at
        ? formatDate(profile.created_at)
        : "—"
    );


    setText(
      "customer-account-id",
      profile.id
        ? shortenId(profile.id)
        : "—"
    );


    setText(
      "customer-account-avatar",
      getInitials(
        profile.first_name,
        profile.last_name
      )
    );


    const emailNotifications =
      document.getElementById(
        "customer-email-notifications"
      );

    const serviceNotifications =
      document.getElementById(
        "customer-service-notifications"
      );


    if (emailNotifications) {
      emailNotifications.checked =
        Boolean(
          profile.email_notifications
        );
    }


    if (serviceNotifications) {
      serviceNotifications.checked =
        Boolean(
          profile.service_notifications
        );
    }
  }


  function setProfileEditing(isEditing) {
    state.editing =
      Boolean(isEditing);


    const editableInputs = [
      document.getElementById(
        "customer-first-name"
      ),
      document.getElementById(
        "customer-last-name"
      ),
      document.getElementById(
        "customer-phone"
      )
    ];


    editableInputs.forEach(
      function (input) {
        if (input) {
          input.disabled =
            !state.editing;
        }
      }
    );


    const notificationInputs = [
      document.getElementById(
        "customer-email-notifications"
      ),
      document.getElementById(
        "customer-service-notifications"
      )
    ];


    notificationInputs.forEach(
      function (input) {
        if (input) {
          input.disabled =
            !state.editing;
        }
      }
    );


    const actions =
      document.getElementById(
        "customer-profile-actions"
      );

    const notificationActions =
      document.getElementById(
        "customer-notification-actions"
      );

    const editButton =
      document.getElementById(
        "customer-edit-profile-btn"
      );


    if (actions) {
      actions.hidden =
        !state.editing;
    }


    if (notificationActions) {
      notificationActions.hidden =
        !state.editing;
    }


    if (editButton) {
      editButton.hidden =
        state.editing;
    }
  }


  async function handleProfileSave(event) {
    event.preventDefault();


    const updatedProfile = {
      ...(state.profile || {}),
      first_name:
        getValue("customer-first-name"),
      last_name:
        getValue("customer-last-name"),
      phone:
        getValue("customer-phone"),
      email_notifications:
        getChecked(
          "customer-email-notifications"
        ),
      service_notifications:
        getChecked(
          "customer-service-notifications"
        )
    };


    /*
      FINAL SUPABASE UPDATE

      Once exact columns and ownership relationships are confirmed:

      supabase
        .from("customer_profiles")
        .update({
          first_name: updatedProfile.first_name,
          last_name: updatedProfile.last_name,
          phone: updatedProfile.phone,
          ...
        })
        .eq("id", authenticatedCustomerId)

      The RLS policy must enforce ownership.

      Do not allow the browser to choose another customer's ID.
    */


    state.profile =
      updatedProfile;

    state.originalProfile =
      clone(updatedProfile);


    renderProfile();
    setProfileEditing(false);


    window.alert(
      "Profile saving will be connected to Supabase during final portal wiring."
    );
  }


  function restoreOriginalProfile() {
    state.profile =
      clone(
        state.originalProfile
      );

    renderProfile();
  }


  function openPasswordModal() {
    const modal =
      document.getElementById(
        "customer-password-modal"
      );

    if (modal) {
      modal.hidden = false;
    }
  }


  function closePasswordModalHandler() {
    const modal =
      document.getElementById(
        "customer-password-modal"
      );

    if (modal) {
      modal.hidden = true;
    }
  }


  function getInitials(firstName, lastName) {
    const initials = [
      firstName,
      lastName
    ]
      .filter(Boolean)
      .map(function (value) {
        return String(value)
          .trim()
          .charAt(0)
          .toUpperCase();
      })
      .join("");


    return initials || "CU";
  }


  function shortenId(id) {
    const value =
      String(id);

    if (value.length <= 12) {
      return value;
    }

    return (
      value.slice(0, 8) +
      "…" +
      value.slice(-4)
    );
  }


  function formatDate(value) {
    const date =
      new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        year: "numeric"
      }
    ).format(date);
  }


  function setText(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent =
        String(value || "");
    }
  }


  function setValue(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.value =
        String(value || "");
    }
  }


  function getValue(id) {
    const element =
      document.getElementById(id);

    return element
      ? element.value.trim()
      : "";
  }


  function getChecked(id) {
    const element =
      document.getElementById(id);

    return Boolean(
      element && element.checked
    );
  }


  function clone(value) {
    return value
      ? JSON.parse(
          JSON.stringify(value)
        )
      : null;
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
