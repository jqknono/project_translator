declare module 'isbinaryfile' {
    export function isBinaryFile(file: string | Buffer): Promise<boolean>;
    export function isBinaryFileSync(file: string | Buffer): boolean;
}