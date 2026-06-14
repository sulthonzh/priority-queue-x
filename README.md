# priority-queue-x

Zero-dependency binary heap priority queue for Node.js.

Min-heap by default, max-heap ready. Supports custom comparators, in-place priority updates, element removal, queue merging, k-way merge of sorted arrays, and `nsmallest`/`nlargest` selection.

## Install

```bash
npm install priority-queue-x
```

## Quick Start

```js
const { create, maxHeap } = require('priority-queue-x');

// Min-heap (default)
const pq = create();
pq.push(5);
pq.push(1);
pq.push(3);
pq.peek();  // 1
pq.pop();   // 1
pq.pop();   // 3
pq.pop();   // 5

// Max-heap
const max = create(maxHeap, [3, 1, 4, 1, 5, 9, 2, 6]);
max.pop();  // 9
max.pop();  // 6
max.pop();  // 5
```

## API

### `create(compare?, items?)`

Create a priority queue. Returns an object with:

| Method | Complexity | Description |
|--------|-----------|-------------|
| `push(value)` | O(log N) | Add a value |
| `pop()` | O(log N) | Remove and return top-priority element |
| `peek()` | O(1) | Look at top without removing |
| `size` | O(1) | Number of elements |
| `isEmpty()` | O(1) | True if empty |
| `clear()` | O(1) | Remove all |
| `toArray()` | O(N log N) | Sorted array (heap unchanged) |
| `updateAt(index)` | O(log N) | Fix heap after changing an element's priority |
| `removeAt(index)` | O(log N) | Remove element at index |
| `toJSON()` | O(N) | Serialize to array |
| `fromJSON(arr)` | O(N) | Restore from array |

### `merge(queues, compare?)`

Merge multiple priority queues into one. O(N) where N = total elements.

### `kwayMerge(arrays, compare?)`

Merge K sorted arrays into one sorted array in O(N log K).

```js
const { kwayMerge } = require('priority-queue-x');

const sorted = kwayMerge([
  [1, 4, 7],
  [2, 5, 8],
  [3, 6, 9],
]);
// [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

### `nsmallest(iterable, k, compare?)`

K smallest elements, sorted ascending. O(N + K log N).

### `nlargest(iterable, k, compare?)`

K largest elements, sorted descending. O(N + K log N).

```js
const { nsmallest, nlargest } = require('priority-queue-x');

nsmallest([5, 3, 8, 1, 9, 2, 7, 4, 6], 3);  // [1, 2, 3]
nlargest([5, 3, 8, 1, 9, 2, 7, 4, 6], 3);   // [9, 8, 7]
```

### Comparators

- `minHeap` — default, smaller = higher priority
- `maxHeap` — larger = higher priority
- Any `(a, b) => number` works

```js
const pq = create((a, b) => a.priority - b.priority);
```

## CLI

```bash
# Pop 3 smallest from stdin
echo "5 3 8 1 9 2 7 4 6" | pq pop 3 --numbers
# 1
# 2
# 3

# 3 largest from args
pq nlargest 3 5 3 8 1 9 2 7 4 6
# 9
# 8
# 7

# K-way merge of JSON arrays
echo "[1,4,7]" > a.json
echo "[2,5,8]" > b.json
pq kway a.json b.json --json
# [1,2,4,5,7,8]
```

## Why?

Binary heaps are the go-to for priority queues — simple, cache-friendly, and O(log N) for insert/extract. This lib gives you the core heap operations plus practical utilities like k-way merge (great for merging sorted streams) and top-K selection.

Zero dependencies. Works in Node 18+.

## License

MIT
