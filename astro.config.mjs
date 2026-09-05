// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  // Put your own domain here. The demo deployment does not edit this file:
  // it passes a SITE environment variable at build time instead. If you set
  // neither, the canonical tags read "example.com", which is deliberate —
  // a wrong domain that looks right is worse than one that is obviously
  // unset.
  site: process.env.SITE ?? "https://example.com",
  vite: {
    plugins: [tailwindcss()],
  },
});
