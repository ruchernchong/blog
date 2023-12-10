/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      typography: (theme) => ({
        DEFAULT: {
          css: {
            "code::before": {
              content: "none",
            },
            "code::after": {
              content: "none",
            },
            code: {
              color: theme("colors.gray.50"),
              backgroundColor: theme("colors.pink.500"),
              borderRadius: theme("borderRadius.DEFAULT"),
              paddingLeft: theme("spacing[1.5]"),
              paddingRight: theme("spacing[1.5]"),
              paddingTop: theme("spacing.1"),
              paddingBottom: theme("spacing.1"),
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
