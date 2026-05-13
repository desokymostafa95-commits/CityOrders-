const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Override resolution to force zustand to use CommonJS version
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // For web platform, redirect zustand/middleware to the CJS version
    if (platform === 'web' && moduleName === 'zustand/middleware') {
        return {
            filePath: require.resolve('zustand/middleware'),
            type: 'sourceFile',
        };
    }

    // Use the default resolver for everything else
    if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
