import * as vscode from "vscode";
import * as path from "path";
import { TranslationDatabase } from "./translationDatabase";
import { FileProcessor } from "./services/fileProcessor";
import { TranslatorService } from "./services/translatorService";
import { AnalyticsService } from "./services/analytics";
import { getConfiguration } from "./config/config";
import { DestFolder, SupportedLanguage } from "./types/types";
import * as fs from "fs";

// Global state
let translationDb: TranslationDatabase | null = null;
let isPaused = false;
let isStopped = false;
let pauseResumeButton: vscode.StatusBarItem | undefined;
let stopButton: vscode.StatusBarItem | undefined;
let outputChannel: vscode.OutputChannel;
let machineId: string | undefined;
let translations: any = {};

export async function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel("Project Translator");
    outputChannel.appendLine("Project Translator extension is now active!");

    // Load translations
    const config = vscode.workspace.getConfiguration("projectTranslator");
    const language = config.get<string>("language", "en");
    const translationsPath = path.join(context.extensionPath, "i18n", `${language}.json`);
    if (fs.existsSync(translationsPath)) {
        translations = JSON.parse(fs.readFileSync(translationsPath, "utf-8"));
    }

    // Initialize machine ID
    machineId = await AnalyticsService.getMachineId();

    // Register commands
    const commands = registerCommands();
    context.subscriptions.push(...commands);
}

function registerCommands(): vscode.Disposable[] {
    // Pause translation command
    const pauseCommand = vscode.commands.registerCommand(
        "extension.pauseTranslation",
        () => {
            isPaused = true;
            outputChannel.appendLine(translations["command.pauseTranslation"] || "Translation paused");
            vscode.window.showInformationMessage(translations["command.pauseTranslation"] || "Translation paused");
            updatePauseResumeButton();
        }
    );

    // Resume translation command
    const resumeCommand = vscode.commands.registerCommand(
        "extension.resumeTranslation",
        () => {
            isPaused = false;
            outputChannel.appendLine(translations["command.resumeTranslation"] || "Translation resumed");
            vscode.window.showInformationMessage(translations["command.resumeTranslation"] || "Translation resumed");
            updatePauseResumeButton();
        }
    );

    // Stop translation command
    const stopCommand = vscode.commands.registerCommand(
        "extension.stopTranslation",
        () => {
            isStopped = true;
            outputChannel.appendLine(translations["command.stopTranslation"] || "Translation stopped");
            vscode.window.showInformationMessage(translations["command.stopTranslation"] || "Translation stopped");
        }
    );

    // Main translate project command
    const translateCommand = vscode.commands.registerCommand(
        "extension.translateProject",
        handleTranslateProject
    );

    return [translateCommand, pauseCommand, resumeCommand, stopCommand];
}

async function handleTranslateProject() {
    try {
        // Show and focus output panel
        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine("==========================================");
        outputChannel.appendLine("Starting new translation task");
        outputChannel.appendLine("==========================================\n");

        const workspace = vscode.workspace.workspaceFolders?.[0];
        if (!workspace) {
            throw new Error("Please open a target workspace first");
        }

        // Initialize services
        const translatorService = new TranslatorService(outputChannel);
        translatorService.initializeOpenAIClient();

        // Initialize database and ensure it exists
        const translationDatabase = new TranslationDatabase(workspace.uri.fsPath);
        const sourceFolderPath = await getSourceFolderPath();
        const targetPaths = await getTargetPaths();

        translationDatabase.setSourceRoot(sourceFolderPath);
        targetPaths.forEach(target => translationDatabase.setTargetRoot(target.path));

        // Set the global translationDb variable
        translationDb = translationDatabase;

        // Initialize file processor
        const fileProcessor = new FileProcessor(outputChannel, translationDatabase, translatorService);

        // Create status bar buttons
        createStatusBarButtons();

        // Reset state
        isPaused = false;
        isStopped = false;
        translatorService.resetTokenCounts();

        // Record start time
        const startTime = Date.now();

        // Process with progress
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Translating project...",
                cancellable: true,
            },
            async (progress, token) => {
                token.onCancellationRequested(() => {
                    isStopped = true;
                });

                fileProcessor.setTranslationState(isPaused, isStopped);
                await fileProcessor.processDirectory(sourceFolderPath, targetPaths);

                if (isStopped) {
                    vscode.window.showInformationMessage("Project translation stopped!");
                } else {
                    vscode.window.showInformationMessage("Project translation completed!");
                }
            }
        );

        // Output summary
        outputSummary(startTime, fileProcessor, translatorService);

        // Send analytics
        const analyticsService = new AnalyticsService(outputChannel, machineId);
        await sendAnalytics(analyticsService, fileProcessor, translatorService);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        vscode.window.showErrorMessage(`Translation failed: ${errorMessage}`);
    } finally {
        cleanup();
    }
}

async function getSourceFolderPath(): Promise<string> {
    const config = vscode.workspace.getConfiguration("projectTranslator");
    let sourceFolderPath = config.get<string>("sourceFolder");

    if (!sourceFolderPath) {
        const sourceFolder = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            title: "Select the project folder to translate",
        });

        if (!sourceFolder) {
            throw new Error("No source folder selected");
        }

        sourceFolderPath = sourceFolder[0].fsPath;
        await config.update(
            "sourceFolder",
            sourceFolderPath,
            vscode.ConfigurationTarget.Workspace
        );
    }

    return sourceFolderPath;
}

async function getTargetPaths(): Promise<DestFolder[]> {
    const config = vscode.workspace.getConfiguration("projectTranslator");
    const destFolders = config.get<Array<{ path: string; lang: string }>>("destFolders") || [];

    if (destFolders.length === 0) {
        const workspace = vscode.workspace.workspaceFolders?.[0];
        if (!workspace) {
            throw new Error("Workspace not found");
        }

        const defaultTargets: DestFolder[] = [{
            path: workspace.uri.fsPath,
            lang: "zh-cn" as SupportedLanguage
        }];

        await config.update(
            "destFolders",
            defaultTargets,
            vscode.ConfigurationTarget.Workspace
        );

        return defaultTargets;
    }

    // Convert string lang to SupportedLanguage type
    return destFolders.map(folder => ({
        path: folder.path,
        lang: folder.lang as SupportedLanguage
    }));
}

function createStatusBarButtons() {
    pauseResumeButton = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        1
    );
    stopButton = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        0
    );

    updatePauseResumeButton();
    stopButton.text = "$(debug-stop) Stop Translation";
    stopButton.command = "extension.stopTranslation";
    stopButton.show();
}

function updatePauseResumeButton() {
    if (pauseResumeButton) {
        if (isPaused) {
            pauseResumeButton.text = "$(debug-continue) Resume Translation";
            pauseResumeButton.command = "extension.resumeTranslation";
        } else {
            pauseResumeButton.text = "$(debug-pause) Pause Translation";
        }
        pauseResumeButton.show();
    }
}

function outputSummary(startTime: number, fileProcessor: FileProcessor, translatorService: TranslatorService) {
    const endTime = Date.now();
    const totalTimeInSeconds = ((endTime - startTime) / 1000).toFixed(2);
    const stats = fileProcessor.getProcessingStats();
    const tokenCounts = translatorService.getTokenCounts();

    outputChannel.appendLine("\n==========================================");
    outputChannel.appendLine("Translation Task Summary");
    outputChannel.appendLine("==========================================");
    outputChannel.appendLine(`✅ Translated files: ${stats.processedFiles}`);
    outputChannel.appendLine(`⏭️ Skipped files: ${stats.skippedFiles}`);
    outputChannel.appendLine(`❌ Failed files: ${stats.failedFiles}`);

    if (stats.failedFiles > 0 && stats.failedPaths.length > 0) {
        outputChannel.appendLine("\n❌ Failed files list:");
        stats.failedPaths.forEach((filePath, index) => {
            outputChannel.appendLine(`   ${index + 1}. ${filePath}`);
        });
        outputChannel.appendLine("");
    }

    outputChannel.appendLine(`⌛ Total time: ${totalTimeInSeconds} seconds`);
    outputChannel.appendLine(`📊 Total tokens consumed:`);
    outputChannel.appendLine(`   - Input: ${tokenCounts.inputTokens.toLocaleString()} tokens`);
    outputChannel.appendLine(`   - Output: ${tokenCounts.outputTokens.toLocaleString()} tokens`);
    outputChannel.appendLine(`   - Total: ${tokenCounts.totalTokens.toLocaleString()} tokens`);

    const tokensPerMinute = Math.round(tokenCounts.totalTokens / (Number(totalTimeInSeconds) / 60));
    if (!isNaN(tokensPerMinute) && isFinite(tokensPerMinute)) {
        outputChannel.appendLine(`   - Processing speed: ${tokensPerMinute.toLocaleString()} tokens/minute`);
    }
}

async function sendAnalytics(analyticsService: AnalyticsService, fileProcessor: FileProcessor, translatorService: TranslatorService) {
    const config = vscode.workspace.getConfiguration('projectTranslator');
    const stats = fileProcessor.getProcessingStats();
    const tokenCounts = translatorService.getTokenCounts();

    const settingsToCollect = {
        sourceFolder: config.get('sourceFolder'),
        destFolders: config.get('destFolders'),
        translationIntervalDays: config.get('translationIntervalDays'),
        ignoreTranslationExtensions: config.get('ignoreTranslationExtensions'),
        ignorePaths: config.get('ignorePaths'),
        currentVendor: config.get('currentVendor'),
        vendors: config.get('vendors'),
        systemPrompts: config.get('systemPrompts'),
        userPrompts: config.get('userPrompts'),
        segmentationMarkers: config.get('segmentationMarkers'),
        stats: {
            processedFiles: stats.processedFiles,
            skippedFiles: stats.skippedFiles,
            failedFiles: stats.failedFiles,
            totalInputTokens: tokenCounts.inputTokens,
            totalOutputTokens: tokenCounts.outputTokens,
            tokensPerMinute: Math.round(tokenCounts.totalTokens / 60)
        }
    };

    await analyticsService.sendSettingsData(settingsToCollect);
}

function cleanup() {
    translationDb?.close().catch((error) => {
        outputChannel.appendLine(`Error closing database: ${error}`);
    });
    translationDb = null;

    pauseResumeButton?.dispose();
    pauseResumeButton = undefined;
    stopButton?.dispose();
    stopButton = undefined;
}

export function deactivate(): void {
    cleanup();
    outputChannel.dispose();
}
