#!/usr/bin/env node

import { newProjectEntrypoint } from './cli/newProject';
import { getError, getHelp } from './cli/information';

function parseAndExecuteArguments(): void {
    const args = process.argv;

    if (args.length === 0) {
        console.error(getError());
        process.exit(1);
    }
    if (args[0] === 'init') {
        newProjectEntrypoint(args.slice(1))
            .then(() =>
                console.log(
                    '\x1b[32mMarkDown To LaTeX feature ' +
                        'has been set up successfully\x1b[0m',
                ),
            )
            .catch(err => {
                console.error(err);
            });
        return;
    }
    if (args[0] === '--help' || args[0] === '?' || args[0] === '-h') {
        console.error(getHelp());
        return;
    }

    console.error(getError());
    process.exit(1);
}

parseAndExecuteArguments();
