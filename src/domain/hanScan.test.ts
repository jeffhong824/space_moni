import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const HAN = /[\u3400-\u9fff]/;

describe('no Han literals outside locale JSON', () => {
  it('src ts/tsx (except tests) contain no Han characters', () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), '..');
    const files = walk(root).filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes(`${join('i18n', 'locales')}`) && !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'));
    const hits: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      const lines = src.split('\n');
      lines.forEach((line, i) => {
        if (HAN.test(line)) hits.push(`${file}:${i + 1}: ${line.trim().slice(0, 120)}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
