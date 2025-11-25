# NoteLab DAW

![NoteLab DAW](https://img.shields.io/badge/NoteLab-DAW-5865f2?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.0-43b581?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-faa61a?style=for-the-badge)

**NoteLab DAW** is a fully interactive browser-based Digital Audio Workstation featuring a piano roll editor, drum machine, 9 synthesized instruments including 3 guitar types, effects processing, and audio export capabilities.

---

## 🎵 Overview

NoteLab DAW transforms your browser into a complete music production environment. Create melodies with the piano roll, build beats with the drum machine, layer instruments, and export your creations as WAV or MP3 files—all without installing any software.

Built entirely with **Web Audio API** and vanilla JavaScript, NoteLab runs 100% in your browser with zero backend dependencies for audio processing.

---

## ✨ Features

### 🎹 Piano Roll
- **Note Range**: C0 to C8 (97 notes)
- **Timeline**: 8 bars (128 sixteenth notes)
- **Grid Snapping**: 1/16 note quantization
- **Polyphony**: Full chord support
- **Auto-Preview**: Notes play when placed
- **Drag & Drop**: Move notes by dragging
- **Selection**: Click to select, Ctrl+click for multi-select
- **Deletion**: Right-click to remove notes

### 🥁 Drum Machine
- **4 Lanes**: Kick, Snare, Hi-Hat, Clap
- **Grid**: 16 steps × 8 bars (128 steps total)
- **Lane Controls**: Mute, Solo, Volume per lane
- **Click to Toggle**: Add/remove hits instantly
- **Visual Feedback**: Color-coded lanes with playhead
- **Collapsible Panel**: Minimize when not in use

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
- **Reverb**: Convolution-based room simulation
  - Adjustable mix level
  - Toggle on/off
- **Delay**: Tempo-synced echo effect
  - Adjustable delay time
  - Feedback control
  - Mix level

### ⏱ Transport
- **Play/Pause**: Start and pause playback
- **Stop**: Reset to beginning
- **Loop**: Toggle loop mode (enabled by default)
- **Metronome**: Click track (ON by default)
- **Recording**: Capture keyboard input during playback
- **BPM**: Adjustable tempo (20-300 BPM)

### 💾 Project Management
- **Multi-Project Saving**: Store unlimited songs in browser
- **Auto-Persistence**: Songs survive browser refresh
- **Rename/Delete**: Manage your song library
- **JSON Export**: Download projects as JSON files
- **JSON Import**: Load projects from files

### 📤 Audio Export
- **WAV Export**: Lossless audio export
- **MP3 Export**: Compressed export via lamejs

---

## 🎛 UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🎹 NoteLab DAW        BPM [120]  Instrument [▼]   📄💾📂🎵 │
├──────────┬─────────────────────────────────┬────────────────┤
│          │                                 │                │
│  EFFECTS │        PIANO ROLL GRID          │   INSTRUMENT   │
│  ───────┤         (8 bars × 97 notes)      │      RACK      │
│  Reverb  │                                 │   ──────────── │
│  Delay   │    ██ ██   ██  ██              │    Piano       │
│          │  ██    ██ ██    ██              │    Pluck       │
│  ───────┤       ◄────────────►             │    Saw Lead    │
│ KEYBOARD │        ▲ Playhead               │    Pad         │
│  Hints   │                                 │    Bass        │
│          │                                 │    Bell        │
│          │                                 │    Clean Gtr   │
│          │                                 │    Distort Gtr │
│          │                                 │    Acoustic    │
├──────────┴─────────────────────────────────┴────────────────┤
│  🥁 DRUM MACHINE                                    [▼]     │
│  ┌────────┬────────────────────────────────────────────────┐│
│  │ Kick   │ ● ○ ○ ○ │ ● ○ ○ ○ │ ● ○ ○ ○ │ ● ○ ○ ○ │ ...  ││
│  │ Snare  │ ○ ○ ● ○ │ ○ ○ ● ○ │ ○ ○ ● ○ │ ○ ○ ● ○ │ ...  ││
│  │ Hi-Hat │ ● ● ● ● │ ● ● ● ● │ ● ● ● ● │ ● ● ● ● │ ...  ││
│  │ Clap   │ ○ ○ ● ○ │ ○ ○ ○ ○ │ ○ ○ ● ○ │ ○ ○ ○ ○ │ ...  ││
│  └────────┴────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  ⏹ ▶ ⏺  [Loop] [Metronome]     🔊━━━━○     Mini Piano      │
├─────────────────────────────────────────────────────────────┤
│  8 bars • 1/16 grid • C0-C8             NoteLab DAW v2.0    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎮 How to Use

### Adding Notes (Piano Roll)
1. Select an instrument from the dropdown or click in the Instrument Rack
2. Click on the grid to add a note at that position
3. Notes are automatically quantized to 1/16 grid
4. A preview sound plays when you add a note

### Editing Notes
- **Move**: Click and drag a note to reposition it
- **Delete**: Right-click on a note to remove it
- **Select**: Click to select (highlighted white)
- **Multi-select**: Hold Ctrl/Cmd while clicking
- **Delete Selected**: Press Delete or Backspace

### Using the Drum Machine
1. Expand the drum panel by clicking the header
2. Click on grid cells to toggle drum hits
3. Use M (Mute) to silence a lane
4. Use S (Solo) to hear only that lane
5. Adjust volume sliders for balance

### Recording Mode
1. Click the Record button (⏺) to enable recording
2. Press Play to start playback
3. Play notes on your keyboard or mini piano
4. Notes are recorded at the current playhead position

### Exporting Audio
1. Click **MP3** for compressed export (uses lamejs)
2. Click **WAV** for lossless export
3. Files download automatically with your song name

### Saving/Loading Projects
- **New**: Create a fresh empty project
- **Save**: Store project in browser storage
- **Load**: Open the load modal to select a saved song
- **Export JSON**: Download project as JSON file
- **Import JSON**: Load project from JSON file

---

## ⌨️ Keyboard Shortcuts

| Key | Function |
|-----|----------|
| `Space` | Play/Pause |
| `Delete` / `Backspace` | Delete selected notes |
| `A S D F G H J K L` | Play white keys (C4-D5) |
| `W E T Y U O P` | Play black keys (sharps/flats) |

---

## 🛠 Tech Stack

- **Audio**: Web Audio API
- **Synthesis**: OscillatorNode, GainNode, BiquadFilterNode
- **Effects**: ConvolverNode (reverb), DelayNode (delay), WaveShaperNode (distortion)
- **UI**: Vanilla JavaScript, Canvas API
- **Storage**: localStorage for projects
- **Export**: lamejs (MP3), native WAV encoding
- **Server**: Node.js + Express (static serving)
- **Reverse Proxy**: Caddy (HTTPS)

---

## 📁 File Structure

```
Song-HTML/
├── index.html           # Main DAW interface
├── dashboard.html       # Admin control panel
├── styles.css           # Dark DAW theme styles
├── audioEngine.js       # Web Audio synthesis & effects
├── pianoRoll.js         # Piano roll grid & note management
├── drumMachine.js       # Drum pattern sequencer
├── transport.js         # Playback scheduler & metronome
├── storage.js           # Project save/load functionality
├── ui.js                # UI controller & event handling
├── server.js            # Express static server
├── Caddyfile            # Caddy reverse proxy config
├── sites.json           # Multi-site configuration
├── ecosystem.config.js  # PM2 process configuration
├── package.json         # Node dependencies
├── start.ps1            # Windows startup script
├── update.ps1           # DuckDNS update script
└── README.md            # This documentation
```

---

## 🚀 Hosting Instructions

### Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open in browser
http://localhost:3000
```

### Production with Caddy + DuckDNS

1. **Configure Caddy** (`Caddyfile`):
```caddyfile
yourdomain.duckdns.org {
    reverse_proxy localhost:3000
    encode gzip
    file_server
}
```

2. **Start with PowerShell** (`start.ps1`):
```powershell
# Starts Node server and Caddy
./start.ps1
```

3. **Update DuckDNS** (`update.ps1`):
```powershell
# Updates dynamic DNS
./update.ps1
```

### PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Enable startup
pm2 startup
pm2 save
```

---

## 🔮 Future Roadmap

- [ ] **MIDI Input**: Connect MIDI keyboards
- [ ] **Sample Packs**: Load custom drum samples
- [ ] **Guitar Amp Modeling**: More realistic amp simulations
- [ ] **EQ/Filter**: Per-track equalization
- [ ] **Mixing Console**: Faders, pan, sends
- [ ] **Arrangement View**: Multiple patterns/sections
- [ ] **Automation**: Parameter automation lanes
- [ ] **Stem Export**: Export individual tracks
- [ ] **Collaboration**: Real-time multi-user editing
- [ ] **Mobile Support**: Touch-optimized interface

---

## 📜 License

MIT License - Feel free to use, modify, and distribute.

---

## 🙏 Credits

- **Web Audio API**: Modern browser audio synthesis
- **lamejs**: MP3 encoding library
- **Inter Font**: Clean UI typography

---

Made with 🎵 by NoteLab Team
