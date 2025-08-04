# Multiline Cursor Audio Visualizer

A Visual Studio Code extension that provides real-time audio visualization using multiline cursors.

## Features

- **Real-time Audio Capture**: Captures system audio using cross-platform audio libraries
- **Frequency Analysis**: Performs FFT analysis to extract frequency information
- **Multiline Cursor Visualization**: Uses VS Code's multiline cursor feature to visualize audio
- **Configurable Settings**: Adjust sensitivity, frequency range, and cursor count

## Development

### Prerequisites

- Node.js 18+
- VS Code 1.74+
- TypeScript 4.9+

### Building

```bash
npm install
npm run compile
```

### Testing

Press F5 in VS Code to launch the extension in a new Extension Development Host window.

### Commands

- `Audio Visualizer: Start` - Start the audio visualizer
- `Audio Visualizer: Stop` - Stop the audio visualizer
- `Audio Visualizer: Configure` - Open configuration settings

## Usage

1. Open any text file in VS Code
2. Use Command Palette (Ctrl+Shift+P) and run "Audio Visualizer: Start"
3. Grant microphone permissions when prompted
4. Watch the cursors move with your audio!