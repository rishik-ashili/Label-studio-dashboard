/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1f77b4',
                success: '#28a745',
                warning: '#ffc107',
                danger: '#dc3545',
            },
            backgroundImage: {
                'gradient-1': 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                'gradient-2': 'linear-gradient(90deg, #28a745 0%, #20c997 100%)',
            },
        },
    },
    plugins: [],
}
