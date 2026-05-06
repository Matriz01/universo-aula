import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { silenceThreeDeprecations } from '@/shims/silenceThreeDeprecations';

describe('silenceThreeDeprecations', () => {
  let originalWarn: typeof console.warn;

  beforeEach(() => {
    originalWarn = console.warn;
  });

  afterEach(() => {
    console.warn = originalWarn;
  });

  it('silencia el warning de THREE.Clock deprecation', () => {
    const spy = vi.fn();
    console.warn = spy;
    silenceThreeDeprecations();

    console.warn('THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.');

    expect(spy).not.toHaveBeenCalled();
  });

  it('NO silencia warnings ajenos', () => {
    const spy = vi.fn();
    console.warn = spy;
    silenceThreeDeprecations();

    console.warn('Some unrelated warning');
    console.warn('Another warning with arg', 42);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, 'Some unrelated warning');
    expect(spy).toHaveBeenNthCalledWith(2, 'Another warning with arg', 42);
  });

  it('no rompe si console.warn recibe argumentos no-string', () => {
    const spy = vi.fn();
    console.warn = spy;
    silenceThreeDeprecations();

    console.warn({ obj: 'value' });
    console.warn(123);
    console.warn(null);

    expect(spy).toHaveBeenCalledTimes(3);
  });
});
