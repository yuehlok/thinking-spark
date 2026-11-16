import test from 'node:test';
import assert from 'node:assert/strict';
import { starPath } from '../src/thinking-spark.js';

test('starPath returns a closed, finite path', () => {
  const d = starPath({ rays: 11, seed: 7 });
  assert.match(d, /^M[\d.\- ]+(L[\d.\- ]+)+Z$/);
  assert.ok(d.length > 50);
});

test('starPath is deterministic for a seed', () => {
  assert.equal(starPath({ seed: 3 }), starPath({ seed: 3 }));
  assert.notEqual(starPath({ seed: 3 }), starPath({ seed: 4 }));
});

test('ray count controls the number of points', () => {
  const points = (d) => d.split('L').length;
  assert.equal(points(starPath({ rays: 5 })), 10);
  assert.equal(points(starPath({ rays: 12 })), 24);
});
