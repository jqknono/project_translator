import * as vscode from 'vscode';
import { VendorConfig } from '../types/types';
import * as path from 'path';
import * as fs from 'fs';

let translations: any = {};

export function loadTranslations(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration("projectTranslator");
    const language = config.get<string>("language", "en");
    const translationsPath = path.join(context.extensionPath, "i18n", `${language}.json`);
    if (fs.existsSync(translationsPath)) {
        translations = JSON.parse(fs.readFileSync(translationsPath, "utf-8"));
    }
}

export function getConfiguration() {
    const config = vscode.workspace.getConfiguration("projectTranslator");
    const ignoreTranslationExtensions = config.get<string[]>("ignoreTranslationExtensions") || [];
    const sourceFolder = config.get<string>("sourceFolder");
    const currentVendorName = config.get<string>("currentVendor") || "openai";
    const vendors = config.get<VendorConfig[]>("vendors") || [];

    // Find current vendor configuration
    const currentVendor = vendors.find(
        (vendor) => vendor.name === currentVendorName
    );
    if (!currentVendor || !currentVendor.apiKey) {
        throw new Error(translations["error.invalidApiSettings"] || "Please provide valid API settings in the vendor configuration");
    }

    return {
        ...currentVendor,
        ignoreTranslationExtensions,
        sourceFolder,
        currentVendorName,
    };
}

export function getTranslationPrompts() {
    const projectConfig = vscode.workspace.getConfiguration("projectTranslator");
    const systemPrompts = projectConfig.get<string[]>("systemPrompts") || [];
    const userPrompts = projectConfig.get<string[]>("userPrompts") || [];
    
    return {
        systemPrompts,
        userPrompts
    };
}