import { AndroidConfig } from 'expo/config-plugins';

import { AetherPluginError } from './errors';
import type { AetherCodePushPluginProps } from './types';

type ResourceXML = AndroidConfig.Resources.ResourceXML;
type ResourceItemXML = AndroidConfig.Resources.ResourceItemXML;

const DEPLOYMENT_KEY_RESOURCE = 'CodePushDeploymentKey';
const SERVER_URL_RESOURCE = 'CodePushServerUrl';

const CODEPUSH_IMPORT = 'import com.microsoft.codepush.react.CodePush';
const IMPORT_ANCHOR = 'import com.facebook.react.PackageList\n';
const CODEPUSH_BUNDLE_CALL = 'CodePush.getJSBundleFile()';

const CLASSIC_MARKER = 'DefaultReactNativeHost';
const CLASSIC_ANCHOR = 'override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"';
const CLASSIC_OVERRIDE = '          override fun getJSBundleFile(): String = CodePush.getJSBundleFile()';

const FACTORY_MARKER = 'ExpoReactHostFactory.getDefaultReactHost(';
const FACTORY_ANCHOR = '\n        }\n    )';
const FACTORY_REPLACEMENT = '\n        },\n      jsBundleFilePath = CodePush.getJSBundleFile()\n    )';

function moduleConfigString(name: string, value: string): ResourceItemXML {
  return { $: { name, moduleConfig: 'true' }, _: value } as unknown as ResourceItemXML;
}

export function setCodePushStrings(
  resources: ResourceXML,
  props: AetherCodePushPluginProps
): ResourceXML {
  const items = [moduleConfigString(DEPLOYMENT_KEY_RESOURCE, props.androidDeploymentKey)];
  if (props.serverUrl !== undefined) {
    items.push(moduleConfigString(SERVER_URL_RESOURCE, props.serverUrl));
  }
  return AndroidConfig.Strings.setStringItem(items, resources);
}

export function modifyMainApplication(contents: string): string {
  let next = contents;
  if (!next.includes(CODEPUSH_IMPORT + '\n')) {
    if (!next.includes(IMPORT_ANCHOR)) {
      throw new AetherPluginError(
        'Could not find the "import com.facebook.react.PackageList" line in MainApplication.kt. Your MainApplication diverges from the Expo template; wire CodePush.getJSBundleFile() manually.'
      );
    }
    next = next.replace(IMPORT_ANCHOR, `${IMPORT_ANCHOR}${CODEPUSH_IMPORT}\n`);
  }
  if (next.includes(CODEPUSH_BUNDLE_CALL)) {
    return next;
  }
  if (next.includes(FACTORY_MARKER)) {
    return injectFactory(next);
  }
  if (next.includes(CLASSIC_MARKER)) {
    return injectClassic(next);
  }
  throw new AetherPluginError(
    'Unrecognized MainApplication.kt shape: found neither ExpoReactHostFactory.getDefaultReactHost nor DefaultReactNativeHost. This plugin supports Expo SDK 53 and newer; wire CodePush.getJSBundleFile() manually.'
  );
}

function injectFactory(contents: string): string {
  if (contents.includes('jsBundleFilePath')) {
    throw new AetherPluginError(
      'MainApplication.kt already passes jsBundleFilePath to getDefaultReactHost. Remove it or set it to CodePush.getJSBundleFile() manually.'
    );
  }
  if (!contents.includes(FACTORY_ANCHOR)) {
    throw new AetherPluginError(
      'Could not find the closing of the getDefaultReactHost call in MainApplication.kt. Your MainApplication diverges from the Expo template; add jsBundleFilePath = CodePush.getJSBundleFile() as the last argument manually.'
    );
  }
  return contents.replace(FACTORY_ANCHOR, FACTORY_REPLACEMENT);
}

function injectClassic(contents: string): string {
  if (!contents.includes(CLASSIC_ANCHOR)) {
    throw new AetherPluginError(
      'Could not find the getJSMainModuleName override in MainApplication.kt. Your MainApplication diverges from the Expo template; add an override fun getJSBundleFile(): String = CodePush.getJSBundleFile() to your DefaultReactNativeHost manually.'
    );
  }
  return contents.replace(CLASSIC_ANCHOR, `${CLASSIC_ANCHOR}\n\n${CLASSIC_OVERRIDE}`);
}
