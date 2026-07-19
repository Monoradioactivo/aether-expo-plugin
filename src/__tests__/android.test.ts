import { readFileSync } from 'fs';
import { join } from 'path';

import { modifyAppBuildGradle, modifyMainApplication, setCodePushStrings } from '../android';

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const props = { iosDeploymentKey: 'ios-key', androidDeploymentKey: 'android-key' };

describe('setCodePushStrings', () => {
  it('writes the deployment key with moduleConfig', () => {
    const result = setCodePushStrings({ resources: {} }, props);
    expect(result.resources.string).toContainEqual({
      $: { name: 'CodePushDeploymentKey', moduleConfig: 'true' },
      _: 'android-key',
    });
  });

  it('writes the server URL when provided', () => {
    const result = setCodePushStrings({ resources: {} }, { ...props, serverUrl: 'https://staging.example.com' });
    expect(result.resources.string).toContainEqual({
      $: { name: 'CodePushServerUrl', moduleConfig: 'true' },
      _: 'https://staging.example.com',
    });
  });

  it('writes the public key when provided', () => {
    const pem = '-----BEGIN PUBLIC KEY-----\nabc\n-----END PUBLIC KEY-----';
    const result = setCodePushStrings({ resources: {} }, { ...props, publicKey: pem });
    expect(result.resources.string).toContainEqual({
      $: { name: 'CodePushPublicKey', moduleConfig: 'true' },
      _: pem,
    });
  });

  it('omits the server URL when absent', () => {
    const result = setCodePushStrings({ resources: {} }, props);
    const names = (result.resources.string ?? []).map((item) => item.$.name);
    expect(names).not.toContain('CodePushServerUrl');
  });
});

describe.each(['MainApplication-sdk53.kt', 'MainApplication-sdk54.kt'])(
  'modifyMainApplication on classic template %s',
  (name) => {
    const source = fixture(name);

    it('adds the CodePush import', () => {
      const result = modifyMainApplication(source);
      expect(result).toContain(
        'import com.facebook.react.PackageList\nimport com.microsoft.codepush.react.CodePush\n'
      );
    });

    it('adds the getJSBundleFile override after getJSMainModuleName', () => {
      const result = modifyMainApplication(source);
      expect(result).toContain(
        'override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"\n\n          override fun getJSBundleFile(): String = CodePush.getJSBundleFile()'
      );
    });

    it('is idempotent', () => {
      const once = modifyMainApplication(source);
      expect(modifyMainApplication(once)).toBe(once);
    });
  }
);

describe('modifyMainApplication on factory template MainApplication-sdk57.kt', () => {
  const source = fixture('MainApplication-sdk57.kt');

  it('adds the CodePush import', () => {
    const result = modifyMainApplication(source);
    expect(result).toContain(
      'import com.facebook.react.PackageList\nimport com.microsoft.codepush.react.CodePush\n'
    );
  });

  it('passes jsBundleFilePath after the package list argument', () => {
    const result = modifyMainApplication(source);
    expect(result).toContain('        },\n      jsBundleFilePath = CodePush.getJSBundleFile()\n    )');
    const packageListIndex = result.indexOf('PackageList(this).packages');
    const bundleArgIndex = result.indexOf('jsBundleFilePath = CodePush.getJSBundleFile()');
    expect(packageListIndex).toBeGreaterThan(-1);
    expect(bundleArgIndex).toBeGreaterThan(packageListIndex);
  });

  it('is idempotent', () => {
    const once = modifyMainApplication(source);
    expect(modifyMainApplication(once)).toBe(once);
  });

  it('throws when jsBundleFilePath is already set', () => {
    const conflicting = source.replace(
      'context = applicationContext,',
      'context = applicationContext,\n      jsBundleFilePath = "custom",'
    );
    expect(() => modifyMainApplication(conflicting)).toThrow(/already passes jsBundleFilePath/);
  });
});

describe('modifyAppBuildGradle', () => {
  const source = fixture('app-build.gradle-sdk57');

  it('appends the codepush.gradle apply line', () => {
    const result = modifyAppBuildGradle(source);
    expect(result.endsWith(
      '\napply from: "../../node_modules/@aetherpush/react-native-code-push/android/codepush.gradle"\n'
    )).toBe(true);
  });

  it('keeps the original contents intact', () => {
    const result = modifyAppBuildGradle(source);
    expect(result.startsWith(source)).toBe(true);
  });

  it('is idempotent', () => {
    const once = modifyAppBuildGradle(source);
    expect(modifyAppBuildGradle(once)).toBe(once);
  });
});

describe('modifyMainApplication on divergent sources', () => {
  it('throws on an unrecognized shape', () => {
    const source = 'package com.example\nimport com.facebook.react.PackageList\nclass MainApplication\n';
    expect(() => modifyMainApplication(source)).toThrow(/Unrecognized MainApplication.kt shape/);
  });

  it('throws when the import anchor is missing', () => {
    expect(() => modifyMainApplication('class MainApplication')).toThrow(/PackageList/);
  });
});
