# Releasing over-the-air updates for Expo apps

This is the canonical release flow for Expo projects using this plugin. The docs site derives its Expo guide from this file; update both together.

## Why not `aether release-react`

`aether release-react` bundles through the React Native community CLI (`node_modules/react-native/cli.js bundle`), which Expo projects do not use. Expo's bundler entry point is `npx expo export:embed`, the same command the native build runs to embed the JavaScript bundle. Bundle with `export:embed`, then upload the result with `aether release`.

## Requirements

- `@aetherpush/cli` 0.4.0 or newer. Signing pre-built contents (`aether release --privateKeyPath`) shipped in 0.4.0.
- A development or production build of the app on a device, carrying the deployment key set through this plugin.

## 1. Bundle into a folder named `CodePush`

The folder name is not a convention, it is a protocol requirement: the SDK looks for the signature at `CodePush/.codepushrelease` and hashes file paths under a `CodePush/` prefix when verifying signed updates. `aether release --privateKeyPath` refuses any other folder name.

iOS:

```sh
rm -rf build/CodePush && mkdir -p build/CodePush
npx expo export:embed \
  --platform ios \
  --dev false \
  --bundle-output build/CodePush/main.jsbundle \
  --assets-dest build/CodePush
```

Android:

```sh
rm -rf build/CodePush && mkdir -p build/CodePush
npx expo export:embed \
  --platform android \
  --dev false \
  --bundle-output build/CodePush/index.android.bundle \
  --assets-dest build/CodePush
```

Use the bundle filename your binary expects: `main.jsbundle` on iOS and `index.android.bundle` on Android are the defaults.

## 2. Release the folder

```sh
aether release MyApp build/CodePush 1.2.0 -d Staging
```

The third argument is the binary version the update targets: the app version of the builds that should receive it, as a semver version or range.

To sign the release, pass the private key and the CLI writes the signature into the folder before upload:

```sh
aether release MyApp build/CodePush 1.2.0 -d Staging --privateKeyPath keys/private.pem
```

Signed updates require the matching public key in the app config (`publicKey` prop of this plugin).

## 3. Verify on a device

Run the release build, then watch the update arrive with `aether debug ios` or `aether debug android`. Promote to Production once Staging looks good:

```sh
aether promote MyApp Staging Production
```
