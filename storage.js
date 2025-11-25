/**
 * storage.js - Project Storage for NoteLab
 * 
 * This module handles:
 * - Saving and loading songs to localStorage
 * - Song data serialization/deserialization
 * - Managing multiple saved songs
 */

// ==================== STORAGE KEYS ====================

const STORAGE_KEYS = {
  SONGS: 'notelab_songs',
  CURRENT_SONG: 'notelab_current_song',
  SETTINGS: 'notelab_settings'
};

// ==================== SONG DATA MODEL ====================

/**
 * Create a new empty song
 * @param {string} name - Song name
 * @returns {Object} New song object
 */
function createNewSong(name = 'Untitled') {
  return {
    id: generateSongId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bpm: 120,
    instrument: 'piano',
    notes: [],
    effects: {
      reverb: { enabled: false, mix: 0.3 },
      delay: { enabled: false, time: 0.3, feedback: 0.4, mix: 0.25 }
    }
  };
}

/**
 * Generate a unique song ID
 * @returns {string} Unique ID
 */
function generateSongId() {
  return `song_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// ==================== SONG MANAGEMENT ====================

/**
 * Get all saved songs
 * @returns {Array} Array of song objects
 */
function getAllSongs() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SONGS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading songs:', e);
    return [];
  }
}

/**
 * Save all songs
 * @param {Array} songs - Array of song objects
 */
function saveAllSongs(songs) {
  try {
    localStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify(songs));
  } catch (e) {
    console.error('Error saving songs:', e);
    throw new Error('Failed to save songs. Storage may be full.');
  }
}

/**
 * Get a song by ID
 * @param {string} songId - Song ID
 * @returns {Object|null} Song object or null
 */
function getSongById(songId) {
  const songs = getAllSongs();
  return songs.find(s => s.id === songId) || null;
}

/**
 * Save a song (create or update)
 * @param {Object} song - Song object to save
 * @returns {Object} Saved song
 */
function saveSong(song) {
  const songs = getAllSongs();
  const index = songs.findIndex(s => s.id === song.id);
  
  song.updatedAt = new Date().toISOString();
  
  if (index >= 0) {
    songs[index] = song;
  } else {
    songs.push(song);
  }
  
  saveAllSongs(songs);
  return song;
}

/**
 * Delete a song by ID
 * @param {string} songId - Song ID to delete
 * @returns {boolean} Whether deletion was successful
 */
function deleteSong(songId) {
  const songs = getAllSongs();
  const filtered = songs.filter(s => s.id !== songId);
  
  if (filtered.length < songs.length) {
    saveAllSongs(filtered);
    return true;
  }
  return false;
}

// ==================== CURRENT SONG ====================

/**
 * Get the current song ID
 * @returns {string|null} Current song ID or null
 */
function getCurrentSongId() {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_SONG);
}

/**
 * Set the current song ID
 * @param {string} songId - Song ID
 */
function setCurrentSongId(songId) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_SONG, songId);
}

/**
 * Get the current song (or create a new one if none exists)
 * @returns {Object} Current song object
 */
function getCurrentSong() {
  const songId = getCurrentSongId();
  if (songId) {
    const song = getSongById(songId);
    if (song) return song;
  }
  
  // No current song, create a new one
  return createNewSong('My First Song');
}

// ==================== SONG DATA SERIALIZATION ====================

/**
 * Serialize current project state to a song object
 * @param {Object} options - Options with name, bpm, instrument, notes, effects
 * @returns {Object} Song object ready to save
 */
function serializeCurrentProject(options) {
  const currentSongId = getCurrentSongId();
  const existingSong = currentSongId ? getSongById(currentSongId) : null;
  
  return {
    id: existingSong ? existingSong.id : generateSongId(),
    name: options.name || (existingSong ? existingSong.name : 'Untitled'),
    createdAt: existingSong ? existingSong.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bpm: options.bpm || 120,
    instrument: options.instrument || 'piano',
    notes: options.notes || [],
    effects: options.effects || {
      reverb: { enabled: false, mix: 0.3 },
      delay: { enabled: false, time: 0.3, feedback: 0.4, mix: 0.25 }
    }
  };
}

/**
 * Load a song into the application
 * @param {string} songId - Song ID to load
 * @returns {Object|null} Loaded song or null
 */
function loadSong(songId) {
  const song = getSongById(songId);
  if (!song) return null;
  
  setCurrentSongId(songId);
  return song;
}

// ==================== SETTINGS ====================

/**
 * Get application settings
 * @returns {Object} Settings object
 */
function getSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return {};
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading settings:', e);
    return {};
  }
}

/**
 * Save application settings
 * @param {Object} settings - Settings object
 */
function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

/**
 * Update a specific setting
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 */
function updateSetting(key, value) {
  const settings = getSettings();
  settings[key] = value;
  saveSettings(settings);
}

/**
 * Get a specific setting
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if not found
 * @returns {any} Setting value
 */
function getSetting(key, defaultValue = null) {
  const settings = getSettings();
  return settings.hasOwnProperty(key) ? settings[key] : defaultValue;
}

// ==================== EXPORT/IMPORT ====================

/**
 * Export a song to a JSON string (for file download)
 * @param {string} songId - Song ID to export
 * @returns {string} JSON string
 */
function exportSongToJSON(songId) {
  const song = getSongById(songId);
  if (!song) return null;
  
  return JSON.stringify(song, null, 2);
}

/**
 * Import a song from a JSON string
 * @param {string} jsonString - JSON string to import
 * @returns {Object|null} Imported song or null on error
 */
function importSongFromJSON(jsonString) {
  try {
    const song = JSON.parse(jsonString);
    
    // Validate required fields
    if (!song.name || !Array.isArray(song.notes)) {
      throw new Error('Invalid song format');
    }
    
    // Generate new ID to avoid conflicts
    song.id = generateSongId();
    song.name = song.name + ' (imported)';
    song.createdAt = new Date().toISOString();
    song.updatedAt = new Date().toISOString();
    
    saveSong(song);
    return song;
  } catch (e) {
    console.error('Error importing song:', e);
    return null;
  }
}

// Export functions for use by other modules
window.Storage = {
  createNewSong,
  getAllSongs,
  getSongById,
  saveSong,
  deleteSong,
  getCurrentSongId,
  setCurrentSongId,
  getCurrentSong,
  serializeCurrentProject,
  loadSong,
  getSettings,
  saveSettings,
  updateSetting,
  getSetting,
  exportSongToJSON,
  importSongFromJSON
};
