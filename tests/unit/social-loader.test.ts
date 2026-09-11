import { expect, test, vi } from 'vitest';
import { retryableLoader, withTimeout } from '../../src/lib/social-loader';

test('shares script loading and retries after failure', async () => {
  const operation = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue('ready');
  const load = retryableLoader(operation);
  const first = load();
  expect(load()).toBe(first);
  await expect(first).rejects.toThrow('network');
  await expect(load()).resolves.toBe('ready');
  await expect(load()).resolves.toBe('ready');
  expect(operation).toHaveBeenCalledTimes(2);
});

test('a stalled embed times out', async () => {
  vi.useFakeTimers();
  const result = expect(withTimeout(new Promise(() => {}), 15000)).rejects.toThrow('タイムアウト');
  await vi.advanceTimersByTimeAsync(15000);
  await result;
  vi.useRealTimers();
});
