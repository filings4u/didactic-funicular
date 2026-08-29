/* ============================================================
   SCREENINGS4U
   CUSTOMER DONOR PASS
   customer-donor-pass.js

   UI STATE ONLY.
   Secure Supabase data wiring will be added later.
   ============================================================ */

(function () {
  "use strict";

  document.addEventListener(
    "DOMContentLoaded",
    initializeCustomerDonorPass
  );

  const state = {
    activePass: null
  };


  function initializeCustomerDonorPass() {
    bindActions();
    loadDonorPass();
  }


  function bindActions() {
    const downloadButton = document.getElementById(
      "download-donor-pass"
    );

    if (downloadButton) {
      downloadButton.addEventListener(
        "click",
        handleDownload
      );
    }


    const printButton = document.getElementById(
      "print-donor-pass"
    );

    if (printButton) {
      printButton.addEventListener(
        "click",
        handlePrint
      );
    }
  }


  async function loadDonorPass() {
    /*
      SUPABASE WIRING POINT

      The final query must identify the authenticated customer and
      return only donor/testing authorization data that customer is
      permitted to access.

      No sample donor information is intentionally displayed here.
    */

    await wait(250);

    state.activePass = null;

    renderDonorPass();
  }


  function renderDonorPass() {
    const empty = document.getElementById(
      "donor-pass-empty"
    );

    const actions = document.getElementById(
      "donor-pass-actions"
    );

    if (!state.activePass) {
      if (empty) {
        empty.hidden = false;
      }

      if (actions) {
        actions.hidden = true;
      }

      setText("donor-pass-status", "No Active Pass");
      setText("donor-pass-number", "—");
      setText("donor-pass-customer-name", "No active authorization");
      setText("donor-pass-service", "—");
      setText("donor-pass-order", "—");
      setText("donor-pass-expiration", "—");
      setText("donor-pass-collection-status", "Not scheduled");

      return;
    }

    if (empty) {
      empty.hidden = true;
    }

    if (actions) {
      actions.hidden = false;
    }

    const pass = state.activePass;

    setText("donor-pass-status", "Active");
    setText("donor-pass-number", pass.passNumber);
    setText("donor-pass-customer-name", pass.customerName);
    setText("donor-pass-service", pass.service);
    setText("donor-pass-order", pass.orderNumber);
    setText("donor-pass-expiration", formatDate(pass.expiresAt));
    setText(
      "donor-pass-collection-status",
      pass.collectionStatus
    );

    setText(
      "donor-pass-location-name",
      pass.locationName
    );

    setText(
      "donor-pass-location-address",
      pass.locationAddress
    );

    configureDirections(pass);
  }


  function configureDirections(pass) {
    const directions = document.getElementById(
      "donor-pass-directions"
    );

    if (!directions || !pass) {
      return;
    }

    if (pass.mapsUrl) {
      directions.href = pass.mapsUrl;
      directions.hidden = false;
    } else {
      directions.hidden = true;
    }
  }


  function handleDownload() {
    /*
      FUTURE IMPLEMENTATION:

      Generate or retrieve the authorized donor pass PDF from the
      secure document/result workflow.
    */

    if (!state.activePass) {
      return;
    }

    window.alert(
      "Donor pass download will be connected during secure portal wiring."
    );
  }


  function handlePrint() {
    if (!state.activePass) {
      return;
    }

    window.print();
  }


  function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value || "—";
    }
  }


  function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
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


  function wait(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

})();
