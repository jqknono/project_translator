import { SupportedLanguage } from "../translationDatabase";

// Re-export SupportedLanguage
export { SupportedLanguage };

// Vendor configuration interface
export interface VendorConfig {
    name: string;
    apiEndpoint: string;
    apiKey: string;
    model: string;
    rpm?: number;
    maxTokensPerSegment?: number;
    timeout?: number;
    temperature?: number;
}

// Chat message interface
export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

// Destination folder interface
export interface DestFolder {
    path: string;
    lang: SupportedLanguage;
}

// Language name mapping
export const languageNameMap: Record<SupportedLanguage, string> = {
    "zh-cn": "Simplified Chinese",
    "zh-tw": "Traditional Chinese",
    "en-us": "English",
    "ja-jp": "Japanese",
    "ko-kr": "Korean", 
    "fr-fr": "French",
    "de-de": "German",
    "es-es": "Spanish",
    "pt-br": "Portuguese",
    "ru-ru": "Russian",
    "it-it": "Italian",
    "nl-nl": "Dutch",
    "pl-pl": "Polish",
    "tr-tr": "Turkish",
    "ar-sa": "Arabic",
    "hi-in": "Hindi",
    "vi-vn": "Vietnamese", 
    "th-th": "Thai",
    "id-id": "Indonesian",
};