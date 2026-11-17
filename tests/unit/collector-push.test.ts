import { mkdtempSync, writeFileSync, chmodSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
function run(overrides: Record<string, string | undefined> = {}, reject = false) {
  const dir = mkdtempSync(join(tmpdir(), 'collector-push-'));
  dirs.push(dir);
  const log = join(dir, 'git.log');
  const git = join(dir, 'git');
  writeFileSync(git, '#!/bin/sh\nprintf "%s\\n" "$@" > "$TEST_GIT_LOG"\nexit "${TEST_GIT_EXIT:-0}"\n');
  chmodSync(git, 0o700);
  const result = spawnSync('bash', [resolve('scripts/push-collector.sh')], {
    encoding: 'utf8', env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, TEST_GIT_LOG: log,
      TEST_GIT_EXIT: reject ? '1' : '0', GITHUB_REF: 'refs/heads/main',
      GITHUB_REPOSITORY: 'mentamaru/mizuho-maru-un-official-fun-site', COLLECTOR_TOKEN: 'test-sensitive-token', ...overrides }
  });
  let args = '';
  try { args = readFileSync(log, 'utf8'); } catch { /* git must not run on invalid inputs */ }
  return { ...result, args };
}
describe('collector push credential boundary', () => {
  it('pushes only main without credentials in argv or output', () => {
    const result = run();
    expect(result.status).toBe(0);
    expect(result.args).toContain('HEAD:refs/heads/main');
    expect(result.args).not.toContain('--force');
    expect(result.args + result.stdout + result.stderr).not.toContain('test-sensitive-token');
    expect(result.args).toContain('credential.helper=');
  });
  it.each([
    { GITHUB_REF: 'refs/pull/1/merge' }, { GITHUB_REF: 'refs/heads/test' },
    { GITHUB_REPOSITORY: 'other/repo' }, { COLLECTOR_TOKEN: '' }
  ])('rejects unsafe context before invoking git: %j', overrides => {
    const result = run(overrides);
    expect(result.status).not.toBe(0);
    expect(result.args).toBe('');
  });
  it('propagates push rejection without a fallback', () => {
    expect(run({}, true).status).not.toBe(0);
  });
});
