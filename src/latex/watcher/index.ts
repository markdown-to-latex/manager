import * as chokidar from 'chokidar';
import { FSWatcher } from 'chokidar';
import { ChildProcess } from 'child_process';
import { LatexBuilder } from '../builder';

export enum WatcherKillType {
    Wait = 'Wait',
    Kill = 'Kill',
}

export interface WatcherContext {
    times: number;
    builder: LatexBuilder;
    killType: WatcherKillType;
    childProcess: ChildProcess | null;
    postBuild: () => void;
    preBuild: () => void;
}

const context: WatcherContext = {
    times: 1,
    builder: LatexBuilder.fromPartialConfig({}),
    killType: WatcherKillType.Kill,
    childProcess: null,
    postBuild: () => null,
    preBuild: () => null,
};

export class WatcherBuildChoice {
    public context: WatcherContext;

    constructor(context: WatcherContext) {
        this.context = context;
    }

    public static fromContext(context: WatcherContext): WatcherBuildChoice {
        return new WatcherBuildChoice(context);
    }

    public choice(): WatcherAppliable {
        if (this.context.childProcess) {
            if (this.context.killType === WatcherKillType.Kill) {
                return new WatcherKillerE(this.context);
            }

            return new WatcherWaitingE(this.context);
        }

        return new WatcherBuildE(this.context);
    }
}

export interface WatcherAppliable {
    apply: () => void;
}

export class WatcherBuildE implements WatcherAppliable {
    public context: WatcherContext;

    constructor(context: WatcherContext) {
        this.context = context;
    }

    public apply() {
        try {
            this.context.preBuild();
            console.log('> PreBuild \x1b[32mfinished\x1b[0m');
        } catch (e) {
            console.error('Error occurred during preBuild script execution');
            console.error(e);
            return;
        }

        const childProcess = this.context.builder
            .makeAsync()
            .build()
            .apply() as ChildProcess;
        console.log('> Started \x1b[32mbuild\x1b[0m');

        const stdout = childProcess.stdout;
        const stderr = childProcess.stderr;
        if (!stdout || !stderr) {
            console.error('No stdout or stderr detected. Exiting');
            childProcess.kill('SIGKILL');
            return;
        }

        stdout.on('data', function (chunk: string) {
            process.stdout.write(chunk);
        });
        stderr.on('data', function (chunk: string) {
            process.stdout.write(chunk);
        });

        childProcess.on('exit', (code: string) => {
            console.log(
                `> Build \x1b[32mfinished\x1b[0m with code \x1b[34m${code}\x1b[0m`,
            );

            if (+code === 0 && code !== null && code !== undefined) {
                try {
                    this.context.postBuild();
                    console.log('> PostBuild \x1b[32mfinished\x1b[0m');
                } catch (e) {
                    console.error(
                        'Error occurred during postBuild script execution',
                    );
                    console.error(e);
                }
            }

            this.context.childProcess = null;
        });

        this.context.childProcess = childProcess;
        console.log('childProcess.pid', childProcess.pid);
    }
}

export class WatcherKillerE implements WatcherAppliable {
    public context: WatcherContext;

    constructor(context: WatcherContext) {
        this.context = context;
    }

    public apply() {
        const childProcess = this.context.childProcess;
        if (childProcess && !childProcess.killed) {
            childProcess.on('exit', (code: string) => {
                return new WatcherBuildE(this.context).apply();
            });
            childProcess.kill('SIGINT');
        }
    }
}

export class WatcherWaitingE implements WatcherAppliable {
    public context: WatcherContext;

    constructor(context: WatcherContext) {
        this.context = context;
    }

    public apply() {
        if (this.context.childProcess && this.context.childProcess.killed) {
            this.context.childProcess = null;
            return new WatcherBuildE(this.context).apply();
        }

        console.log(
            `> \x1b[31mWaiting already started building process\x1b[0m`,
        );
    }
}

export const listener: (path: string) => void = path => {
    console.log(
        `> Updated \x1b[34m${path}\x1b[0m \x1b[35m${new Date().toISOString()}\x1b[0m`,
    );

    WatcherBuildChoice.fromContext(context).choice().apply();
};

export interface WatcherConfig {
    killType: WatcherKillType;
    builder: LatexBuilder;
    postBuild: () => void;
    preBuild: () => void;
}

export function createWatcher(config: Partial<WatcherConfig>): FSWatcher {
    context.killType = config.killType ?? context.killType;
    context.builder = config.builder ?? context.builder;
    context.postBuild = config.postBuild ?? context.postBuild;
    context.preBuild = config.preBuild ?? context.preBuild;

    console.log('> Watcher \x1b[32mstarted\x1b[0m');

    return chokidar
        .watch('src/**', {
            ignoreInitial: true,
        })
        .on('add', listener)
        .on('change', listener);
}
