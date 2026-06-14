'use strict';

/**
 * priority-queue-x — Zero-dep binary heap priority queue.
 *
 * Min-heap by default. Pass a custom comparator for max-heap or custom ordering.
 * All operations are O(log N) except peek/size which are O(1).
 */

/** Default: min-heap (smaller values have higher priority). */
const defaultCompare = (a, b) => {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

/**
 * Create a PriorityQueue.
 * @param {function(a:*, b:*):number} [compare] — Comparator (default: min-heap).
 * @param {Iterable<*>} [items] — Initial items (heapified in O(N)).
 */
function create(compare = defaultCompare, items) {
  const heap = [];
  const cmp = compare;

  /** Swap two indices. */
  function swap(i, j) {
    const tmp = heap[i];
    heap[i] = heap[j];
    heap[j] = tmp;
  }

  /** Sift up from index i. */
  function siftUp(i) {
    while (i > 0) {
      const parent = (i - 1) >>> 1;
      if (cmp(heap[i], heap[parent]) < 0) {
        swap(i, parent);
        i = parent;
      } else break;
    }
  }

  /** Sift down from index i. */
  function siftDown(i) {
    const n = heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && cmp(heap[left], heap[smallest]) < 0) smallest = left;
      if (right < n && cmp(heap[right], heap[smallest]) < 0) smallest = right;
      if (smallest !== i) {
        swap(i, smallest);
        i = smallest;
      } else break;
    }
  }

  /** Build heap in O(N) from existing array. */
  function heapify() {
    for (let i = (heap.length >>> 1) - 1; i >= 0; i--) siftDown(i);
  }

  if (items) {
    for (const item of items) heap.push(item);
    heapify();
  }

  return {
    /** Current number of elements. */
    get size() { return heap.length; },
    /** True if empty. */
    isEmpty() { return heap.length === 0; },

    /**
     * Push a value onto the heap. O(log N)
     * @param {*} value
     */
    push(value) {
      heap.push(value);
      siftUp(heap.length - 1);
    },

    /**
     * Pop and return the top-priority element. O(log N)
     * @returns {*} The top element, or undefined if empty.
     */
    pop() {
      if (heap.length === 0) return undefined;
      const top = heap[0];
      const last = heap.pop();
      if (heap.length > 0) {
        heap[0] = last;
        siftDown(0);
      }
      return top;
    },

    /**
     * Peek at the top element without removing. O(1)
     * @returns {*}
     */
    peek() {
      return heap[0];
    },

    /**
     * Remove all elements.
     */
    clear() {
      heap.length = 0;
    },

    /**
     * Return all elements as a sorted array (does not modify heap). O(N log N)
     */
    toArray() {
      const sorted = [...heap];
      sorted.sort(cmp);
      return sorted;
    },

    /**
     * Get raw backing array (for serialization). Do not mutate.
     */
    _raw() { return heap; },

    /**
     * Update an element at a given index after its priority changes. O(log N)
     * @param {number} index — Index in the backing array.
     */
    updateAt(index) {
      if (index < 0 || index >= heap.length) throw new RangeError(`Index ${index} out of bounds`);
      siftUp(index);
      // siftUp may not move it; siftDown from new position
      siftDown(index);
    },

    /**
     * Remove element at a given index. O(log N)
     * @param {number} index
     * @returns {*} The removed element.
     */
    removeAt(index) {
      if (index < 0 || index >= heap.length) throw new RangeError(`Index ${index} out of bounds`);
      const removed = heap[index];
      const last = heap.pop();
      if (index < heap.length) {
        heap[index] = last;
        siftUp(index);
        siftDown(index);
      }
      return removed;
    },

    /** Serialize to JSON (array form). */
    toJSON() { return [...heap]; },

    /**
     * Restore from JSON array. Overwrites current heap.
     * @param {Array} arr
     */
    fromJSON(arr) {
      heap.length = 0;
      for (const v of arr) heap.push(v);
      heapify();
    },
  };
}

/**
 * Merge multiple priority queues into one. O(N) build where N = total elements.
 * @param {ReturnType<create>[]} queues
 * @param {function(a:*, b:*):number} [compare]
 */
function merge(queues, compare = defaultCompare) {
  const all = [];
  for (const q of queues) {
    for (const item of q.toArray()) all.push(item);
  }
  return create(compare, all);
}

/**
 * k-way merge: given K sorted arrays, yield elements in sorted order.
 * Uses a min-heap for O(N log K) where N = total elements.
 * @param {Array<Array<*>>} arrays — K sorted arrays.
 * @param {function(a:*, b:*):number} [compare]
 * @returns {Array} Merged sorted array.
 */
function kwayMerge(arrays, compare = defaultCompare) {
  const pq = create((a, b) => compare(a.val, b.val));
  for (let i = 0; i < arrays.length; i++) {
    if (arrays[i].length > 0) {
      pq.push({ val: arrays[i][0], arrIdx: i, elemIdx: 0 });
    }
  }
  const result = [];
  while (!pq.isEmpty()) {
    const { val, arrIdx, elemIdx } = pq.pop();
    result.push(val);
    const next = elemIdx + 1;
    if (next < arrays[arrIdx].length) {
      pq.push({ val: arrays[arrIdx][next], arrIdx, elemIdx: next });
    }
  }
  return result;
}

/**
 * Find the K smallest (or largest) elements from an iterable. O(N + K log N)
 * @param {Iterable<*>} iterable
 * @param {number} k
 * @param {function(a:*, b:*):number} [compare]
 * @returns {Array} K elements (sorted ascending by comparator).
 */
function nsmallest(iterable, k, compare = defaultCompare) {
  if (k <= 0) return [];
  const arr = [...iterable];
  if (k >= arr.length) return arr.sort(compare);
  const pq = create(compare, arr);
  const result = [];
  for (let i = 0; i < k; i++) result.push(pq.pop());
  return result;
}

/**
 * Find the K largest elements. O(N + K log N)
 */
function nlargest(iterable, k, compare = defaultCompare) {
  const reverse = (a, b) => -compare(a, b);
  return nsmallest(iterable, k, reverse);
}

/** Max-heap comparator convenience. */
const maxHeap = (a, b) => {
  if (a > b) return -1;
  if (a < b) return 1;
  return 0;
};

/** Min-heap comparator convenience. */
const minHeap = defaultCompare;

module.exports = {
  create,
  merge,
  kwayMerge,
  nsmallest,
  nlargest,
  minHeap,
  maxHeap,
};
