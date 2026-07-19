export class AetherPluginError extends Error {
  constructor(message: string) {
    super(`[@aetherpush/expo-code-push-plugin] ${message}`);
    this.name = 'AetherPluginError';
  }
}
