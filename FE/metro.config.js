// Sanitize invalid or placeholder EXPO_TOKEN containing non-ASCII characters
// to prevent ByteString conversion crash in Node HTTP Headers / Expo Auth
if (process.env.EXPO_TOKEN && /[^\x00-\x7F]/.test(process.env.EXPO_TOKEN)) {
  delete process.env.EXPO_TOKEN;
}

const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
  };

  return config;
})();
