/**
 * pianoRoll.js - Piano Roll Editor for NoteLab
 * 
 * This module handles:
 * - Note data model
 * - Grid rendering on canvas
 * - Note add/remove/edit operations
 * - Mouse interaction for editing
 * - Visual display of notes and playhead
 */

// ==================== CONFIGURATION ====================

const PIANO_ROLL_CONFIG = {
  // Note range: C0 (MIDI 12) to C8 (MIDI 108)
  minNote: 12,  // C0
  maxNote: 108, // C8
  
  // Grid settings
  bars: 8,
  beatsPerBar: 4,
  sixteenthsPerBeat: 4,
  
  // Visual settings
  noteHeight: 16,
  sixteenthWidth: 20,
  keyboardWidth: 60,
  
  // Colors by instrument
  noteColors: {
    piano: '#5865f2',
    pluck: '#43b581',
    saw: '#faa61a',
    pad: '#eb459e',
    bass: '#ed4245',
    bell: '#00aff4'
  }
};

// ==================== DATA MODEL ====================

/**
 * Note data structure
 * @typedef {Object} Note
 * @property {string} id - Unique identifier
 * @property {number} pitch - MIDI note number (12-108)
 * @property {number} start - Start time in 16th notes (0-based)
 * @property {number} duration - Duration in 16th notes
 * @property {number} velocity - Velocity (0.0-1.0)
 */

let notes = [];
let selectedNotes = new Set();
let hoveredNote = null;
let nextNoteId = 1;

/**
 * Generate a unique note ID
 * @returns {string} Unique ID
 */
function generateNoteId() {
  return `note_${nextNoteId++}`;
}

/**
 * Add a note to the piano roll
 * @param {number} pitch - MIDI note number
 * @param {number} start - Start position in 16th notes
 * @param {number} duration - Duration in 16th notes
 * @param {number} velocity - Velocity (0.0-1.0)
 * @returns {Note} The created note
 */
function addNote(pitch, start, duration = 4, velocity = 0.8) {
  // Validate pitch range
  if (pitch < PIANO_ROLL_CONFIG.minNote || pitch > PIANO_ROLL_CONFIG.maxNote) {
    return null;
  }
  
  // Calculate max position
  const maxPosition = PIANO_ROLL_CONFIG.bars * PIANO_ROLL_CONFIG.beatsPerBar * PIANO_ROLL_CONFIG.sixteenthsPerBeat;
  
  // Validate start position
  if (start < 0 || start >= maxPosition) {
    return null;
  }
  
  // Clamp duration to fit within bounds
  duration = Math.min(duration, maxPosition - start);
  
  const note = {
    id: generateNoteId(),
    pitch,
    start,
    duration,
    velocity
  };
  
  notes.push(note);
  render();
  
  return note;
}

/**
 * Remove a note by ID
 * @param {string} noteId - The note ID to remove
 */
function removeNote(noteId) {
  const index = notes.findIndex(n => n.id === noteId);
  if (index !== -1) {
    notes.splice(index, 1);
    selectedNotes.delete(noteId);
    render();
  }
}

/**
 * Remove all selected notes
 */
function removeSelectedNotes() {
  notes = notes.filter(n => !selectedNotes.has(n.id));
  selectedNotes.clear();
  render();
}

/**
 * Clear all notes
 */
function clearAllNotes() {
  notes = [];
  selectedNotes.clear();
  hoveredNote = null;
  render();
}

/**
 * Get note at a specific position
 * @param {number} pitch - MIDI note number
 * @param {number} time - Position in 16th notes
 * @returns {Note|null} The note at that position, or null
 */
function getNoteAt(pitch, time) {
  return notes.find(n => 
    n.pitch === pitch && 
    time >= n.start && 
    time < n.start + n.duration
  ) || null;
}

/**
 * Get all notes
 * @returns {Array<Note>} All notes
 */
function getAllNotes() {
  return [...notes];
}

/**
 * Set all notes (for loading)
 * @param {Array<Note>} newNotes - Notes to load
 */
function setAllNotes(newNotes) {
  notes = newNotes.map(n => ({
    ...n,
    id: n.id || generateNoteId()
  }));
  selectedNotes.clear();
  render();
}

/**
 * Select a note
 * @param {string} noteId - Note ID to select
 * @param {boolean} toggle - Whether to toggle selection
 */
function selectNote(noteId, toggle = false) {
  if (toggle) {
    if (selectedNotes.has(noteId)) {
      selectedNotes.delete(noteId);
    } else {
      selectedNotes.add(noteId);
    }
  } else {
    selectedNotes.clear();
    selectedNotes.add(noteId);
  }
  render();
}

/**
 * Clear selection
 */
function clearSelection() {
  selectedNotes.clear();
  render();
}

// ==================== CANVAS RENDERING ====================

let canvas = null;
let ctx = null;
let scrollContainer = null;
let timelineCanvas = null;
let timelineCtx = null;
let playheadPosition = 0; // In 16th notes
let pianoRollInstrument = 'piano'; // Internal instrument state for note colors

/**
 * Initialize the piano roll canvas
 * @param {HTMLCanvasElement} canvasElement - The canvas element
 * @param {HTMLElement} scrollElement - The scroll container
 * @param {HTMLCanvasElement} timelineElement - The timeline canvas
 */
function initCanvas(canvasElement, scrollElement, timelineElement) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d');
  scrollContainer = scrollElement;
  timelineCanvas = timelineElement;
  timelineCtx = timelineCanvas.getContext('2d');
  
  // Calculate dimensions
  const totalNotes = PIANO_ROLL_CONFIG.maxNote - PIANO_ROLL_CONFIG.minNote + 1;
  const total16ths = PIANO_ROLL_CONFIG.bars * PIANO_ROLL_CONFIG.beatsPerBar * PIANO_ROLL_CONFIG.sixteenthsPerBeat;
  
  // Set canvas size
  canvas.width = total16ths * PIANO_ROLL_CONFIG.sixteenthWidth;
  canvas.height = totalNotes * PIANO_ROLL_CONFIG.noteHeight;
  
  // Set timeline canvas size
  timelineCanvas.width = canvas.width;
  timelineCanvas.height = 32;
  
  // Add event listeners
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseLeave);
  canvas.addEventListener('contextmenu', handleContextMenu);
  
  // Sync timeline scroll with grid scroll
  scrollContainer.addEventListener('scroll', () => {
    const timelineContainer = timelineCanvas.parentElement;
    if (timelineContainer) {
      timelineContainer.scrollLeft = scrollContainer.scrollLeft;
    }
  });
  
  render();
}

/**
 * Render the piano roll grid and notes
 */
function render() {
  if (!ctx) return;
  
  const width = canvas.width;
  const height = canvas.height;
  const totalNotes = PIANO_ROLL_CONFIG.maxNote - PIANO_ROLL_CONFIG.minNote + 1;
  const total16ths = PIANO_ROLL_CONFIG.bars * PIANO_ROLL_CONFIG.beatsPerBar * PIANO_ROLL_CONFIG.sixteenthsPerBeat;
  
  // Clear canvas
  ctx.fillStyle = '#12121a';
  ctx.fillRect(0, 0, width, height);
  
  // Draw horizontal lines (note rows)
  for (let i = 0; i <= totalNotes; i++) {
    const y = i * PIANO_ROLL_CONFIG.noteHeight;
    const midiNote = PIANO_ROLL_CONFIG.maxNote - i;
    const noteName = midiNote % 12;
    
    // Alternate row colors and highlight C notes
    if (noteName === 0) {
      ctx.fillStyle = '#1a1a24';
    } else if ([1, 3, 6, 8, 10].includes(noteName)) {
      ctx.fillStyle = '#0f0f14';
    } else {
      ctx.fillStyle = '#12121a';
    }
    ctx.fillRect(0, y, width, PIANO_ROLL_CONFIG.noteHeight);
    
    // Draw row line
    ctx.strokeStyle = '#2a2a38';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }
  
  // Draw vertical lines (time divisions)
  for (let i = 0; i <= total16ths; i++) {
    const x = i * PIANO_ROLL_CONFIG.sixteenthWidth;
    
    if (i % 16 === 0) {
      // Bar line
      ctx.strokeStyle = '#4a4a58';
      ctx.lineWidth = 2;
    } else if (i % 4 === 0) {
      // Beat line
      ctx.strokeStyle = '#3a3a48';
      ctx.lineWidth = 1;
    } else {
      // 16th note line
      ctx.strokeStyle = '#2a2a38';
      ctx.lineWidth = 1;
    }
    
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
  
  // Draw notes
  notes.forEach((note) => {
    drawNote(note);
  });
  
  // Draw playhead
  if (playheadPosition >= 0) {
    const x = playheadPosition * PIANO_ROLL_CONFIG.sixteenthWidth;
    ctx.fillStyle = '#f04747';
    ctx.fillRect(x - 1, 0, 2, height);
  }
  
  // Render timeline
  renderTimeline();
}

/**
 * Draw a single note
 * @param {Note} note - The note to draw
 */
function drawNote(note) {
  const x = note.start * PIANO_ROLL_CONFIG.sixteenthWidth;
  const y = (PIANO_ROLL_CONFIG.maxNote - note.pitch) * PIANO_ROLL_CONFIG.noteHeight;
  const w = note.duration * PIANO_ROLL_CONFIG.sixteenthWidth;
  const h = PIANO_ROLL_CONFIG.noteHeight;
  
  // Get note color based on current instrument
  const color = PIANO_ROLL_CONFIG.noteColors[pianoRollInstrument] || '#5865f2';
  
  // Check if selected or hovered
  const isSelected = selectedNotes.has(note.id);
  const isHovered = hoveredNote === note.id;
  
  // Draw note background
  ctx.fillStyle = color;
  if (isSelected) {
    ctx.fillStyle = '#ffffff';
  } else if (isHovered) {
    ctx.fillStyle = lightenColor(color, 20);
  }
  
  // Draw rounded rectangle with fallback for older browsers
  const radius = 3;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x + 1, y + 1, w - 2, h - 2, radius);
  } else {
    // Fallback for browsers without roundRect support
    const rx = x + 1, ry = y + 1, rw = w - 2, rh = h - 2;
    ctx.moveTo(rx + radius, ry);
    ctx.lineTo(rx + rw - radius, ry);
    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
    ctx.lineTo(rx + rw, ry + rh - radius);
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
    ctx.lineTo(rx + radius, ry + rh);
    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
    ctx.lineTo(rx, ry + radius);
    ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
    ctx.closePath();
  }
  ctx.fill();
  
  // Draw border
  ctx.strokeStyle = isSelected ? color : darkenColor(color, 20);
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Draw note name if wide enough
  if (w > 30) {
    ctx.fillStyle = isSelected ? color : '#ffffff';
    ctx.font = '10px Inter, sans-serif';
    ctx.textBaseline = 'middle';
    const noteName = window.AudioEngine ? window.AudioEngine.midiToNoteName(note.pitch) : `${note.pitch}`;
    ctx.fillText(noteName, x + 4, y + h / 2);
  }
}

/**
 * Render the timeline header
 */
function renderTimeline() {
  if (!timelineCtx) return;
  
  const width = timelineCanvas.width;
  const height = timelineCanvas.height;
  const total16ths = PIANO_ROLL_CONFIG.bars * PIANO_ROLL_CONFIG.beatsPerBar * PIANO_ROLL_CONFIG.sixteenthsPerBeat;
  
  // Clear
  timelineCtx.fillStyle = '#1a1a24';
  timelineCtx.fillRect(0, 0, width, height);
  
  // Draw bar and beat markers
  for (let i = 0; i <= total16ths; i++) {
    const x = i * PIANO_ROLL_CONFIG.sixteenthWidth;
    
    if (i % 16 === 0) {
      // Bar marker
      const barNumber = i / 16 + 1;
      timelineCtx.fillStyle = '#ffffff';
      timelineCtx.font = 'bold 12px Inter, sans-serif';
      timelineCtx.fillText(`${barNumber}`, x + 4, 14);
      
      timelineCtx.strokeStyle = '#4a4a58';
      timelineCtx.lineWidth = 2;
    } else if (i % 4 === 0) {
      // Beat marker
      const beat = (i % 16) / 4 + 1;
      timelineCtx.fillStyle = '#72767d';
      timelineCtx.font = '10px Inter, sans-serif';
      timelineCtx.fillText(`${beat}`, x + 4, 24);
      
      timelineCtx.strokeStyle = '#3a3a48';
      timelineCtx.lineWidth = 1;
    } else {
      timelineCtx.strokeStyle = '#2a2a38';
      timelineCtx.lineWidth = 1;
    }
    
    timelineCtx.beginPath();
    timelineCtx.moveTo(x + 0.5, height - 8);
    timelineCtx.lineTo(x + 0.5, height);
    timelineCtx.stroke();
  }
  
  // Draw bottom border
  timelineCtx.strokeStyle = '#3a3a48';
  timelineCtx.lineWidth = 1;
  timelineCtx.beginPath();
  timelineCtx.moveTo(0, height - 0.5);
  timelineCtx.lineTo(width, height - 0.5);
  timelineCtx.stroke();
  
  // Draw playhead on timeline
  if (playheadPosition >= 0) {
    const x = playheadPosition * PIANO_ROLL_CONFIG.sixteenthWidth;
    timelineCtx.fillStyle = '#f04747';
    timelineCtx.beginPath();
    timelineCtx.moveTo(x - 6, 0);
    timelineCtx.lineTo(x + 6, 0);
    timelineCtx.lineTo(x, 10);
    timelineCtx.closePath();
    timelineCtx.fill();
  }
}

/**
 * Update playhead position
 * @param {number} position - Position in 16th notes
 */
function setPlayheadPosition(position) {
  playheadPosition = position;
  render();
  
  // Auto-scroll to keep playhead visible
  if (scrollContainer && canvas) {
    const x = position * PIANO_ROLL_CONFIG.sixteenthWidth;
    const containerWidth = scrollContainer.clientWidth;
    const scrollLeft = scrollContainer.scrollLeft;
    
    if (x < scrollLeft || x > scrollLeft + containerWidth - 100) {
      scrollContainer.scrollLeft = Math.max(0, x - 100);
    }
  }
}

/**
 * Set current instrument (for note colors)
 * @param {string} instrument - Instrument ID
 */
function setCurrentInstrument(instrument) {
  pianoRollInstrument = instrument;
  render();
}

// ==================== MOUSE INTERACTION ====================

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragNote = null;

/**
 * Get grid position from mouse event
 * @param {MouseEvent} event - Mouse event
 * @returns {Object} Grid position { pitch, time }
 */
function getGridPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const time = Math.floor(x / PIANO_ROLL_CONFIG.sixteenthWidth);
  const pitch = PIANO_ROLL_CONFIG.maxNote - Math.floor(y / PIANO_ROLL_CONFIG.noteHeight);
  
  return { time, pitch };
}

/**
 * Handle mouse down on canvas
 * @param {MouseEvent} event - Mouse event
 */
function handleMouseDown(event) {
  if (event.button === 2) return; // Right click handled separately
  
  const { time, pitch } = getGridPosition(event);
  const existingNote = getNoteAt(pitch, time);
  
  if (existingNote) {
    // Select existing note
    selectNote(existingNote.id, event.ctrlKey || event.metaKey);
    isDragging = true;
    dragNote = existingNote;
    dragStartX = time;
    dragStartY = pitch;
  } else {
    // Add new note
    const note = addNote(pitch, time, 4, 0.8);
    if (note) {
      selectNote(note.id);
      
      // Play preview
      if (window.AudioEngine) {
        window.AudioEngine.playPreviewNote(pianoRollInstrument, pitch);
      }
    }
  }
}

/**
 * Handle mouse move on canvas
 * @param {MouseEvent} event - Mouse event
 */
function handleMouseMove(event) {
  const { time, pitch } = getGridPosition(event);
  
  // Update hovered note
  const noteAtPosition = getNoteAt(pitch, time);
  const newHoveredNote = noteAtPosition ? noteAtPosition.id : null;
  
  if (newHoveredNote !== hoveredNote) {
    hoveredNote = newHoveredNote;
    render();
  }
  
  // Handle dragging (optional feature for moving notes)
  if (isDragging && dragNote) {
    const deltaX = time - dragStartX;
    const deltaY = pitch - dragStartY;
    
    // Move note if delta is significant
    if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
      const newStart = Math.max(0, dragNote.start + deltaX);
      const newPitch = Math.max(PIANO_ROLL_CONFIG.minNote, 
                                Math.min(PIANO_ROLL_CONFIG.maxNote, dragNote.pitch + deltaY));
      
      // Validate new position
      const maxPosition = PIANO_ROLL_CONFIG.bars * PIANO_ROLL_CONFIG.beatsPerBar * 
                          PIANO_ROLL_CONFIG.sixteenthsPerBeat;
      if (newStart + dragNote.duration <= maxPosition) {
        dragNote.start = newStart;
        dragNote.pitch = newPitch;
        dragStartX = time;
        dragStartY = pitch;
        render();
      }
    }
  }
}

/**
 * Handle mouse up on canvas
 * @param {MouseEvent} event - Mouse event
 */
function handleMouseUp(event) {
  isDragging = false;
  dragNote = null;
}

/**
 * Handle mouse leave on canvas
 * @param {MouseEvent} event - Mouse event
 */
function handleMouseLeave(event) {
  if (hoveredNote) {
    hoveredNote = null;
    render();
  }
}

/**
 * Handle right click (context menu) for deletion
 * @param {MouseEvent} event - Mouse event
 */
function handleContextMenu(event) {
  event.preventDefault();
  
  const { time, pitch } = getGridPosition(event);
  const existingNote = getNoteAt(pitch, time);
  
  if (existingNote) {
    removeNote(existingNote.id);
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Lighten a hex color
 * @param {string} color - Hex color
 * @param {number} percent - Percentage to lighten
 * @returns {string} Lightened hex color
 */
function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

/**
 * Darken a hex color
 * @param {string} color - Hex color
 * @param {number} percent - Percentage to darken
 * @returns {string} Darkened hex color
 */
function darkenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

/**
 * Get the configuration object
 * @returns {Object} Piano roll configuration
 */
function getConfig() {
  return { ...PIANO_ROLL_CONFIG };
}

// Export functions for use by other modules
window.PianoRoll = {
  initCanvas,
  render,
  addNote,
  removeNote,
  removeSelectedNotes,
  clearAllNotes,
  getNoteAt,
  getAllNotes,
  setAllNotes,
  selectNote,
  clearSelection,
  setPlayheadPosition,
  setCurrentInstrument,
  getConfig,
  generateNoteId
};
