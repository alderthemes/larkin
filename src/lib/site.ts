/**
 * Site yapılandırması — alıcının düzenleyeceği TEK dosya olacak şekilde tasarlandı.
 * UI string'leri src/i18n/*.json'da; şube/adres/saat bilgisi
 * src/content/locations/ collection'ında; burada yalnızca işletme kimliği var.
 */
import { createT, DEFAULT_LOCALE, type Locale } from "@studio/core/utils/i18n";
import en from "../i18n/en.json";
import tr from "../i18n/tr.json";

/** Aktif dil — "tr" yapınca tüm UI Türkçe'ye döner. */
export const LOCALE: Locale = DEFAULT_LOCALE;

const dicts: Record<Locale, typeof en> = { en, tr };
export const t = createT(dicts[LOCALE], en);

/**
 * İletişim formu hedefi. Cloudflare/Netlify dışı bir host kullanıyorsanız
 * Formspree veya Basin gibi bir servisin endpoint'ini yazın (docs/README.md).
 */
export const contactFormAction = "#";

/**
 * İşletme kimliği — schema.org LocalBusiness alanları buradan beslenir.
 * Adres ve saatler ŞUBEDEN gelir (src/content/locations/), böylece ikinci
 * şube eklemek tek markdown dosyası eklemektir.
 */
export const business = {
  name: en.site.name,
  email: "hello@fernandfilter.example",
  phone: "+1 503 555 0142",
  priceRange: "$",
  servesCuisine: ["Coffee", "Light bites"],
  /** Instagram embed slotu için hesap adı; boş bırakılırsa bölüm gizlenir. */
  instagramHandle: "",
  /** Kuruluş yılı — hakkında sayfası ve schema.org */
  foundingYear: "2019",
};
