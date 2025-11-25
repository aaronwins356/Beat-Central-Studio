/**
 * ui.js - UI Controller for NoteLab DAW
 * 
 * This module handles:
 * - DOM element initialization
 * - Event listeners for all UI controls
 * - Keyboard input mapping
 * - Mini piano interaction
 * - Modal dialogs
 * - Drum machine panel
 * - Instrument rack
 * - JSON export/import
 * - WAV export
 * - Glue between UI elements and engine functions
 */

// ==================== STATE ====================

let currentInstrument = 'piano';
let currentSongId = null;
let currentSongName = 'Untitled';
let drumPanelCollapsed = false;

// Key mapping for computer keyboard input
// Maps keyboard keys to MIDI notes (starting from C4 = 60)
const KEY_NOTE_MAP = {
  'a': 60,  // C4
  'w': 61,  // C#4
  's': 62,  // D4
  'e': 63,  // D#4
  'd': 64,  // E4
  'f': 65,  // F4
  't': 66,  // F#4
  'g': 67,  // G4
  'y': 68,  // G#4
  'h': 69,  // A4
  'u': 70,  // A#4
  'j': 71,  // B4
  'k': 72,  // C5
  'o': 73,  // C#5
  'l': 74,  // D5
  'p': 75,  // D#5
  ';': 76,  // E5
};

// Track pressed keys to avoid repeated triggers
const pressedKeys = new Set();

// ==================== INITIALIZATION ====================

/**
 * Initialize the UI when DOM is ready
 */
function init() {
  // Initialize audio engine (will be activated on first user interaction)
  if (window.AudioEngine) {
    window.AudioEngine.init();
  }
  
  // Initialize piano roll
  initPianoRoll();
  
  // Initialize drum machine
  initDrumMachine();
  
  // Initialize event listeners
  initTransportControls();
  initInstrumentSelector();
  initInstrumentRack();
  initBPMControl();
  initVolumeControl();
  initEffectControls();
  initMiniPiano();
  initKeyboardInput();
  initSongControls();
  initModals();
  initPianoKeysSidebar();
  initDrumPanelToggle();
  
  // Set up transport callbacks
  if (window.Transport) {
    window.Transport.setPlayStateCallback(handlePlayStateChange);
    window.Transport.setPositionCallback(handlePositionUpdate);
  }
  
  // Load last song or create new
  loadLastSong();
  
  console.log('NoteLab DAW UI initialized');
}

/**
 * Initialize the piano roll canvas
 */
function initPianoRoll() {
  const canvas = document.getElementById('grid-canvas');
  const scrollContainer = document.getElementById('piano-roll-scroll');
  const timelineCanvas = document.getElementById('timeline-canvas');
  
  if (canvas && scrollContainer && timelineCanvas && window.PianoRoll) {
    window.PianoRoll.initCanvas(canvas, scrollContainer, timelineCanvas);
  }
}

/**
 * Initialize the drum machine
 */
function initDrumMachine() {
  const container = document.getElementById('drum-machine-container');
  if (container && window.DrumMachine) {
    window.DrumMachine.init(container);
  }
}

/**
 * Initialize drum panel toggle
 */
function initDrumPanelToggle() {
  const toggle = document.getElementById('drum-panel-toggle');
  const panel = document.querySelector('.drum-panel');
  
  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      drumPanelCollapsed = !drumPanelCollapsed;
      panel.classList.toggle('collapsed', drumPanelCollapsed);
    });
  }
}

/**
 * Initialize piano keys sidebar
 */
function initPianoKeysSidebar() {
  const container = document.getElementById('piano-keys');
  if (!container) return;
  
  const config = window.PianoRoll ? window.PianoRoll.getConfig() : { minNote: 12, maxNote: 108 };
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  container.innerHTML = '';
  
  for (let midi = config.maxNote; midi >= config.minNote; midi--) {
    const noteName = noteNames[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    const isBlackKey = noteName.includes('#');
    const isCKey = noteName === 'C';
    
    const keyDiv = document.createElement('div');
    keyDiv.className = 'piano-key';
    if (isBlackKey) keyDiv.classList.add('black-key');
    if (isCKey) keyDiv.classList.add('c-key');
    keyDiv.textContent = isCKey ? `C${octave}` : '';
    keyDiv.dataset.midi = midi;
    
    container.appendChild(keyDiv);
  }
}

// ==================== TRANSPORT CONTROLS ====================

/**
 * Initialize transport control buttons
 */
function initTransportControls() {
  const playBtn = document.getElementById('play-btn');
  const stopBtn = document.getElementById('stop-btn');
  const recordBtn = document.getElementById('record-btn');
  const loopToggle = document.getElementById('loop-toggle');
  const metronomeToggle = document.getElementById('metronome-toggle');
  
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      resumeAudioAndDo(() => {
        if (window.Transport) {
          const state = window.Transport.getState();
          if (state.isPlaying && !state.isPaused) {
            window.Transport.pause();
          } else {
            window.Transport.play();
          }
        }
      });
    });
  }
  
  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      if (window.Transport) {
        window.Transport.stop();
      }
    });
  }
  
  if (recordBtn) {
    recordBtn.addEventListener('click', () => {
      if (window.Transport) {
        const isRecording = window.Transport.toggleRecord();
        recordBtn.classList.toggle('active', isRecording);
        updateRecordIndicator(isRecording);
      }
    });
  }
  
  if (loopToggle) {
    loopToggle.addEventListener('click', () => {
      if (window.Transport) {
        const isLooping = window.Transport.toggleLoop();
        loopToggle.classList.toggle('active', isLooping);
      }
    });
    // Set initial state
    loopToggle.classList.add('active');
  }
  
  if (metronomeToggle) {
    metronomeToggle.addEventListener('click', () => {
      resumeAudioAndDo(() => {
        if (window.Transport) {
          const isMetronome = window.Transport.toggleMetronome();
          metronomeToggle.classList.toggle('active', isMetronome);
        }
      });
    });
  }
}

/**
 * Handle play state changes from transport
 * @param {Object} state - { isPlaying, isPaused }
 */
function handlePlayStateChange(state) {
  const playBtn = document.getElementById('play-btn');
  if (playBtn) {
    if (state.isPlaying && !state.isPaused) {
      playBtn.innerHTML = '⏸';
      playBtn.classList.add('playing');
    } else {
      playBtn.innerHTML = '▶';
      playBtn.classList.remove('playing');
    }
  }
}

/**
 * Handle position updates from transport
 * @param {number} position - Position in 16th notes
 */
function handlePositionUpdate(position) {
  const positionDisplay = document.getElementById('position-display');
  if (positionDisplay) {
    const bar = Math.floor(position / 16) + 1;
    const beat = Math.floor((position % 16) / 4) + 1;
    const sixteenth = (position % 4) + 1;
    positionDisplay.textContent = `${bar}.${beat}.${sixteenth}`;
  }
}

/**
 * Update record indicator
 * @param {boolean} isRecording - Whether recording is active
 */
function updateRecordIndicator(isRecording) {
  const indicator = document.getElementById('record-indicator');
  if (indicator) {
    indicator.classList.toggle('recording', isRecording);
    const text = indicator.querySelector('.record-text');
    if (text) {
      text.textContent = isRecording ? 'REC' : 'READY';
    }
  }
}

// ==================== INSTRUMENT & BPM ====================

/**
 * Initialize instrument selector
 */
function initInstrumentSelector() {
  const selector = document.getElementById('instrument-select');
  if (!selector) return;
  
  selector.addEventListener('change', (e) => {
    currentInstrument = e.target.value;
    if (window.PianoRoll) {
      window.PianoRoll.setCurrentInstrument(currentInstrument);
    }
    updateInstrumentRack();
  });
}

/**
 * Initialize instrument rack
 */
function initInstrumentRack() {
  const items = document.querySelectorAll('.instrument-item');
  items.forEach((item) => {
    item.addEventListener('click', () => {
      const instrument = item.dataset.instrument;
      if (instrument) {
        currentInstrument = instrument;
        
        // Update select dropdown
        const selector = document.getElementById('instrument-select');
        if (selector) {
          selector.value = instrument;
        }
        
        // Update piano roll
        if (window.PianoRoll) {
          window.PianoRoll.setCurrentInstrument(instrument);
        }
        
        // Play preview note
        resumeAudioAndDo(() => {
          if (window.AudioEngine) {
            window.AudioEngine.playPreviewNote(instrument, 60);
          }
        });
        
        updateInstrumentRack();
      }
    });
  });
  
  updateInstrumentRack();
}

/**
 * Update instrument rack UI
 */
function updateInstrumentRack() {
  const items = document.querySelectorAll('.instrument-item');
  items.forEach((item) => {
    item.classList.toggle('active', item.dataset.instrument === currentInstrument);
  });
}

/**
 * Initialize BPM control
 */
function initBPMControl() {
  const bpmInput = document.getElementById('bpm-input');
  if (!bpmInput) return;
  
  bpmInput.addEventListener('change', (e) => {
    const bpm = parseInt(e.target.value, 10);
    if (bpm >= 20 && bpm <= 300) {
      if (window.Transport) {
        window.Transport.setBPM(bpm);
      }
    } else {
      e.target.value = window.Transport ? window.Transport.getBPM() : 120;
    }
  });
}

/**
 * Initialize volume control
 */
function initVolumeControl() {
  const volumeSlider = document.getElementById('master-volume');
  if (!volumeSlider) return;
  
  volumeSlider.addEventListener('input', (e) => {
    const volume = parseFloat(e.target.value);
    if (window.AudioEngine) {
      window.AudioEngine.setMasterVolume(volume);
    }
  });
}

/**
 * Get current instrument
 * @returns {string} Current instrument ID
 */
function getCurrentInstrument() {
  return currentInstrument;
}

// ==================== EFFECT CONTROLS ====================

/**
 * Initialize effect controls
 */
function initEffectControls() {
  // Reverb toggle
  const reverbToggle = document.getElementById('reverb-toggle');
  if (reverbToggle) {
    reverbToggle.addEventListener('click', () => {
      reverbToggle.classList.toggle('active');
      if (window.AudioEngine) {
        window.AudioEngine.updateEffectSettings('reverb', { 
          enabled: reverbToggle.classList.contains('active') 
        });
      }
    });
  }
  
  // Reverb mix
  const reverbMix = document.getElementById('reverb-mix');
  if (reverbMix) {
    reverbMix.addEventListener('input', (e) => {
      if (window.AudioEngine) {
        window.AudioEngine.updateEffectSettings('reverb', { 
          mix: parseFloat(e.target.value) 
        });
      }
    });
  }
  
  // Delay toggle
  const delayToggle = document.getElementById('delay-toggle');
  if (delayToggle) {
    delayToggle.addEventListener('click', () => {
      delayToggle.classList.toggle('active');
      if (window.AudioEngine) {
        window.AudioEngine.updateEffectSettings('delay', { 
          enabled: delayToggle.classList.contains('active') 
        });
      }
    });
  }
  
  // Delay time
  const delayTime = document.getElementById('delay-time');
  if (delayTime) {
    delayTime.addEventListener('input', (e) => {
      if (window.AudioEngine) {
        window.AudioEngine.updateEffectSettings('delay', { 
          time: parseFloat(e.target.value) 
        });
      }
    });
  }
  
  // Delay feedback
  const delayFeedback = document.getElementById('delay-feedback');
  if (delayFeedback) {
    delayFeedback.addEventListener('input', (e) => {
      if (window.AudioEngine) {
        window.AudioEngine.updateEffectSettings('delay', { 
          feedback: parseFloat(e.target.value) 
        });
      }
    });
  }
  
  // Delay mix
  const delayMix = document.getElementById('delay-mix');
  if (delayMix) {
    delayMix.addEventListener('input', (e) => {
      if (window.AudioEngine) {
        window.AudioEngine.updateEffectSettings('delay', { 
          mix: parseFloat(e.target.value) 
        });
      }
    });
  }
}

// ==================== MINI PIANO ====================

/**
 * Initialize mini piano
 */
function initMiniPiano() {
  const container = document.getElementById('mini-piano');
  if (!container) return;
  
  // Create keys from C3 to C5 (MIDI 48-72)
  const keys = [];
  for (let midi = 48; midi <= 72; midi++) {
    const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    const isBlack = noteName.includes('#');
    
    const key = document.createElement('div');
    key.className = `mini-piano-key ${isBlack ? 'black' : 'white'}`;
    key.dataset.midi = midi;
    
    // Add label for C notes
    if (noteName === 'C') {
      const label = document.createElement('span');
      label.className = 'key-label';
      label.textContent = `C${octave}`;
      key.appendChild(label);
    }
    
    key.addEventListener('mousedown', (e) => {
      e.preventDefault();
      playMiniPianoKey(midi);
      key.classList.add('pressed');
    });
    
    key.addEventListener('mouseup', () => {
      key.classList.remove('pressed');
    });
    
    key.addEventListener('mouseleave', () => {
      key.classList.remove('pressed');
    });
    
    keys.push({ midi, isBlack, element: key });
  }
  
  // Add keys in correct order (white keys first, then black keys overlaid)
  container.innerHTML = '';
  keys.filter(k => !k.isBlack).forEach(k => container.appendChild(k.element));
  // Re-insert black keys in correct positions
  keys.filter(k => k.isBlack).forEach(k => {
    const whiteKeyIndex = keys.findIndex(wk => wk.midi === k.midi - 1 && !wk.isBlack);
    if (whiteKeyIndex >= 0) {
      container.appendChild(k.element);
    }
  });
  
  // Rebuild mini piano with proper ordering
  buildMiniPiano();
}

/**
 * Build mini piano with proper key arrangement
 */
function buildMiniPiano() {
  const container = document.getElementById('mini-piano');
  if (!container) return;
  
  container.innerHTML = '';
  
  // C3 (48) to C5 (72) = 25 notes
  // White keys: C, D, E, F, G, A, B (7 per octave)
  // Black keys: C#, D#, F#, G#, A# (5 per octave)
  
  for (let midi = 48; midi <= 72; midi++) {
    const noteInOctave = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);
    
    if (isBlack) continue; // Skip black keys in first pass
    
    const key = document.createElement('div');
    key.className = 'mini-piano-key';
    key.dataset.midi = midi;
    
    if (noteInOctave === 0) {
      const label = document.createElement('span');
      label.className = 'key-label';
      label.textContent = `C${octave}`;
      key.appendChild(label);
    }
    
    key.addEventListener('mousedown', (e) => {
      e.preventDefault();
      playMiniPianoKey(midi);
      key.classList.add('pressed');
    });
    
    key.addEventListener('mouseup', () => key.classList.remove('pressed'));
    key.addEventListener('mouseleave', () => key.classList.remove('pressed'));
    
    container.appendChild(key);
  }
  
  // Add black keys
  for (let midi = 48; midi <= 72; midi++) {
    const noteInOctave = midi % 12;
    const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);
    
    if (!isBlack) continue;
    
    const key = document.createElement('div');
    key.className = 'mini-piano-key black';
    key.dataset.midi = midi;
    
    key.addEventListener('mousedown', (e) => {
      e.preventDefault();
      playMiniPianoKey(midi);
      key.classList.add('pressed');
    });
    
    key.addEventListener('mouseup', () => key.classList.remove('pressed'));
    key.addEventListener('mouseleave', () => key.classList.remove('pressed'));
    
    container.appendChild(key);
  }
}

/**
 * Play a mini piano key
 * @param {number} midi - MIDI note number
 */
function playMiniPianoKey(midi) {
  resumeAudioAndDo(() => {
    if (window.AudioEngine) {
      window.AudioEngine.playPreviewNote(currentInstrument, midi);
    }
    
    // Record if in record mode
    if (window.Transport && window.Transport.isRecording()) {
      window.Transport.recordNote(midi, 4);
    }
  });
}

// ==================== KEYBOARD INPUT ====================

/**
 * Initialize keyboard input
 */
function initKeyboardInput() {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
}

/**
 * Handle key down events
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyDown(event) {
  // Ignore if typing in an input
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return;
  }
  
  const key = event.key.toLowerCase();
  
  // Spacebar for play/pause
  if (event.code === 'Space') {
    event.preventDefault();
    resumeAudioAndDo(() => {
      if (window.Transport) {
        const state = window.Transport.getState();
        if (state.isPlaying && !state.isPaused) {
          window.Transport.pause();
        } else {
          window.Transport.play();
        }
      }
    });
    return;
  }
  
  // Delete key for removing selected notes
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (window.PianoRoll) {
      window.PianoRoll.removeSelectedNotes();
    }
    return;
  }
  
  // Musical keys
  if (KEY_NOTE_MAP[key] && !pressedKeys.has(key)) {
    pressedKeys.add(key);
    const midi = KEY_NOTE_MAP[key];
    
    resumeAudioAndDo(() => {
      if (window.AudioEngine) {
        window.AudioEngine.playPreviewNote(currentInstrument, midi);
      }
      
      // Record if in record mode
      if (window.Transport && window.Transport.isRecording()) {
        window.Transport.recordNote(midi, 4);
      }
    });
    
    // Visual feedback on mini piano
    const miniKey = document.querySelector(`.mini-piano-key[data-midi="${midi}"]`);
    if (miniKey) {
      miniKey.classList.add('pressed');
    }
  }
}

/**
 * Handle key up events
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyUp(event) {
  const key = event.key.toLowerCase();
  
  if (KEY_NOTE_MAP[key]) {
    pressedKeys.delete(key);
    
    const midi = KEY_NOTE_MAP[key];
    const miniKey = document.querySelector(`.mini-piano-key[data-midi="${midi}"]`);
    if (miniKey) {
      miniKey.classList.remove('pressed');
    }
  }
}

// ==================== SONG CONTROLS ====================

/**
 * Initialize song control buttons
 */
function initSongControls() {
  const newBtn = document.getElementById('new-song-btn');
  const saveBtn = document.getElementById('save-btn');
  const loadBtn = document.getElementById('load-btn');
  const exportBtn = document.getElementById('export-btn');
  const exportWavBtn = document.getElementById('export-wav-btn');
  
  if (newBtn) {
    newBtn.addEventListener('click', createNewSong);
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', saveCurrentSong);
  }
  
  if (loadBtn) {
    loadBtn.addEventListener('click', showLoadModal);
  }
  
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToMP3);
  }
  
  if (exportWavBtn) {
    exportWavBtn.addEventListener('click', exportToWAV);
  }
}

/**
 * Create a new song
 */
function createNewSong() {
  if (window.Transport) {
    window.Transport.stop();
  }
  
  if (window.PianoRoll) {
    window.PianoRoll.clearAllNotes();
  }
  
  // Clear drum pattern
  if (window.DrumMachine) {
    window.DrumMachine.clearPattern();
  }
  
  currentSongId = null;
  currentSongName = 'Untitled';
  updateSongTitle();
  
  // Reset BPM
  const bpmInput = document.getElementById('bpm-input');
  if (bpmInput) {
    bpmInput.value = 120;
    if (window.Transport) {
      window.Transport.setBPM(120);
    }
  }
  
  // Reset instrument
  const instrumentSelect = document.getElementById('instrument-select');
  if (instrumentSelect) {
    instrumentSelect.value = 'piano';
    currentInstrument = 'piano';
    if (window.PianoRoll) {
      window.PianoRoll.setCurrentInstrument('piano');
    }
    updateInstrumentRack();
  }
}

/**
 * Save current song
 */
function saveCurrentSong() {
  if (!currentSongId) {
    showSaveModal();
    return;
  }
  
  const song = collectSongData();
  if (window.Storage) {
    window.Storage.saveSong(song);
    showNotification('Song saved!');
  }
}

/**
 * Collect current song data
 * @returns {Object} Song data
 */
function collectSongData() {
  const notes = window.PianoRoll ? window.PianoRoll.getAllNotes() : [];
  const bpm = window.Transport ? window.Transport.getBPM() : 120;
  const effects = window.AudioEngine ? window.AudioEngine.getEffectSettings() : {};
  const drumPattern = window.DrumMachine ? window.DrumMachine.getPattern() : {};
  const drumLaneStates = window.DrumMachine ? window.DrumMachine.getLaneStates() : {};
  
  return {
    id: currentSongId || `song_${Date.now()}`,
    name: currentSongName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bpm,
    instrument: currentInstrument,
    notes: notes.map(n => ({
      pitch: n.pitch,
      start: n.start,
      duration: n.duration,
      velocity: n.velocity
    })),
    drumPattern,
    drumLaneStates,
    effects
  };
}

/**
 * Load last song or create new
 */
function loadLastSong() {
  if (!window.Storage) return;
  
  const lastSongId = window.Storage.getCurrentSongId();
  if (lastSongId) {
    const song = window.Storage.loadSong(lastSongId);
    if (song) {
      applySongData(song);
      return;
    }
  }
  
  // No last song, start fresh
  createNewSong();
}

/**
 * Apply song data to the app
 * @param {Object} song - Song data
 */
function applySongData(song) {
  currentSongId = song.id;
  currentSongName = song.name;
  updateSongTitle();
  
  // Apply BPM
  if (window.Transport) {
    window.Transport.setBPM(song.bpm || 120);
  }
  const bpmInput = document.getElementById('bpm-input');
  if (bpmInput) {
    bpmInput.value = song.bpm || 120;
  }
  
  // Apply instrument
  currentInstrument = song.instrument || 'piano';
  const instrumentSelect = document.getElementById('instrument-select');
  if (instrumentSelect) {
    instrumentSelect.value = currentInstrument;
  }
  if (window.PianoRoll) {
    window.PianoRoll.setCurrentInstrument(currentInstrument);
  }
  updateInstrumentRack();
  
  // Apply notes
  if (window.PianoRoll && song.notes) {
    window.PianoRoll.setAllNotes(song.notes);
  }
  
  // Apply drum pattern
  if (window.DrumMachine) {
    if (song.drumPattern) {
      window.DrumMachine.setPattern(song.drumPattern);
    }
    if (song.drumLaneStates) {
      window.DrumMachine.setLaneStates(song.drumLaneStates);
    }
  }
  
  // Apply effects
  if (window.AudioEngine && song.effects) {
    if (song.effects.reverb) {
      window.AudioEngine.updateEffectSettings('reverb', song.effects.reverb);
      const reverbToggle = document.getElementById('reverb-toggle');
      if (reverbToggle) {
        reverbToggle.classList.toggle('active', song.effects.reverb.enabled);
      }
    }
    if (song.effects.delay) {
      window.AudioEngine.updateEffectSettings('delay', song.effects.delay);
      const delayToggle = document.getElementById('delay-toggle');
      if (delayToggle) {
        delayToggle.classList.toggle('active', song.effects.delay.enabled);
      }
    }
  }
}

/**
 * Update song title in header
 */
function updateSongTitle() {
  const titleEl = document.getElementById('song-title');
  if (titleEl) {
    titleEl.textContent = currentSongName;
  }
}

// ==================== MODALS ====================

/**
 * Initialize modal functionality
 */
function initModals() {
  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeAllModals();
      }
    });
  });
  
  // Close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  
  // Save modal confirm
  const saveConfirm = document.getElementById('save-confirm');
  if (saveConfirm) {
    saveConfirm.addEventListener('click', confirmSave);
  }
  
  // Load modal song selection
  const loadConfirm = document.getElementById('load-confirm');
  if (loadConfirm) {
    loadConfirm.addEventListener('click', confirmLoad);
  }
  
  // JSON export button
  const exportJsonBtn = document.getElementById('export-json-btn');
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', exportProjectToJSON);
  }
  
  // JSON import button
  const importJsonBtn = document.getElementById('import-json-btn');
  if (importJsonBtn) {
    importJsonBtn.addEventListener('click', () => {
      document.getElementById('json-file-input').click();
    });
  }
  
  // File input change handler
  const fileInput = document.getElementById('json-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', handleJSONImport);
  }
}

/**
 * Show save modal
 */
function showSaveModal() {
  const modal = document.getElementById('save-modal');
  const nameInput = document.getElementById('song-name-input');
  
  if (modal && nameInput) {
    nameInput.value = currentSongName;
    modal.classList.add('visible');
    nameInput.focus();
    nameInput.select();
  }
}

/**
 * Confirm save in modal
 */
function confirmSave() {
  const nameInput = document.getElementById('song-name-input');
  if (!nameInput) return;
  
  const name = nameInput.value.trim() || 'Untitled';
  currentSongName = name;
  
  if (!currentSongId) {
    currentSongId = `song_${Date.now()}`;
  }
  
  const song = collectSongData();
  song.name = name;
  
  if (window.Storage) {
    window.Storage.saveSong(song);
    window.Storage.setCurrentSongId(song.id);
  }
  
  updateSongTitle();
  closeAllModals();
  showNotification('Song saved!');
}

/**
 * Show load modal
 */
function showLoadModal() {
  const modal = document.getElementById('load-modal');
  const songList = document.getElementById('song-list');
  
  if (!modal || !songList) return;
  
  // Populate song list
  const songs = window.Storage ? window.Storage.getAllSongs() : [];
  
  if (songs.length === 0) {
    songList.innerHTML = '<div class="no-songs">No saved songs yet</div>';
  } else {
    songList.innerHTML = '';
    songs.forEach(song => {
      const item = document.createElement('div');
      item.className = 'song-item';
      item.dataset.songId = song.id;
      
      const date = new Date(song.updatedAt);
      const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      item.innerHTML = `
        <div class="song-info">
          <div class="song-name">${escapeHtml(song.name)}</div>
          <div class="song-meta">${song.notes ? song.notes.length : 0} notes • ${song.bpm} BPM • ${dateStr}</div>
        </div>
        <div class="song-actions">
          <button class="btn btn-danger btn-icon delete-song-btn" data-song-id="${song.id}" title="Delete">🗑</button>
        </div>
      `;
      
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-song-btn')) return;
        document.querySelectorAll('.song-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
      });
      
      const deleteBtn = item.querySelector('.delete-song-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteSong(song.id, item);
        });
      }
      
      songList.appendChild(item);
    });
  }
  
  modal.classList.add('visible');
}

/**
 * Confirm load in modal
 */
function confirmLoad() {
  const selected = document.querySelector('.song-item.selected');
  if (!selected) {
    showNotification('Please select a song', 'warning');
    return;
  }
  
  const songId = selected.dataset.songId;
  const song = window.Storage ? window.Storage.loadSong(songId) : null;
  
  if (song) {
    if (window.Transport) {
      window.Transport.stop();
    }
    applySongData(song);
    closeAllModals();
    showNotification(`Loaded: ${song.name}`);
  }
}

/**
 * Delete a song
 * @param {string} songId - Song ID
 * @param {HTMLElement} element - Song item element
 */
function deleteSong(songId, element) {
  if (!confirm('Delete this song?')) return;
  
  if (window.Storage) {
    window.Storage.deleteSong(songId);
  }
  
  if (element) {
    element.remove();
  }
  
  // If deleting current song, clear it
  if (songId === currentSongId) {
    createNewSong();
  }
  
  showNotification('Song deleted');
}

/**
 * Close all modals
 */
function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('visible');
  });
}

// ==================== MP3 EXPORT ====================

/**
 * Export current song to MP3
 */
async function exportToMP3() {
  if (!window.AudioEngine || !window.PianoRoll || !window.Transport) {
    showNotification('Export not available', 'error');
    return;
  }
  
  showLoadingOverlay('Rendering audio...');
  
  try {
    const notes = window.PianoRoll.getAllNotes();
    const bpm = window.Transport.getBPM();
    const config = window.PianoRoll.getConfig();
    
    // Calculate total duration (8 bars + release time)
    const total16ths = config.bars * config.beatsPerBar * config.sixteenthsPerBeat;
    const secondsPer16th = 60 / bpm / 4;
    const duration = total16ths * secondsPer16th + 2; // Add 2 seconds for release
    
    // Render to buffer
    const buffer = await window.AudioEngine.renderToBuffer(notes, currentInstrument, bpm, duration);
    
    // Convert to MP3
    showLoadingOverlay('Encoding MP3...');
    const mp3Blob = await encodeMP3(buffer);
    
    // Download
    const url = URL.createObjectURL(mp3Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSongName.replace(/[^a-z0-9]/gi, '_')}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    hideLoadingOverlay();
    showNotification('MP3 exported successfully!');
    
  } catch (error) {
    console.error('Export error:', error);
    hideLoadingOverlay();
    showNotification('Export failed: ' + error.message, 'error');
  }
}

/**
 * Encode AudioBuffer to MP3 using lamejs
 * @param {AudioBuffer} buffer - Audio buffer to encode
 * @returns {Promise<Blob>} MP3 blob
 */
async function encodeMP3(buffer) {
  // Load lamejs if not already loaded
  if (!window.lamejs) {
    await loadScript('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js');
  }
  
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.length;
  
  // Get channel data
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = channels > 1 ? buffer.getChannelData(1) : leftChannel;
  
  // Convert to 16-bit PCM
  const leftSamples = new Int16Array(samples);
  const rightSamples = new Int16Array(samples);
  
  for (let i = 0; i < samples; i++) {
    leftSamples[i] = Math.max(-32768, Math.min(32767, Math.floor(leftChannel[i] * 32767)));
    rightSamples[i] = Math.max(-32768, Math.min(32767, Math.floor(rightChannel[i] * 32767)));
  }
  
  // Encode with lamejs
  const mp3encoder = new lamejs.Mp3Encoder(2, sampleRate, 128);
  const mp3Data = [];
  
  const blockSize = 1152;
  for (let i = 0; i < samples; i += blockSize) {
    const leftChunk = leftSamples.subarray(i, i + blockSize);
    const rightChunk = rightSamples.subarray(i, i + blockSize);
    const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }
  
  const finalBuf = mp3encoder.flush();
  if (finalBuf.length > 0) {
    mp3Data.push(finalBuf);
  }
  
  return new Blob(mp3Data, { type: 'audio/mp3' });
}

/**
 * Load a script dynamically
 * @param {string} src - Script URL
 * @returns {Promise} Resolves when script is loaded
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ==================== WAV EXPORT ====================

/**
 * Export current song to WAV
 */
async function exportToWAV() {
  if (!window.AudioEngine || !window.PianoRoll || !window.Transport) {
    showNotification('Export not available', 'error');
    return;
  }
  
  showLoadingOverlay('Rendering audio...');
  
  try {
    const notes = window.PianoRoll.getAllNotes();
    const bpm = window.Transport.getBPM();
    const config = window.PianoRoll.getConfig();
    
    // Calculate total duration (8 bars + release time)
    const total16ths = config.bars * config.beatsPerBar * config.sixteenthsPerBeat;
    const secondsPer16th = 60 / bpm / 4;
    const duration = total16ths * secondsPer16th + 2;
    
    // Render to buffer
    const buffer = await window.AudioEngine.renderToBuffer(notes, currentInstrument, bpm, duration);
    
    // Convert to WAV
    showLoadingOverlay('Creating WAV file...');
    const wavBlob = window.AudioEngine.audioBufferToWav(buffer);
    
    // Download
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSongName.replace(/[^a-z0-9]/gi, '_')}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    hideLoadingOverlay();
    showNotification('WAV exported successfully!');
    
  } catch (error) {
    console.error('WAV export error:', error);
    hideLoadingOverlay();
    showNotification('WAV export failed: ' + error.message, 'error');
  }
}

// ==================== JSON EXPORT/IMPORT ====================

/**
 * Export current project to JSON file
 */
function exportProjectToJSON() {
  const song = collectSongData();
  const jsonString = JSON.stringify(song, null, 2);
  
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentSongName.replace(/[^a-z0-9]/gi, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification('Project exported as JSON!');
  closeAllModals();
}

/**
 * Handle JSON file import
 * @param {Event} event - File input change event
 */
function handleJSONImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const song = JSON.parse(e.target.result);
      
      // Validate required fields
      if (!song.name) {
        throw new Error('Invalid song format: missing name');
      }
      
      // Generate new ID to avoid conflicts
      song.id = `song_${Date.now()}`;
      song.name = song.name + ' (imported)';
      
      // Apply the song data
      if (window.Transport) {
        window.Transport.stop();
      }
      
      applySongData(song);
      
      // Save to storage
      if (window.Storage) {
        window.Storage.saveSong(song);
        window.Storage.setCurrentSongId(song.id);
      }
      
      currentSongId = song.id;
      currentSongName = song.name;
      updateSongTitle();
      
      closeAllModals();
      showNotification('Project imported successfully!');
      
    } catch (error) {
      console.error('JSON import error:', error);
      showNotification('Import failed: ' + error.message, 'error');
    }
  };
  
  reader.readAsText(file);
  
  // Reset file input
  event.target.value = '';
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Resume audio context and execute callback
 * @param {Function} callback - Function to execute
 */
function resumeAudioAndDo(callback) {
  if (window.AudioEngine) {
    window.AudioEngine.resumeAudioContext().then(callback);
  } else {
    callback();
  }
}

/**
 * Show notification
 * @param {string} message - Message to show
 * @param {string} type - 'success', 'warning', or 'error'
 */
function showNotification(message, type = 'success') {
  const container = document.getElementById('notifications');
  if (!container) return;
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  container.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Show loading overlay
 * @param {string} message - Loading message
 */
function showLoadingOverlay(message = 'Loading...') {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">${message}</div>
    `;
    document.body.appendChild(overlay);
  } else {
    const text = overlay.querySelector('.loading-text');
    if (text) text.textContent = message;
    overlay.style.display = 'flex';
  }
}

/**
 * Hide loading overlay
 */
function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== INITIALIZATION ====================

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Export functions for use by other modules
window.UI = {
  getCurrentInstrument,
  showNotification,
  showLoadingOverlay,
  hideLoadingOverlay
};
