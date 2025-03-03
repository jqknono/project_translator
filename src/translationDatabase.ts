import * as path from 'path';
import * as fs from 'fs';
import * as sqlite3 from 'sqlite3';
import * as vscode from 'vscode';
import { promisify } from 'util';

export const SUPPORTED_LANGUAGES = [
    'zh-cn', 'zh-tw', 'en-us', 'ja-jp', 'ko-kr',
    'fr-fr', 'de-de', 'es-es', 'pt-br', 'ru-ru',
    'it-it', 'nl-nl', 'pl-pl', 'tr-tr', 'ar-sa',
    'hi-in', 'vi-vn', 'th-th', 'id-id'
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export class TranslationDatabase {
    private db: sqlite3.Database;
    private workspaceRoot: string;
    private sourceRoot: string | null = null;
    private targetRoots: Map<string, SupportedLanguage> = new Map(); // Store target paths with their explicitly set languages

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        const dbPath = path.join(workspaceRoot, '.prj.trans.sqlite');
        this.db = new sqlite3.Database(dbPath);
        this.initDatabase();
    }

    private initDatabase() {
        const config = vscode.workspace.getConfiguration('projectTranslator');
        const destFolders = config.get<Array<{ path: string; lang: SupportedLanguage }>>('destFolders') || [];

        // Only create tables for languages specified in the configuration
        const configuredLanguages = new Set<SupportedLanguage>();
        destFolders.forEach(folder => {
            if (folder.lang) {
                configuredLanguages.add(folder.lang);
            }
        });

        // Create tables only for configured languages
        if (configuredLanguages.size > 0) {
            configuredLanguages.forEach(lang => {
                const tableName = `translations_${lang.replace('-', '_')}`;
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS ${tableName} (
                        source_path TEXT PRIMARY KEY,
                        last_translation_time INTEGER
                    )
                `);
                console.log(`Created/verified table for language: ${lang}`);
            });
        } else {
            console.warn('Warning: No target languages found in configuration');
        }

        // Initialize target roots from configuration
        this.initTargetRootsFromConfig(destFolders);
    }

    private initTargetRootsFromConfig(destFolders: Array<{ path: string; lang: SupportedLanguage }>) {
        this.clearTargetRoots();

        for (const folder of destFolders) {
            if (!folder.lang) {
                console.warn(`Warning: Target folder "${folder.path}" has no language configured, skipped`);
                continue;
            }

            const normalizedPath = path.normalize(folder.path).replace(/\\/g, '/');
            this.targetRoots.set(normalizedPath, folder.lang);
        }
    }

    public setSourceRoot(sourcePath: string) {
        this.sourceRoot = sourcePath;
    }

    public getSourceRoot(): string | null {
        return this.sourceRoot;
    }

    public setTargetRoot(targetPath: string) {
        // This method is kept for backward compatibility
        // Languages should now be set through configuration
        const normalizedPath = path.normalize(targetPath).replace(/\\/g, '/');

        // Check if we have this path in our configured paths
        const config = vscode.workspace.getConfiguration('projectTranslator');
        const destFolders = config.get<Array<{ path: string; lang: SupportedLanguage }>>('destFolders') || [];

        const matchingFolder = destFolders.find(folder => {
            const folderPath = path.normalize(folder.path).replace(/\\/g, '/');
            return normalizedPath === folderPath || normalizedPath.startsWith(folderPath + '/');
        });

        if (matchingFolder && matchingFolder.lang) {
            this.targetRoots.set(normalizedPath, matchingFolder.lang);
        } else {
            throw new Error(`Target path "${targetPath}" has no language set in configuration, please configure it in projectTranslator.destFolders`);
        }
    }

    public clearTargetRoots() {
        this.targetRoots.clear();
    }

    private getRelativePath(absolutePath: string, isSource: boolean): string {
        const normalizePath = (p: string) => path.normalize(p).replace(/\\/g, '/');
        const normalizedAbsolutePath = normalizePath(absolutePath);

        if (isSource) {
            if (!this.sourceRoot) {
                throw new Error('Source root path not set');
            }
            const normalizedSourceRoot = normalizePath(this.sourceRoot);
            const relativePath = path.relative(normalizedSourceRoot, normalizedAbsolutePath);
            return relativePath.replace(/\\/g, '/');
        } else {
            // Start from the longest matching path
            const normalizedTargetRoots = Array.from(this.targetRoots.keys())
                .map(root => normalizePath(root))
                .sort((a, b) => b.length - a.length); // Sort by descending length

            console.log('Debug - Target roots:', normalizedTargetRoots);
            console.log('Debug - Looking for path:', normalizedAbsolutePath);

            for (const targetRoot of normalizedTargetRoots) {
                if (normalizedAbsolutePath.startsWith(targetRoot)) {
                    // Get full relative path from target root to file, including all subfolders
                    const fullRelativePath = path.relative(targetRoot, normalizedAbsolutePath);
                    const commonPath = fullRelativePath.replace(/\\/g, '/');

                    return commonPath;
                }
            }

            const error = new Error(`Target root path not set. File: ${absolutePath}\nAvailable roots: ${normalizedTargetRoots.join(', ')}`);
            console.error(error);
            throw error;
        }
    }

    // Get language for target path from explicit configuration
    private getTargetLanguageForPath(targetPath: string): SupportedLanguage {
        const normalizedPath = path.normalize(targetPath).replace(/\\/g, '/');

        // Find the longest matching target root
        let matchedLang: SupportedLanguage | undefined = undefined;
        let longestMatch = 0;

        for (const [rootPath, lang] of this.targetRoots.entries()) {
            if (normalizedPath.startsWith(rootPath) && rootPath.length > longestMatch) {
                matchedLang = lang;
                longestMatch = rootPath.length;
            }
        }

        if (!matchedLang) {
            throw new Error(`Target path "${targetPath}" has no language set in configuration, please configure it in projectTranslator.destFolders`);
        }

        return matchedLang;
    }

    public async updateTranslationTime(sourcePath: string, targetPath: string): Promise<void> {
        const relativeSourcePath = this.getRelativePath(sourcePath, true);
        const targetLang = this.getTargetLanguageForPath(targetPath);
        const tableName = `translations_${targetLang.replace('-', '_')}`;

        console.log('Debug - Updating translation time:', {
            sourcePath: relativeSourcePath,
            lang: targetLang
        });

        return new Promise<void>((resolve, reject) => {
            this.db.run(
                `INSERT OR REPLACE INTO ${tableName} (source_path, last_translation_time) VALUES (?, ?)`,
                [relativeSourcePath, Date.now()],
                (err: Error | null) => {
                    if (err) {
                        console.error('Error updating translation time:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }

    public async setOldestTranslationTime(sourcePath: string, targetPath: string): Promise<void> {
        const relativeSourcePath = this.getRelativePath(sourcePath, true);
        const targetLang = this.getTargetLanguageForPath(targetPath);
        const tableName = `translations_${targetLang.replace('-', '_')}`;
        // Use Unix epoch start time (1970-01-01) as the oldest time
        const oldestTimestamp = 0;

        console.log('Debug - Setting oldest translation time:', {
            sourcePath: relativeSourcePath,
            lang: targetLang
        });

        return new Promise<void>((resolve, reject) => {
            this.db.run(
                `INSERT OR REPLACE INTO ${tableName} (source_path, last_translation_time) VALUES (?, ?)`,
                [relativeSourcePath, oldestTimestamp],
                (err: Error | null) => {
                    if (err) {
                        console.error('Error setting oldest translation time:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }

    public async shouldTranslate(sourcePath: string, targetPath: string): Promise<boolean> {
        // Always translate if target file doesn't exist
        if (!fs.existsSync(targetPath)) {
            return true;
        }

        const relativeSourcePath = this.getRelativePath(sourcePath, true);
        const targetLang = this.getTargetLanguageForPath(targetPath);
        const tableName = `translations_${targetLang.replace('-', '_')}`;
        const intervalDays = vscode.workspace.getConfiguration('projectTranslator').get<number>('translationIntervalDays') || 7;

        console.log('Debug - Checking translation status:', {
            sourcePath: relativeSourcePath,
            lang: targetLang
        });

        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT last_translation_time FROM ${tableName} WHERE source_path = ?`,
                [relativeSourcePath],
                (err: Error | null, result: { last_translation_time: number } | undefined) => {
                    if (err) {
                        console.error('Error checking translation status:', err);
                        resolve(true);
                        return;
                    }

                    if (!result) {
                        resolve(true);
                        return;
                    }

                    const daysSinceLastTranslation = (Date.now() - result.last_translation_time) / (1000 * 60 * 60 * 24);
                    resolve(daysSinceLastTranslation >= intervalDays);
                }
            );
        });
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}