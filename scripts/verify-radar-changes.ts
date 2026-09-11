import { execFileSync } from 'node:child_process';

const month = process.env.RADAR_MONTH;
if (!month || !/^\d{4}-\d{2}$/u.test(month)) throw new Error('RADAR_MONTH must be YYYY-MM.');
const allowed = `data/radar/${month}.json`;
const changed = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACDMRT', 'HEAD'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const invalid = [...new Set([...changed, ...untracked])].filter(path => path !== allowed);
if (invalid.length > 0) throw new Error(`Radar workflow may only change ${allowed}; found: ${invalid.join(', ')}`);
