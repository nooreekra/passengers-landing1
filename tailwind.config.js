module.exports = {
    content: ['./src/**/*.{ts,tsx,js,jsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Roboto', 'sans-serif'],
            },
            colors: {
                brand: {
                    white: '#FFFFFF',
                    black: '#0E0A0D',
                    blue: '#0062E4',
                },
                action: {
                    primary: {
                        active: '#0062E4',
                        hovered: '#0056C0',
                        pressed: '#004BB5',
                        disabled: '#7B90B4',
                    },
                    secondary: {
                        active: '#FFFFFF',
                        hovered: '#CCCDD7',
                        pressed: '#C0C2CE',
                        disabled: '#D7D8E0',
                    },
                },
                label: {
                    primary: '#0E0A0D',
                    secondary: '#7B7C83',
                    additional: '#4B4B4B',
                    green: '#0e671c',
                    white: '#FFFFFF',
                    blue: '#0062E4',
                    disabled: '#C7C7C7',
                    red: '#FF482B',
                },
                decorative: {
                    green: '#C5E4B0',
                    blue: '#CDDDFF',
                    gray: '#DBDADA',
                },
                background: {
                    white: '#FFFFFF',
                    gray1: '#F4F4F6',
                    gray2: '#D9D9D9',
                    grayLight: '#FBFBFB',
                    dark: '#1E1E1E',
                },
                border: {
                    default: '#D7D8E0',
                    hover: '#E1E1E1',
                    pressed: '#CECECE',
                    disabled: '#E8E9ED',
                    negative: '#FF482B',
                },
                'blue-linear-start': '#567ED0',
                'blue-linear-end': '#0062E4',
                dark: '#1E1E1E',
            },
            keyframes: {
                'fade-down': {
                    '0%': { opacity: '0', transform: 'translateY(-10%)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'fade-down': 'fade-down 0.3s ease-out',
            },
        },
    },
    plugins: [],
};
