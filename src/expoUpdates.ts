import { AetherPluginError } from './errors';

export function assertExpoUpdatesInactive(
  projectRoot: string | undefined,
  updatesEnabled: boolean | undefined
): void {
  if (!projectRoot) {
    return;
  }
  let installed = false;
  try {
    require.resolve('expo-updates/package.json', { paths: [projectRoot] });
    installed = true;
  } catch {
    installed = false;
  }
  if (installed && updatesEnabled !== false) {
    throw new AetherPluginError(
      'expo-updates is installed and enabled. Aether and expo-updates both control the JS bundle and cannot run together. Uninstall expo-updates, or set updates.enabled to false in your app config.'
    );
  }
}
