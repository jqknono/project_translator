import axios from 'axios';
import * as vscode from 'vscode';

// Define an interface for generic data objects
interface DataObject {
    [key: string]: unknown;
}

export class AnalyticsService {
    private outputChannel: vscode.OutputChannel;
    private isDebugMode: boolean;
    private machineId: string | undefined;

    constructor(outputChannel: vscode.OutputChannel, machineId: string | undefined) {
        this.outputChannel = outputChannel;
        this.machineId = machineId;

        // Improved debug mode detection to ensure correct identification during F5 debugging
        this.isDebugMode = this.detectDebugMode();
        this.outputChannel.appendLine(`🔍 Debug mode: ${this.isDebugMode}`);
    }

    /**
     * Detect whether currently in debug mode
     * @returns Whether in debug mode
     */
    private detectDebugMode(): boolean {
        // 1. Detect through VS Code's debug API
        const debugActive = vscode.debug.activeDebugSession !== undefined;

        // 2. Detect through environment variables
        const envDebugMode = process.env.VSCODE_DEBUG_MODE === 'true' ||
            !!process.env.VSCODE_DEBUG_SESSION;

        // 3. Detect through session ID
        const sessionDebugMode = vscode.env.sessionId.includes('debug');

        // 4. Detect Node's debug arguments
        const nodeDebugArg = process.execArgv.some(arg =>
            arg.startsWith('--inspect') || arg.startsWith('--debug'));

        // 5. Detect through debug port
        const debugPort = typeof process.env.DEBUG_PORT !== 'undefined';

        // If any condition is met, consider it in debug mode
        return debugActive || envDebugMode || sessionDebugMode || nodeDebugArg || debugPort;
    }

    public async sendSettingsData(settings: DataObject): Promise<void> {
        // Check if metrics are enabled
        const config = vscode.workspace.getConfiguration('projectTranslator');
        const metricsEnabled = config.get<boolean>('enableMetrics', true);

        if (!metricsEnabled) {
            if (this.isDebugMode) {
                this.outputChannel.appendLine('📊 Metrics collection is disabled');
            }
            return;
        }

        try {
            // Filter out API key information
            if (settings.vendors && Array.isArray(settings.vendors)) {
                settings.vendors = settings.vendors.map(vendor => {
                    const { apiKey, ...rest } = vendor;
                    return rest;
                });
            }

            // Check debug status again in case it changes during runtime
            this.isDebugMode = this.detectDebugMode();

            // Choose different URLs based on the environment
            const url = this.isDebugMode
                ? 'http://100.64.0.5:8080/api/project-translator/data'
                : 'https://collect.jqknono.com/api/project-translator/data';

            if (this.isDebugMode) {
                this.outputChannel.appendLine(`📤 Sending data to: ${url}`);
                this.outputChannel.appendLine(`📦 Data payload: ${JSON.stringify({
                    id: this.machineId,
                    projectTranslatorConfigs: [settings]
                }, null, 2)}`);
            }

            await axios.post(url, {
                id: this.machineId,
                projectTranslatorConfigs: [settings]
            });

            if (this.isDebugMode) {
                this.outputChannel.appendLine(`📤 Usage data sent successfully to ${this.isDebugMode ? 'debug' : 'production'} endpoint`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            this.outputChannel.appendLine(`⚠️ Failed to send usage data: ${errorMessage}`);
        }
    }

    static async getMachineId(): Promise<string | undefined> {
        try {
            const envMachineId = await vscode.env.machineId;
            return envMachineId;
        } catch (error) {
            return undefined;
        }
    }
}