import type { Config } from "tailwindcss";
import baseConfig from "@fitflow/config/tailwind";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  ...baseConfig,
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  plugins: [tailwindcssAnimate],
};

export default config;
