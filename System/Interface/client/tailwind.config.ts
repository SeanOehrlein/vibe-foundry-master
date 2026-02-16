import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                neon: {
                    green: "#00ff00",
                    cyan: "#00ffff",
                    red: "#ff0000",
                },
                cyber: {
                    black: "#050505",
                    gray: "#111111",
                    border: "#333333",
                }
            },
            fontFamily: {
                mono: ["var(--font-mono)", "monospace"],
                sans: ["var(--font-sans)", "sans-serif"],
            },
        },
    },
    plugins: [],
};
export default config;
