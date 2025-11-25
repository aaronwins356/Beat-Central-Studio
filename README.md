# NoteLab DAW

![NoteLab DAW](https://img.shields.io/badge/NoteLab-DAW-5865f2?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.0-43b581?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-faa61a?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Web-00aff4?style=for-the-badge)

**NoteLab DAW** is a professional-grade Digital Audio Workstation available as both a **desktop application** (via Electron) and a **browser-based** web app. Create music with a full-featured piano roll editor, drum machine, 9 synthesized instruments including guitars, effects processing, and export capabilities.

---

## 🎵 Overview

NoteLab DAW transforms your computer into a complete music production environment. Whether you prefer working in a standalone desktop application or directly in your browser, NoteLab provides the same powerful features:

- **Piano Roll**: Create melodies with a professional note editor
- **Drum Machine**: Build beats with a 4-lane step sequencer
- **9 Instruments**: Synths and guitars with unique characteristics
- **Effects**: Reverb and delay with adjustable parameters
- **Export**: Save your creations as WAV or MP3 files

Built entirely with **Web Audio API** and vanilla JavaScript, NoteLab runs 100% locally with zero backend dependencies for audio processing.

---

## 🖥️ Desktop Application

### Quick Start (Desktop)

```bash
# Clone the repository
git clone https://github.com/aaronwins356/Song-HTML.git
cd Song-HTML

# Install dependencies
npm install

# Run in development mode
npm run electron
```

### Building Windows Installer (.exe)

```bash
# Build Windows installer
npm run build:desktop
```

The installer will be created in the `dist/` folder:
- `NoteLab-DAW-Setup-2.0.0.exe` - NSIS installer for Windows

### Building for Other Platforms

```bash
# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux

# Build for all platforms
npm run build:all
```

### Desktop Features

- **Native Window**: Runs as a standalone application
- **Menu Bar**: File, Edit, View, Transport, and Help menus
- **Keyboard Shortcuts**: Native shortcuts for common actions
- **Offline**: Works completely offline once installed
- **Fast Launch**: Starts immediately on open

---

## 🌐 Web Application

### Quick Start (Web)

```bash
# Clone the repository
git clone https://github.com/aaronwins356/Song-HTML.git
cd Song-HTML

# Install dependencies
npm install

# Start the web server
npm start

# Open in browser
open http://localhost:3000
```

### Production Deployment with Caddy + DuckDNS

1. **Configure Caddy** (`Caddyfile`):
```caddyfile
yourdomain.duckdns.org {
    reverse_proxy localhost:3000
    encode gzip
    file_server
}
```

2. **Start with PM2**:
```bash
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

3. **Update DuckDNS** (Windows):
```powershell
./update.ps1
```

---

## ✨ Features

### 🎹 Piano Roll
| Feature | Description |
|---------|-------------|
| Note Range | C0 to C8 (97 notes) |
| Timeline | 8 bars (128 sixteenth notes) |
| Grid Snapping | 1/16 note quantization |
| Polyphony | Full chord support |
| Auto-Preview | Notes play when placed |
| Drag & Drop | Move notes by dragging |
| Selection | Click to select, Ctrl+click for multi-select |
| Deletion | Right-click to remove notes |

### 🥁 Drum Machine
| Feature | Description |
|---------|-------------|
| Lanes | Kick, Snare, Hi-Hat, Clap |
| Grid | 16 steps × 8 bars (128 steps) |
| Lane Controls | Mute, Solo, Volume per lane |
| Interaction | Click to toggle hits |
| Visual Feedback | Color-coded lanes with playhead |

### 🎸 Instruments (9 Total)

| Instrument | Type | Description |
|------------|------|-------------|
| **Piano** | Synth | Warm triangle + sine wave blend |
| **Pluck** | Synth | Fast attack with filter sweep |
| **Saw Lead** | Synth | Detuned sawtooth for rich leads |
| **Synth Pad** | Synth | Slow attack ambient pad |
| **Bass** | Synth | Deep sawtooth with low-pass filter |
| **Bell** | Synth | FM-style harmonic bell tones |
| **Clean Guitar** | Guitar | Soft triangle-based electric |
| **Distorted Guitar** | Guitar | Waveshaper distortion effect |
| **Acoustic Guitar** | Guitar | Warm acoustic simulation |

### 🔊 Effects
- **Reverb**: Convolution-based room simulation (toggle, adjustable mix)
- **Delay**: Tempo-synced echo (time, feedback, mix controls)

### ⏱ Transport
- **Play/Pause/Stop**: Full playback control
- **Loop**: Toggle loop mode (enabled by default)
- **Metronome**: Click track (ON by default)
- **Recording**: Capture keyboard input during playback
- **BPM**: Adjustable tempo (20-300 BPM)

### 💾 Project Management
- **Multi-Project Saving**: Store unlimited songs locally
- **Auto-Persistence**: Songs survive browser/app refresh
- **JSON Export/Import**: Share projects as files

### 📤 Audio Export
- **WAV Export**: Lossless audio (native encoding)
- **MP3 Export**: Compressed audio (via lamejs)

---

## 🎛 UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🎹 NoteLab DAW        BPM [120]  Instrument [▼]   📄💾📂🎵 │
├──────────┬─────────────────────────────────┬────────────────┤
│          │                                 │                │
│  EFFECTS │        PIANO ROLL GRID          │   INSTRUMENT   │
│  ───────│         (8 bars × 97 notes)      │      RACK      │
│  Reverb  │                                 │   ──────────── │
│  Delay   │    ██ ██   ██  ██              │    Piano       │
│          │  ██    ██ ██    ██              │    Pluck       │
│  ───────│       ◄────────────►             │    Saw Lead    │
│ KEYBOARD │        ▲ Playhead               │    ...         │
│  Hints   │                                 │                │
├──────────┴─────────────────────────────────┴────────────────┤
│  🥁 DRUM MACHINE                                    [▼]     │
│  ┌────────┬────────────────────────────────────────────────┐│
│  │ Kick   │ ● ○ ○ ○ │ ● ○ ○ ○ │ ● ○ ○ ○ │ ● ○ ○ ○ │ ...  ││
│  │ Snare  │ ○ ○ ● ○ │ ○ ○ ● ○ │ ○ ○ ● ○ │ ○ ○ ● ○ │ ...  ││
│  └────────┴────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  ⏹ ▶ ⏺  [Loop] [Metronome]     🔊━━━━○     Mini Piano      │
└─────────────────────────────────────────────────────────────┘
```

---

## ⌨️ Keyboard Shortcuts

| Key | Function |
|-----|----------|
| `Space` | Play/Pause |
| `Delete` / `Backspace` | Delete selected notes |
| `A S D F G H J K L` | Play white keys (C4-D5) |
| `W E T Y U O P` | Play black keys (sharps/flats) |
| `Ctrl+N` | New Project (Desktop) |
| `Ctrl+S` | Save Project (Desktop) |
| `Ctrl+E` | Export WAV (Desktop) |
| `Ctrl+Shift+E` | Export MP3 (Desktop) |

---

## 🏗️ Architecture

### Project Structure

```
Song-HTML/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Secure context bridge
├── assets/
│   └── icon.png         # Application icon
├── index.html           # Main DAW interface
├── styles.css           # Dark DAW theme
├── audioEngine.js       # Web Audio synthesis & effects
├── pianoRoll.js         # Piano roll grid & notes
├── drumMachine.js       # Drum pattern sequencer
├── transport.js         # Playback scheduler
├── storage.js           # Project persistence
├── ui.js                # UI controller
├── server.js            # Express static server (web mode)
├── package.json         # Dependencies & build config
├── Caddyfile            # Reverse proxy config
└── README.md            # This documentation
```

### Module Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer (ui.js)                       │
│   Event handlers, DOM manipulation, user interactions       │
├─────────────────────────────────────────────────────────────┤
│                    State Management                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ pianoRoll.js│  │drumMachine.js│  │    storage.js       │ │
│  │  Notes data │  │ Drum pattern│  │ Project persistence │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Audio Engine                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   audioEngine.js                         ││
│  │  Synthesis • Effects • MIDI conversion • Export          ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   transport.js                           ││
│  │  Scheduler • Metronome • BPM • Recording                 ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                  Web Audio API                               │
│  AudioContext, OscillatorNode, GainNode, ConvolverNode      │
└─────────────────────────────────────────────────────────────┘
```

### Desktop vs Web Mode

| Aspect | Desktop (Electron) | Web (Browser) |
|--------|-------------------|---------------|
| Entry Point | `electron/main.js` | `server.js` |
| Launch | `npm run electron` | `npm start` |
| Build | `npm run build:desktop` | N/A |
| Menu | Native application menu | Browser UI |
| Storage | Same localStorage | Same localStorage |
| Audio | Same Web Audio API | Same Web Audio API |

---

## 🛠 Tech Stack

- **Audio Engine**: Web Audio API
- **Synthesis**: OscillatorNode, GainNode, BiquadFilterNode
- **Effects**: ConvolverNode, DelayNode, WaveShaperNode
- **Desktop**: Electron
- **Packaging**: electron-builder
- **UI**: Vanilla JavaScript, Canvas API
- **Storage**: localStorage
- **Export**: Native WAV encoding, lamejs (MP3)
- **Server**: Node.js + Express
- **Reverse Proxy**: Caddy

---

## 🔮 Future Roadmap

- [ ] MIDI Input: Connect MIDI keyboards
- [ ] Sample Packs: Load custom drum samples
- [ ] Guitar Amp Modeling: More realistic simulations
- [ ] EQ/Filter: Per-track equalization
- [ ] Mixing Console: Faders, pan, sends
- [ ] Arrangement View: Multiple patterns/sections
- [ ] Automation: Parameter automation lanes
- [ ] Stem Export: Export individual tracks
- [ ] Collaboration: Real-time multi-user editing
- [ ] Mobile Support: Touch-optimized interface

---

## 📜 License

MIT License - Feel free to use, modify, and distribute.

---

## 🙏 Credits

- **Web Audio API**: Modern browser audio synthesis
- **Electron**: Cross-platform desktop framework
- **electron-builder**: Application packaging
- **lamejs**: MP3 encoding library
- **Inter Font**: Clean UI typography

---

Made with 🎵 by NoteLab Team
