class CacheNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.freq = 1;
    this.prev = null;
    this.next = null;
  }
}

class DoublyLinkedList {
  constructor() {
    this.head = new CacheNode(null, null); // MRU sentinel
    this.tail = new CacheNode(null, null); // LRU sentinel
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.size = 0;
  }

  addToFront(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
    this.size++;
  }

  removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    this.size--;
  }

  removeLRU() {
    if (this.size === 0) return null;
    const lruNode = this.tail.prev;
    this.removeNode(lruNode);
    return lruNode;
  }

  toArray() {
    const arr = [];
    let curr = this.head.next;
    while (curr !== this.tail) {
      arr.push(curr);
      curr = curr.next;
    }
    return arr;
  }
}

class FileCacheSimulator {
  constructor(capacity) {
    this.capacity = capacity;
    this.keyMap = new Map();   // key -> CacheNode (O(1))
    this.freqMap = new Map();  // freq -> DoublyLinkedList (O(1))
    this.minFreq = 0;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  _updateFrequency(node) {
    const oldFreq = node.freq;
    const oldList = this.freqMap.get(oldFreq);
    oldList.removeNode(node);

    if (oldList.size === 0) {
      this.freqMap.delete(oldFreq);
      if (this.minFreq === oldFreq) {
        this.minFreq++;
      }
    }

    node.freq++;
    if (!this.freqMap.has(node.freq)) {
      this.freqMap.set(node.freq, new DoublyLinkedList());
    }
    this.freqMap.get(node.freq).addToFront(node);
  }

  get(key) {
    if (this.capacity === 0 || !this.keyMap.has(key)) {
      this.misses++;
      const reason = this.capacity === 0 ? "capacity is 0" : "key not in cache";
      return {
        type: "miss",
        text: `GET(${key}) -> MISS (${reason})`
      };
    }

    this.hits++;
    const node = this.keyMap.get(key);
    this._updateFrequency(node);
    return {
      type: "hit",
      text: `GET(${key}) -> ${node.value} (freq=${node.freq})`
    };
  }

  put(key, value) {
    if (this.capacity === 0) {
      return {
        type: "miss",
        text: `PUT(${key}, ${value}) -> IGNORED (capacity is 0)`
      };
    }

    if (this.keyMap.has(key)) {
      const node = this.keyMap.get(key);
      node.value = value;
      this._updateFrequency(node);
      return {
        type: "hit",
        text: `PUT(${key}, ${value}) -> UPDATED (freq=${node.freq})`
      };
    }

    let evictionNote = "";
    let wasEvicted = false;

    if (this.keyMap.size >= this.capacity) {
      const minList = this.freqMap.get(this.minFreq);
      const hadTie = minList.size > 1;
      const evictedNode = minList.removeLRU();
      if (minList.size === 0) {
        this.freqMap.delete(this.minFreq);
      }
      this.keyMap.delete(evictedNode.key);
      this.evictions++;
      wasEvicted = true;

      const reason = hadTie
        ? `lowest freq=${evictedNode.freq}, tie broken by LRU`
        : `lowest freq=${evictedNode.freq}`;
      evictionNote = ` | EVICTED ${evictedNode.key} (${reason})`;
    }

    const newNode = new CacheNode(key, value);
    this.keyMap.set(key, newNode);
    if (!this.freqMap.has(1)) {
      this.freqMap.set(1, new DoublyLinkedList());
    }
    this.freqMap.get(1).addToFront(newNode);
    this.minFreq = 1;

    return {
      type: wasEvicted ? "evict" : "hit",
      text: `PUT(${key}, ${value}) -> INSERTED (freq=1)${evictionNote}`
    };
  }

  getStateReport() {
    if (this.keyMap.size === 0) {
      return "STATE REPORT: Cache is currently empty (0 items).";
    }

    const lines = [`STATE REPORT (${this.keyMap.size}/${this.capacity} slots used):`];
    const sortedFreqs = Array.from(this.freqMap.keys()).sort((a, b) => a - b);

    for (const freq of sortedFreqs) {
      const nodes = this.freqMap.get(freq).toArray();
      for (const node of nodes) {
        lines.push(`  • Key: ${node.key} | Value: ${node.value} | Access Count (freq): ${node.freq}`);
      }
    }
    return lines.join("\n");
  }
}

let simulator = new FileCacheSimulator(2);

function appendLog(message, type = "hit") {
  const container = document.getElementById("logContainer");
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  container.prepend(entry);
}

function clearLogs() {
  document.getElementById("logContainer").innerHTML = "";
}

function renderUI() {
  document.getElementById("capBadge").textContent = `Capacity: ${simulator.capacity}`;
  document.getElementById("sizeBadge").textContent = `Used: ${simulator.keyMap.size} / ${simulator.capacity}`;
  document.getElementById("minFreqBadge").textContent = `min_freq: ${simulator.minFreq}`;

  document.getElementById("statHits").textContent = simulator.hits;
  document.getElementById("statMisses").textContent = simulator.misses;
  document.getElementById("statEvictions").textContent = simulator.evictions;

  const totalGets = simulator.hits + simulator.misses;
  const hitRate = totalGets === 0 ? 0 : Math.round((simulator.hits / totalGets) * 100);
  document.getElementById("statHitRate").textContent = `${hitRate}%`;

  const bucketsContainer = document.getElementById("bucketsContainer");
  if (simulator.keyMap.size === 0) {
    bucketsContainer.innerHTML = `<div class="empty-state">Cache is empty. Use PUT(key, value) or run a demo preset.</div>`;
    return;
  }

  const sortedFreqs = Array.from(simulator.freqMap.keys()).sort((a, b) => a - b);
  const isFull = simulator.keyMap.size >= simulator.capacity;

  bucketsContainer.innerHTML = sortedFreqs.map(freq => {
    const dll = simulator.freqMap.get(freq);
    const nodes = dll.toArray();
    const isMinBucket = freq === simulator.minFreq;

    const nodesHtml = nodes.map((node, idx) => {
      const isMRU = idx === 0;
      const isNextEvict = isMinBucket && isFull && idx === nodes.length - 1;

      let tagHtml = "";
      if (isNextEvict) {
        tagHtml = `<span class="tag evict">NEXT TO EVICT (LRU)</span>`;
      } else if (isMRU) {
        tagHtml = `<span class="tag mru">MRU</span>`;
      }

      return `
        <span class="arrow">⇄</span>
        <div class="node-card ${isNextEvict ? "evict-target" : ""}">
          ${tagHtml}
          <div class="node-key">${node.key}</div>
          <div class="node-meta">val: ${node.value} | freq: ${node.freq}</div>
        </div>
      `;
    }).join("");

    return `
      <div class="freq-row ${isMinBucket ? "min-bucket" : ""}">
        <div class="freq-label">
          Freq ${freq}
          <span>${nodes.length} file(s)</span>
        </div>
        <div class="dll-chain">
          <span class="sentinel">HEAD</span>
          ${nodesHtml}
          <span class="arrow">⇄</span>
          <span class="sentinel">TAIL</span>
        </div>
      </div>
    `;
  }).join("");
}

function handleSetCapacity() {
  const raw = document.getElementById("capacityInput").value;
  const cap = parseInt(raw, 10);
  if (isNaN(cap) || cap < 0 || cap > 200) {
    alert("Please enter a valid capacity between 0 and 200.");
    return;
  }
  simulator = new FileCacheSimulator(cap);
  clearLogs();
  document.getElementById("stateOutput").textContent = 'Click "Request STATE Report" to inspect cached keys and access counts.';
  appendLog(`Initialized File Cache Simulator with capacity ${cap}.`, "hit");
  renderUI();
}

function resetCurrentCache() {
  simulator = new FileCacheSimulator(simulator.capacity);
  clearLogs();
  document.getElementById("stateOutput").textContent = "Cache cleared.";
  appendLog(`Reset cache (capacity=${simulator.capacity}).`, "hit");
  renderUI();
}

function handlePut() {
  const key = document.getElementById("putKey").value.trim();
  const val = document.getElementById("putVal").value.trim();
  if (!key || !val) return;

  const res = simulator.put(key, val);
  appendLog(res.text, res.type);
  document.getElementById("putKey").value = "";
  document.getElementById("putVal").value = "";
  renderUI();
}

function handleGet() {
  const key = document.getElementById("getKey").value.trim();
  if (!key) return;

  const res = simulator.get(key);
  appendLog(res.text, res.type);
  document.getElementById("getKey").value = "";
  renderUI();
}

function handleStateReport() {
  const report = simulator.getStateReport();
  document.getElementById("stateOutput").textContent = report;
  appendLog("STATE report generated.", "state");
}

/* Built-in Deliverable & Edge-Case Suites */
function runSequence(cap, title, steps) {
  document.getElementById("capacityInput").value = cap;
  simulator = new FileCacheSimulator(cap);
  clearLogs();
  appendLog(`=== ${title} (Capacity ${cap}) ===`, "state");

  for (const step of steps) {
    if (step.op === "PUT") {
      const res = simulator.put(step.k, step.v);
      appendLog(res.text, res.type);
    } else if (step.op === "GET") {
      const res = simulator.get(step.k);
      appendLog(res.text, res.type);
    } else if (step.op === "STATE") {
      handleStateReport();
    }
  }
  renderUI();
}

function runIllustrativeDemo() {
  runSequence(2, "Illustrative Example", [
    { op: "PUT", k: "A", v: 10 },
    { op: "PUT", k: "B", v: 20 },
    { op: "GET", k: "A" },
    { op: "PUT", k: "C", v: 30 },
    { op: "STATE" }
  ]);
}

function runTieBreakerTest() {
  runSequence(3, "Test: Frequency Ties (LRU Tie-Break)", [
    { op: "PUT", k: "Doc1", v: 100 },
    { op: "PUT", k: "Doc2", v: 200 },
    { op: "PUT", k: "Doc3", v: 300 },
    { op: "GET", k: "Doc2" },
    { op: "GET", k: "Doc1" },
    { op: "PUT", k: "Doc4", v: 400 }, // Evicts Doc3 (freq 1)
    { op: "GET", k: "Doc4" },          // All 3 now have freq=2; LRU order is Doc2 (oldest), Doc1, Doc4 (newest)
{ op: "PUT", k: "Doc5", v: 500 }, // Tie at freq=2 -> Evicts Doc2!
{ op: "STATE" }
]);
}
function runUpdateMissTest() {
runSequence(2, "Test: Repeated Updates & Missed GETs", [
{ op: "GET", k: "GhostFile" },     // Miss, must not insert
{ op: "PUT", k: "Notes", v: "v1" },
{ op: "PUT", k: "Notes", v: "v2" }, // Update counts as access (freq=2)
{ op: "PUT", k: "Slides", v: "v1" },// freq=1
{ op: "PUT", k: "Lab", v: "v1" },   // Evicts Slides (freq=1), keeps updated Notes (freq=2)
{ op: "STATE" }
]);
}
function runZeroCapacityTest() {
runSequence(0, "Test: Zero Capacity Edge Case", [
{ op: "PUT", k: "A", v: 10 },
{ op: "GET", k: "A" },
{ op: "STATE" }
]);
}
// Initial render
renderUI();