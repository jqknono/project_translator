import * as path from 'path';
import * as vscode from 'vscode';

// Default markers for different file types
// These will be used if custom markers aren't provided in settings
const DEFAULT_SEGMENTATION_MARKERS: Record<string, string[]> = {
    'markdown': ['^#\\s', '^##\\s', '^###\\s'], // Markdown headers
    'html': ['^<h1[^>]*>', '^<h2[^>]*>', '^<h3[^>]*>'], // HTML headers
    'javascript': ['^function\\s+\\w+\\(', '^class\\s+\\w+'], // JS functions and classes
    'typescript': ['^function\\s+\\w+\\(', '^class\\s+\\w+', '^interface\\s+\\w+'], // TS functions, classes, interfaces
    'python': ['^def\\s+\\w+\\(', '^class\\s+\\w+'], // Python functions and classes
    'java': ['^public\\s+(class|interface|enum)\\s+\\w+', '^\\s*public\\s+\\w+\\s+\\w+\\('], // Java classes and methods
    'go': ['^func\\s+\\w+\\(', '^type\\s+\\w+\\s+struct'], // Go functions and structs
    'c#': ['^public\\s+(class|interface|enum)\\s+\\w+', '^\\s*public\\s+\\w+\\s+\\w+\\('], // C# classes and methods
    'php': ['^function\\s+\\w+\\(', '^class\\s+\\w+'], // PHP functions and classes
    'ruby': ['^def\\s+\\w+', '^class\\s+\\w+'], // Ruby methods and classes
    'rust': ['^fn\\s+\\w+', '^struct\\s+\\w+', '^enum\\s+\\w+'], // Rust functions, structs, enums
    'swift': ['^func\\s+\\w+', '^class\\s+\\w+', '^struct\\s+\\w+'], // Swift functions, classes, structs
    'kotlin': ['^fun\\s+\\w+', '^class\\s+\\w+'], // Kotlin functions and classes
    'plaintext': ['^\\s*\\n'] // Plain text - segment on empty lines
};

// Extension to language mapping
const EXTENSION_TO_LANGUAGE_MAP: Record<string, string> = {
    '.md': 'markdown',
    '.markdown': 'markdown',
    '.html': 'html',
    '.htm': 'html',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.cs': 'c#',
    '.php': 'php',
    '.rb': 'ruby',
    '.rs': 'rust',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.txt': 'plaintext'
    // Add more mappings as needed
};

/**
 * Roughly estimate token count based on GPT tokenization rules
 * This is an approximation - actual tokens may vary slightly
 * @param text The text to count tokens for
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
    if (!text) return 0;
    
    // GPT tokenizer splits words at common boundaries
    // Roughly 4 characters per token for English text
    // This is a simplified approach - actual tokenization is more complex
    const words = text.split(/\s+/);
    let tokenCount = 0;
    
    for (const word of words) {
        // Count about 1 token per 4 chars, with minimum 1 token per word
        tokenCount += Math.max(1, Math.ceil(word.length / 4));
    }
    
    // Account for punctuation and special characters
    tokenCount += text.match(/[.,!?;:()[\]{}'"]/g)?.length || 0;
    
    return tokenCount;
}

/**
 * Segments text based on file type and configured markers
 * @param text The text content to segment
 * @param filePath The file path to determine the file type
 * @param maxTokens Maximum tokens per segment, defaults to config value or 3800
 * @returns Array of text segments
 */
export function segmentText(text: string, filePath: string, maxTokens?: number): string[] {
    const ext = path.extname(filePath).toLowerCase();
    const language = EXTENSION_TO_LANGUAGE_MAP[ext] || 'plaintext';
    
    // Get configuration values
    const config = vscode.workspace.getConfiguration('projectTranslator');
    const customMarkers = config.get<Record<string, string[]>>('segmentationMarkers') || {};
    
    // Use provided maxTokens parameter, or get from settings, or use default 3800
    const configMaxTokens = config.get<number>('maxTokensPerSegment') || 3800;
    const effectiveMaxTokens = maxTokens || configMaxTokens;
    
    // Combine default markers with custom markers, preferring custom
    const markers = customMarkers[language] || DEFAULT_SEGMENTATION_MARKERS[language] || DEFAULT_SEGMENTATION_MARKERS['plaintext'];
    
    // Create regex patterns from markers
    const patterns = markers.map(marker => new RegExp(marker, 'm'));
    
    // If text is small enough, return as a single segment
    if (estimateTokenCount(text) <= effectiveMaxTokens) {
        return [text];
    }
    
    // Split text into lines
    const lines = text.split('\n');
    const segments: string[] = [];
    let currentSegment: string[] = [];
    let currentTokens = 0;
    
    // Track potential segment break points (markers)
    let lastMarkerIndex = -1;
    let lastMarkerTokens = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineTokens = estimateTokenCount(line);
        
        // Check if this line is a segment marker
        const isMarker = patterns.some(pattern => pattern.test(line));
        
        // If this is a marker, remember it as a potential break point
        if (isMarker) {
            // If this is the first line or we don't have enough content yet, just add it
            if (currentSegment.length === 0) {
                currentSegment.push(line);
                currentTokens = lineTokens;
                continue;
            }
            
            lastMarkerIndex = currentSegment.length;
            lastMarkerTokens = currentTokens;
        }
        
        // If adding this line would exceed token limit, create a new segment
        if (currentTokens + lineTokens > effectiveMaxTokens) {
            // If we have a marker to break at, use it
            if (lastMarkerIndex > 0) {
                // Take everything up to the marker
                const segmentContent = currentSegment.slice(0, lastMarkerIndex);
                segments.push(segmentContent.join('\n'));
                
                // Start new segment with everything after the marker
                const remainingContent = currentSegment.slice(lastMarkerIndex);
                currentSegment = [...remainingContent, line];
                currentTokens = currentTokens - lastMarkerTokens + lineTokens;
            } else {
                // No good break point, just split here
                segments.push(currentSegment.join('\n'));
                currentSegment = [line];
                currentTokens = lineTokens;
            }
            
            // Reset marker tracking
            lastMarkerIndex = -1;
            lastMarkerTokens = 0;
        } else {
            // Otherwise add line to current segment
            currentSegment.push(line);
            currentTokens += lineTokens;
        }
    }
    
    // Add the last segment if there's anything left
    if (currentSegment.length > 0) {
        segments.push(currentSegment.join('\n'));
    }
    
    return segments;
}

/**
 * Combines translated segments back into a single file
 * @param segments Array of translated segments
 * @returns Combined text
 */
export function combineSegments(segments: string[]): string {
    // Simply join segments with newlines
    return segments.join('\n');
}