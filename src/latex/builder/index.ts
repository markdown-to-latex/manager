import { LatexBuilderConfig, LatexFlagsE } from './config';
import { execSync, ExecSyncOptions } from 'child_process';

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
class LatexBuilder {
    public config: LatexBuilderConfig;

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

    public build(): ExecSyncE {
        return new ExecSyncE(
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

class ExecSyncE {
    protected args: string[];
    protected options: ExecSyncOptions;

    constructor(args: string[], options: ExecSyncOptions) {
        this.args = args;
        this.options = options;
    }

    public apply(times?: number): void {
        execSync(this.args.join(' '), this.options);
    }
}
