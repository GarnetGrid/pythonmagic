/* ============================================
   PythonMagic — Widgets Engine
   Live Python Editor · Sorting Viz · Type Explorer
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initPythonEditor();
    initSortingVisualizer();
    initTypeExplorer();
});

/* ===================================================
   💻 LIVE PYTHON EDITOR (Pyodide)
   =================================================== */
function initPythonEditor() {
    const input = document.getElementById('code-input');
    const output = document.getElementById('code-output');
    const runBtn = document.getElementById('editor-run');
    const clearBtn = document.getElementById('editor-clear');
    const examplesSelect = document.getElementById('editor-examples');
    const statusEl = document.getElementById('pyodide-status');
    if (!input || !output) return;

    let pyodide = null;

    const EXAMPLES = {
        hello: `# Hello, World!
print("Hello, World! 🐍")
print("Welcome to PythonMagic!")
print()
print("Python is running in your browser")
print("via WebAssembly — no server needed!")`,

        fib: `# Fibonacci Generator
def fibonacci(n):
    """Generate first n Fibonacci numbers"""
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

fib = fibonacci(20)
print("First 20 Fibonacci numbers:")
for i, num in enumerate(fib):
    print(f"  F({i}) = {num}")

print(f"\\nGolden ratio ≈ {fib[-1]/fib[-2]:.10f}")`,

        zen: `# The Zen of Python
import this`,

        sort: `# Sorting Algorithms
import random

data = random.sample(range(1, 51), 15)
print(f"Original:  {data}")

# Built-in sort
sorted_data = sorted(data)
print(f"Sorted:    {sorted_data}")

# Reverse sort
rev_sorted = sorted(data, reverse=True)
print(f"Reversed:  {rev_sorted}")

# Sort by last digit
by_last = sorted(data, key=lambda x: x % 10)
print(f"By last ⑩: {by_last}")

# Custom bubble sort
def bubble_sort(arr):
    a = arr[:]
    swaps = 0
    for i in range(len(a)):
        for j in range(len(a) - 1 - i):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                swaps += 1
    return a, swaps

result, swaps = bubble_sort(data)
print(f"\\nBubble sort: {result}")
print(f"Total swaps: {swaps}")`,

        'class': `# Python Classes
class Pet:
    def __init__(self, name, species):
        self.name = name
        self.species = species
        self.tricks = []

    def learn(self, trick):
        self.tricks.append(trick)
        print(f"🎓 {self.name} learned '{trick}'!")

    def show_tricks(self):
        if self.tricks:
            print(f"🐾 {self.name}'s tricks: {', '.join(self.tricks)}")
        else:
            print(f"🐾 {self.name} hasn't learned any tricks yet.")

    def __repr__(self):
        return f"Pet('{self.name}', '{self.species}')"

class Snake(Pet):
    def __init__(self, name, length_m):
        super().__init__(name, "Python 🐍")
        self.length = length_m

    def slither(self):
        print(f"🐍 {self.name} slithers gracefully ({self.length}m long)!")

# Create instances
monty = Snake("Monty", 3.5)
monty.slither()
monty.learn("coil")
monty.learn("hiss dramatically")
monty.show_tricks()
print(f"\\nRepr: {monty}")`,

        comprehension: `# List Comprehension Magic ✨
print("=== List Comprehensions ===")

# Squares
squares = [x**2 for x in range(1, 11)]
print(f"Squares: {squares}")

# Even numbers
evens = [x for x in range(20) if x % 2 == 0]
print(f"Evens:   {evens}")

# Nested: flatten
matrix = [[1,2,3], [4,5,6], [7,8,9]]
flat = [x for row in matrix for x in row]
print(f"Flat:    {flat}")

print("\\n=== Dict Comprehensions ===")
word = "supercalifragilistic"
freq = {ch: word.count(ch) for ch in set(word)}
for ch, count in sorted(freq.items(), key=lambda x: -x[1])[:5]:
    bar = "█" * count
    print(f"  '{ch}': {bar} ({count})")

print("\\n=== Set Comprehensions ===")
vowels = {ch for ch in "hello beautiful world" if ch in "aeiou"}
print(f"Vowels found: {vowels}")`,

        math: `# Math Magic 🔮
import math

print("=== Mathematical Constants ===")
print(f"  π  = {math.pi:.15f}")
print(f"  e  = {math.e:.15f}")
print(f"  τ  = {math.tau:.15f}")
print(f"  φ  = {(1 + math.sqrt(5)) / 2:.15f}")

print("\\n=== Fun with Primes ===")
def is_prime(n):
    if n < 2: return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0: return False
    return True

primes = [n for n in range(2, 100) if is_prime(n)]
print(f"Primes < 100: {primes}")
print(f"Count: {len(primes)}")

print("\\n=== Collatz Conjecture ===")
def collatz(n):
    seq = [n]
    while n != 1:
        n = n // 2 if n % 2 == 0 else 3 * n + 1
        seq.append(n)
    return seq

seq = collatz(27)
print(f"Collatz(27): {len(seq)} steps")
print(f"Max value:   {max(seq)}")
print(f"Sequence:    {seq[:15]}...")`
    };

    // Load Pyodide asynchronously
    async function loadPyodide_() {
        try {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
            document.head.appendChild(script);
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
            });
            pyodide = await loadPyodide();
            statusEl.innerHTML = '<span class="dot"></span><span>Pyodide Ready</span>';
        } catch (err) {
            statusEl.innerHTML = '<span class="dot" style="background:var(--accent-red)"></span><span>Pyodide failed to load — try refreshing</span>';
            console.error('Pyodide load error:', err);
        }
    }

    loadPyodide_();

    async function runCode() {
        const code = input.value;
        output.innerHTML = '';

        if (!pyodide) {
            output.innerHTML = '<span class="error">⏳ Pyodide is still loading... please wait.</span>';
            return;
        }

        try {
            // Redirect stdout
            pyodide.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);
            await pyodide.runPythonAsync(code);
            const stdout = pyodide.runPython('sys.stdout.getvalue()');
            const stderr = pyodide.runPython('sys.stderr.getvalue()');
            let result = '';
            if (stdout) result += stdout;
            if (stderr) result += `<span class="error">${escapeHtml(stderr)}</span>`;
            if (!result) result = '<span style="color:var(--text-secondary)">✓ Code executed (no output)</span>';
            output.innerHTML = result;
        } catch (err) {
            output.innerHTML = `<span class="error">${escapeHtml(err.message)}</span>`;
        }
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    runBtn.addEventListener('click', runCode);
    clearBtn.addEventListener('click', () => {
        input.value = '';
        output.innerHTML = '<span style="color:var(--text-secondary)">← Write some code and click ▶ Run</span>';
    });

    input.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
        // Tab handling
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = input.selectionStart;
            const end = input.selectionEnd;
            input.value = input.value.substring(0, start) + '    ' + input.value.substring(end);
            input.selectionStart = input.selectionEnd = start + 4;
        }
    });

    examplesSelect.addEventListener('change', () => {
        const key = examplesSelect.value;
        if (EXAMPLES[key]) {
            input.value = EXAMPLES[key];
            output.innerHTML = '<span style="color:var(--text-secondary)">← Click ▶ Run to execute</span>';
        }
        examplesSelect.value = '';
    });
}


/* ===================================================
   📊 SORTING VISUALIZER
   =================================================== */
function initSortingVisualizer() {
    const barsContainer = document.getElementById('sort-bars');
    if (!barsContainer) return;
    const sizeInput = document.getElementById('sort-size');
    const speedInput = document.getElementById('sort-speed');
    const shuffleBtn = document.getElementById('sort-shuffle');
    const comparisonsEl = document.getElementById('sort-comparisons');
    const swapsEl = document.getElementById('sort-swaps');
    const statusEl = document.getElementById('sort-status');

    let arr = [];
    let sorting = false;
    let comparisons = 0;
    let swapCount = 0;
    let animationSpeed = 30;

    function generateArray() {
        if (sorting) return;
        const size = parseInt(sizeInput.value);
        arr = Array.from({ length: size }, (_, i) => i + 1);
        shuffleArray(arr);
        comparisons = 0;
        swapCount = 0;
        comparisonsEl.textContent = '0';
        swapsEl.textContent = '0';
        statusEl.textContent = 'Ready';
        renderBars();
    }

    function shuffleArray(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
    }

    function renderBars(activeIndices = [], sortedIndices = []) {
        barsContainer.innerHTML = '';
        const max = Math.max(...arr);
        arr.forEach((val, i) => {
            const bar = document.createElement('div');
            bar.className = 'sort-bar';
            if (activeIndices.includes(i)) bar.classList.add('active');
            if (sortedIndices.includes(i)) bar.classList.add('sorted');
            bar.style.height = `${(val / max) * 100}%`;
            barsContainer.appendChild(bar);
        });
    }

    function delay() {
        animationSpeed = 101 - parseInt(speedInput.value);
        return new Promise(r => setTimeout(r, animationSpeed));
    }

    // Bubble Sort
    async function bubbleSort() {
        const n = arr.length;
        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                comparisons++;
                comparisonsEl.textContent = comparisons;
                if (arr[j] > arr[j + 1]) {
                    [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                    swapCount++;
                    swapsEl.textContent = swapCount;
                }
                renderBars([j, j + 1], Array.from({ length: i }, (_, k) => n - 1 - k));
                await delay();
                if (!sorting) return;
            }
        }
    }

    // Insertion Sort
    async function insertionSort() {
        for (let i = 1; i < arr.length; i++) {
            let key = arr[i];
            let j = i - 1;
            while (j >= 0 && arr[j] > key) {
                comparisons++;
                comparisonsEl.textContent = comparisons;
                arr[j + 1] = arr[j];
                swapCount++;
                swapsEl.textContent = swapCount;
                renderBars([j, j + 1]);
                await delay();
                if (!sorting) return;
                j--;
            }
            comparisons++;
            comparisonsEl.textContent = comparisons;
            arr[j + 1] = key;
            renderBars([j + 1]);
            await delay();
        }
    }

    // Quick Sort
    async function quickSort(lo = 0, hi = arr.length - 1) {
        if (lo >= hi || !sorting) return;
        const pivot = arr[hi];
        let i = lo - 1;
        for (let j = lo; j < hi; j++) {
            comparisons++;
            comparisonsEl.textContent = comparisons;
            renderBars([j, hi]);
            await delay();
            if (!sorting) return;
            if (arr[j] < pivot) {
                i++;
                [arr[i], arr[j]] = [arr[j], arr[i]];
                swapCount++;
                swapsEl.textContent = swapCount;
            }
        }
        [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
        swapCount++;
        swapsEl.textContent = swapCount;
        const pi = i + 1;
        await quickSort(lo, pi - 1);
        await quickSort(pi + 1, hi);
    }

    // Merge Sort
    async function mergeSort(lo = 0, hi = arr.length - 1) {
        if (lo >= hi || !sorting) return;
        const mid = Math.floor((lo + hi) / 2);
        await mergeSort(lo, mid);
        await mergeSort(mid + 1, hi);
        await merge(lo, mid, hi);
    }

    async function merge(lo, mid, hi) {
        const left = arr.slice(lo, mid + 1);
        const right = arr.slice(mid + 1, hi + 1);
        let i = 0, j = 0, k = lo;
        while (i < left.length && j < right.length) {
            comparisons++;
            comparisonsEl.textContent = comparisons;
            if (left[i] <= right[j]) {
                arr[k] = left[i]; i++;
            } else {
                arr[k] = right[j]; j++;
                swapCount++;
                swapsEl.textContent = swapCount;
            }
            renderBars([k]);
            await delay();
            if (!sorting) return;
            k++;
        }
        while (i < left.length) { arr[k] = left[i]; i++; k++; }
        while (j < right.length) { arr[k] = right[j]; j++; k++; }
        renderBars(Array.from({ length: hi - lo + 1 }, (_, x) => lo + x));
        await delay();
    }

    // Algo button handlers
    document.querySelectorAll('[data-algo]').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (sorting) { sorting = false; return; }

            generateArray();
            sorting = true;
            statusEl.textContent = `Sorting (${btn.dataset.algo})...`;
            statusEl.style.color = 'var(--py-yellow)';

            // Highlight active button
            document.querySelectorAll('[data-algo]').forEach(b => {
                b.className = 'btn btn-sm btn-secondary';
            });
            btn.className = 'btn btn-sm btn-primary';

            switch (btn.dataset.algo) {
                case 'bubble': await bubbleSort(); break;
                case 'insertion': await insertionSort(); break;
                case 'quick': await quickSort(); break;
                case 'merge': await mergeSort(); break;
            }

            if (sorting) {
                sorting = false;
                const allIndices = Array.from({ length: arr.length }, (_, i) => i);
                renderBars([], allIndices);
                statusEl.textContent = '✓ Complete!';
                statusEl.style.color = 'var(--accent-green)';
            } else {
                statusEl.textContent = 'Stopped';
                statusEl.style.color = 'var(--text-secondary)';
            }
        });
    });

    shuffleBtn.addEventListener('click', generateArray);
    sizeInput.addEventListener('input', generateArray);
    generateArray();
}


/* ===================================================
   🔎 DATA TYPE EXPLORER
   =================================================== */
function initTypeExplorer() {
    const grid = document.getElementById('type-grid');
    const detailPanel = document.getElementById('type-detail');
    if (!grid || !detailPanel) return;

    const TYPES = [
        {
            name: 'int', icon: '🔢', color: '#306998',
            desc: 'Immutable integer numbers with arbitrary precision.',
            example: `x = 42\ny = 0xFF  # hex: 255\nz = 0b1010  # binary: 10\nbig = 10 ** 100  # no overflow!\n\nprint(x + y)     # 297\nprint(bin(z))    # 0b1010\nprint(len(str(big)))  # 101 digits`,
            methods: ['bit_length()', 'to_bytes()', 'from_bytes()', 'conjugate()', '__add__()', '__mul__()']
        },
        {
            name: 'str', icon: '📝', color: '#FFD43B',
            desc: 'Immutable sequence of Unicode characters.',
            example: `s = "Hello, Python! 🐍"\n\nprint(s.upper())       # HELLO, PYTHON! 🐍\nprint(s.split(", "))   # ['Hello', 'Python! 🐍']\nprint(s[::-1])         # 🐍 !nohtyP ,olleH\nprint(f"{s!r}")        # 'Hello, Python! 🐍'\nprint(len(s))          # 17`,
            methods: ['split()', 'join()', 'strip()', 'replace()', 'find()', 'format()', 'encode()', 'startswith()', 'upper()', 'lower()']
        },
        {
            name: 'list', icon: '📋', color: '#48c774',
            desc: 'Mutable ordered sequence of items.',
            example: `fruits = ["apple", "banana", "cherry"]\nfruits.append("date")\nfruits.insert(1, "avocado")\n\nprint(fruits)          # ['apple', 'avocado', ...]\nprint(fruits[-1])      # date\nprint(fruits[1:3])     # ['avocado', 'banana']\n\n# List comprehension\nsquares = [x**2 for x in range(5)]\nprint(squares)         # [0, 1, 4, 9, 16]`,
            methods: ['append()', 'extend()', 'insert()', 'remove()', 'pop()', 'sort()', 'reverse()', 'copy()', 'index()', 'count()']
        },
        {
            name: 'dict', icon: '📖', color: '#b794f4',
            desc: 'Mutable mapping of key-value pairs.',
            example: `user = {\n    "name": "Monty",\n    "lang": "Python",\n    "age": 50\n}\n\nprint(user["name"])        # Monty\nprint(user.get("missing")) # None\nuser["version"] = 3.12\n\nfor k, v in user.items():\n    print(f"  {k}: {v}")`,
            methods: ['keys()', 'values()', 'items()', 'get()', 'setdefault()', 'update()', 'pop()', 'clear()', 'copy()']
        },
        {
            name: 'tuple', icon: '📌', color: '#ff6b6b',
            desc: 'Immutable ordered sequence — often used for fixed data.',
            example: `point = (3, 7)\nrgb = (255, 128, 0)\n\nx, y = point  # unpacking\nprint(f"x={x}, y={y}")\n\n# Named tuples\nfrom collections import namedtuple\nColor = namedtuple("Color", "r g b")\nred = Color(255, 0, 0)\nprint(red.r)  # 255`,
            methods: ['count()', 'index()']
        },
        {
            name: 'set', icon: '🔵', color: '#4ecdc4',
            desc: 'Mutable unordered collection of unique elements.',
            example: `a = {1, 2, 3, 4}\nb = {3, 4, 5, 6}\n\nprint(a | b)   # {1,2,3,4,5,6} union\nprint(a & b)   # {3, 4}        intersect\nprint(a - b)   # {1, 2}        difference\nprint(a ^ b)   # {1,2,5,6}     symmetric diff`,
            methods: ['add()', 'remove()', 'discard()', 'union()', 'intersection()', 'difference()', 'issubset()', 'clear()']
        },
        {
            name: 'bool', icon: '✅', color: '#ffd93d',
            desc: 'Subclass of int — True (1) or False (0).',
            example: `print(True + True)      # 2\nprint(True * 10)        # 10\nprint(bool(0))          # False\nprint(bool(""))         # False\nprint(bool([]))         # False\nprint(bool("Python"))   # True\nprint(bool(42))         # True\n\n# Truthy / Falsy\nresult = "yes" if [] else "no"\nprint(result)  # no`,
            methods: ['__and__()', '__or__()', '__xor__()', '__int__()']
        }
    ];

    // Render type cards
    TYPES.forEach((t, i) => {
        const card = document.createElement('div');
        card.className = 'type-card';
        card.innerHTML = `<div class="type-icon">${t.icon}</div><div class="type-name">${t.name}</div>`;
        card.addEventListener('click', () => showType(i));
        grid.appendChild(card);
    });

    function showType(index) {
        const t = TYPES[index];
        grid.querySelectorAll('.type-card').forEach((c, i) => {
            c.classList.toggle('active', i === index);
        });
        detailPanel.className = 'type-detail active';
        detailPanel.innerHTML = `
      <h4>${t.icon} ${t.name} — ${t.desc}</h4>
      <pre>${escapeHtml(t.example)}</pre>
      <div class="type-methods">
        <span style="color:var(--text-secondary);font-size:0.8rem;margin-right:0.5rem;">Methods:</span>
        ${t.methods.map(m => `<span class="tag">${m}</span>`).join('')}
      </div>
    `;
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Show first type by default
    showType(0);
}
