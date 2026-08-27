/* ============================================================
   screenings4u — SYSTEM EVENT HELPER
   ============================================================ */

(() => {
  "use strict";

  async function emit(eventName, {
    organizationId = null,
    entityType = null,
    entityId = null,
    payload = {}
  } = {}) {
    const client = window.S4UAuth.getClient();

    const {
      data: { user }
    } = await client.auth.getUser();

    const { data, error } = await client
      .from("system_events")
      .insert({
        event_name: eventName,
        actor_user_id: user?.id || null,
        organization_id: organizationId,
        entity_type: entityType,
        entity_id: entityId,
        payload
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  window.S4UEvents = Object.freeze({ emit });
})();
