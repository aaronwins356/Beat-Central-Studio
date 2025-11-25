/**
 * Electron Preload Script for NoteLab DAW
 * 
 * This script runs in the renderer process before the web page loads.
 * It provides a secure bridge between the Electron main process and
 * the web content using contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform information
  platform: process.platform,
  
  // App version
  getVersion: () => {
    return process.env.npm_package_version || '2.0.0';
  },
  
  // Check if running in Electron
  isElectron: true
});

// Log when preload completes
console.log('NoteLab DAW - Electron preload script loaded');
