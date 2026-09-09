/**
 * Closes the mobile menu when Escape is pressed.
 *
 * The menu is a native <details> element, which is why it works with no
 * JavaScript at all: it opens, it traps nothing, and Tab walks straight out
 * of it. The one thing the element does not do is close on Escape, and that
 * is the key a keyboard user reaches for. Six lines is a smaller cost than
 * the expectation it breaks.
 *
 * It lives in a file rather than inline for the same reason as
 * open-status.js: the Content-Security-Policy in public/_headers allows
 * script-src 'self', and an inline block is refused silently.
 */
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  for (const menu of document.querySelectorAll("details.site-header__mobile[open]")) {
    menu.open = false;
    /* Focus goes back to the control that opened it. Without this the focus
       is left on an element that is no longer visible, and the next Tab
       starts from the top of the document. */
    menu.querySelector("summary")?.focus();
  }
});
