import {
  type ConfigPlugin,
  createRunOncePlugin,
  withAppBuildGradle,
  withAppDelegate,
  withInfoPlist,
  withMainApplication,
  withStringsXml,
} from 'expo/config-plugins';

import { modifyAppBuildGradle, modifyMainApplication, setCodePushStrings } from './android';
import { AetherPluginError } from './errors';
import { modifyAppDelegate, setCodePushInfoPlist } from './ios';
import { assertExpoUpdatesInactive } from './expoUpdates';
import { validateProps } from './props';
import type { AetherCodePushPluginProps } from './types';

const pkg: { name: string; version: string } = require('../package.json');

const withAetherCodePush: ConfigPlugin<AetherCodePushPluginProps> = (config, rawProps) => {
  const props = validateProps(rawProps);
  assertExpoUpdatesInactive(config._internal?.projectRoot, config.updates?.enabled);

  config = withInfoPlist(config, (c) => {
    c.modResults = setCodePushInfoPlist(c.modResults, props);
    return c;
  });

  config = withAppDelegate(config, (c) => {
    if (c.modResults.language !== 'swift') {
      throw new AetherPluginError(
        `Expected a Swift AppDelegate but found ${c.modResults.language}. This plugin supports Expo SDK 53 and newer; for older projects integrate @aetherpush/react-native-code-push manually.`
      );
    }
    c.modResults.contents = modifyAppDelegate(c.modResults.contents);
    return c;
  });

  config = withStringsXml(config, (c) => {
    c.modResults = setCodePushStrings(c.modResults, props);
    return c;
  });

  config = withAppBuildGradle(config, (c) => {
    if (c.modResults.language !== 'groovy') {
      throw new AetherPluginError(
        `Expected a Groovy app/build.gradle but found ${c.modResults.language}. Apply codepush.gradle from @aetherpush/react-native-code-push manually.`
      );
    }
    c.modResults.contents = modifyAppBuildGradle(c.modResults.contents);
    return c;
  });

  config = withMainApplication(config, (c) => {
    if (c.modResults.language !== 'kt') {
      throw new AetherPluginError(
        `Expected a Kotlin MainApplication but found ${c.modResults.language}. This plugin supports Expo SDK 53 and newer; for older projects integrate @aetherpush/react-native-code-push manually.`
      );
    }
    c.modResults.contents = modifyMainApplication(c.modResults.contents);
    return c;
  });

  return config;
};

export default createRunOncePlugin(withAetherCodePush, pkg.name, pkg.version);
export type { AetherCodePushPluginProps };
