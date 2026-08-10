import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brandOrange: "#F5821F",
        brandOrangeDark: "#D96C0F",
        brandBlack: "#111111",
        brandGray: "#6B6B6B",
        brandBg: "#FFFFFF",
        brandCard: "#FAFAFA",
      },
    },
  },
  plugins: [],
};
export default config;
