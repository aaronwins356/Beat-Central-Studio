/**
 * Electron Main Process for NoteLab DAW
 * 
 * This file creates the main BrowserWindow and handles
 * application lifecycle events for the desktop version.
 */

const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

/**
 * Create the main application window
 * @returns {BrowserWindow} The created window
 */
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'NoteLab DAW',
    backgroundColor: '#0a0a0f',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    autoHideMenuBar: false,
    show: false // Don't show until ready
  });

  // Load the main HTML file
  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Create application menu
  createMenu(mainWindow);

  return mainWindow;
}

/**
 * Create the application menu
 * @param {BrowserWindow} mainWindow - The main application window
 */
function createMenu(mainWindow) {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.executeJavaScript('window.UI && createNewSong && createNewSong()');
          }
        },
        {
          label: 'Save Project',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.executeJavaScript('window.UI && saveCurrentSong && saveCurrentSong()');
          }
        },
        { type: 'separator' },
        {
          label: 'Export as WAV',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.executeJavaScript('exportToWAV && exportToWAV()');
          }
        },
        {
          label: 'Export as MP3',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => {
            mainWindow.webContents.executeJavaScript('exportToMP3 && exportToMP3()');
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Transport',
      submenu: [
        {
          label: 'Play/Pause',
          accelerator: 'Space',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              if (window.Transport) {
                const state = window.Transport.getState();
                if (state.isPlaying && !state.isPaused) {
                  window.Transport.pause();
                } else {
                  window.Transport.play();
                }
              }
            `);
          }
        },
        {
          label: 'Stop',
          accelerator: 'CmdOrCtrl+.',
          click: () => {
            mainWindow.webContents.executeJavaScript('window.Transport && window.Transport.stop()');
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Loop',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            mainWindow.webContents.executeJavaScript('window.Transport && window.Transport.toggleLoop()');
          }
        },
        {
          label: 'Toggle Metronome',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            mainWindow.webContents.executeJavaScript('window.Transport && window.Transport.toggleMetronome()');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About NoteLab DAW',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About NoteLab DAW',
              message: 'NoteLab DAW',
              detail: 'Version 2.0.0\n\nA browser-based Digital Audio Workstation featuring a piano roll editor, drum machine, 9 synthesized instruments, and audio export capabilities.\n\nBuilt with Web Audio API and Electron.'
            });
          }
        },
        {
          label: 'View on GitHub',
          click: () => {
            shell.openExternal('https://github.com/aaronwins356/Song-HTML');
          }
        }
      ]
    }
  ];

  // Add macOS-specific menu items
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App lifecycle events

app.whenReady().then(() => {
  createWindow();

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    // Only allow file:// URLs (local files)
    if (parsedUrl.protocol !== 'file:') {
      event.preventDefault();
    }
  });
});
