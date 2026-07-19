import { AetherPluginError } from './errors';
import type { AetherCodePushPluginProps } from './types';

export function validateProps(props: unknown): AetherCodePushPluginProps {
  if (typeof props !== 'object' || props === null) {
    throw new AetherPluginError(
      'Plugin props are required. Pass { iosDeploymentKey, androidDeploymentKey } in your app config plugins entry.'
    );
  }
  const candidate = props as Record<string, unknown>;
  if ('serverPathMode' in candidate) {
    throw new AetherPluginError(
      'serverPathMode is not native configuration and cannot be set by this plugin. Set it in JavaScript instead: codePush({ serverPathMode: "aether" | "codepush-legacy" }). The default is "aether".'
    );
  }
  const { iosDeploymentKey, androidDeploymentKey, serverUrl } = candidate;
  if (typeof iosDeploymentKey !== 'string' || iosDeploymentKey.trim() === '') {
    throw new AetherPluginError('iosDeploymentKey must be a non-empty string.');
  }
  if (typeof androidDeploymentKey !== 'string' || androidDeploymentKey.trim() === '') {
    throw new AetherPluginError('androidDeploymentKey must be a non-empty string.');
  }
  if (serverUrl !== undefined && (typeof serverUrl !== 'string' || serverUrl.trim() === '')) {
    throw new AetherPluginError('serverUrl must be a non-empty string when provided.');
  }
  return { iosDeploymentKey, androidDeploymentKey, serverUrl };
}
