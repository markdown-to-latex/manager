import { LatexBuilderConfig, LatexFlagsE } from './config';
import { ChildProcess, exec, execSync, ExecSyncOptions } from 'child_process';
import * as fs from 'fs';

export const defaultConfig: LatexBuilderConfig = {
    indexFile: 'index.tex',
    executable: 'xelatex',
    packet: 'texlive',
    cwd: '.',
    flags: {
        fileLineError: null,
        interaction: 'nonstopmode',
        shellEscape: null,
        haltOnError: null,
        outputFormat: 'pdf',
        outputDirectory: './out',
    },
};

/**
 * @example LatexBuilder.fromPartialConfig({}).build().apply(times);
 */
export class LatexBuilder {
    public config: LatexBuilderConfig;
    public isAsync: boolean = false;

    constructor(config: LatexBuilderConfig) {
        this.config = config;
    }

    public get flagsE(): LatexFlagsE {
        return new LatexFlagsE(this.config.flags);
    }

    public static fromPartialConfig(
        config: Partial<LatexBuilderConfig>,
    ): LatexBuilder {
        return new LatexBuilder({
            indexFile: config.indexFile ?? defaultConfig.indexFile,
            executable: config.executable ?? defaultConfig.executable,
            packet: config.packet ?? defaultConfig.packet,
            cwd: config.cwd ?? defaultConfig.cwd,
            flags: config.flags ?? defaultConfig.flags,
        });
    }

    public makeSync(): LatexBuilder {
        this.isAsync = false;
        return this;
    }

    public makeAsync(): LatexBuilder {
        this.isAsync = true;
        return this;
    }

    public build(): ExecAppliable {
        if (this.config.flags.outputDirectory) {
            fs.mkdirSync(this.config.flags.outputDirectory, {
                recursive: true,
            });
        }

        return new (this.isAsync ? ExecAsyncE : ExecSyncE)(
            [
                this.config.executable,
                ...this.flagsE.filterFlags(this.config.packet).args,
                this.config.indexFile,
            ],
            {
                cwd: this.config.cwd,
                encoding: 'utf8',
                stdio: ['inherit', 'inherit', 'inherit'],
            },
        );
    }
}

export interface ExecAppliable {
    apply: (times?: number) => null | ChildProcess;
}

export abstract class AbstractExecE implements ExecAppliable {
    protected args: string[];
    protected options: ExecSyncOptions;

    constructor(args: string[], options: ExecSyncOptions) {
        this.args = args;
        this.options = options;
    }

    abstract apply(times: number | undefined): null | ChildProcess;
}

export class ExecSyncE extends AbstractExecE {
    public apply(times?: number): null {
        for (let i = 0; i < (times ?? 1); i++) {
            execSync(this.args.join(' '), this.options);
        }

        return null;
    }
}

export class ExecAsyncE extends AbstractExecE {
    public apply(times?: number): ChildProcess {
        if (times != 1) {
            console.warn('Async exec can be performed only 1 time');
        }

        return exec(this.args.join(' '), this.options);
    }
}
