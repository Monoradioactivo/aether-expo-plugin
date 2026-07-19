import { readFileSync } from 'fs';
import { join } from 'path';

import { modifyAppDelegate, setCodePushInfoPlist } from '../ios';

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8');
const props = { iosDeploymentKey: 'ios-key', androidDeploymentKey: 'android-key' };

describe('setCodePushInfoPlist', () => {
  it('writes the deployment key', () => {
    const result = setCodePushInfoPlist({}, props);
    expect(result.CodePushDeploymentKey).toBe('ios-key');
    expect(result.CodePushServerURL).toBeUndefined();
  });

  it('writes the server URL when provided', () => {
    const result = setCodePushInfoPlist({}, { ...props, serverUrl: 'https://staging.example.com' });
    expect(result.CodePushServerURL).toBe('https://staging.example.com');
  });

  it('preserves existing entries', () => {
    const result = setCodePushInfoPlist({ CFBundleName: 'App' }, props);
    expect(result.CFBundleName).toBe('App');
  });
});

describe.each(['AppDelegate-sdk53.swift', 'AppDelegate-sdk57.swift'])(
  'modifyAppDelegate on %s',
  (name) => {
    const source = fixture(name);

    it('adds the CodePush import after import React', () => {
      const result = modifyAppDelegate(source);
      expect(result).toContain('import React\nimport CodePush\n');
    });

    it('swaps the release bundle URL for CodePush.bundleURL()', () => {
      const result = modifyAppDelegate(source);
      expect(result).toContain('return CodePush.bundleURL()');
      expect(result).not.toContain('return Bundle.main.url(forResource: "main", withExtension: "jsbundle")');
    });

    it('keeps the debug branch pointing at Metro', () => {
      const result = modifyAppDelegate(source);
      expect(result).toContain(
        'RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")'
      );
    });

    it('is idempotent', () => {
      const once = modifyAppDelegate(source);
      expect(modifyAppDelegate(once)).toBe(once);
    });
  }
);

describe('modifyAppDelegate on divergent sources', () => {
  it('throws when the import anchor is missing', () => {
    expect(() => modifyAppDelegate('class AppDelegate {}')).toThrow(/import React/);
  });

  it('throws when the release bundle URL line is missing', () => {
    const source = 'import React\nclass ReactNativeDelegate {}\n';
    expect(() => modifyAppDelegate(source)).toThrow(/release bundle URL/);
  });
});
