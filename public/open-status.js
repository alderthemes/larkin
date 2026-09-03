/**
 * Updates today's opening hours and the open/closed badge to the visitor's
 * own clock.
 *
 * Why this lives in a file instead of inline in the component: the template
 * ships a Content-Security-Policy of `script-src 'self'` (public/_headers).
 * An inline script violates it and the browser blocks it SILENTLY — the page
 * loads, nothing looks broken, the badge just never appears. Served from the
 * same origin, this file complies.
 *
 * The server already renders correct fallback hours, so the page still makes
 * sense with JavaScript disabled. This only personalises it to today.
 */
for (const el of document.querySelectorAll(".open-status")) {
  try {
    const ranges = JSON.parse(el.dataset.ranges || "[]");
    const minutes = JSON.parse(el.dataset.minutes || "[]");
    const now = new Date();
    const day = now.getDay();

    const value = el.querySelector(".open-status__value");
    if (ranges[day] && value) value.textContent = ranges[day];

    const today = minutes[day];
    const state = el.querySelector(".open-status__state");
    const text = el.querySelector(".open-status__state-text");
    if (state && text) {
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const isOpen = Boolean(today && nowMin >= today[0] && nowMin < today[1]);
      text.textContent = isOpen ? el.dataset.open || "" : el.dataset.closed || "";
      state.classList.toggle("open-status__state--open", isOpen);
      state.hidden = false;
    }
  } catch {
    /* keep the server-rendered fallback */
  }
}
