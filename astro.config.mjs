// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  // Alıcı kendi domain'ini buraya yazar. Demo deploy'da bu dosya DEĞİŞMEZ:
  // Cloudflare build'inde SITE ortam değişkeni verilir (D-038). Alıcı SITE
  // tanımlamaz, "example.com" görür ve kendi adresini yazmak zorunda kalır (D-019).
  site: process.env.SITE ?? "https://example.com",
  vite: {
    plugins: [tailwindcss()],
  },
});
