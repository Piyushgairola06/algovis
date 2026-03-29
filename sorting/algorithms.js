// algorithms.js — pure sorting logic
// Each function reads/writes the shared `arr` and `bars` arrays from visualizer.js
// and calls pause(), updateStats(), explain(), draw() for animation.

const COMPLEXITIES = {
  bubble:    { best:'O(n)',       avg:'O(n²)',      worst:'O(n²)',      space:'O(1)',     stable:'Yes' },
  selection: { best:'O(n²)',      avg:'O(n²)',      worst:'O(n²)',      space:'O(1)',     stable:'No'  },
  insertion: { best:'O(n)',       avg:'O(n²)',      worst:'O(n²)',      space:'O(1)',     stable:'Yes' },
  merge:     { best:'O(n log n)', avg:'O(n log n)', worst:'O(n log n)', space:'O(n)',     stable:'Yes' },
  quick:     { best:'O(n log n)', avg:'O(n log n)', worst:'O(n²)',      space:'O(log n)', stable:'No'  },
  heap:      { best:'O(n log n)', avg:'O(n log n)', worst:'O(n log n)', space:'O(1)',     stable:'No'  },
};

// ── Bubble Sort ───────────────────────────────────────────────────────────────
async function bubbleSort() {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comps++;
      await pause(
        [[j, 'compare'], [j + 1, 'compare']],
        `Comparing arr[${j}] = ${arr[j]}  vs  arr[${j+1}] = ${arr[j+1]}`,
        'comparing'
      );
      if (arr[j] > arr[j + 1]) {
        swaps++;
        await pause(
          [[j, 'swap'], [j + 1, 'swap']],
          `${arr[j]} > ${arr[j+1]}  →  Swap! Larger value bubbles right`,
          'swapping'
        );
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      } else {
        explain(`${arr[j]} ≤ ${arr[j+1]}  →  Already in order, no swap needed`, 'comparing');
      }
      updateStats();
    }
    bars[n - i - 1] = 'sorted';
    explain(`Position ${n - i - 1} is locked in its final sorted place ✓`, 'sorted');
    draw();
  }
  bars[0] = 'sorted';
}

// ── Selection Sort ────────────────────────────────────────────────────────────
async function selectionSort() {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    explain(`Pass ${i + 1}: scanning indices ${i} → ${n - 1} for the minimum value`, 'comparing');
    for (let j = i + 1; j < n; j++) {
      comps++;
      await pause(
        [[j, 'compare'], [minIdx, 'swap']],
        `Is arr[${j}] = ${arr[j]}  smaller than current min arr[${minIdx}] = ${arr[minIdx]}?`,
        'comparing'
      );
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
        explain(`New minimum found: ${arr[minIdx]} at index ${minIdx}`, 'comparing');
      }
      updateStats();
    }
    if (minIdx !== i) {
      swaps++;
      await pause(
        [[i, 'swap'], [minIdx, 'swap']],
        `Placing minimum ${arr[minIdx]} into position ${i} by swapping`,
        'swapping'
      );
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      updateStats();
    }
    bars[i] = 'sorted';
    explain(`${arr[i]} placed correctly at position ${i} ✓`, 'sorted');
    draw();
  }
  bars[arr.length - 1] = 'sorted';
}

// ── Insertion Sort ────────────────────────────────────────────────────────────
async function insertionSort() {
  const n = arr.length;
  bars[0] = 'sorted';
  for (let i = 1; i < n; i++) {
    let key = arr[i], j = i - 1;
    await pause(
      [[i, 'compare']],
      `Picking up ${key} from index ${i} — finding where it belongs in the sorted left side`,
      'comparing'
    );
    while (j >= 0 && arr[j] > key) {
      comps++;
      arr[j + 1] = arr[j];
      swaps++;
      await pause(
        [[j, 'swap'], [j + 1, 'swap']],
        `${arr[j]} > ${key}  →  Shift ${arr[j]} one step right to make room`,
        'swapping'
      );
      bars[j + 1] = 'normal';
      j--;
      updateStats();
    }
    arr[j + 1] = key;
    bars[j + 1] = 'sorted';
    explain(`${key} inserted at position ${j + 1} ✓`, 'sorted');
    draw();
  }
  bars.fill('sorted');
  draw();
}

// ── Merge Sort ────────────────────────────────────────────────────────────────
async function mergeSort() {
  explain('Merge Sort: recursively splitting array in half, then merging sorted halves back together', 'comparing');
  await _mergeSortHelper(0, arr.length - 1);
  bars.fill('sorted');
  pointers = {};
  draw();
}

async function _mergeSortHelper(l, r) {
  if (l >= r) return;
  const m = Math.floor((l + r) / 2);
  explain(`Splitting: [${l}..${m}]  and  [${m + 1}..${r}]`, 'comparing');
  await _mergeSortHelper(l, m);
  await _mergeSortHelper(m + 1, r);
  await _merge(l, m, r);
}

async function _merge(l, m, r) {
  const left = arr.slice(l, m + 1);
  const right = arr.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;
  while (i < left.length && j < right.length) {
    comps++;
    const lv = left[i], rv = right[j];
    await pause(
      [[k, 'compare']],
      `Merging: left = ${lv}  vs  right = ${rv}  →  placing ${lv <= rv ? lv : rv}`,
      'comparing'
    );
    if (lv <= rv) { arr[k++] = left[i++]; }
    else          { arr[k++] = right[j++]; swaps++; }
    updateStats();
  }
  while (i < left.length)  arr[k++] = left[i++];
  while (j < right.length) arr[k++] = right[j++];
  for (let x = l; x <= r; x++) bars[x] = 'swap';
  explain(`Merged section [${l}..${r}] into sorted order`, 'swapping');
  draw();
  await sleep(getDelay());
}

// ── Quick Sort ────────────────────────────────────────────────────────────────
async function quickSort() {
  explain('Quick Sort: pick a pivot → move smaller elements left, larger right → recurse on each side', 'pivot');
  await _quickSortHelper(0, arr.length - 1);
  bars.fill('sorted');
  pointers = {};
  draw();
}

async function _quickSortHelper(low, high) {
  if (low < high) {
    const pi = await _partition(low, high);
    await _quickSortHelper(low, pi - 1);
    await _quickSortHelper(pi + 1, high);
  } else if (low === high) {
    bars[low] = 'sorted';
    draw();
  }
}

async function _partition(low, high) {
  const pivot = arr[high];
  bars[high] = 'pivot';
  explain(`Pivot = ${pivot} (last element in range). Scanning for elements smaller than ${pivot}`, 'pivot');
  await pause([[high, 'pivot']], `Pivot selected: ${pivot}`, 'pivot');
  bars[high] = 'pivot';

  let i = low - 1;
  for (let j = low; j < high; j++) {
    comps++;
    await pause(
      [[j, 'compare'], [high, 'pivot']],
      `arr[${j}] = ${arr[j]}  ${arr[j] < pivot ? '<' : '≥'}  pivot ${pivot}  →  ${arr[j] < pivot ? 'move left of pivot' : 'leave in place'}`,
      'comparing'
    );
    bars[high] = 'pivot';
    if (arr[j] < pivot) {
      i++;
      swaps++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      await pause(
        [[i, 'swap'], [j, 'swap'], [high, 'pivot']],
        `Swapping ${arr[j]} ↔ ${arr[i]}  →  smaller element moves left of pivot boundary`,
        'swapping'
      );
      bars[high] = 'pivot';
      updateStats();
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  swaps++;
  bars[i + 1] = 'sorted';
  bars[high]  = 'normal';
  explain(`Pivot ${pivot} is now in its final sorted position at index ${i + 1} ✓`, 'sorted');
  await pause([[i + 1, 'sorted']], '', 'sorted');
  updateStats();
  return i + 1;
}

// ── Heap Sort ─────────────────────────────────────────────────────────────────
async function heapSort() {
  const n = arr.length;
  explain('Heap Sort: building a max-heap so the largest element is always at root, then extracting one by one', 'comparing');
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) await _heapify(n, i);
  for (let i = n - 1; i > 0; i--) {
    swaps++;
    explain(`Root ${arr[0]} is the max — placing it at its final position ${i}`, 'swapping');
    [arr[0], arr[i]] = [arr[i], arr[0]];
    await pause([[0, 'swap'], [i, 'swap']], `Swap root → position ${i}`, 'swapping');
    bars[i] = 'sorted';
    updateStats();
    await _heapify(i, 0);
  }
  bars[0] = 'sorted';
  draw();
}

async function _heapify(n, i) {
  let largest = i, l = 2 * i + 1, r = 2 * i + 2;
  if (l < n) { comps++; if (arr[l] > arr[largest]) largest = l; }
  if (r < n) { comps++; if (arr[r] > arr[largest]) largest = r; }
  if (largest !== i) {
    swaps++;
    explain(`Heapify: ${arr[i]} < child ${arr[largest]}  →  swap to restore heap property`, 'swapping');
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    await pause([[i, 'swap'], [largest, 'swap']], '', 'swapping');
    updateStats();
    await _heapify(n, largest);
  }
}

// ── Algorithm map (used by visualizer.js) ────────────────────────────────────
const ALGO_FNS = {
  bubble:    bubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  merge:     mergeSort,
  quick:     quickSort,
  heap:      heapSort,
};