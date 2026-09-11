import { expect, test, vi } from 'vitest';
import { createSerialQueue, retryableLoader, withTimeout } from '../../src/lib/social-loader';

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

test('serializes timeline work and continues after a failure', async () => {
  const queue = createSerialQueue();
  let releaseFirst: (() => void) | undefined;
  const first = vi.fn(() => new Promise<void>((resolve) => { releaseFirst = resolve; }));
  const second = vi.fn().mockRejectedValue(new Error('429'));
  const third = vi.fn().mockResolvedValue('ready');

  const firstResult = queue(first);
  const secondResult = queue(second);
  const thirdResult = queue(third);
  await Promise.resolve();
  expect(first).toHaveBeenCalledOnce();
  expect(second).not.toHaveBeenCalled();

  releaseFirst?.();
  await firstResult;
  await expect(secondResult).rejects.toThrow('429');
  await expect(thirdResult).resolves.toBe('ready');
  expect(second).toHaveBeenCalledOnce();
  expect(third).toHaveBeenCalledOnce();
});
