import { expect } from 'chai';
import * as vscode from 'vscode';
import { AnalyticsService } from './analytics';
import axios from 'axios';
import { SinonStub, stub } from 'sinon';

// Import the DataObject interface or define it here
interface DataObject {
    [key: string]: unknown;
}

describe('AnalyticsService', () => {
    let outputChannel: vscode.OutputChannel;
    let service: AnalyticsService;
    let axiosPostStub: SinonStub;

    beforeEach(() => {
        // Use an empty function that complies with ESLint rules
        outputChannel = {
            appendLine: () => { /* empty */ },
            append: () => { /* empty */ },
            clear: () => { /* empty */ },
            show: () => { /* empty */ },
            hide: () => { /* empty */ },
            dispose: () => { /* empty */ },
            replace: () => { /* empty */ },
            name: 'test'
        };
        service = new AnalyticsService(outputChannel, 'test-machine-id');
        axiosPostStub = stub(axios, 'post').resolves();
    });

    afterEach(() => {
        axiosPostStub.restore();
    });

    describe('sendSettingsData', () => {
        it('should send encrypted settings data', async () => {
            const settings = { test: 'data' };
            
            await service.sendSettingsData(settings);

            expect(axiosPostStub.calledOnce).to.be.true;
            const [url, data] = axiosPostStub.firstCall.args;
            expect(url).to.equal('https://collect.jqknono.com/api/project-translator/data');
            expect(data).to.have.property('id', 'test-machine-id');
            expect(data).to.have.property('projectTranslatorConfigs');
            expect(data).to.have.property('encryptedProjectTranslatorConfigs');
        });

        it('should handle errors gracefully', async () => {
            axiosPostStub.rejects(new Error('Network error'));
            const settings = { test: 'data' };
            
            await service.sendSettingsData(settings);
            // Should not throw error
        });
    });

    describe('getMachineId', () => {
        it('should return machine id from vscode env', async () => {
            const mockMachineId = 'test-id';
            stub(vscode.env, 'machineId').value(Promise.resolve(mockMachineId));

            const result = await AnalyticsService.getMachineId();
            expect(result).to.equal(mockMachineId);
        });

        it('should return undefined on error', async () => {
            stub(vscode.env, 'machineId').value(Promise.reject(new Error()));

            const result = await AnalyticsService.getMachineId();
            expect(result).to.be.undefined;
        });
    });

    // Test encryption and decryption functionality
    describe('encryption and decryption', () => {
        it('should correctly encrypt and decrypt data', () => {
            // Get references to private methods and use the correct types
            const encryptData = (service as unknown as { encryptData(data: DataObject, key: string): string }).encryptData.bind(service);
            const decryptData = (service as unknown as { decryptData(encryptedText: string, key: string): DataObject }).decryptData.bind(service);
            
            const testData = { 
                name: "test", 
                value: 123, 
                nested: { 
                    item: "value" 
                },
                array: [1, 2, 3]
            };
            const testKey = "test-encryption-key";
            
            // Encrypt data
            const encrypted = encryptData(testData, testKey);
            
            // Verify the format of the encrypted result
            expect(encrypted).to.be.a('string');
            expect(encrypted).to.include(':');
            
            // Decrypt data and verify the result
            const decrypted = decryptData(encrypted, testKey);
            expect(decrypted).to.deep.equal(testData);
        });

        it('should throw error when decrypting with invalid format', () => {
            const decryptData = (service as unknown as { decryptData(encryptedText: string, key: string): DataObject }).decryptData.bind(service);
            const invalidEncrypted = "invalidData";
            const testKey = "test-encryption-key";
            
            expect(() => decryptData(invalidEncrypted, testKey)).to.throw('Invalid encrypted text format');
        });

        it('should throw error when decrypting with wrong key', () => {
            const encryptData = (service as unknown as { encryptData(data: DataObject, key: string): string }).encryptData.bind(service);
            const decryptData = (service as unknown as { decryptData(encryptedText: string, key: string): DataObject }).decryptData.bind(service);
            
            const testData = { test: "data" };
            const encryptKey = "correct-key";
            const wrongKey = "wrong-key";
            
            const encrypted = encryptData(testData, encryptKey);
            
            // Decrypting with the wrong key should fail
            expect(() => decryptData(encrypted, wrongKey)).to.throw();
        });
    });
});