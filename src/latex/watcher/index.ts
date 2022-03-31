import * as chokidar from 'chokidar';
import { ChildProcess, exec } from 'child_process';
import { FSWatcher } from 'chokidar';

export enum WatcherKillType {
    Wait = 'Wait',
    Kill = 'Kill',
}

export interface WatcherContext {
    lastBuildTime: number;
    buildTimeCooldown: number;
    executable: string;
    killType: WatcherKillType;
    childProcess: ChildProcess | null;
}

const context: WatcherContext = {
    lastBuildTime: 0,
    buildTimeCooldown: 2 * 1000,
    executable: 'npm run watcher-build',
    killType: WatcherKillType.Kill,
    childProcess: null,
};

export class WatcherBuildChoice {

}

export class WatcherBuildE {
  public context: WatcherContext;

  constructor(context: WatcherContext) {
    this.context = context;
  }

  public build() {
    context.childProcess = exec('npm run build', {
      encoding: 'utf8',
    });

    context.childProcess.stdout.on('data', function(chunk: string) {
      console.log(chunk);
    });
  }
}

function stopCurrentBuild() {
    context.childProcess.kill('SIGTERM');
}

export const listener: (path: string) => void = path => {
    // If current datetime - lastBuild datetime < DELTA => do not build again!
    console.log(
        `> Updated \x1b[34m${path}\x1b[0m \x1b[35m${new Date().toISOString()}\x1b[0m`,
    );
    const currentTimestamp = new Date().getTime();
    if (currentTimestamp - context.lastBuildTime < context.buildTimeCooldown) {
        console.log(`> Build \x1b[31mskipped due to cooldown\x1b[0m`);

        return;
    }

    console.log('> Started \x1b[32mbuild\x1b[0m');
    build();
    context.lastBuildTime = new Date().getTime();
    console.log('> Build \x1b[32mfinished\x1b[0m');
};

export function createWatcher(str: string) {}

const watcher: FSWatcher = chokidar
    .watch('src/**', {
        ignoreInitial: true,
    })
    .on('add', listener)
    .on('change', listener);

console.log('> Watcher \x1b[32mstarted\x1b[0m');
