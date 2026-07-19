# @aetherpush/expo-code-push-plugin

Expo config plugin for [@aetherpush/react-native-code-push](https://www.npmjs.com/package/@aetherpush/react-native-code-push). It configures the native side of an Expo app during `expo prebuild`, so you can ship over-the-air updates with Aether without editing native code by hand.

## Requirements

- `@aetherpush/react-native-code-push` 1.2.1 or newer. Older versions send a broken header through the strict fetch that Expo ships, so update checks fail.
- Expo SDK 53 or newer. The native SDK itself supports React Native 0.76 and newer, but this plugin needs the Swift AppDelegate template that Expo introduced in SDK 53. On older projects, follow the manual setup in the [@aetherpush/react-native-code-push](https://www.npmjs.com/package/@aetherpush/react-native-code-push) README instead.
- A development build or a prebuild workflow. The plugin changes native files, so it does not work in Expo Go.
- expo-updates must not be active. Aether and expo-updates both want to control which JS bundle the app loads, and they cannot do that at the same time. Uninstall expo-updates, or set `updates.enabled` to `false` in your app config. Prebuild fails with a clear error if an active expo-updates install is found.

## Install

```sh
npx expo install @aetherpush/expo-code-push-plugin @aetherpush/react-native-code-push
```

## Use

Add the plugin to your app config and pass your deployment keys:

```json
{
  "expo": {
    "plugins": [
      [
        "@aetherpush/expo-code-push-plugin",
        {
          "iosDeploymentKey": "your-ios-deployment-key",
          "androidDeploymentKey": "your-android-deployment-key"
        }
      ]
    ]
  }
}
```

Then run prebuild and build a development client:

```sh
npx expo prebuild
npx expo run:ios
npx expo run:android
```

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `iosDeploymentKey` | `string` | yes | Deployment key for the iOS app. |
| `androidDeploymentKey` | `string` | yes | Deployment key for the Android app. |
| `serverUrl` | `string` | no | Aether server URL. When omitted, the SDK uses `https://api.aetherpush.com/`. |
| `publicKey` | `string` | no | PEM public key for code signing. When set, the SDK only installs updates whose bundle carries a valid signature, so release with the matching `--privateKeyPath`. |

### Where is serverPathMode?

`serverPathMode` is a JavaScript option, not native configuration, so this plugin cannot set it. Pass it to the SDK in your code:

```js
codePush({ serverPathMode: 'aether' })(App);
```

The default is `'aether'`. Use `'codepush-legacy'` only if your server needs the old CodePush paths.

## What the plugin changes

On iOS:

- Writes `CodePushDeploymentKey` (plus `CodePushServerURL` and `CodePushPublicKey` when you set them) to `Info.plist`.
- Adds `import CodePush` to `AppDelegate.swift` and makes `bundleURL()` return `CodePush.bundleURL()` in release builds. Debug builds keep loading from Metro.

On Android:

- Writes `CodePushDeploymentKey` (plus `CodePushServerUrl` and `CodePushPublicKey` when you set them) to `res/values/strings.xml`.
- Adds the CodePush import to `MainApplication.kt` and wires `CodePush.getJSBundleFile()` into bundle resolution. On SDK 55 and newer it passes `jsBundleFilePath` to `getDefaultReactHost`. On SDK 53 and 54 it adds a `getJSBundleFile()` override to the `DefaultReactNativeHost`.
- Applies the SDK's `codepush.gradle` at the end of `app/build.gradle`, which records the binary build time the SDK needs to detect new app builds.

The plugin edits the files that `expo prebuild` generates from the Expo template. If your project has a custom AppDelegate or MainApplication that no longer matches the template, the plugin stops with an error that tells you what to wire manually.

## License

MIT
