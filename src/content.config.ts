import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * menu — kategorili menü collection'ı.
 * Cafe menüsü küçük ve döngüseldir: sezonluk öğeler `seasonal: true` ile
 * işaretlenir ve listede rozetle öne çıkar. Yeni ürün eklemek = yeni .md dosyası.
 */
const menu = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/menu" }),
  schema: z.object({
    name: z.string(),
    description: z.string().default(""),
    price: z.number().positive(),
    currency: z.string().default("USD"),
    /** Kategori listesi büyüyecekse enum'u genişlet; i18n karşılıkları
        src/i18n/*.json "menu.categories" altındadır. */
    category: z.enum(["espresso", "brew", "food", "seasonal"]),
    /** plant-based / vegetarian / gluten-free / decaf */
    tags: z.array(z.string()).default([]),
    /** Sezonluk rozeti — menünün nabzı (cafe kurulu, G0) */
    seasonal: z.boolean().default(false),
    order: z.number().int().default(100),
    available: z.boolean().default(true),
    featured: z.boolean().default(false),
  }),
});

/**
 * locations — şube collection'ı (G0 kararı: çoklu şube BAŞTAN desteklenir).
 * Tek dosya varsa site tek şubeli görünür; ikinci dosya eklenince ana sayfa
 * "tüm şubeler" bağlantısı açar ve iletişim sayfası kart grid'ine döner.
 * Kod değişikliği gerekmez.
 */
const locations = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/locations" }),
  schema: z.object({
    name: z.string(),
    streetAddress: z.string(),
    addressLocality: z.string(),
    addressRegion: z.string(),
    postalCode: z.string(),
    addressCountry: z.string().default("US"),
    phone: z.string().optional(),
    /** Harita bağlantısı — "Get directions" butonunun hedefi */
    mapUrl: z.string().url().optional(),
    /** Haftalık saatler; schema.org openingHoursSpecification buradan üretilir */
    hours: z
      .array(
        z.object({
          dayOfWeek: z.array(z.string()),
          opens: z.string(),
          closes: z.string(),
        })
      )
      .default([]),
    /** "Çalışılabilir mi?" bilgisi — dürüst cevap güven kazandırır (cafe kurulu) */
    wifi: z.boolean().default(true),
    outlets: z.boolean().default(true),
    laptopFriendly: z.boolean().default(true),
    /** Ana şube: ana sayfa kartı ve schema.org bu kaydı kullanır */
    primary: z.boolean().default(false),
    order: z.number().int().default(100),
  }),
});

/**
 * faq — SSS collection'ı. FAQPage schema'ya otomatik bağlanır;
 * GEO'nun ana yemi (docs/seo-geo-playbook.md).
 */
const faq = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/faq" }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    order: z.number().int().default(100),
  }),
});

/**
 * legal — yasal sayfalar (privacy/terms). Gövde markdown'dır; alıcı kendi
 * metniyle değiştirir (dokümantasyonda hukuki uyarı notu vardır).
 */
const legal = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/legal" }),
  schema: z.object({
    title: z.string(),
    updated: z.string(),
  }),
});

export const collections = { menu, locations, faq, legal };
