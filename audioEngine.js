/**
 * audioEngine.js - Web Audio API Engine for NoteLab DAW
 * 
 * This module handles all audio synthesis and effects processing.
 * It provides:
 * - AudioContext initialization
 * - 9 instruments: Piano, Pluck, Saw, Pad, Bass, Bell + 3 Guitars
 * - Drum machine samples (Kick, Snare, Hat, Clap)
 * - Reverb and Delay effects with convolution
 * - Note playback with precise timing
 * - WAV and MP3 export capabilities
 */

// ==================== AUDIO CONTEXT SETUP ====================

let audioContext = null;
let masterGain = null;
let reverbNode = null;
let delayNode = null;
let reverbGain = null;
let delayGain = null;
let dryGain = null;
let metronomeGain = null;
let drumGain = null;

// Effect settings
let effectSettings = {
  reverb: { enabled: false, mix: 0.3 },
  delay: { enabled: false, time: 0.3, feedback: 0.4, mix: 0.25 }
};

// Impulse response for convolution reverb (generated programmatically)
let reverbBuffer = null;

// Drum sample buffers (generated programmatically)
let drumBuffers = {};

/**
 * Initialize the Web Audio API context and effects chain
 * Must be called after user interaction (e.g., button click) due to browser autoplay policies
 */
function initAudioEngine() {
  if (audioContext) return;
  
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Create master output gain
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.7;
  masterGain.connect(audioContext.destination);
  
  // Create dry signal path
  dryGain = audioContext.createGain();
  dryGain.gain.value = 1.0;
  dryGain.connect(masterGain);
  
  // Initialize effects
  initReverb();
  initDelay();
  
  // Create metronome gain (separate from effects)
  metronomeGain = audioContext.createGain();
  metronomeGain.gain.value = 0.3;
  metronomeGain.connect(masterGain);
  
  // Create drum gain (separate channel)
  drumGain = audioContext.createGain();
  drumGain.gain.value = 0.8;
  drumGain.connect(masterGain);
  
  // Generate drum samples
  generateDrumSamples();
  
  console.log('Audio engine initialized with drums and guitars');
}

/**
 * Generate synthetic drum samples using Web Audio API
 * Creates Kick, Snare, Hi-Hat, and Clap sounds
 */
function generateDrumSamples() {
  const sampleRate = audioContext.sampleRate;
  
  // Kick drum - low frequency sine with pitch envelope
  drumBuffers.kick = generateKickSample(sampleRate);
  
  // Snare drum - noise + tone
  drumBuffers.snare = generateSnareSample(sampleRate);
  
  // Hi-hat - filtered noise
  drumBuffers.hihat = generateHiHatSample(sampleRate);
  
  // Clap - noise bursts
  drumBuffers.clap = generateClapSample(sampleRate);
}

/**
 * Generate a kick drum sample
 * @param {number} sampleRate - Audio sample rate
 * @returns {AudioBuffer} Kick sample buffer
 */
function generateKickSample(sampleRate) {
  const duration = 0.5;
  const samples = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, samples, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    // Pitch envelope: starts at 150Hz, drops to 50Hz
    const pitchEnv = 150 * Math.exp(-t * 30) + 50;
    const ampEnv = Math.exp(-t * 8);
    data[i] = Math.sin(2 * Math.PI * pitchEnv * t) * ampEnv * 0.8;
  }
  
  return buffer;
}

/**
 * Generate a snare drum sample
 * @param {number} sampleRate - Audio sample rate
 * @returns {AudioBuffer} Snare sample buffer
 */
function generateSnareSample(sampleRate) {
  const duration = 0.3;
  const samples = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, samples, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    // Tone component
    const tone = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 20) * 0.3;
    // Noise component
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 15) * 0.7;
    data[i] = tone + noise;
  }
  
  return buffer;
}

/**
 * Generate a hi-hat sample
 * @param {number} sampleRate - Audio sample rate
 * @returns {AudioBuffer} Hi-hat sample buffer
 */
function generateHiHatSample(sampleRate) {
  const duration = 0.15;
  const samples = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, samples, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    // High-frequency noise with fast decay
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.5;
    // Add some metallic character with high frequencies
    const metallic = Math.sin(2 * Math.PI * 8000 * t) * Math.exp(-t * 50) * 0.2;
    data[i] = noise + metallic;
  }
  
  return buffer;
}

/**
 * Generate a clap sample
 * @param {number} sampleRate - Audio sample rate
 * @returns {AudioBuffer} Clap sample buffer
 */
function generateClapSample(sampleRate) {
  const duration = 0.3;
  const samples = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, samples, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    // Multiple noise bursts to simulate clap
    let amp = 0;
    if (t < 0.01) amp = 1.0;
    else if (t < 0.02) amp = 0.3;
    else if (t < 0.03) amp = 0.8;
    else if (t < 0.04) amp = 0.2;
    else amp = Math.exp(-(t - 0.04) * 20);
    
    data[i] = (Math.random() * 2 - 1) * amp * 0.6;
  }
  
  return buffer;
}

/**
 * Generate a simple impulse response for reverb effect
 * Uses filtered noise decay to simulate room reverb
 */
function generateImpulseResponse(duration = 2.0, decay = 2.0) {
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioContext.createBuffer(2, length, sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // Exponential decay with random noise
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  
  return impulse;
}

/**
 * Initialize reverb effect using ConvolverNode
 */
function initReverb() {
  reverbNode = audioContext.createConvolver();
  reverbGain = audioContext.createGain();
  reverbGain.gain.value = 0;
  
  // Generate impulse response
  reverbBuffer = generateImpulseResponse(2.0, 2.5);
  reverbNode.buffer = reverbBuffer;
  
  // Connect: reverbNode -> reverbGain -> masterGain
  reverbNode.connect(reverbGain);
  reverbGain.connect(masterGain);
}

/**
 * Initialize delay effect using DelayNode with feedback
 */
function initDelay() {
  delayNode = audioContext.createDelay(2.0);
  delayNode.delayTime.value = effectSettings.delay.time;
  
  const feedbackGain = audioContext.createGain();
  feedbackGain.gain.value = effectSettings.delay.feedback;
  
  delayGain = audioContext.createGain();
  delayGain.gain.value = 0;
  
  // Connect: delayNode -> feedbackGain -> delayNode (feedback loop)
  //          delayNode -> delayGain -> masterGain
  delayNode.connect(feedbackGain);
  feedbackGain.connect(delayNode);
  delayNode.connect(delayGain);
  delayGain.connect(masterGain);
  
  // Store feedback gain for later adjustment
  delayNode._feedbackGain = feedbackGain;
}

/**
 * Update effect settings
 * @param {string} effect - 'reverb' or 'delay'
 * @param {object} settings - New settings to apply
 */
function updateEffectSettings(effect, settings) {
  effectSettings[effect] = { ...effectSettings[effect], ...settings };
  
  if (effect === 'reverb') {
    reverbGain.gain.value = effectSettings.reverb.enabled ? effectSettings.reverb.mix : 0;
  } else if (effect === 'delay') {
    delayGain.gain.value = effectSettings.delay.enabled ? effectSettings.delay.mix : 0;
    delayNode.delayTime.value = effectSettings.delay.time;
    delayNode._feedbackGain.gain.value = effectSettings.delay.feedback;
  }
}

/**
 * Set master volume
 * @param {number} value - Volume level (0.0 to 1.0)
 */
function setMasterVolume(value) {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(1, value));
  }
}

// ==================== INSTRUMENT DEFINITIONS ====================

/**
 * Instrument configurations with oscillator types and ADSR envelopes
 * Each instrument has unique characteristics for its waveform and envelope
 * Includes 6 synths + 3 guitar types = 9 total instruments
 */
const INSTRUMENTS = {
  piano: {
    name: 'Piano',
    oscillators: [
      { type: 'triangle', detune: 0, gain: 0.6 },
      { type: 'sine', detune: 1, gain: 0.4 }
    ],
    envelope: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 0.5 },
    color: '#5865f2'
  },
  pluck: {
    name: 'Pluck',
    oscillators: [
      { type: 'sawtooth', detune: 0, gain: 0.5 },
      { type: 'triangle', detune: 2, gain: 0.3 }
    ],
    envelope: { attack: 0.001, decay: 0.15, sustain: 0.1, release: 0.2 },
    filter: { type: 'lowpass', frequency: 3000, Q: 2 },
    color: '#43b581'
  },
  saw: {
    name: 'Saw Lead',
    oscillators: [
      { type: 'sawtooth', detune: 0, gain: 0.4 },
      { type: 'sawtooth', detune: 7, gain: 0.3 },
      { type: 'sawtooth', detune: -7, gain: 0.3 }
    ],
    envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.2 },
    filter: { type: 'lowpass', frequency: 5000, Q: 1 },
    color: '#faa61a'
  },
  pad: {
    name: 'Synth Pad',
    oscillators: [
      { type: 'sine', detune: 0, gain: 0.4 },
      { type: 'triangle', detune: 5, gain: 0.3 },
      { type: 'sine', detune: -5, gain: 0.3 }
    ],
    envelope: { attack: 0.4, decay: 0.5, sustain: 0.8, release: 1.0 },
    color: '#eb459e'
  },
  bass: {
    name: 'Bass',
    oscillators: [
      { type: 'sawtooth', detune: 0, gain: 0.6 },
      { type: 'sine', detune: 0, gain: 0.4 }
    ],
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.15 },
    filter: { type: 'lowpass', frequency: 800, Q: 3 },
    color: '#ed4245'
  },
  bell: {
    name: 'Bell',
    oscillators: [
      { type: 'sine', detune: 0, gain: 0.5 },
      { type: 'sine', detune: 1200, gain: 0.3 }, // Harmonic at fifth
      { type: 'sine', detune: 2400, gain: 0.2 }  // Higher harmonic
    ],
    envelope: { attack: 0.001, decay: 1.0, sustain: 0.1, release: 1.5 },
    color: '#00aff4'
  },
  // === GUITAR INSTRUMENTS ===
  cleanGuitar: {
    name: 'Clean Guitar',
    oscillators: [
      { type: 'triangle', detune: 0, gain: 0.5 },
      { type: 'sawtooth', detune: 2, gain: 0.2 },
      { type: 'sine', detune: 1200, gain: 0.15 } // Harmonic content
    ],
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.4 },
    filter: { type: 'lowpass', frequency: 4000, Q: 1.5 },
    color: '#9b59b6'
  },
  distortedGuitar: {
    name: 'Distorted Guitar',
    oscillators: [
      { type: 'sawtooth', detune: 0, gain: 0.4 },
      { type: 'square', detune: 5, gain: 0.3 },
      { type: 'sawtooth', detune: -5, gain: 0.3 }
    ],
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.3 },
    filter: { type: 'lowpass', frequency: 3500, Q: 2 },
    distortion: true, // Flag for waveshaper
    color: '#e74c3c'
  },
  acousticGuitar: {
    name: 'Acoustic Guitar',
    oscillators: [
      { type: 'triangle', detune: 0, gain: 0.4 },
      { type: 'sine', detune: 0, gain: 0.3 },
      { type: 'triangle', detune: 1200, gain: 0.2 },
      { type: 'sine', detune: 2400, gain: 0.1 }
    ],
    envelope: { attack: 0.005, decay: 0.4, sustain: 0.3, release: 0.6 },
    filter: { type: 'lowpass', frequency: 3000, Q: 1 },
    color: '#f39c12'
  }
};

/**
 * Convert MIDI note number to frequency in Hz
 * @param {number} midiNote - MIDI note number (0-127)
 * @returns {number} Frequency in Hz
 */
function midiToFrequency(midiNote) {
  // A4 = MIDI 69 = 440 Hz
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Convert note name to MIDI note number
 * @param {string} noteName - Note name (e.g., 'C4', 'F#3')
 * @returns {number} MIDI note number
 */
function noteNameToMidi(noteName) {
  const noteMap = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
  const match = noteName.match(/^([A-G])(#|b)?(\d+)$/);
  if (!match) return 60; // Default to C4
  
  let [, note, accidental, octave] = match;
  let midiNote = noteMap[note] + (parseInt(octave) + 1) * 12;
  
  if (accidental === '#') midiNote += 1;
  if (accidental === 'b') midiNote -= 1;
  
  return midiNote;
}

/**
 * Convert MIDI note number to note name
 * @param {number} midiNote - MIDI note number
 * @returns {string} Note name (e.g., 'C4')
 */
function midiToNoteName(midiNote) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = noteNames[midiNote % 12];
  return `${noteName}${octave}`;
}

// ==================== NOTE PLAYBACK ====================

/**
 * Create a distortion curve for waveshaper
 * @param {number} amount - Distortion amount (0-100)
 * @returns {Float32Array} Distortion curve
 */
function makeDistortionCurve(amount = 50) {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2 / samples) - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

/**
 * Play a note using the specified instrument
 * @param {string} instrumentId - Instrument identifier (e.g., 'piano', 'bass')
 * @param {number} midiNote - MIDI note number (0-127)
 * @param {number} startTime - AudioContext time to start the note
 * @param {number} duration - Duration in seconds
 * @param {number} velocity - Velocity/volume (0.0 to 1.0)
 * @returns {object} Object with stop() method to end the note early
 */
function playNote(instrumentId, midiNote, startTime, duration, velocity = 0.8) {
  if (!audioContext) {
    initAudioEngine();
  }
  
  const instrument = INSTRUMENTS[instrumentId] || INSTRUMENTS.piano;
  const frequency = midiToFrequency(midiNote);
  const envelope = instrument.envelope;
  
  // Calculate actual start time (use current time if not specified)
  const actualStartTime = startTime || audioContext.currentTime;
  const endTime = actualStartTime + duration;
  
  // Create nodes for this voice
  const oscillators = [];
  const voiceGain = audioContext.createGain();
  voiceGain.gain.value = 0;
  
  // Optional filter
  let filterNode = null;
  if (instrument.filter) {
    filterNode = audioContext.createBiquadFilter();
    filterNode.type = instrument.filter.type;
    filterNode.frequency.value = instrument.filter.frequency;
    filterNode.Q.value = instrument.filter.Q;
  }
  
  // Optional distortion (for distorted guitar)
  let distortionNode = null;
  if (instrument.distortion) {
    distortionNode = audioContext.createWaveShaper();
    distortionNode.curve = makeDistortionCurve(50);
    distortionNode.oversample = '4x';
  }
  
  // Create oscillators for each oscillator definition
  instrument.oscillators.forEach((oscDef) => {
    const osc = audioContext.createOscillator();
    osc.type = oscDef.type;
    osc.frequency.value = frequency;
    osc.detune.value = oscDef.detune;
    
    const oscGain = audioContext.createGain();
    oscGain.gain.value = oscDef.gain * velocity;
    
    osc.connect(oscGain);
    
    if (filterNode) {
      oscGain.connect(filterNode);
    } else if (distortionNode) {
      oscGain.connect(distortionNode);
    } else {
      oscGain.connect(voiceGain);
    }
    
    oscillators.push({ osc, gain: oscGain });
  });
  
  // Connect filter to distortion or voice gain
  if (filterNode) {
    if (distortionNode) {
      filterNode.connect(distortionNode);
      distortionNode.connect(voiceGain);
    } else {
      filterNode.connect(voiceGain);
    }
  } else if (distortionNode) {
    distortionNode.connect(voiceGain);
  }
  
  // Connect voice to dry path and effects sends
  voiceGain.connect(dryGain);
  if (reverbNode && effectSettings.reverb.enabled) {
    voiceGain.connect(reverbNode);
  }
  if (delayNode && effectSettings.delay.enabled) {
    voiceGain.connect(delayNode);
  }
  
  // Apply ADSR envelope
  const attackEnd = actualStartTime + envelope.attack;
  const decayEnd = attackEnd + envelope.decay;
  const sustainLevel = envelope.sustain * velocity;
  const releaseStart = endTime;
  const releaseEnd = releaseStart + envelope.release;
  
  // Attack
  voiceGain.gain.setValueAtTime(0, actualStartTime);
  voiceGain.gain.linearRampToValueAtTime(velocity, attackEnd);
  
  // Decay to sustain
  voiceGain.gain.linearRampToValueAtTime(sustainLevel, decayEnd);
  
  // Sustain (hold until release)
  voiceGain.gain.setValueAtTime(sustainLevel, releaseStart);
  
  // Release
  voiceGain.gain.linearRampToValueAtTime(0, releaseEnd);
  
  // Start all oscillators
  oscillators.forEach(({ osc }) => {
    osc.start(actualStartTime);
    osc.stop(releaseEnd + 0.1);
  });
  
  // Cleanup after note ends
  const cleanup = () => {
    oscillators.forEach(({ osc }) => {
      try {
        osc.disconnect();
      } catch (e) {
        // Already disconnected
      }
    });
    try {
      voiceGain.disconnect();
      if (filterNode) filterNode.disconnect();
      if (distortionNode) distortionNode.disconnect();
    } catch (e) {
      // Already disconnected
    }
  };
  
  // Schedule cleanup
  setTimeout(cleanup, (releaseEnd - audioContext.currentTime + 0.2) * 1000);
  
  // Return control object
  return {
    stop: (time) => {
      const stopTime = time || audioContext.currentTime;
      voiceGain.gain.cancelScheduledValues(stopTime);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, stopTime);
      voiceGain.gain.linearRampToValueAtTime(0, stopTime + 0.05);
      oscillators.forEach(({ osc }) => {
        try {
          osc.stop(stopTime + 0.1);
        } catch (e) {
          // Already stopped
        }
      });
    }
  };
}

/**
 * Play a preview note (short duration, for UI feedback)
 * @param {string} instrumentId - Instrument identifier
 * @param {number} midiNote - MIDI note number
 */
function playPreviewNote(instrumentId, midiNote) {
  playNote(instrumentId, midiNote, null, 0.2, 0.6);
}

/**
 * Play metronome click
 * @param {number} startTime - AudioContext time to play the click
 * @param {boolean} isDownbeat - Whether this is the first beat of a bar
 */
function playMetronomeClick(startTime, isDownbeat = false) {
  if (!audioContext) return;
  
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = 'sine';
  osc.frequency.value = isDownbeat ? 1000 : 800;
  
  osc.connect(gain);
  gain.connect(metronomeGain);
  
  const duration = 0.03;
  gain.gain.setValueAtTime(0.5, startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  
  osc.start(startTime);
  osc.stop(startTime + duration + 0.1);
}

/**
 * Get the current AudioContext time
 * @returns {number} Current time in seconds
 */
function getCurrentTime() {
  if (!audioContext) {
    initAudioEngine();
  }
  return audioContext.currentTime;
}

/**
 * Get the AudioContext sample rate
 * @returns {number} Sample rate in Hz
 */
function getSampleRate() {
  if (!audioContext) {
    initAudioEngine();
  }
  return audioContext.sampleRate;
}

/**
 * Resume AudioContext if suspended (required after user interaction)
 */
async function resumeAudioContext() {
  if (!audioContext) {
    initAudioEngine();
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
}

/**
 * Get AudioContext for external use (e.g., MP3 export)
 * @returns {AudioContext} The audio context
 */
function getAudioContext() {
  if (!audioContext) {
    initAudioEngine();
  }
  return audioContext;
}

// ==================== OFFLINE RENDERING FOR EXPORT ====================

/**
 * Render notes to an AudioBuffer for export
 * @param {Array} notes - Array of note objects with pitch, start, duration
 * @param {string} instrumentId - Instrument to use
 * @param {number} bpm - Beats per minute
 * @param {number} duration - Total duration in seconds
 * @returns {Promise<AudioBuffer>} Rendered audio buffer
 */
async function renderToBuffer(notes, instrumentId, bpm, duration) {
  const sampleRate = 44100;
  const offlineContext = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
  
  // Create master gain for offline context
  const offlineMaster = offlineContext.createGain();
  offlineMaster.gain.value = 0.8;
  offlineMaster.connect(offlineContext.destination);
  
  // Create reverb for offline context if enabled
  let offlineReverb = null;
  let offlineReverbGain = null;
  if (effectSettings.reverb.enabled) {
    offlineReverb = offlineContext.createConvolver();
    offlineReverbGain = offlineContext.createGain();
    offlineReverbGain.gain.value = effectSettings.reverb.mix;
    
    // Generate impulse response for offline context
    const impulse = offlineContext.createBuffer(2, sampleRate * 2, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / channelData.length, 2.5);
      }
    }
    offlineReverb.buffer = impulse;
    offlineReverb.connect(offlineReverbGain);
    offlineReverbGain.connect(offlineMaster);
  }
  
  // Create delay for offline context if enabled
  let offlineDelay = null;
  let offlineDelayGain = null;
  if (effectSettings.delay.enabled) {
    offlineDelay = offlineContext.createDelay(2.0);
    offlineDelay.delayTime.value = effectSettings.delay.time;
    
    const feedbackGain = offlineContext.createGain();
    feedbackGain.gain.value = effectSettings.delay.feedback;
    
    offlineDelayGain = offlineContext.createGain();
    offlineDelayGain.gain.value = effectSettings.delay.mix;
    
    offlineDelay.connect(feedbackGain);
    feedbackGain.connect(offlineDelay);
    offlineDelay.connect(offlineDelayGain);
    offlineDelayGain.connect(offlineMaster);
  }
  
  const instrument = INSTRUMENTS[instrumentId] || INSTRUMENTS.piano;
  
  // Calculate time per 16th note
  const secondsPerBeat = 60 / bpm;
  const secondsPer16th = secondsPerBeat / 4;
  
  // Render each note
  notes.forEach((note) => {
    const startTime = note.start * secondsPer16th;
    const noteDuration = note.duration * secondsPer16th;
    const frequency = midiToFrequency(note.pitch);
    const envelope = instrument.envelope;
    const velocity = note.velocity || 0.8;
    
    // Create voice
    const voiceGain = offlineContext.createGain();
    voiceGain.gain.value = 0;
    voiceGain.connect(offlineMaster);
    
    if (offlineReverb) voiceGain.connect(offlineReverb);
    if (offlineDelay) voiceGain.connect(offlineDelay);
    
    // Optional filter
    let filterNode = null;
    if (instrument.filter) {
      filterNode = offlineContext.createBiquadFilter();
      filterNode.type = instrument.filter.type;
      filterNode.frequency.value = instrument.filter.frequency;
      filterNode.Q.value = instrument.filter.Q;
    }
    
    // Create oscillators
    instrument.oscillators.forEach((oscDef) => {
      const osc = offlineContext.createOscillator();
      osc.type = oscDef.type;
      osc.frequency.value = frequency;
      osc.detune.value = oscDef.detune;
      
      const oscGain = offlineContext.createGain();
      oscGain.gain.value = oscDef.gain * velocity;
      
      osc.connect(oscGain);
      
      if (filterNode) {
        oscGain.connect(filterNode);
      } else {
        oscGain.connect(voiceGain);
      }
      
      // Apply ADSR
      const attackEnd = startTime + envelope.attack;
      const decayEnd = attackEnd + envelope.decay;
      const sustainLevel = envelope.sustain * velocity;
      const releaseStart = startTime + noteDuration;
      const releaseEnd = releaseStart + envelope.release;
      
      voiceGain.gain.setValueAtTime(0, startTime);
      voiceGain.gain.linearRampToValueAtTime(velocity, attackEnd);
      voiceGain.gain.linearRampToValueAtTime(sustainLevel, decayEnd);
      voiceGain.gain.setValueAtTime(sustainLevel, releaseStart);
      voiceGain.gain.linearRampToValueAtTime(0, releaseEnd);
      
      osc.start(startTime);
      osc.stop(releaseEnd + 0.1);
    });
    
    if (filterNode) {
      filterNode.connect(voiceGain);
    }
  });
  
  // Render
  return await offlineContext.startRendering();
}

// ==================== DRUM PLAYBACK ====================

/**
 * Drum sound types available
 */
const DRUM_TYPES = ['kick', 'snare', 'hihat', 'clap'];

/**
 * Play a drum sound
 * @param {string} drumType - Type of drum: 'kick', 'snare', 'hihat', 'clap'
 * @param {number} startTime - AudioContext time to start the sound
 * @param {number} velocity - Volume (0.0 to 1.0)
 */
function playDrum(drumType, startTime, velocity = 0.8) {
  if (!audioContext) {
    initAudioEngine();
  }
  
  const buffer = drumBuffers[drumType];
  if (!buffer) {
    console.warn('Drum buffer not found:', drumType);
    return;
  }
  
  const actualStartTime = startTime || audioContext.currentTime;
  
  // Create buffer source
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  
  // Create gain for velocity
  const gain = audioContext.createGain();
  gain.gain.value = velocity;
  
  // Connect through drum gain to master
  source.connect(gain);
  gain.connect(drumGain);
  
  // Also send to effects if enabled
  if (reverbNode && effectSettings.reverb.enabled) {
    gain.connect(reverbNode);
  }
  
  source.start(actualStartTime);
}

/**
 * Play a drum preview (for UI feedback)
 * @param {string} drumType - Type of drum
 */
function playDrumPreview(drumType) {
  playDrum(drumType, null, 0.7);
}

/**
 * Set drum volume
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
function setDrumVolume(volume) {
  if (drumGain) {
    drumGain.gain.value = Math.max(0, Math.min(1, volume));
  }
}

// ==================== WAV EXPORT ====================

/**
 * Convert AudioBuffer to WAV Blob
 * @param {AudioBuffer} buffer - Audio buffer to convert
 * @returns {Blob} WAV file blob
 */
function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const samples = buffer.length;
  const dataSize = samples * blockAlign;
  const bufferSize = 44 + dataSize;
  
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);
  
  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Write audio data
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Helper function to write string to DataView
 * @param {DataView} view - DataView to write to
 * @param {number} offset - Byte offset
 * @param {string} string - String to write
 */
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Render and export as WAV
 * @param {Array} notes - Array of note objects
 * @param {Array} drumPattern - Array of drum hits
 * @param {string} instrumentId - Instrument to use
 * @param {number} bpm - Beats per minute
 * @param {number} duration - Total duration in seconds
 * @returns {Promise<Blob>} WAV file blob
 */
async function exportToWav(notes, drumPattern, instrumentId, bpm, duration) {
  // Render notes to buffer
  const buffer = await renderToBuffer(notes, instrumentId, bpm, duration);
  
  // TODO: Mix in drum pattern if provided
  // For now, just export the notes
  
  return audioBufferToWav(buffer);
}

// Export functions for use by other modules
window.AudioEngine = {
  init: initAudioEngine,
  playNote,
  playPreviewNote,
  playMetronomeClick,
  playDrum,
  playDrumPreview,
  setDrumVolume,
  updateEffectSettings,
  setMasterVolume,
  getCurrentTime,
  getSampleRate,
  resumeAudioContext,
  getAudioContext,
  renderToBuffer,
  audioBufferToWav,
  exportToWav,
  midiToFrequency,
  midiToNoteName,
  noteNameToMidi,
  INSTRUMENTS,
  DRUM_TYPES,
  getEffectSettings: () => ({ ...effectSettings })
};
