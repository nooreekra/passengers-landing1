const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "stimstestneu.blob.core.windows.net",
                pathname: "**"
            }
        ]
    },
    transpilePackages: ['react-international-phone', 'qrcode.react']
};

module.exports = nextConfig;
