# How It Works

## Audio Processing Pipeline

The visualizer converts audio into cursor positions through these steps:

### 1. Audio Capture
**Microphone Mode**: Real-time input via `@picovoice/pvrecorder-node`  
**System Audio Mode**: Loopback capture of computer's audio output

### 2. Frame Processing
- Audio captured in 1024-sample chunks (23ms at 44.1kHz)
- Processed at 60 FPS for smooth real-time visualization
- Normalized to Float32Array (-1.0 to +1.0 range)

### 3. Frequency Analysis (FFT)
Fast Fourier Transform converts time-domain audio to frequency spectrum:

```
Input:  [0.1, 0.3, -0.2, 0.5, ...]  ← Audio waveform
Output: 512 frequency bins with magnitudes
        [0Hz: 0.1, 86Hz: 0.8, 172Hz: 0.3, ...]
```

### 4. Frequency Binning
Groups 512 FFT bins into cursor bins (typically 20-64):

```
Bin 0:  0-200Hz    → Bass frequencies (drums, bass guitar)
Bin 1:  200-500Hz  → Low-mid frequencies  
Bin 2:  500-1kHz   → Mid frequencies (vocals, guitar)
Bin 3:  1-3kHz     → High-mid frequencies
Bin 4:  3kHz+      → High frequencies (cymbals, harmonics)
```

### 5. Cursor Mapping
Each frequency bin maps to a VS Code editor line:

```
Line 0: |--------●     ← Bass drum hit (high magnitude)
Line 1: |---●          ← Quiet guitar (low magnitude)  
Line 2: |------------● ← Loud vocals (high magnitude)
Line 3: |--●           ← Cymbals (medium magnitude)
```

**Positioning Logic**:
- **Line number** = Frequency band (0=bass, higher=treble)
- **Horizontal position** = Magnitude × sensitivity

### 6. Real-Time Updates
Update loop runs every 16ms (60 FPS):
1. Capture latest audio frame
2. Run FFT analysis 
3. Calculate cursor positions
4. Update `editor.selections` with new cursor array

## Understanding Digital Audio

### What Audio Files Contain
Think of music as layered frequencies playing simultaneously:

```
🥁 Bass Layer (0-200Hz):     ████████████ Drums, bass guitar
🎸 Mid Layer (200-2kHz):     ████████     Guitar, piano  
🎤 Vocal Layer (2-8kHz):     ██████       Vocals, harmonics
🔔 Air Layer (8kHz+):        ███          Cymbals, "sparkle"
```

### Audio Sampling
Digital audio captures continuous sound waves as discrete measurements:

```
Sound wave: ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿
Samples:    • • • • • • • • • • • • • • • •
            44,100 times per second
```

Each sample represents "how far are air molecules displaced right now?"

### The FFT Magic
FFT acts as a "frequency detective" - it separates mixed audio back into individual frequency components:

```
Mixed Audio:     [Complex waveform samples]
                         ↓ FFT
Separated:       Bass: loud, Mids: quiet, Highs: medium
```

## Example: Rock Song Analysis

**Quiet Verse**:
```
Bass (drums):     ██       → Cursors on lines 0-2 near left
Mids (guitar):    ████     → Cursors on lines 3-8 medium right  
Vocals:           ██████   → Cursors on lines 9-15 far right
Cymbals:          █        → Cursors on lines 16+ near left
```

**Loud Chorus**:
```
Bass (drums):     ██████   → Cursors on lines 0-2 far right
Mids (guitar):    ████████ → Cursors on lines 3-8 far right
Vocals:           ██████   → Cursors on lines 9-15 far right  
Cymbals:          ████     → Cursors on lines 16+ medium right
```

The visual result shows how different frequency layers contribute to the music's energy and character in real-time.