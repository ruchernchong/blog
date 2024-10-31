import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      typography: (theme: (path: string) => string) => ({
        DEFAULT: {
          css: {
            "code::before": {
              content: "",
            },
            "code::after": {
              content: "",
            },
            code: {
              backgroundColor: theme("colors.gray.800"),
              borderWidth: theme("borderWidth.2"),
              borderColor: theme("colors.gray.600"),
              borderRadius: theme("borderRadius.lg"),
              padding: theme("spacing.1"),
              margin: theme("spacing.1"),
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;

export default config;
