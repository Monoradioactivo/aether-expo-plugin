import { validateProps } from '../props';

const valid = { iosDeploymentKey: 'ios-key', androidDeploymentKey: 'android-key' };

describe('validateProps', () => {
  it('accepts minimal valid props', () => {
    expect(validateProps(valid)).toEqual({ ...valid, serverUrl: undefined });
  });

  it('accepts an optional server URL', () => {
    const props = { ...valid, serverUrl: 'https://staging.example.com' };
    expect(validateProps(props)).toEqual(props);
  });

  it('rejects missing props', () => {
    expect(() => validateProps(undefined)).toThrow(/props are required/);
  });

  it('rejects a missing iOS deployment key', () => {
    expect(() => validateProps({ androidDeploymentKey: 'android-key' })).toThrow(/iosDeploymentKey/);
  });

  it('rejects a missing Android deployment key', () => {
    expect(() => validateProps({ iosDeploymentKey: 'ios-key' })).toThrow(/androidDeploymentKey/);
  });

  it('rejects an empty server URL', () => {
    expect(() => validateProps({ ...valid, serverUrl: ' ' })).toThrow(/serverUrl/);
  });

  it('rejects serverPathMode with a pointer to the JS option', () => {
    expect(() => validateProps({ ...valid, serverPathMode: 'aether' })).toThrow(/codePush\(\{ serverPathMode/);
  });
});
