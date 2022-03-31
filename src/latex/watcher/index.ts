import * as chokidar from 'chokidar';
import { FSWatcher } from 'chokidar';
import { ChildProcess, execSync, spawn } from 'child_process';

export enum WatcherKillType {
    Wait = 'Wait',
    Kill = 'Kill',
}

export interface WatcherContext {
    executable: string;
    executableArgs: string[];
    killType: WatcherKillType;
    childProcess: ChildProcess | null;
}

const context: WatcherContext = {
    executable: 'npm',
    executableArgs: ['run', 'watcher-build'],
    killType: WatcherKillType.Kill,
    childProcess: null,
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
        console.log('> Started \x1b[32mbuild\x1b[0m');

        const childProcess = spawn(
            this.context.executable,
            this.context.executableArgs,
            {
                shell: true,
            },
        );

        const stdout = childProcess.stdout;
        const stderr = childProcess.stderr;
        if (!stdout || !stderr) {
            console.error('No stdout or stderr detected. Exiting');
            childProcess.kill('SIGKILL');
            return;
        }

        stdout.on('data', function (chunk: Buffer) {
            console.log(chunk.toString('utf-8'));
        });
        stderr.on('data', function (chunk: Buffer) {
            console.log(chunk.toString('utf-8'));
        });

        childProcess.on('exit', (code: string) => {
            console.log(code);
            console.log('> Build \x1b[32mfinished\x1b[0m');

            this.context.childProcess = null;
        });

        this.context.childProcess = childProcess;
    }
}

export class WatcherKillerE implements WatcherAppliable {
    public context: WatcherContext;

    constructor(context: WatcherContext) {
        this.context = context;
    }

    public static killLinux(cp: ChildProcess) {
        cp.kill('SIGKILL');
    }

    public static killWindows(cp: ChildProcess) {
        execSync(['taskkill', '/pid', cp.pid, '/f', '/t'].join(' '));
    }

    public apply() {
        const childProcess = this.context.childProcess;
        if (childProcess && !childProcess.killed) {
            if (process.platform === 'win32') {
                WatcherKillerE.killWindows(childProcess);
            } else {
                WatcherKillerE.killLinux(childProcess);
            }
            return new WatcherBuildE(this.context).apply();
        }
        this.context.childProcess = null;
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
    executable: string;
    executableArgs: string[];
    killType: WatcherKillType;
}

export function createWatcher(config: Partial<WatcherConfig>): FSWatcher {
    context.executable = config.executable ?? context.executable;
    context.executableArgs = config.executableArgs ?? context.executableArgs;
    context.killType = config.killType ?? context.killType;

    console.log('> Watcher \x1b[32mstarted\x1b[0m');

    return chokidar
        .watch('src/**', {
            ignoreInitial: true,
        })
        .on('add', listener)
        .on('change', listener);
}
