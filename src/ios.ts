import type { InfoPlist } from 'expo/config-plugins';

import { AetherPluginError } from './errors';
import type { AetherCodePushPluginProps } from './types';

const DEPLOYMENT_KEY_PLIST_KEY = 'CodePushDeploymentKey';
const SERVER_URL_PLIST_KEY = 'CodePushServerURL';

const IMPORT_ANCHOR = 'import React\n';
const CODEPUSH_IMPORT = 'import CodePush';
const RELEASE_BUNDLE_URL = 'return Bundle.main.url(forResource: "main", withExtension: "jsbundle")';
const CODEPUSH_BUNDLE_URL = 'return CodePush.bundleURL()';

export function setCodePushInfoPlist(
  infoPlist: InfoPlist,
  props: AetherCodePushPluginProps
): InfoPlist {
  const next: InfoPlist = { ...infoPlist, [DEPLOYMENT_KEY_PLIST_KEY]: props.iosDeploymentKey };
  if (props.serverUrl !== undefined) {
    next[SERVER_URL_PLIST_KEY] = props.serverUrl;
  }
  return next;
}

export function modifyAppDelegate(contents: string): string {
  let next = contents;
  if (!next.includes(CODEPUSH_IMPORT + '\n')) {
    if (!next.includes(IMPORT_ANCHOR)) {
      throw new AetherPluginError(
        'Could not find the "import React" line in AppDelegate.swift. Your AppDelegate diverges from the Expo template; add "import CodePush" and return CodePush.bundleURL() from bundleURL() manually.'
      );
    }
    next = next.replace(IMPORT_ANCHOR, `${IMPORT_ANCHOR}${CODEPUSH_IMPORT}\n`);
  }
  if (!next.includes(CODEPUSH_BUNDLE_URL)) {
    if (!next.includes(RELEASE_BUNDLE_URL)) {
      throw new AetherPluginError(
        'Could not find the release bundle URL line in AppDelegate.swift. Your AppDelegate diverges from the Expo template; make bundleURL() return CodePush.bundleURL() in release builds manually.'
      );
    }
    next = next.replace(RELEASE_BUNDLE_URL, CODEPUSH_BUNDLE_URL);
  }
  return next;
}
