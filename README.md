# 🎵 VS Code Music Visualizer

> Transform your code editor into a real-time music visualizer using multiline cursors

A Visual Studio Code extension that captures audio input and creates beautiful real-time visualizations using VS Code's multiline cursor feature. Watch your code dance to the beat of your music as frequency analysis drives dynamic cursor positioning.

![VS Code Audio Visualizer Demo](https://img.shields.io/badge/VS%20Code-Extension-blue?logo=visualstudiocode)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue?logo=typescript)
![Audio](https://img.shields.io/badge/Audio-Real--time-green?logo=audacity)

## ✨ Features

- **🎤 Multiple Audio Sources**: Microphone, system audio, audio files, or synthetic test signals
- **⚡ Real-time Analysis**: Advanced FFT/DFT frequency analysis at 60 FPS
- **🎯 Dynamic Cursors**: Each cursor represents a frequency band, positioned by amplitude
- **🎛️ Configurable**: Adjust sensitivity, update rate, and cursor count
- **🖥️ Cross-platform**: Works on Windows, macOS, and Linux
- **🧪 Test Modes**: Built-in synthetic audio for testing without hardware dependencies

## 🚀 Quick Start

### Installation

1. **Clone & Build**:
   ```bash
   git clone https://github.com/ark-tik/vs-code-music-visualiser.git
   cd vs-code-music-visualiser
   npm install
   npm run compile
   ```

2. **Install Extension**:
   - Press `F5` in VS Code to launch in Extension Development Host
   - Or package: `npm install -g vsce && vsce package`

### Usage

1. **Open any text file** in VS Code
2. **Start visualization**:
   - Press `Ctrl+Shift+P` (Command Palette)
   - Type "Audio Visualizer: Start"
   - Choose your preferred mode:
     - **Default**: Microphone input with automatic fallback
     - **Test Mode**: Synthetic 440Hz tone for testing
     - **File Mode**: Load and visualize audio files
     - **System Audio**: Capture system output (loopback)

3. **Watch the magic**: Cursors will appear and move based on audio frequencies:
   ```
   Line 0 (Bass):     |--------●     ← Bass drum hits
   Line 1 (Low Mid):  |---●          ← Guitar
   Line 2 (Mid):      |------------● ← Vocals  
   Line 3 (High):     |--●           ← Cymbals
   ```

## 🎯 How It Works

The visualizer transforms audio into visual patterns through these steps:

### 1. Audio Capture
- **Microphone**: Real-time input via cross-platform audio libraries
- **File Playback**: WAV file support with automatic resampling
- **System Audio**: Loopback capture of computer's audio output
- **Test Mode**: Generated sine waves for consistent testing

### 2. Frequency Analysis  
- **FFT Processing**: Fast Fourier Transform converts time-domain audio to frequency spectrum
- **Real-time**: 1024-sample frames processed at 60 FPS
- **Frequency Bins**: Audio spectrum divided into bands (bass, mids, treble, etc.)

### 3. Visual Mapping
- **Lines = Frequencies**: Each editor line represents a frequency band
- **Horizontal Position = Amplitude**: Louder frequencies push cursors further right
- **Live Updates**: Smooth 60 FPS visualization with configurable smoothing

> **Think of it like this**: Music is like a layered cake with bass, mids, and treble. The visualizer shows you how "thick" each layer is at any moment, with cursors dancing to represent the intensity of each frequency band.

## ⚙️ Configuration

Customize the visualizer through VS Code settings:

```json
{
  "audioVisualizer.sensitivity": 1.0,           // Amplitude multiplier (0.1-5.0)
  "audioVisualizer.updateRate": 60,             // Refresh rate in FPS (30-120)  
  "audioVisualizer.cursorCount": 64,            // Number of cursors (8-256)
  "audioVisualizer.autoConfigureCursorCount": true, // Auto-adjust to visible lines
  "audioVisualizer.maxCursors": 128,            // Maximum cursor limit
  "audioVisualizer.smoothing": 0.7,             // Movement smoothing (0.0-1.0)
  "audioVisualizer.enableDebugLogging": false   // Verbose logging for debugging
}
```

## 🛠️ Development

### Prerequisites
- **Node.js** 18+
- **VS Code** 1.74+  
- **TypeScript** 4.9+

### Project Structure
```
src/
├── audioSources/           # Audio input implementations
│   ├── microphoneAudioSource.ts   # Real microphone input
│   ├── fileAudioSource.ts         # WAV file playback  
│   ├── systemAudioSource.ts       # System audio loopback
│   └── testAudioSource.ts         # Synthetic test signals
├── fftProviders/           # Frequency analysis algorithms  
│   └── fftProvider.ts              # FFT/DFT implementations
├── audioVisualizer.ts      # Main orchestration
├── frequencyAnalyzer.ts    # Audio → frequency data
├── cursorController.ts     # Frequency → cursor positions
└── extension.ts            # VS Code integration
```

### Available Commands
- `npm run compile` - Build TypeScript
- `npm run watch` - Continuous compilation
- `node list-audio-devices.js` - Test audio device discovery

### Testing Audio Setup
Use the built-in audio device utility:
```bash
node list-audio-devices.js
```
This will show available audio inputs and identify potential system audio loopback devices.

## 🎛️ Audio Sources Explained

### 🎤 Microphone Input
- **Best for**: Live music, singing, acoustic instruments
- **Setup**: Grant microphone permissions when prompted
- **Works with**: Any system microphone or audio interface

### 🔊 System Audio (Loopback)  
- **Best for**: Visualizing music from Spotify, YouTube, games
- **Setup Required**:
  - **Windows**: Enable "Stereo Mix" in recording devices
  - **macOS**: Install BlackHole or Soundflower
  - **Linux**: Use PulseAudio monitor devices (`.monitor`)
- **Pro tip**: Run `node list-audio-devices.js` to find loopback devices

### 📁 File Mode
- **Best for**: Analyzing specific audio files, presentations  
- **Supported**: WAV files (MP3 support planned)
- **Features**: Automatic mono conversion, resampling, looping

### 🧪 Test Mode
- **Best for**: Development, debugging, demonstrations
- **No hardware needed**: Generates synthetic 440Hz tone
- **Consistent**: Perfect for testing visualization algorithms

## 🏗️ Architecture

The extension follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Audio Sources │────▶   Frequency      │────▶   Cursor       │
│                 │    │   Analyzer       │    │   Controller    │  
│ • Microphone    │    │                  │    │                 │
│ • File          │    │ • FFT/DFT        │    │ • Line mapping  │
│ • System        │    │ • Binning        │    │ • Position calc │
│ • Test          │    │ • Smoothing      │    │ • VS Code API   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   VS Code       │
                       │   Editor        │
                       │                 │
                       │ • Multiline     │
                       │   cursors       │
                       │ • Real-time     │  
                       │   updates       │
                       └─────────────────┘
```

## 🤝 Contributing

Contributions are welcome! The architecture is designed for easy extension:

### Adding New Audio Sources
Implement the `AudioSource` interface:
```typescript
export class CustomAudioSource extends AudioSource {
  get name(): string { return "Custom Source"; }
  async initialize(): Promise<void> { /* setup */ }
  async startCapture(): Promise<void> { /* begin */ }
  stopCapture(): void { /* cleanup */ }
}
```

### Adding New FFT Algorithms  
Implement the `FFTProvider` interface:
```typescript
export class CustomFFT extends FFTProvider {
  get name(): string { return "Custom FFT"; }
  transform(input: Float32Array): { real: number[], imag: number[] }
}
```

## 📚 Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)**: Detailed technical architecture
- **[How It Works](docs/how-it-works.md)**: Step-by-step audio processing explanation  
- **[Audio Fundamentals](docs/how-music-is-sampled.md)**: Understanding digital audio and FFT

## 🐛 Troubleshooting

### No Audio Input Detected
1. **Check permissions**: Ensure VS Code has microphone access
2. **Test devices**: Run `node list-audio-devices.js` 
3. **Try test mode**: Use "Audio Visualizer: Start (Test Mode)" to verify extension works
4. **Check logs**: Enable debug logging in settings

### System Audio Not Working
- **Windows**: Enable "Stereo Mix" in Windows Sound settings
- **macOS**: Install [BlackHole](https://github.com/ExistentialAudio/BlackHole) 
- **Linux**: Use PulseAudio monitor devices ending in `.monitor`

### Performance Issues
- Lower `updateRate` (try 30 FPS instead of 60)
- Reduce `cursorCount` for fewer cursors
- Disable debug logging in production use

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎶 Inspiration

Created for developers who love music and want to see their code come alive with sound. Whether you're coding to lo-fi hip-hop, debugging to death metal, or presenting with classical music, this visualizer adds a new dimension to your VS Code experience.

---

**Made with ❤️ for the VS Code community using [Claude Code](https://claude.ai/code)**

*Tip: Try it with different genres of music - each style creates unique visual patterns!*