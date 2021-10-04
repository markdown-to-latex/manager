export function getVersion(): string {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {version} = require('../../package.json');
    return version;
}

export function getHelp(): string {
    return `md-to-latex version: ${getVersion()}\n` +
        '\x1b[0m\n' +
        'Usage: \x1b[35mmd-to-latex \x1b[1m<command>\x1b[0m\n' +
        '\x1b[0m\n' +
        'Available commands:' +
        '\x1b[0m\n' +
        '    \x1b[34minit    \x1b[0mInitialize MarkDown To LaTeX Boilerplate' +
        '\x1b[0m\n' +
        '\x1b[0m\n' +
        'Example command, to get more specific help:\n' +
        '\x1b[35mmd-to-latex \x1b[1minit \x1b[34m--help\x1b[0m';
}

export function getError(): string {
    return '\x1b[31mUnexpected argument.\x1b[0m Use command below to get information:\n' +
        '\x1b[34mmd-to-latex --help\x1b[0m';
}