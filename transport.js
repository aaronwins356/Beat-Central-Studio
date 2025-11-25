/**
 * transport.js - Transport Controls & Scheduler for NoteLab
 * 
 * This module handles:
 * - Playback scheduling using AudioContext time
 * - Play/Pause/Stop controls
 * - Loop handling
 * - Metronome
 * - BPM management
 */

// ==================== TRANSPORT STATE ====================

const transportState = {
  isPlaying: false,
  isPaused: false,
  position: 0,        // Current position in 16th notes
  bpm: 120,
  loopEnabled: true,
  metronomeEnabled: false,
  recordEnabled: false
};

// Scheduler variables
let schedulerTimer = null;
let nextScheduleTime = 0;
let lookahead = 0.1;       // How far ahead to schedule (seconds)
let scheduleAheadTime = 0.1; // How often to call scheduler (seconds)
let scheduledNotes = [];    // Notes scheduled for current playback
let lastScheduledPosition = -1;

// Callbacks for UI updates
let onPositionUpdate = null;
let onPlayStateChange = null;
let onRecordNote = null;

/**
 * Set callback for position updates
 * @param {Function} callback - Function to call with position (in 16th notes)
 */
function setPositionCallback(callback) {
  onPositionUpdate = callback;
}

/**
 * Set callback for play state changes
 * @param {Function} callback - Function to call with { isPlaying, isPaused }
 */
function setPlayStateCallback(callback) {
  onPlayStateChange = callback;
}

/**
 * Set callback for recording notes
 * @param {Function} callback - Function to call when recording a note
 */
function setRecordCallback(callback) {
  onRecordNote = callback;
}

// ==================== BPM & TIMING ====================

/**
 * Set BPM (beats per minute)
 * @param {number} bpm - BPM value (20-300)
 */
function setBPM(bpm) {
  transportState.bpm = Math.max(20, Math.min(300, bpm));
}

/**
 * Get current BPM
 * @returns {number} Current BPM
 */
function getBPM() {
  return transportState.bpm;
}

/**
 * Convert 16th note position to seconds
 * @param {number} position - Position in 16th notes
 * @returns {number} Time in seconds
 */
function positionToSeconds(position) {
  const secondsPerBeat = 60 / transportState.bpm;
  const secondsPer16th = secondsPerBeat / 4;
  return position * secondsPer16th;
}

/**
 * Convert seconds to 16th note position
 * @param {number} seconds - Time in seconds
 * @returns {number} Position in 16th notes
 */
function secondsToPosition(seconds) {
  const secondsPerBeat = 60 / transportState.bpm;
  const secondsPer16th = secondsPerBeat / 4;
  return seconds / secondsPer16th;
}

/**
 * Get duration of one 16th note in seconds
 * @returns {number} Duration in seconds
 */
function get16thDuration() {
  return 60 / transportState.bpm / 4;
}

// ==================== PLAYBACK CONTROL ====================

/**
 * Start playback
 */
function play() {
  if (transportState.isPlaying && !transportState.isPaused) return;
  
  // Initialize audio engine if needed
  if (window.AudioEngine) {
    window.AudioEngine.resumeAudioContext();
  }
  
  if (transportState.isPaused) {
    // Resume from pause
    transportState.isPaused = false;
  } else {
    // Start fresh
    transportState.position = 0;
    lastScheduledPosition = -1;
  }
  
  transportState.isPlaying = true;
  
  // Get notes for scheduling
  if (window.PianoRoll) {
    scheduledNotes = window.PianoRoll.getAllNotes();
  }
  
  // Start scheduler
  const audioContext = window.AudioEngine ? window.AudioEngine.getAudioContext() : null;
  if (audioContext) {
    nextScheduleTime = audioContext.currentTime;
    startScheduler();
  }
  
  // Notify UI
  if (onPlayStateChange) {
    onPlayStateChange({ isPlaying: true, isPaused: false });
  }
}

/**
 * Pause playback
 */
function pause() {
  if (!transportState.isPlaying || transportState.isPaused) return;
  
  transportState.isPaused = true;
  stopScheduler();
  
  if (onPlayStateChange) {
    onPlayStateChange({ isPlaying: true, isPaused: true });
  }
}

/**
 * Stop playback and reset position
 */
function stop() {
  transportState.isPlaying = false;
  transportState.isPaused = false;
  transportState.position = 0;
  lastScheduledPosition = -1;
  
  stopScheduler();
  
  // Update playhead
  if (window.PianoRoll) {
    window.PianoRoll.setPlayheadPosition(0);
  }
  
  if (onPlayStateChange) {
    onPlayStateChange({ isPlaying: false, isPaused: false });
  }
  
  if (onPositionUpdate) {
    onPositionUpdate(0);
  }
}

/**
 * Toggle loop mode
 */
function toggleLoop() {
  transportState.loopEnabled = !transportState.loopEnabled;
  return transportState.loopEnabled;
}

/**
 * Set loop mode
 * @param {boolean} enabled - Whether loop is enabled
 */
function setLoop(enabled) {
  transportState.loopEnabled = enabled;
}

/**
 * Toggle metronome
 */
function toggleMetronome() {
  transportState.metronomeEnabled = !transportState.metronomeEnabled;
  return transportState.metronomeEnabled;
}

/**
 * Set metronome mode
 * @param {boolean} enabled - Whether metronome is enabled
 */
function setMetronome(enabled) {
  transportState.metronomeEnabled = enabled;
}

/**
 * Toggle record mode
 */
function toggleRecord() {
  transportState.recordEnabled = !transportState.recordEnabled;
  return transportState.recordEnabled;
}

/**
 * Set record mode
 * @param {boolean} enabled - Whether record is enabled
 */
function setRecord(enabled) {
  transportState.recordEnabled = enabled;
}

/**
 * Check if recording is active
 * @returns {boolean} Whether recording is active
 */
function isRecording() {
  return transportState.recordEnabled && transportState.isPlaying && !transportState.isPaused;
}

// ==================== SCHEDULER ====================

/**
 * Start the scheduling loop
 */
function startScheduler() {
  if (schedulerTimer) return;
  
  schedulerTimer = setInterval(scheduler, scheduleAheadTime * 1000);
}

/**
 * Stop the scheduling loop
 */
function stopScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

/**
 * Main scheduler function
 * Uses Web Audio API precise timing for scheduling notes ahead
 */
function scheduler() {
  if (!transportState.isPlaying || transportState.isPaused) return;
  
  const audioContext = window.AudioEngine ? window.AudioEngine.getAudioContext() : null;
  if (!audioContext) return;
  
  const currentTime = audioContext.currentTime;
  const config = window.PianoRoll ? window.PianoRoll.getConfig() : { bars: 8, beatsPerBar: 4, sixteenthsPerBeat: 4 };
  const totalLength = config.bars * config.beatsPerBar * config.sixteenthsPerBeat;
  
  // Schedule notes while we're within the lookahead window
  while (nextScheduleTime < currentTime + lookahead) {
    const currentPosition = Math.floor(transportState.position);
    
    // Schedule metronome clicks
    if (transportState.metronomeEnabled && currentPosition !== lastScheduledPosition) {
      if (currentPosition % 4 === 0) {
        const isDownbeat = currentPosition % 16 === 0;
        window.AudioEngine.playMetronomeClick(nextScheduleTime, isDownbeat);
      }
    }
    
    // Schedule notes that start at this position
    if (currentPosition !== lastScheduledPosition) {
      const notesToPlay = scheduledNotes.filter(n => n.start === currentPosition);
      
      notesToPlay.forEach((note) => {
        const instrument = window.UI ? window.UI.getCurrentInstrument() : 'piano';
        const duration = positionToSeconds(note.duration);
        window.AudioEngine.playNote(instrument, note.pitch, nextScheduleTime, duration, note.velocity);
      });
      
      lastScheduledPosition = currentPosition;
    }
    
    // Update position
    const sixteenthDuration = get16thDuration();
    transportState.position += 1;
    nextScheduleTime += sixteenthDuration;
    
    // Handle loop or stop
    if (transportState.position >= totalLength) {
      if (transportState.loopEnabled) {
        transportState.position = 0;
        lastScheduledPosition = -1;
        // Refresh notes for new loop iteration
        if (window.PianoRoll) {
          scheduledNotes = window.PianoRoll.getAllNotes();
        }
      } else {
        stop();
        return;
      }
    }
  }
  
  // Update visual position (debounced)
  updateVisualPosition();
}

/**
 * Update the visual playhead position
 */
let lastVisualUpdate = 0;
function updateVisualPosition() {
  const now = performance.now();
  if (now - lastVisualUpdate < 50) return; // Limit to ~20fps for performance
  lastVisualUpdate = now;
  
  if (window.PianoRoll) {
    window.PianoRoll.setPlayheadPosition(Math.floor(transportState.position));
  }
  
  if (onPositionUpdate) {
    onPositionUpdate(Math.floor(transportState.position));
  }
}

// ==================== RECORDING ====================

/**
 * Record a note at the current playback position
 * @param {number} pitch - MIDI note number
 * @param {number} duration - Duration in 16th notes (default 4)
 */
function recordNote(pitch, duration = 4) {
  if (!isRecording()) return;
  
  const position = Math.floor(transportState.position);
  
  if (window.PianoRoll) {
    const note = window.PianoRoll.addNote(pitch, position, duration, 0.8);
    if (note) {
      // Refresh scheduled notes
      scheduledNotes = window.PianoRoll.getAllNotes();
      
      if (onRecordNote) {
        onRecordNote(note);
      }
    }
  }
}

// ==================== STATE GETTERS ====================

/**
 * Get current transport state
 * @returns {Object} Transport state
 */
function getState() {
  return { ...transportState };
}

/**
 * Get current position in 16th notes
 * @returns {number} Current position
 */
function getPosition() {
  return Math.floor(transportState.position);
}

/**
 * Check if playing
 * @returns {boolean} Whether playing
 */
function isPlaying() {
  return transportState.isPlaying && !transportState.isPaused;
}

// Export functions for use by other modules
window.Transport = {
  play,
  pause,
  stop,
  toggleLoop,
  setLoop,
  toggleMetronome,
  setMetronome,
  toggleRecord,
  setRecord,
  isRecording,
  setBPM,
  getBPM,
  getState,
  getPosition,
  isPlaying,
  positionToSeconds,
  secondsToPosition,
  get16thDuration,
  recordNote,
  setPositionCallback,
  setPlayStateCallback,
  setRecordCallback
};
