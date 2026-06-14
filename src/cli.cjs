#!/usr/bin/env node
'use strict';

const { create, kwayMerge, nsmallest, nlargest, minHeap, maxHeap } = require('./index.cjs');

function usage() {
  console.log(`Usage: pq <command> [options]

Commands:
  push <value> [--max]       Push values (read multiple from stdin or args)
  pop <n> [--max]            Pop N elements (default 1)
  peek [--max]               Show top element
  kway <file1> <file2>...    Merge K sorted arrays (JSON arrays, one per file/line)
  nsmallest <k> [values...]  K smallest elements
  nlargest <k> [values...]   K largest elements
  demo                       Run a demo

Options:
  --max       Use max-heap (default: min-heap)
  --numbers   Parse values as numbers
  --json      Output as JSON

Examples:
  echo "5 3 8 1 9 2" | pq push --numbers
  pq pop 3 --numbers --json
  pq nlargest 3 5 3 8 1 9 2 7 4 6
`);
}

const args = process.argv.slice(2);
if (args.length === 0) { usage(); process.exit(0); }

function parseVal(v, asNum) {
  return asNum ? Number(v) : v;
}

async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => data += c);
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

async function main() {
  const cmd = args[0];
  const useMax = args.includes('--max');
  const asNum = args.includes('--numbers');
  const asJson = args.includes('--json');
  const cmp = useMax ? maxHeap : minHeap;

  switch (cmd) {
    case 'demo': {
      const pq = create(cmp);
      const values = asNum ? [5, 3, 8, 1, 9, 2, 7, 4, 6] : ['banana', 'apple', 'cherry', 'date'];
      console.log(`Pushing: ${values.join(', ')}`);
      for (const v of values) pq.push(v);
      console.log(`Size: ${pq.size}`);
      console.log(`Peek: ${pq.peek()}`);
      const result = [];
      while (!pq.isEmpty()) result.push(pq.pop());
      console.log(`Popped: ${result.join(', ')}`);
      break;
    }
    case 'push': {
      const pq = create(cmp);
      const remaining = args.slice(1).filter(a => !a.startsWith('--'));
      let values = remaining;
      if (values.length === 0) {
        const stdin = await readStdin();
        values = stdin.split(/\s+/).filter(Boolean);
      }
      for (const v of values) pq.push(parseVal(v, asNum));
      console.log(`Pushed ${values.length} element(s). Size: ${pq.size}`);
      console.log(`Top: ${pq.peek()}`);
      break;
    }
    case 'pop': {
      const remaining = args.slice(1).filter(a => !a.startsWith('--'));
      let values = remaining;
      if (values.length === 0) {
        const stdin = await readStdin();
        values = stdin.split(/\s+/).filter(Boolean);
      }
      const n = values[0] ? parseInt(values[0], 10) : 1;
      const rest = values.slice(1);
      const pq = create(cmp, rest.map(v => parseVal(v, asNum)));
      const result = [];
      for (let i = 0; i < n && !pq.isEmpty(); i++) result.push(pq.pop());
      if (asJson) console.log(JSON.stringify(result));
      else console.log(result.join('\n'));
      break;
    }
    case 'peek': {
      const remaining = args.slice(1).filter(a => !a.startsWith('--'));
      let values = remaining;
      if (values.length === 0) {
        const stdin = await readStdin();
        values = stdin.split(/\s+/).filter(Boolean);
      }
      const pq = create(cmp, values.map(v => parseVal(v, asNum)));
      console.log(pq.peek());
      break;
    }
    case 'nsmallest':
    case 'nlargest': {
      const remaining = args.slice(1).filter(a => !a.startsWith('--'));
      const k = parseInt(remaining[0], 10) || 1;
      let values = remaining.slice(1);
      if (values.length === 0) {
        const stdin = await readStdin();
        values = stdin.split(/\s+/).filter(Boolean);
      }
      const parsed = values.map(v => parseVal(v, asNum));
      const result = cmd === 'nsmallest'
        ? nsmallest(parsed, k, cmp)
        : nlargest(parsed, k, cmp);
      if (asJson) console.log(JSON.stringify(result));
      else console.log(result.join('\n'));
      break;
    }
    case 'kway': {
      const remaining = args.slice(1).filter(a => !a.startsWith('--'));
      if (remaining.length < 1) {
        console.error('Need at least 1 input for kway merge');
        process.exit(1);
      }
      const arrays = [];
      for (const arg of remaining) {
        if (arg === '-') {
          const stdin = await readStdin();
          arrays.push(JSON.parse(stdin));
        } else {
          const data = arg.startsWith('[') ? arg : require('fs').readFileSync(arg, 'utf8');
          arrays.push(JSON.parse(data));
        }
      }
      const result = kwayMerge(arrays, cmp);
      if (asJson) console.log(JSON.stringify(result));
      else console.log(result.join('\n'));
      break;
    }
    default:
      usage();
      process.exit(1);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
