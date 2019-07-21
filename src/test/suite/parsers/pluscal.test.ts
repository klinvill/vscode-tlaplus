import * as vscode from 'vscode';
import * as assert from 'assert';
import { beforeEach } from 'mocha';
import { TranspilerStdoutParser } from '../../../parsers/pluscal';
import { pathToUri } from '../../../common';
import { applyDCollection } from '../../../diagnostic';

const dc = vscode.languages.createDiagnosticCollection('tlaplus');

suite('PlusCal Transpiler Output Parser Test Suite', () => {
    beforeEach(() => {
        dc.clear();
    });

    test('No errors on successfull run', () => {
        const stdout = [
            'pcal.trans Version 1.9 of 10 July 2019',
            'Labels added.',
            'Parsing completed.',
            'Translation completed.',
            'New file /Users/bob/TLA/test.tla written.',
            'File /Users/bob/TLA/test.cfg already contains SPECIFICATION statement,',
            '    so new one not written.',
            'New file /Users/bob/TLA/test.cfg written.`'
        ].join('\n');
        assertOutput(stdout, '/Users/bob/TLA/test.tla', []);
    });

    test('Captures parsing error', () => {
        const stdout = [
            'pcal.trans Version 1.9 of 10 July 2019',
            '',
            'Unrecoverable error:',
            ' -- Expected "begin" but found "variabless"',
            ' line 8, column 1.',
            ''
        ].join('\n');
        assertOutput(stdout, '/Users/bob/TLA/err.tla', [
            new vscode.Diagnostic(
                new vscode.Range(7, 1, 7, 1),
                'Expected "begin" but found "variabless"',
                vscode.DiagnosticSeverity.Error)
        ]);
    });

    test('Ignore no-pluscal-code error', () => {
        const stdout = [
            'pcal.trans Version 1.9 of 10 July 2019',
            '',
            'Unrecoverable error:',
            ' -- Beginning of algorithm string --algorithm not found..',
            ''
        ].join('\n');
        assertOutput(stdout, '/Users/bob/TLA/err.tla', []);
    });
});

function assertOutput(out: string, filePath: string, expected: vscode.Diagnostic[]) {
    const outLines = out.split('\n');
    const parser = new TranspilerStdoutParser(outLines, filePath);
    const dCol = parser.readAllSync();
    applyDCollection(dCol, dc);
    const diagnostics = dc.get(pathToUri(filePath));
    assert.deepEqual(diagnostics, expected);
}
