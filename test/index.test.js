'use strict';

const { create, merge, kwayMerge, nsmallest, nlargest, minHeap, maxHeap } = require('../src/index.cjs');
const { test } = require('node:test');
const assert = require('node:assert');

// ─── Basic Operations ───

test('push and pop maintain order (min-heap)', () => {
  const pq = create();
  [5, 3, 8, 1, 9, 2, 7, 4, 6].forEach(v => pq.push(v));
  const result = [];
  while (!pq.isEmpty()) result.push(pq.pop());
  assert.deepStrictEqual(result, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('max-heap pops largest first', () => {
  const pq = create(maxHeap);
  [5, 3, 8, 1, 9, 2].forEach(v => pq.push(v));
  const result = [];
  while (!pq.isEmpty()) result.push(pq.pop());
  assert.deepStrictEqual(result, [9, 8, 5, 3, 2, 1]);
});

test('peek returns top without removing', () => {
  const pq = create();
  [5, 3, 8, 1].forEach(v => pq.push(v));
  assert.strictEqual(pq.peek(), 1);
  assert.strictEqual(pq.size, 4);
  assert.strictEqual(pq.peek(), 1);
});

test('pop on empty returns undefined', () => {
  const pq = create();
  assert.strictEqual(pq.pop(), undefined);
  assert.strictEqual(pq.peek(), undefined);
});

test('isEmpty and size', () => {
  const pq = create();
  assert.strictEqual(pq.isEmpty(), true);
  assert.strictEqual(pq.size, 0);
  pq.push(42);
  assert.strictEqual(pq.isEmpty(), false);
  assert.strictEqual(pq.size, 1);
  pq.pop();
  assert.strictEqual(pq.isEmpty(), true);
});

test('clear removes all elements', () => {
  const pq = create();
  [1, 2, 3].forEach(v => pq.push(v));
  pq.clear();
  assert.strictEqual(pq.size, 0);
  assert.strictEqual(pq.isEmpty(), true);
});

// ─── Initial Items ───

test('heapify from initial items in O(N)', () => {
  const pq = create(undefined, [9, 7, 5, 3, 1, 8, 6, 4, 2]);
  assert.strictEqual(pq.peek(), 1);
  const result = [];
  while (!pq.isEmpty()) result.push(pq.pop());
  assert.deepStrictEqual(result, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('empty initial items', () => {
  const pq = create(undefined, []);
  assert.strictEqual(pq.size, 0);
});

// ─── Custom Comparator ───

test('custom comparator for objects', () => {
  const pq = create((a, b) => a.priority - b.priority);
  pq.push({ name: 'A', priority: 3 });
  pq.push({ name: 'B', priority: 1 });
  pq.push({ name: 'C', priority: 2 });
  assert.strictEqual(pq.pop().name, 'B');
  assert.strictEqual(pq.pop().name, 'C');
  assert.strictEqual(pq.pop().name, 'A');
});

test('string comparator', () => {
  const pq = create((a, b) => a.localeCompare(b));
  ['cherry', 'apple', 'banana', 'date'].forEach(v => pq.push(v));
  assert.strictEqual(pq.pop(), 'apple');
  assert.strictEqual(pq.pop(), 'banana');
  assert.strictEqual(pq.pop(), 'cherry');
  assert.strictEqual(pq.pop(), 'date');
});

// ─── toArray ───

test('toArray returns sorted without modifying heap', () => {
  const pq = create();
  [5, 3, 8, 1, 9, 2].forEach(v => pq.push(v));
  assert.deepStrictEqual(pq.toArray(), [1, 2, 3, 5, 8, 9]);
  assert.strictEqual(pq.size, 6);
  assert.strictEqual(pq.peek(), 1);
});

// ─── Serialization ───

test('toJSON / fromJSON round-trip', () => {
  const pq = create();
  [5, 3, 8, 1, 9, 2].forEach(v => pq.push(v));
  const json = pq.toJSON();
  assert.ok(Array.isArray(json));
  assert.strictEqual(json.length, 6);
  const pq2 = create();
  pq2.fromJSON(json);
  assert.strictEqual(pq2.size, 6);
  assert.strictEqual(pq2.peek(), 1);
  const result = [];
  while (!pq2.isEmpty()) result.push(pq2.pop());
  assert.deepStrictEqual(result, [1, 2, 3, 5, 8, 9]);
});

// ─── updateAt ───

test('updateAt restores heap property after priority change', () => {
  const items = [{ id: 1, val: 10 }, { id: 2, val: 20 }, { id: 3, val: 30 }];
  const pq = create((a, b) => a.val - b.val, items);
  // Lower id:3's val from 30 to 5
  const raw = pq._raw();
  const idx3 = raw.findIndex(x => x.id === 3);
  raw[idx3].val = 5;
  pq.updateAt(idx3);
  assert.strictEqual(pq.peek().id, 3);
  assert.strictEqual(pq.pop().val, 5);
});

test('updateAt throws on invalid index', () => {
  const pq = create();
  pq.push(1);
  assert.throws(() => pq.updateAt(-1), RangeError);
  assert.throws(() => pq.updateAt(1), RangeError);
});

// ─── removeAt ───

test('removeAt removes and restores heap property', () => {
  const pq = create();
  [5, 3, 8, 1, 9, 2, 7, 4, 6].forEach(v => pq.push(v));
  const raw = pq._raw();
  // Find value 5 and remove it
  const idx5 = raw.indexOf(5);
  const removed = pq.removeAt(idx5);
  assert.strictEqual(removed, 5);
  assert.strictEqual(pq.size, 8);
  const result = [];
  while (!pq.isEmpty()) result.push(pq.pop());
  assert.deepStrictEqual(result, [1, 2, 3, 4, 6, 7, 8, 9]);
});

test('removeAt throws on invalid index', () => {
  const pq = create();
  assert.throws(() => pq.removeAt(0), RangeError);
});

// ─── merge ───

test('merge combines multiple priority queues', () => {
  const pq1 = create(undefined, [1, 3, 5]);
  const pq2 = create(undefined, [2, 4, 6]);
  const pq3 = create(undefined, [0, 7, 8]);
  const merged = merge([pq1, pq2, pq3]);
  const result = [];
  while (!merged.isEmpty()) result.push(merged.pop());
  assert.deepStrictEqual(result, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
});

test('merge with empty queues', () => {
  const pq1 = create();
  const pq2 = create(undefined, [1, 2]);
  const merged = merge([pq1, pq2]);
  assert.strictEqual(merged.size, 2);
});

// ─── kwayMerge ───

test('kwayMerge merges sorted arrays', () => {
  const arrs = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];
  assert.deepStrictEqual(kwayMerge(arrs), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('kwayMerge with empty arrays', () => {
  const arrs = [[], [1, 3], [], [2], []];
  assert.deepStrictEqual(kwayMerge(arrs), [1, 2, 3]);
});

test('kwayMerge single array', () => {
  assert.deepStrictEqual(kwayMerge([[1, 2, 3]]), [1, 2, 3]);
});

test('kwayMerge all empty', () => {
  assert.deepStrictEqual(kwayMerge([[], [], []]), []);
});

test('kwayMerge with duplicates', () => {
  const arrs = [[1, 1, 2], [1, 2, 3]];
  assert.deepStrictEqual(kwayMerge(arrs), [1, 1, 1, 2, 2, 3]);
});

// ─── nsmallest / nlargest ───

test('nsmallest returns K smallest', () => {
  assert.deepStrictEqual(nsmallest([5, 3, 8, 1, 9, 2, 7, 4, 6], 3), [1, 2, 3]);
});

test('nsmallest k >= length returns sorted', () => {
  assert.deepStrictEqual(nsmallest([3, 1, 2], 5), [1, 2, 3]);
});

test('nsmallest k=0 returns empty', () => {
  assert.deepStrictEqual(nsmallest([1, 2, 3], 0), []);
});

test('nlargest returns K largest', () => {
  assert.deepStrictEqual(nlargest([5, 3, 8, 1, 9, 2, 7, 4, 6], 3), [9, 8, 7]);
});

test('nlargest with objects', () => {
  const items = [{ v: 5 }, { v: 3 }, { v: 8 }, { v: 1 }];
  const top = nlargest(items, 2, (a, b) => a.v - b.v);
  assert.deepStrictEqual(top, [{ v: 8 }, { v: 5 }]);
});

// ─── Stress / Edge Cases ───

test('handles duplicate values', () => {
  const pq = create();
  [3, 3, 1, 1, 2, 2].forEach(v => pq.push(v));
  const result = [];
  while (!pq.isEmpty()) result.push(pq.pop());
  assert.deepStrictEqual(result, [1, 1, 2, 2, 3, 3]);
});

test('single element', () => {
  const pq = create();
  pq.push(42);
  assert.strictEqual(pq.pop(), 42);
  assert.strictEqual(pq.isEmpty(), true);
});

test('two elements', () => {
  const pq = create();
  pq.push(2);
  pq.push(1);
  assert.strictEqual(pq.pop(), 1);
  assert.strictEqual(pq.pop(), 2);
});

test('large number of elements preserves sorted order', () => {
  const N = 10000;
  const input = Array.from({ length: N }, () => Math.floor(Math.random() * 100000));
  const pq = create(undefined, input);
  const result = [];
  while (!pq.isEmpty()) result.push(pq.pop());
  const expected = [...input].sort((a, b) => a - b);
  assert.deepStrictEqual(result, expected);
});

test('push after pop works correctly', () => {
  const pq = create();
  [5, 3, 8].forEach(v => pq.push(v));
  pq.pop(); // 3
  pq.push(1);
  pq.push(7);
  const result = [];
  while (!pq.isEmpty()) result.push(pq.pop());
  assert.deepStrictEqual(result, [1, 5, 7, 8]);
});

test('interleaved push and pop', () => {
  const pq = create();
  pq.push(5);
  pq.push(3);
  assert.strictEqual(pq.pop(), 3);
  pq.push(1);
  pq.push(8);
  assert.strictEqual(pq.pop(), 1);
  pq.push(2);
  assert.strictEqual(pq.pop(), 2);
  assert.strictEqual(pq.pop(), 5);
  assert.strictEqual(pq.pop(), 8);
});

test('minHeap and maxHeap are proper comparators', () => {
  assert.strictEqual(minHeap(1, 2), -1);
  assert.strictEqual(minHeap(2, 1), 1);
  assert.strictEqual(minHeap(1, 1), 0);
  assert.strictEqual(maxHeap(1, 2), 1);
  assert.strictEqual(maxHeap(2, 1), -1);
  assert.strictEqual(maxHeap(1, 1), 0);
});

test('heap with negative numbers', () => {
  const pq = create();
  [-5, 3, -8, 0, -1, 7].forEach(v => pq.push(v));
  const result = [];
  while (!pq.isEmpty()) result.push(pq.pop());
  assert.deepStrictEqual(result, [-8, -5, -1, 0, 3, 7]);
});

test('toArray on empty heap', () => {
  const pq = create();
  assert.deepStrictEqual(pq.toArray(), []);
});

test('toJSON on empty heap', () => {
  const pq = create();
  assert.deepStrictEqual(pq.toJSON(), []);
});

test('fromJSON overwrites existing heap', () => {
  const pq = create(undefined, [10, 20, 30]);
  pq.fromJSON([3, 1, 2]);
  assert.strictEqual(pq.peek(), 1);
  assert.strictEqual(pq.size, 3);
});

test('nlargest k=0 returns empty', () => {
  assert.deepStrictEqual(nlargest([1, 2, 3], 0), []);
});

test('nlargest k >= length returns all sorted desc', () => {
  assert.deepStrictEqual(nlargest([1, 3, 2], 5), [3, 2, 1]);
});
