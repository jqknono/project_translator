import * as vscode from 'vscode';
import OpenAI from 'openai';
import { ChatMessage, languageNameMap } from '../types/types';
import { estimateTokenCount } from '../segmentationUtils';
import { getConfiguration, getTranslationPrompts } from '../config/config';
import { SupportedLanguage } from '../translationDatabase';
import * as path from 'path';

// Store the last request timestamp for each vendor
const vendorLastRequest: Map<string, number> = new Map();

// Translation state
let currentFileMessages: ChatMessage[] = [];
let currentFilePath: string | null = null;
let currentMessageId: string | null = null;

export class TranslatorService {
    private openaiClient: OpenAI | null = null;
    private outputChannel: vscode.OutputChannel;
    private projectTotalInputTokens: number = 0;
    private projectTotalOutputTokens: number = 0;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    public initializeOpenAIClient() {
        const { apiEndpoint, apiKey, model, timeout } = getConfiguration();
        this.outputChannel.appendLine(`🔑 Using vendor API endpoint: ${apiEndpoint}`);

        const config: any = {
            apiKey,
            baseURL: apiEndpoint,
        };

        const timeoutMs = timeout ? timeout * 1000 : 30000;
        this.outputChannel.appendLine(`⏱️ API request timeout setting: ${timeout || 30} seconds (${timeoutMs}ms)`);
        config.timeout = timeoutMs;

        this.openaiClient = new OpenAI(config);
        return { model };
    }

    public async translateContent(
        content: string,
        targetLang: SupportedLanguage,
        sourcePath: string,
        isStopped: boolean
    ): Promise<string> {
        if (!this.openaiClient) {
            const error = "OpenAI client not initialized";
            this.outputChannel.appendLine(`❌ ${error}`);
            throw new Error(error);
        }

        const config = getConfiguration();
        const { model, currentVendorName, rpm, maxTokensPerSegment, temperature } = config;
        const languageName = languageNameMap[targetLang] || targetLang;

        this.outputChannel.appendLine(`🤖 Using model: ${model}`);
        this.outputChannel.appendLine(`🌐 Target language: ${languageName}`);
        this.outputChannel.appendLine(`🎲 Temperature: ${temperature}`);

        // Wait for RPM limit if needed
        if (rpm && rpm > 0) {
            await this.handleRpmLimit(currentVendorName, rpm, isStopped);
        }

        try {
            const { systemPrompts, userPrompts } = getTranslationPrompts();

            this.outputChannel.appendLine("📤 Sending translation request...");
            const response = await this.openaiClient.chat.completions.create({
                model: model || "",
                messages: [
                    ...systemPrompts.map(prompt => ({
                        role: "system" as const,
                        content: prompt,
                    })),
                    ...(systemPrompts.length === 0 ? [{
                        role: "system" as const,
                        content: "",
                    }] : []),
                    ...userPrompts.map((prompt) => ({
                        role: "user" as const,
                        content: prompt,
                    })),
                    {
                        role: "user",
                        content: `Please translate the following content to ${languageName}. The file type is ${path.extname(sourcePath)}.`,
                    },
                    {
                        role: "user",
                        content: content,
                    },
                ],
                temperature: temperature
            });

            vendorLastRequest.set(currentVendorName, Date.now());

            const inputTokens = response.usage?.prompt_tokens || 0;
            const outputTokens = response.usage?.completion_tokens || 0;
            this.outputChannel.appendLine(
                `📥 Translation request completed (input: ${inputTokens} tokens, output: ${outputTokens} tokens)`
            );

            this.projectTotalInputTokens += inputTokens;
            this.projectTotalOutputTokens += outputTokens;

            return response.choices[0]?.message?.content || content;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            this.outputChannel.appendLine(`❌ Translation failed: ${errorMessage}`);
            throw error;
        }
    }

    private async handleRpmLimit(currentVendorName: string, rpm: number, isStopped: boolean): Promise<void> {
        const lastRequestTime = vendorLastRequest.get(currentVendorName) || 0;
        const now = Date.now();
        const minInterval = (60 * 1000) / rpm;
        const timeToWait = Math.max(0, minInterval - (now - lastRequestTime));

        if (timeToWait > 0) {
            this.outputChannel.appendLine(
                `⏳ Waiting for API rate limit... (${(timeToWait / 1000).toFixed(1)} seconds)`
            );

            const waitInterval = 500;
            let waitedTime = 0;
            while (waitedTime < timeToWait && !isStopped) {
                await new Promise((resolve) =>
                    setTimeout(resolve, Math.min(waitInterval, timeToWait - waitedTime))
                );
                waitedTime += waitInterval;

                if (isStopped) {
                    this.outputChannel.appendLine("⛔ Cancel request detected, stopping API rate limit wait");
                    throw new Error("Translation canceled");
                }
            }
        }
    }

    public getTokenCounts() {
        return {
            inputTokens: this.projectTotalInputTokens,
            outputTokens: this.projectTotalOutputTokens,
            totalTokens: this.projectTotalInputTokens + this.projectTotalOutputTokens
        };
    }

    public resetTokenCounts() {
        this.projectTotalInputTokens = 0;
        this.projectTotalOutputTokens = 0;
    }
}