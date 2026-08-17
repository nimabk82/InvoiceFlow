module.exports = {
  preset: '@react-native/jest-preset',
  // pnpm stores real package paths under node_modules/.pnpm, so React Native's
  // default transform allowlist needs an equivalent pattern for that layout.
  transformIgnorePatterns: [
    'node_modules/.pnpm/(?!(?:@react-native\\+|react-native@|@react-navigation\\+|react-native-paper@|react-native-safe-area-context@|react-native-screens@|@react-native-vector-icons\\+))',
    'node_modules/(?!.pnpm|(?:@react-native|react-native|@react-navigation|react-native-paper|react-native-safe-area-context|react-native-screens|@react-native-vector-icons)/)',
  ],
};
