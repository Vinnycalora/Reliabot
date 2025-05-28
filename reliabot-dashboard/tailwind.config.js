/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // 👈 enables manual dark mode toggling
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};

