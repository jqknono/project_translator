import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { isBinaryFile } from "isbinaryfile";
import { minimatch } from "minimatch";
import { TranslationDatabase } from "../translationDatabase";
import { DestFolder, SupportedLanguage } from "../types/types";
import { TranslatorService } from "./translatorService";
import { estimateTokenCount, segmentText, combineSegments } from "../segmentationUtils";
import { getConfiguration } from "../config/config";

export class FileProcessor {
    private outputChannel: vscode.OutputChannel;
    private translationDb: TranslationDatabase;
    private translatorService: TranslatorService;
    private processedFilesCount: number = 0;
    private skippedFilesCount: number = 0;
    private failedFilesCount: number = 0;
    private failedFilePaths: string[] = [];
    private isPaused: boolean = false;
    private isStopped: boolean = false;

    constructor(
        outputChannel: vscode.OutputChannel,
        translationDb: TranslationDatabase,
        translatorService: TranslatorService
    ) {
        this.outputChannel = outputChannel;
        this.translationDb = translationDb;
        this.translatorService = translatorService;
    }

    public setTranslationState(isPaused: boolean, isStopped: boolean) {
        this.isPaused = isPaused;
        this.isStopped = isStopped;
    }

    public getProcessingStats() {
        return {
            processedFiles: this.processedFilesCount,
            skippedFiles: this.skippedFilesCount,
            failedFiles: this.failedFilesCount,
            failedPaths: this.failedFilePaths
        };
    }

    public async processDirectory(sourcePath: string, targetPaths: DestFolder[]) {
        this.outputChannel.appendLine("\n[Directory Processing] ----------------------------------------");
        this.outputChannel.appendLine(`📂 Starting to process directory: ${sourcePath}`);

        try {
            const ignorePaths = vscode.workspace.getConfiguration("projectTranslator").get<string[]>("ignorePaths") || [];
            const sourceRoot = this.translationDb.getSourceRoot() || sourcePath;
            const relativePath = path.relative(sourceRoot, sourcePath).replace(/\\/g, "/");

            // Check if directory should be ignored
            for (const pattern of ignorePaths) {
                if (minimatch(relativePath, pattern) || minimatch(`${relativePath}/`, pattern)) {
                    this.outputChannel.appendLine(`⏭️ Skipping ignored directory: ${sourcePath} (matched pattern: ${pattern})`);
                    return;
                }
            }

            const files = fs.readdirSync(sourcePath);
            this.outputChannel.appendLine(`📊 Found ${files.length} files/directories`);

            for (const file of files) {
                if (this.isStopped) {
                    this.outputChannel.appendLine("⛔ Processing stopped");
                    return;
                }

                const fullPath = path.join(sourcePath, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    await this.processSubDirectory(fullPath, targetPaths, sourceRoot, ignorePaths);
                } else {
                    this.outputChannel.appendLine(`\n📄 File: ${file}`);
                    for (const target of targetPaths) {
                        const relativePath = path.relative(sourceRoot, fullPath);
                        const targetFilePath = path.join(target.path, relativePath);
                        await this.processFile(fullPath, targetFilePath, target.lang);
                    }
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            this.outputChannel.appendLine(`❌ Error processing directory: ${errorMessage}`);
            throw error;
        }
    }

    private async processSubDirectory(fullPath: string, targetPaths: DestFolder[], sourceRoot: string, ignorePaths: string[]) {
        const relativeSubPath = path.relative(sourceRoot, fullPath).replace(/\\/g, "/");
        let shouldSkip = false;

        for (const pattern of ignorePaths) {
            if (minimatch(relativeSubPath, pattern) || minimatch(`${relativeSubPath}/`, pattern)) {
                this.outputChannel.appendLine(`⏭️ Skipping ignored subdirectory: ${fullPath} (matched pattern: ${pattern})`);
                shouldSkip = true;
                break;
            }
        }

        if (shouldSkip) {
            return;
        }

        this.outputChannel.appendLine(`\n📂 Processing subdirectory: ${path.basename(fullPath)}`);

        // Create corresponding directories for each target path
        for (const target of targetPaths) {
            const relativePath = path.relative(sourceRoot, fullPath);
            const targetDirPath = path.join(target.path, relativePath);
            if (!fs.existsSync(targetDirPath)) {
                this.outputChannel.appendLine(`Creating target directory: ${targetDirPath}`);
                fs.mkdirSync(targetDirPath, { recursive: true });
            }
        }

        await this.processDirectory(fullPath, targetPaths);
    }

    public async processFile(sourcePath: string, targetPath: string, targetLang: SupportedLanguage) {
        try {
            this.outputChannel.appendLine("\n[File Processing] ----------------------------------------");
            this.outputChannel.appendLine(`📄 Source file: ${path.basename(sourcePath)}`);
            this.outputChannel.appendLine(`🎯 Target: ${path.basename(targetPath)}`);

            // Check if file should be ignored
            if (await this.shouldSkipFile(sourcePath, targetPath)) {
                this.skippedFilesCount++;
                return;
            }

            // Ensure target directory exists
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) {
                this.outputChannel.appendLine(`📁 Creating target directory: ${targetDir}`);
                fs.mkdirSync(targetDir, { recursive: true });
            }

            // Process file based on type
            const ext = path.extname(sourcePath).toLowerCase();
            const ignoreTranslationExtensions = getConfiguration().ignoreTranslationExtensions;

            if (ignoreTranslationExtensions.includes(ext)) {
                await this.handleIgnoredFile(sourcePath, targetPath);
                return;
            }

            if (await isBinaryFile(sourcePath)) {
                await this.handleBinaryFile(sourcePath, targetPath);
                return;
            }

            await this.handleTextFile(sourcePath, targetPath, targetLang);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            this.outputChannel.appendLine(`❌ Failed to process file: ${errorMessage}`);
            this.failedFilesCount++;
            this.failedFilePaths.push(sourcePath);
            throw error;
        }
    }

    private async shouldSkipFile(sourcePath: string, targetPath: string): Promise<boolean> {
        const ignorePaths = vscode.workspace.getConfiguration("projectTranslator").get<string[]>("ignorePaths") || [];
        const sourceRoot = this.translationDb.getSourceRoot() || path.dirname(sourcePath);
        const relativePath = path.relative(sourceRoot, sourcePath).replace(/\\/g, "/");

        // Check ignore patterns
        for (const pattern of ignorePaths) {
            if (minimatch(relativePath, pattern)) {
                this.outputChannel.appendLine(`⏭️ Skipping ignored file: ${sourcePath} (matched pattern: ${pattern})`);
                return true;
            }
        }

        // Check translation interval
        const shouldTranslate = await this.translationDb.shouldTranslate(sourcePath, targetPath);
        if (!shouldTranslate) {
            this.outputChannel.appendLine("⏭️ File is within translation interval, skipping translation");
            return true;
        }

        return false;
    }

    private async handleIgnoredFile(sourcePath: string, targetPath: string) {
        if (fs.existsSync(targetPath)) {
            const sourceContent = fs.readFileSync(sourcePath);
            const targetContent = fs.readFileSync(targetPath);
            if (Buffer.compare(sourceContent, targetContent) === 0) {
                this.outputChannel.appendLine("⏭️ Source file and target file content are the same, skipping copy");
                this.skippedFilesCount++;
                return;
            }
        }

        this.outputChannel.appendLine(`📦 Detected file type to ignore translation: ${path.extname(sourcePath)}`);
        this.outputChannel.appendLine("🔄 Performing file copy");
        fs.copyFileSync(sourcePath, targetPath);
        this.outputChannel.appendLine("✅ Ignored file copy completed");
        this.processedFilesCount++;
    }

    private async handleBinaryFile(sourcePath: string, targetPath: string) {
        this.outputChannel.appendLine("📦 Detected binary file, performing direct copy");
        fs.copyFileSync(sourcePath, targetPath);
        this.outputChannel.appendLine("✅ Binary file copy completed");
        this.processedFilesCount++;
    }

    private async handleTextFile(sourcePath: string, targetPath: string, targetLang: SupportedLanguage) {
        // Set oldest translation time before starting
        await this.translationDb.setOldestTranslationTime(sourcePath, targetPath);
        this.outputChannel.appendLine("🕒 Translation timestamp reset");

        // Handle pause state
        while (this.isPaused && !this.isStopped) {
            await new Promise(resolve => setTimeout(resolve, 500));
            if (this.isStopped) {
                this.outputChannel.appendLine("⛔ Cancel request detected, stopping pause wait");
                return;
            }
            this.outputChannel.appendLine("⏸️ Translation paused...");
        }

        if (this.isStopped) {
            return;
        }

        // Start translation
        this.outputChannel.appendLine("🔄 Starting file content translation...");
        const content = fs.readFileSync(sourcePath, "utf8");
        const startTime = Date.now();

        try {
            const config = getConfiguration();
            const { maxTokensPerSegment = 4096 } = config;
            const estimatedTokens = estimateTokenCount(content);

            let translatedContent: string;
            if (estimatedTokens > maxTokensPerSegment) {
                translatedContent = await this.handleLargeFile(content, sourcePath, targetPath, targetLang);
            } else {
                translatedContent = await this.translatorService.translateContent(content, targetLang, sourcePath, this.isStopped);
                fs.writeFileSync(targetPath, translatedContent);
                this.outputChannel.appendLine("💾 Translation result written");
            }

            const endTime = Date.now();
            this.outputChannel.appendLine(`⌛ Translation time: ${((endTime - startTime) / 1000).toFixed(2)} seconds`);

            if (!this.isPaused && !this.isStopped) {
                await this.translationDb.updateTranslationTime(sourcePath, targetPath);
                this.outputChannel.appendLine("✅ File processing completed, translation timestamp updated\n");
                this.processedFilesCount++;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            this.outputChannel.appendLine(`❌ Translation failed: ${errorMessage}`);
            throw error;
        }
    }

    private async handleLargeFile(content: string, sourcePath: string, targetPath: string, targetLang: SupportedLanguage): Promise<string> {
        const config = getConfiguration();
        const { maxTokensPerSegment } = config;
        const segments = segmentText(content, sourcePath, maxTokensPerSegment);
        const translatedSegments: string[] = [];

        this.outputChannel.appendLine(`📑 File too large, split into ${segments.length} segments`);

        for (let i = 0; i < segments.length; i++) {
            if (this.isStopped) {
                this.outputChannel.appendLine("⛔ Translation stopped");
                throw new Error("Translation stopped");
            }

            const segment = segments[i];
            const segmentTokens = estimateTokenCount(segment);
            this.outputChannel.appendLine(
                `🔄 Translating segment ${i + 1}/${segments.length} (approximately ${segmentTokens} tokens)...`
            );

            try {
                const translatedSegment = await this.translatorService.translateContent(
                    segment,
                    targetLang,
                    sourcePath,
                    this.isStopped
                );
                translatedSegments.push(translatedSegment);

                // Write progress to file
                const currentContent = combineSegments(translatedSegments);
                fs.writeFileSync(targetPath, currentContent);
                this.outputChannel.appendLine(`💾 Written translation result for segment ${i + 1}/${segments.length}`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                this.outputChannel.appendLine(`❌ Failed to translate segment ${i + 1}: ${errorMessage}`);
                throw error;
            }
        }

        return combineSegments(translatedSegments);
    }
}