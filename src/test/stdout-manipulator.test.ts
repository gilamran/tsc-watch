import { detectState, print } from '../lib/stdout-manipulator';

describe('stdout-manipulator', () => {
    describe('detectState', () => {
        it('Should not detect anything for an empty line', async () => {
            const state = detectState('');
            expect(state).toEqual({
                compilationStarted: false,
                compilationError: false,
                compilationComplete: false,
                fileEmitted: null,
            });
        });

        it('Should not detect anything for an unknown line', async () => {
            const state = detectState('tsc: unknown statement');
            expect(state).toEqual({
                compilationStarted: false,
                compilationError: false,
                compilationComplete: false,
                fileEmitted: null,
            });
        });

        describe('Tested with typescript 4.5.5', () => {
            it('Should detect a compilation start', async () => {
                const { compilationStarted } = detectState('[\x1B[90m11:32:11 AM\x1B[0m] Starting compilation in watch mode...');
                expect(compilationStarted).toEqual(true);
            });

            it('Should detect a compilation error', async () => {
                const { compilationError } = detectState('\x1B[96mmodules/file.ts\x1B[0m:\x1B[93m17\x1B[0m:\x1B[93m49\x1B[0m - \x1B[91merror\x1B[0m\x1B[90m TS2345: \x1B[0mArgument of type \'string\' is not assignable to parameter of type \'never\'.');
                expect(compilationError).toEqual(true);
            });

            it('Should detect a compilation complete', async () => {
                const { compilationComplete } = detectState('[\x1B[90m11:32:26 AM\x1B[0m] Found 4 errors. Watching for file changes.');
                expect(compilationComplete).toEqual(true);
            });

            it('Should detect an emitted file', async () => {
                const { fileEmitted } = detectState('TSFILE: /my/dist/hello.js');
                expect(fileEmitted).toEqual('/my/dist/hello.js');
            });
        })
    });

    describe('print', () => {
        let forkSpy: any;
        beforeEach(() => {
            forkSpy = jest.spyOn(global.console, 'log').mockImplementation();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('Should log raw line with default params', async () => {
            print('raw tsc line');
            expect(forkSpy.mock.calls).toEqual([['raw tsc line']])
        });

        it('Should not hide a normal line when signalEmittedFiles is true', async () => {
            print('any other line', { signalEmittedFiles: true });
            expect(forkSpy.mock.calls).toEqual([['any other line']])
        });

        describe("TSFILE support", () => {
            it('Should hide a TSFILE line when signalEmittedFiles is true', async () => {
                print('TSFILE: /home/emitted/file.js', { signalEmittedFiles: true });
                expect(forkSpy.mock.calls).toEqual([])
            });

            it('Should not hide a TSFILE line when signalEmittedFiles is true and native --listEmittedFiles (requestedToListEmittedFiles) is true', async () => {
                print('TSFILE: /home/emitted/file.js', { noColors: true, signalEmittedFiles: true, requestedToListEmittedFiles: true });
                expect(forkSpy.mock.calls).toEqual([['TSFILE: /home/emitted/file.js']])
            });
        });
    });
});
