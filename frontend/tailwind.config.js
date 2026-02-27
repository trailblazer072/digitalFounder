/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#212121", // ChatGPT Main BG
                sidebar: "#171717",    // ChatGPT Sidebar
                primary: "#10a37f",    // ChatGPT Green (optional, but good for branded items)
                secondary: "#3b82f6",
                accent: "#10b981",
                glass: "rgba(255, 255, 255, 0.05)",
                surface: "#2f2f2f",    // Input/Cards
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease-in-out",
                "slide-up": "slideUp 0.5s ease-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(20px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                }
            }
        },
    },
    plugins: [],
}
