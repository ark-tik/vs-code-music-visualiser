# Change Log

All notable changes to the "Multiline Cursor Audio Visualizer" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-08-16

### Added
- Real-time audio visualization using VS Code's multiline cursor system
- **Microphone input support** - Live audio capture from system microphone
- **System audio support** - Loopback audio capture for visualizing computer output
- **FFT frequency analysis** - Advanced Fast Fourier Transform processing
- **Configurable settings** including:
  - Audio sensitivity adjustment (0.1-5.0x)
  - Update rate control (30-120 FPS)
  - Cursor count configuration (8-256)
  - Automatic cursor count based on visible lines
  - Movement smoothing (0.0-1.0)
  - Debug logging toggle
- **Cross-platform compatibility** - Windows, macOS, and Linux support
- **Pattern-based user action handling** - Smart pause/resume on user interaction
- **Automatic cursor position preservation** - Maintains cursor state when pausing
- **10-second auto-resume** - Visualization automatically resumes after user inactivity

### Commands
- `Audio Visualizer: Start (Microphone)` - Start visualization with microphone input
- `Audio Visualizer: Start (System Audio)` - Start visualization with system audio capture
- `Audio Visualizer: Stop` - Stop the visualization
- `Audio Visualizer: Configure` - Open extension settings

### Architecture
- Modular audio source system for easy extensibility
- Pluggable FFT providers supporting different algorithms
- Clean separation between audio capture, analysis, and visualization
- TypeScript codebase with comprehensive type safety

### Documentation
- Comprehensive README with setup instructions
- Architecture documentation
- Audio fundamentals guide
- Cross-platform setup instructions

## [1.0.1] - 2024-08-16

### Fixed
- **Extension activation failure** - Fixed missing native dependencies in published package
  - Included `@picovoice/pvrecorder-node`, `fft.js`, and `node-wav` in extension bundle
  - Extension now activates properly without "Cannot find module" errors
- **Default visualization file** - Fixed missing default-visualization.md auto-open
  - Both microphone and system audio commands now automatically open the visualization file
  - Provides better visual experience with rich content for cursor visualization

### Technical
- Updated `.vscodeignore` to include runtime dependencies while excluding dev files
- Package size increased to 9MB (from 1.73MB) to include necessary native modules
- Added proper dependency bundling for cross-platform compatibility

## [Unreleased]

### Planned Features
- Additional audio source types
- Custom frequency range configuration
- Visual theme customization
- Performance optimizations

---

**Initial Release Notes:**

This is the first public release of the Multiline Cursor Audio Visualizer. The extension transforms VS Code into a real-time music visualizer by using the editor's multiline cursor feature to represent audio frequencies.

**Getting Started:**
1. Install the extension
2. Open any text file in VS Code
3. Run "Audio Visualizer: Start (Microphone)" or "Audio Visualizer: Start (System Audio)"
4. Watch your code come alive with music!

**System Requirements:**
- VS Code 1.74.0 or later
- Audio input device (microphone) or system audio loopback capability
- Node.js 18+ (for development)

**Known Limitations:**
- System audio capture requires additional setup on some platforms
- Performance may vary based on system specifications
- Large cursor counts (>128) may impact editor responsiveness

For detailed setup instructions and troubleshooting, see the [README](README.md).