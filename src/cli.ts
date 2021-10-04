#!/usr/bin/env node

import * as ts from 'typescript';
import { newProjectEntrypoint } from './cli/newProject';
import { getError, getHelp } from './cli/information';

function parseAndExecuteArguments(): void {
    if (ts.sys.args.length === 0) {
        console.error(getError());
        ts.sys.exit(1);
    }
    if (ts.sys.args[0] === 'init') {
        newProjectEntrypoint(ts.sys.args.slice(1))
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
    if (
        ts.sys.args[0] === '--help' ||
        ts.sys.args[0] === '?' ||
        ts.sys.args[0] === '-h'
    ) {
        console.error(getHelp());
        return;
    }

    console.error(getError());
    ts.sys.exit(1);
}

parseAndExecuteArguments();
