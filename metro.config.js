// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

//  🔑  Comment-out or delete this block entirely
// config.resolver.alias = {
//   ...config.resolver.alias,
//   crypto: 'react-native-quick-crypto',
//   stream: 'readable-stream',
//   buffer: '@craftzdog/react-native-buffer',
// };

module.exports = config;
