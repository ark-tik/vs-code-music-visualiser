import * as vscode from 'vscode';
import { FrequencyData, FrequencyAnalyzer } from './frequencyAnalyzer';
import { Logger } from './logger';

export class CursorController {
    private frequencyAnalyzer: FrequencyAnalyzer;
    private lastCursorPositions: vscode.Position[] = [];
    private smoothedMagnitudes: number[] = [];

    constructor() {
        this.frequencyAnalyzer = new FrequencyAnalyzer();
    }

    private getCurrentEditor(): vscode.TextEditor | undefined {
        return vscode.window.activeTextEditor;
    }

    updateCursors(frequencyData: FrequencyData): void {
        const editor = this.getCurrentEditor();
        if (!editor) {
            Logger.debug('No active editor found, skipping cursor update - open a file to see visualization');
            return;
        }

        const config = vscode.workspace.getConfiguration('audioVisualizer');
        const smoothing = config.get<number>('smoothing', 0.3);
        
        const globalSensitivity = config.get<number>('sensitivity', 5.0);

        // Calculate optimal cursor count based on visible lines
        const optimalCursorCount = this.calculateOptimalCursorCount();
        
        // Get frequency bins
        const bins = this.frequencyAnalyzer.getFrequencyBins(frequencyData, optimalCursorCount);
        
        // Apply exponential smoothing to magnitudes
        const smoothedBins = this.applySmoothingToBins(bins, smoothing);
        
        Logger.debug(`Updating selections: ${smoothedBins.length} bins (auto-configured for ${this.getVisibleLineCount()} visible lines), smoothing: ${smoothing.toFixed(2)}, total energy: ${frequencyData.totalEnergy}`);

        // Create new line selections based on frequency data
        const newSelections: vscode.Selection[] = [];
        const document = editor.document;
        const totalLines = document.lineCount;

        for (let i = 0; i < smoothedBins.length; i++) {
            const magnitude = smoothedBins[i] * globalSensitivity;

            // Lower threshold for test mode visibility
            if (magnitude < 0.001) {
                continue;
            }

            // Place selection on line i (sequential, line-by-line)
            const lineIndex = Math.min(i, totalLines - 1);
            const line = document.lineAt(lineIndex);

            // Position end of selection based on magnitude (amplify for visibility)
            const amplifiedMagnitude = Math.min(magnitude * 0.01, 1.0); // Much smaller multiplier
            const charProgress = amplifiedMagnitude;
            const maxCharIndex = Math.max(line.text.length - 1, 0);
            const charIndex = Math.floor(charProgress * maxCharIndex);

            // Create selection from start of line to the calculated position
            const startPosition = new vscode.Position(lineIndex, 0);
            const endPosition = new vscode.Position(lineIndex, charIndex);
            newSelections.push(new vscode.Selection(startPosition, endPosition));
            
            // Log only first few selections to avoid spam
            if (i < 3 && Logger.isDebugEnabled) {
                Logger.debug(`Selection ${i}: line ${lineIndex}, chars 0-${charIndex}, magnitude ${magnitude.toFixed(4)}`);
            }
        }

        // Update editor selections
        if (newSelections.length > 0) {
            editor.selections = newSelections;
            Logger.debug(`Set ${newSelections.length} line selections in editor`);

            // Optionally reveal the first selection
            if (newSelections.length > 0) {
                editor.revealRange(new vscode.Range(newSelections[0].start, newSelections[0].end));
            }
        } else {
            Logger.debug('No selections to set - all magnitudes below threshold');
        }
    }

    clearCursors(): void {
        const editor = this.getCurrentEditor();
        if (!editor) {
            return;
        }
        
        // Reset to single cursor at the beginning
        const position = new vscode.Position(0, 0);
        editor.selection = new vscode.Selection(position, position);
    }

    private getVisibleLineCount(): number {
        const editor = this.getCurrentEditor();
        if (!editor) {
            return 20; // Fallback if no active editor
        }
        
        // Get the visible range of the editor
        const visibleRanges = editor.visibleRanges;
        
        if (visibleRanges.length === 0) {
            return 20; // Fallback if no visible range available
        }
        
        // Calculate total visible lines across all visible ranges
        let totalVisibleLines = 0;
        for (const range of visibleRanges) {
            totalVisibleLines += range.end.line - range.start.line + 1;
        }
        
        return Math.max(1, totalVisibleLines);
    }

    private calculateOptimalCursorCount(): number {
        const config = vscode.workspace.getConfiguration('audioVisualizer');
        
        // Check if user wants manual control (new setting)
        const useAutoConfiguration = config.get<boolean>('autoConfigureCursorCount', true);
        
        if (!useAutoConfiguration) {
            // Use manual configuration
            return config.get<number>('cursorCount', 64);
        }
        
        // Auto-configuration based on visible lines
        const visibleLines = this.getVisibleLineCount();
        const optimalCount = Math.max(8, visibleLines - 2); // At least 8 cursors, but 2 less than visible lines
        
        // Cap at reasonable maximum to avoid performance issues
        const maxCursors = config.get<number>('maxCursors', 128);
        const finalCount = Math.min(optimalCount, maxCursors);
        
        Logger.debug(`Auto-configured cursor count: ${finalCount} (${visibleLines} visible lines)`);
        return finalCount;
    }

    private applySmoothingToBins(bins: number[], smoothingFactor: number): number[] {
        // Initialize smoothed magnitudes array if empty or size changed
        if (this.smoothedMagnitudes.length !== bins.length) {
            this.smoothedMagnitudes = [...bins]; // Initialize with current values
            return bins; // First frame, no smoothing needed
        }

        // Apply exponential smoothing: smoothed = smoothingFactor * previous + (1 - smoothingFactor) * current
        const smoothedBins: number[] = [];
        for (let i = 0; i < bins.length; i++) {
            const smoothed = smoothingFactor * this.smoothedMagnitudes[i] + (1 - smoothingFactor) * bins[i];
            smoothedBins.push(smoothed);
            this.smoothedMagnitudes[i] = smoothed; // Store for next frame
        }

        return smoothedBins;
    }
}