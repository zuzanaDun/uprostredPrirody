import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../lib/album.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const context = { exports: {}, Intl, Date, Math };
vm.runInNewContext(compiled, context);
const { estateYears, estateDuration, albumColumns, albumPeriod } = context.exports;

assert.equal(estateYears(new Date('2026-08-05T12:00:00Z')), 8);
assert.equal(estateYears(new Date('2026-08-06T12:00:00Z')), 9);
assert.equal(estateYears(new Date('2026-08-05T21:59:59Z')), 8);
assert.equal(estateYears(new Date('2026-08-05T22:00:00Z')), 9);
assert.equal(estateDuration(new Date('2018-08-06T12:00:00Z')), '1 rok');
assert.equal(estateDuration(new Date('2019-08-06T12:00:00Z')), '2 roky');
assert.equal(estateDuration(new Date('2021-08-06T12:00:00Z')), '4 roky');
assert.equal(estateDuration(new Date('2026-08-06T12:00:00Z')), '9 rokov');
assert.equal(albumPeriod({ date: '2014-01-01', datePrecision: 'year' }), '2014');
assert.equal(albumPeriod({ date: '2024-05-24' }), 'máj 2024');
assert.deepEqual([0, 1, 2].map(zoom => albumColumns(390, zoom)), [4, 2, 1]);
assert.deepEqual([0, 1, 2].map(zoom => albumColumns(1199, zoom)), [8, 4, 3]);
for (const width of [0, 320, 640, 800, 1199]) {
  for (const zoom of [0, 1, 2]) assert.ok(albumColumns(width, zoom) >= 1);
}
console.log('Album tests passed: anniversary, Bratislava midnight, Slovak plurals, year precision, responsive columns.');
