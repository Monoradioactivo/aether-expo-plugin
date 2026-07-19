import { mkdtempSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { assertExpoUpdatesInactive } from '../expoUpdates';

function makeProject(withExpoUpdates: boolean): string {
  const root = mkdtempSync(join(tmpdir(), 'aether-plugin-test-'));
  if (withExpoUpdates) {
    const pkgDir = join(root, 'node_modules', 'expo-updates');
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({ name: 'expo-updates', version: '1.0.0' }));
  }
  return root;
}

describe('assertExpoUpdatesInactive', () => {
  it('passes when expo-updates is not installed', () => {
    expect(() => assertExpoUpdatesInactive(makeProject(false), undefined)).not.toThrow();
  });

  it('throws when expo-updates is installed and not disabled', () => {
    expect(() => assertExpoUpdatesInactive(makeProject(true), undefined)).toThrow(/expo-updates is installed/);
  });

  it('passes when expo-updates is installed but disabled', () => {
    expect(() => assertExpoUpdatesInactive(makeProject(true), false)).not.toThrow();
  });

  it('skips the check without a project root', () => {
    expect(() => assertExpoUpdatesInactive(undefined, undefined)).not.toThrow();
  });
});
