/**
 * OpenStatus — bugünün saat aralığını ve açık/kapalı durumunu ziyaretçinin
 * kendi saatine göre günceller.
 *
 * Neden ayrı bir dosya, bileşenin içinde inline değil: bu template'in ürettiği
 * Content-Security-Policy `script-src 'self'` diyor (public/_headers). Inline
 * script o politikayı ihlal eder ve tarayıcı onu SESSİZCE bloklar — sayfa
 * açılır, hata görünmez, yalnızca "Open now" rozeti hiç çıkmaz. Aynı kaynaktan
 * servis edilen bu dosya politikaya uyar.
 *
 * Sunucu tarafı zaten doğru bir fallback basar; bu dosya yalnızca onu
 * bugüne özelleştirir. JavaScript kapalıysa saatler yine görünür.
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
    /* sunucu tarafı fallback metni yerinde kalır */
  }
}
