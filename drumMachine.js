/**
 * drumMachine.js - Drum Machine Module for NoteLab DAW
 * 
 * This module handles:
 * - 4-lane drum grid (Kick, Snare, Hi-Hat, Clap)
 * - 16 steps per bar, 8 bars total (128 steps)
 * - Mute/Solo controls per lane
 * - Volume controls per lane
 * - Pattern data management
 * - Visual rendering and interaction
 */

// ==================== CONFIGURATION ====================

const DRUM_CONFIG = {
  // Drum lanes available
  lanes: [
    { id: 'kick', name: 'Kick', color: '#e74c3c' },
    { id: 'snare', name: 'Snare', color: '#f39c12' },
    { id: 'hihat', name: 'Hi-Hat', color: '#3498db' },
    { id: 'clap', name: 'Clap', color: '#9b59b6' }
  ],
  
  // Grid settings
  stepsPerBar: 16,
  totalBars: 8,
  
  // Visual settings
  stepWidth: 24,
  laneHeight: 40,
  headerWidth: 120
};

// ==================== STATE ====================

// Pattern data: { laneId: Set<stepIndex> }
let pattern = {
  kick: new Set(),
  snare: new Set(),
  hihat: new Set(),
  clap: new Set()
};

// Lane states
let laneStates = {
  kick: { muted: false, solo: false, volume: 0.8 },
  snare: { muted: false, solo: false, volume: 0.8 },
  hihat: { muted: false, solo: false, volume: 0.8 },
  clap: { muted: false, solo: false, volume: 0.8 }
};

// UI elements
let container = null;
let canvas = null;
let ctx = null;

// Playback state
let playheadPosition = 0;

// ==================== INITIALIZATION ====================

/**
 * Initialize the drum machine
 * @param {HTMLElement} containerElement - Container for the drum machine
 */
function init(containerElement) {
  container = containerElement;
  buildUI();
  render();
}

/**
 * Build the drum machine UI
 */
function buildUI() {
  if (!container) return;
  
  container.innerHTML = '';
  container.className = 'drum-machine';
  
  // Create header row
  const header = document.createElement('div');
  header.className = 'drum-header';
  header.innerHTML = `
    <div class="drum-header-label">DRUM MACHINE</div>
    <div class="drum-header-controls">
      <button id="drum-clear-btn" class="drum-btn" title="Clear All">🗑️</button>
    </div>
  `;
  container.appendChild(header);
  
  // Create lanes
  const lanesContainer = document.createElement('div');
  lanesContainer.className = 'drum-lanes';
  
  DRUM_CONFIG.lanes.forEach((lane) => {
    const laneEl = createLaneElement(lane);
    lanesContainer.appendChild(laneEl);
  });
  
  container.appendChild(lanesContainer);
  
  // Create grid canvas
  const gridContainer = document.createElement('div');
  gridContainer.className = 'drum-grid-container';
  
  canvas = document.createElement('canvas');
  canvas.className = 'drum-grid-canvas';
  canvas.width = DRUM_CONFIG.stepsPerBar * DRUM_CONFIG.totalBars * DRUM_CONFIG.stepWidth;
  canvas.height = DRUM_CONFIG.lanes.length * DRUM_CONFIG.laneHeight;
  
  ctx = canvas.getContext('2d');
  
  gridContainer.appendChild(canvas);
  lanesContainer.appendChild(gridContainer);
  
  // Add event listeners
  canvas.addEventListener('click', handleGridClick);
  canvas.addEventListener('contextmenu', handleGridRightClick);
  
  const clearBtn = document.getElementById('drum-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearPattern);
  }
}

/**
 * Create a lane element with controls
 * @param {Object} lane - Lane configuration
 * @returns {HTMLElement} Lane element
 */
function createLaneElement(lane) {
  const laneEl = document.createElement('div');
  laneEl.className = 'drum-lane';
  laneEl.dataset.laneId = lane.id;
  
  laneEl.innerHTML = `
    <div class="drum-lane-header" style="border-left: 4px solid ${lane.color}">
      <span class="drum-lane-name">${lane.name}</span>
      <div class="drum-lane-controls">
        <button class="drum-lane-btn mute-btn" data-lane="${lane.id}" title="Mute">M</button>
        <button class="drum-lane-btn solo-btn" data-lane="${lane.id}" title="Solo">S</button>
        <input type="range" class="drum-lane-volume" data-lane="${lane.id}" 
               min="0" max="1" step="0.01" value="${laneStates[lane.id].volume}" 
               title="Volume">
      </div>
    </div>
  `;
  
  // Add event listeners
  setTimeout(() => {
    const muteBtn = laneEl.querySelector('.mute-btn');
    const soloBtn = laneEl.querySelector('.solo-btn');
    const volumeSlider = laneEl.querySelector('.drum-lane-volume');
    
    if (muteBtn) {
      muteBtn.addEventListener('click', () => toggleMute(lane.id));
    }
    if (soloBtn) {
      soloBtn.addEventListener('click', () => toggleSolo(lane.id));
    }
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        setLaneVolume(lane.id, parseFloat(e.target.value));
      });
    }
  }, 0);
  
  return laneEl;
}

// ==================== RENDERING ====================

/**
 * Render the drum grid
 */
function render() {
  if (!ctx || !canvas) return;
  
  const width = canvas.width;
  const height = canvas.height;
  const totalSteps = DRUM_CONFIG.stepsPerBar * DRUM_CONFIG.totalBars;
  
  // Clear canvas
  ctx.fillStyle = '#12121a';
  ctx.fillRect(0, 0, width, height);
  
  // Draw grid lines
  for (let i = 0; i <= totalSteps; i++) {
    const x = i * DRUM_CONFIG.stepWidth;
    
    if (i % 16 === 0) {
      // Bar line
      ctx.strokeStyle = '#4a4a58';
      ctx.lineWidth = 2;
    } else if (i % 4 === 0) {
      // Beat line
      ctx.strokeStyle = '#3a3a48';
      ctx.lineWidth = 1;
    } else {
      // Step line
      ctx.strokeStyle = '#2a2a38';
      ctx.lineWidth = 1;
    }
    
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
  
  // Draw lane separators
  for (let i = 0; i <= DRUM_CONFIG.lanes.length; i++) {
    const y = i * DRUM_CONFIG.laneHeight;
    ctx.strokeStyle = '#2a2a38';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }
  
  // Draw drum hits
  DRUM_CONFIG.lanes.forEach((lane, laneIndex) => {
    const hits = pattern[lane.id];
    const y = laneIndex * DRUM_CONFIG.laneHeight;
    const isMuted = laneStates[lane.id].muted || 
                   (hasSoloedLane() && !laneStates[lane.id].solo);
    
    hits.forEach((step) => {
      const x = step * DRUM_CONFIG.stepWidth;
      
      // Draw hit
      ctx.fillStyle = isMuted ? '#555' : lane.color;
      ctx.beginPath();
      ctx.roundRect(
        x + 2, 
        y + 4, 
        DRUM_CONFIG.stepWidth - 4, 
        DRUM_CONFIG.laneHeight - 8, 
        4
      );
      ctx.fill();
      
      // Add glow effect if not muted
      if (!isMuted) {
        ctx.shadowColor = lane.color;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  });
  
  // Draw playhead
  if (playheadPosition >= 0 && playheadPosition < totalSteps) {
    const x = playheadPosition * DRUM_CONFIG.stepWidth;
    ctx.fillStyle = 'rgba(240, 71, 71, 0.8)';
    ctx.fillRect(x, 0, 2, height);
  }
}

// ==================== INTERACTION ====================

/**
 * Handle grid click (toggle hit)
 * @param {MouseEvent} event - Mouse event
 */
function handleGridClick(event) {
  const { step, laneIndex } = getGridPosition(event);
  if (laneIndex < 0 || laneIndex >= DRUM_CONFIG.lanes.length) return;
  
  const lane = DRUM_CONFIG.lanes[laneIndex];
  toggleHit(lane.id, step);
  
  // Play preview sound
  if (pattern[lane.id].has(step) && window.AudioEngine) {
    window.AudioEngine.playDrumPreview(lane.id);
  }
}

/**
 * Handle right click (remove hit)
 * @param {MouseEvent} event - Mouse event
 */
function handleGridRightClick(event) {
  event.preventDefault();
  const { step, laneIndex } = getGridPosition(event);
  if (laneIndex < 0 || laneIndex >= DRUM_CONFIG.lanes.length) return;
  
  const lane = DRUM_CONFIG.lanes[laneIndex];
  removeHit(lane.id, step);
}

/**
 * Get grid position from mouse event
 * @param {MouseEvent} event - Mouse event
 * @returns {Object} { step, laneIndex }
 */
function getGridPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const step = Math.floor(x / DRUM_CONFIG.stepWidth);
  const laneIndex = Math.floor(y / DRUM_CONFIG.laneHeight);
  
  return { step, laneIndex };
}

// ==================== PATTERN MANAGEMENT ====================

/**
 * Toggle a hit on/off
 * @param {string} laneId - Lane ID
 * @param {number} step - Step index
 */
function toggleHit(laneId, step) {
  const totalSteps = DRUM_CONFIG.stepsPerBar * DRUM_CONFIG.totalBars;
  if (step < 0 || step >= totalSteps) return;
  
  if (pattern[laneId].has(step)) {
    pattern[laneId].delete(step);
  } else {
    pattern[laneId].add(step);
  }
  
  render();
}

/**
 * Add a hit
 * @param {string} laneId - Lane ID
 * @param {number} step - Step index
 */
function addHit(laneId, step) {
  const totalSteps = DRUM_CONFIG.stepsPerBar * DRUM_CONFIG.totalBars;
  if (step < 0 || step >= totalSteps) return;
  
  pattern[laneId].add(step);
  render();
}

/**
 * Remove a hit
 * @param {string} laneId - Lane ID
 * @param {number} step - Step index
 */
function removeHit(laneId, step) {
  pattern[laneId].delete(step);
  render();
}

/**
 * Clear all hits in a lane
 * @param {string} laneId - Lane ID
 */
function clearLane(laneId) {
  pattern[laneId].clear();
  render();
}

/**
 * Clear the entire pattern
 */
function clearPattern() {
  Object.keys(pattern).forEach(laneId => {
    pattern[laneId].clear();
  });
  render();
}

/**
 * Get all hits for a specific step (for playback)
 * @param {number} step - Step index
 * @returns {Array} Array of lane IDs that have hits at this step
 */
function getHitsAtStep(step) {
  const hits = [];
  Object.keys(pattern).forEach(laneId => {
    if (pattern[laneId].has(step)) {
      // Check if lane is audible
      const state = laneStates[laneId];
      const isMuted = state.muted || (hasSoloedLane() && !state.solo);
      if (!isMuted) {
        hits.push({ laneId, volume: state.volume });
      }
    }
  });
  return hits;
}

/**
 * Get the entire pattern (for saving)
 * @returns {Object} Pattern data
 */
function getPattern() {
  const data = {};
  Object.keys(pattern).forEach(laneId => {
    data[laneId] = Array.from(pattern[laneId]);
  });
  return data;
}

/**
 * Set the pattern (for loading)
 * @param {Object} data - Pattern data
 */
function setPattern(data) {
  Object.keys(pattern).forEach(laneId => {
    pattern[laneId].clear();
    if (data[laneId] && Array.isArray(data[laneId])) {
      data[laneId].forEach(step => pattern[laneId].add(step));
    }
  });
  render();
}

// ==================== LANE CONTROLS ====================

/**
 * Toggle mute on a lane
 * @param {string} laneId - Lane ID
 */
function toggleMute(laneId) {
  laneStates[laneId].muted = !laneStates[laneId].muted;
  updateLaneUI(laneId);
  render();
}

/**
 * Toggle solo on a lane
 * @param {string} laneId - Lane ID
 */
function toggleSolo(laneId) {
  laneStates[laneId].solo = !laneStates[laneId].solo;
  updateLaneUI(laneId);
  render();
}

/**
 * Set lane volume
 * @param {string} laneId - Lane ID
 * @param {number} volume - Volume (0-1)
 */
function setLaneVolume(laneId, volume) {
  laneStates[laneId].volume = Math.max(0, Math.min(1, volume));
}

/**
 * Check if any lane is soloed
 * @returns {boolean} Whether any lane is soloed
 */
function hasSoloedLane() {
  return Object.values(laneStates).some(state => state.solo);
}

/**
 * Update lane UI to reflect current state
 * @param {string} laneId - Lane ID
 */
function updateLaneUI(laneId) {
  const muteBtn = document.querySelector(`.mute-btn[data-lane="${laneId}"]`);
  const soloBtn = document.querySelector(`.solo-btn[data-lane="${laneId}"]`);
  
  if (muteBtn) {
    muteBtn.classList.toggle('active', laneStates[laneId].muted);
  }
  if (soloBtn) {
    soloBtn.classList.toggle('active', laneStates[laneId].solo);
  }
}

/**
 * Get lane states (for saving)
 * @returns {Object} Lane states
 */
function getLaneStates() {
  return JSON.parse(JSON.stringify(laneStates));
}

/**
 * Set lane states (for loading)
 * @param {Object} states - Lane states
 */
function setLaneStates(states) {
  if (!states) return;
  Object.keys(laneStates).forEach(laneId => {
    if (states[laneId]) {
      laneStates[laneId] = { ...laneStates[laneId], ...states[laneId] };
      updateLaneUI(laneId);
      
      // Update volume slider
      const slider = document.querySelector(`.drum-lane-volume[data-lane="${laneId}"]`);
      if (slider) {
        slider.value = laneStates[laneId].volume;
      }
    }
  });
  render();
}

// ==================== PLAYBACK ====================

/**
 * Set the playhead position
 * @param {number} position - Position in steps (16th notes)
 */
function setPlayheadPosition(position) {
  playheadPosition = position;
  render();
}

/**
 * Get the playhead position
 * @returns {number} Current playhead position
 */
function getPlayheadPosition() {
  return playheadPosition;
}

// ==================== UTILITY ====================

/**
 * Get drum machine configuration
 * @returns {Object} Configuration
 */
function getConfig() {
  return { ...DRUM_CONFIG };
}

// ==================== EXPORT ====================

window.DrumMachine = {
  init,
  render,
  toggleHit,
  addHit,
  removeHit,
  clearLane,
  clearPattern,
  getHitsAtStep,
  getPattern,
  setPattern,
  toggleMute,
  toggleSolo,
  setLaneVolume,
  getLaneStates,
  setLaneStates,
  setPlayheadPosition,
  getPlayheadPosition,
  getConfig,
  DRUM_CONFIG
};
