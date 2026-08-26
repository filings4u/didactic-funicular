/* ============================================================
   screenings4u — DOCUMENT STORAGE HELPER
   ============================================================ */

(() => {
  "use strict";

  async function upload(bucket, path, file, options = {}) {
    const client = window.S4UAuth.getClient();

    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, file, {
        upsert: false,
        ...options
      });

    if (error) throw error;

    return data;
  }

  async function signedUrl(bucket, path, expiresIn = 300) {
    const client = window.S4UAuth.getClient();

    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;

    return data?.signedUrl || null;
  }

  window.S4UStorage = Object.freeze({
    upload,
    signedUrl
  });
})();
