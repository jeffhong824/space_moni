import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const FORBIDDEN = [
  '\u9700\u6ce8\u610f',
  'NOMINAL',
  'ABNORMAL TACHYCARDIA',
  '{day.status}',
];

describe('health status vocabulary in UI', () => {
  it('does not render English/legacy status words to users', () => {
    const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
    const files = walk(srcRoot).filter((f) => f.endsWith('.tsx'));
    const hits: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      for (const needle of FORBIDDEN) {
        if (src.includes(needle)) hits.push(`${file}: ${needle}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
