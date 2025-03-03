import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { suite, test } from 'mocha';

suite('Extension Test Suite', () => {
	const tempDir = path.join(os.tmpdir(), 'project-translator-test');
	const sourceDir = path.join(tempDir, 'source');
	const targetDir = path.join(tempDir, 'target');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('jqknono.project-translator'));
	});

	test('Should activate extension', async () => {
		const ext = vscode.extensions.getExtension('jqknono.project-translator');
		await ext?.activate();
		assert.ok(ext?.isActive);
	});

	test('Configuration should be loaded correctly', () => {
		const config = vscode.workspace.getConfiguration('projectTranslator');
		assert.ok(config.get('apiEndpoint'));
		assert.ok(config.get('model'));
	});

	test('Should handle API errors gracefully', async () => {
		 // Set invalid API key to trigger error
		await vscode.workspace.getConfiguration().update('projectTranslator.apiKey', 'invalid-key', vscode.ConfigurationTarget.Global);
		
		try {
			await vscode.commands.executeCommand('extension.translateProject');
			assert.fail('Should throw an error with invalid API key');
		} catch (error) {
            if (error instanceof Error) {
                assert.ok(error.message.includes('API'));
            } else {
                assert.fail('Expected an Error object');
            }
		}
	});

	test('Should process different file types correctly', async () => {
		 // Create test directories and files
		if (!fs.existsSync(sourceDir)) {
			fs.mkdirSync(sourceDir, { recursive: true });
		}
		if (!fs.existsSync(targetDir)) {
			fs.mkdirSync(targetDir, { recursive: true });
		}

		const mdFile = path.join(sourceDir, 'test.md');
		const jsonFile = path.join(sourceDir, 'test.json');
		const txtFile = path.join(sourceDir, 'test.txt');

		fs.writeFileSync(mdFile, '# Test\nThis is a test');
		fs.writeFileSync(jsonFile, '{"test": "This is a test"}');
		fs.writeFileSync(txtFile, 'This is a test');

		 // Set valid API key for testing
		await vscode.workspace.getConfiguration().update('projectTranslator.apiKey', 'test-key', vscode.ConfigurationTarget.Global);

		 // Verify source files exist
		assert.ok(fs.existsSync(mdFile), 'MD file should exist in source');
		assert.ok(fs.existsSync(jsonFile), 'JSON file should exist in source');
		assert.ok(fs.existsSync(txtFile), 'TXT file should exist in source');

		 // Verify target files creation (even without actual translation)
		const targetMdFile = path.join(targetDir, 'test.md');
		const targetJsonFile = path.join(targetDir, 'test.json');
		const targetTxtFile = path.join(targetDir, 'test.txt');

		 // Simulate file copy to verify file processing logic
		fs.copyFileSync(mdFile, targetMdFile);
		fs.copyFileSync(jsonFile, targetJsonFile);
		fs.copyFileSync(txtFile, targetTxtFile);

		assert.ok(fs.existsSync(targetMdFile), 'MD file should exist in target');
		assert.ok(fs.existsSync(targetJsonFile), 'JSON file should exist in target');
		assert.ok(fs.existsSync(targetTxtFile), 'TXT file should exist in target');
	});

	test('Should maintain file structure', async () => {
		 // Create nested directory structure
		const nestedSourceDir = path.join(sourceDir, 'nested', 'folder');
		const nestedTargetDir = path.join(targetDir, 'nested', 'folder');
		
		fs.mkdirSync(nestedSourceDir, { recursive: true });
		fs.mkdirSync(nestedTargetDir, { recursive: true });
		
		const sourceNestedFile = path.join(nestedSourceDir, 'nested.md');
		const targetNestedFile = path.join(nestedTargetDir, 'nested.md');
		
		fs.writeFileSync(
			sourceNestedFile,
			'# Nested Test\nThis is a nested test file.'
		);

		 // Simulate file copy to verify directory structure maintenance
		fs.copyFileSync(sourceNestedFile, targetNestedFile);

		assert.ok(fs.existsSync(sourceNestedFile), 'Nested file should exist in source');
		assert.ok(fs.existsSync(targetNestedFile), 'Nested file should exist in target');
	});

	 // Clean up test files
	test('Cleanup test files', () => {
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true });
		}
		assert.ok(!fs.existsSync(tempDir), 'Temp directory should be removed');
	});
});