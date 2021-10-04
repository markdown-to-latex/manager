import * as inquirer from 'inquirer';
import { ChoiceCollection } from 'inquirer';
import * as path from 'path';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as unzip from 'unzipper';
import * as https from 'https';
import { camelToKebabCase, deleteFolderSyncRecursive } from './utils';
import * as child_process from 'child_process';

function getHelp() {
    const spacer = '                                    ';
    console.log(
        '\x1b[0mUsage: \x1b[35mmd-to-latex \x1b[1minit ' +
            '\x1b[0m[\x1b[34m--help\x1b[0m]\n' +
            spacer +
            '\x1b[0m[\x1b[34m--branch \x1b[1;34mmaster\x1b[0m] ' +
            '\x1b[0m\n' +
            '\x1b[0m\n' +
            'Arguments:\n' +
            '    \x1b[34m--help\x1b[0m              Reveals help message\n' +
            '    \x1b[34m--branch \x1b[1;34m<string>\x1b[0m   Download boilerplate from specified branch\n' +
            '      List of branches: \x1b[34mhttps://github.com/markdown-to-latex/boilerplate/branches\x1b[0m',
    );
}

export interface ParsedOptions {
    branch: string;
    help: boolean;
}

function parseOptions(args: string[]): ParsedOptions {
    const options: ParsedOptions = {
        branch: 'master',
        help: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--help' || arg === '?' || arg === '-h') {
            options.help = true;
            break;
        }

        if (arg === '--branch') {
            if (i + 1 >= args.length) {
                console.error(
                    'Expected usage: \x1b[34m--branch \x1b[1;34mbranchName\x1b[0m\n' +
                        '    Use \x1b[34m--help \x1b[0mto get more information',
                );
                ts.sys.exit(1);
            }

            options.branch = args[i + 1];
            ++i;
            continue;
        }

        console.error(
            `Unexpected argument: ${arg}.\n` +
                `Use \x1b[34m--help \x1b[0mto get available arguments`,
        );
        ts.sys.exit(1);
    }

    return options;
}

function validateDirectory(directory: string): boolean {
    return !fs.existsSync(directory);
}

export function getBoilerplateUrl(branch: string): string {
    return `https://codeload.github.com/markdown-to-latex/boilerplate/zip/refs/heads/${branch}`;
}

export async function downloadBoilerplate(
    branch: string,
    directory: string,
): Promise<void> {
    console.log('\x1b[36m♢\x1b[0m Downloading boilerplate');
    const downloadDir = fs.mkdtempSync('md-to-latex-boilerplate', 'utf8');

    await new Promise<void>((resolve, reject) => {
        const url = getBoilerplateUrl(branch);
        const request = https.get(url, {}, function (response) {
            if (response.statusCode !== 200) {
                reject(
                    '\x1b[31m⛊\x1b[0m Check your internet connecting and specified branch\n' +
                        `\x1b[31m⛊\x1b[0m Also, try to open this URL manually: ${url}\n` +
                        `\x1b[31m⛊\x1b[0m Response status code: \x1b[1;31m${response.statusCode}\x1b[0m`,
                );
            }

            const unzipPipe = response.pipe(
                unzip.Extract({ path: downloadDir }),
            );
            unzipPipe.on('error', err => {
                console.error(
                    '\x1b[31m⛊\x1b[0m ' +
                        '\x1b[31mError happen while unzipping\x1b[0m',
                );
                reject(err);
            });
            unzipPipe.on('close', () => {
                console.log('\x1b[32m♦\x1b[0m Download complete\x1b[0m');
                resolve();
            });
        });
        request.on('error', err => {
            console.error(
                '\x1b[31m⛊\x1b[0m ' +
                    '\x1b[31mError happen while performing request\x1b[0m',
            );
            reject(err);
        });
    }).catch(error => {
        console.error(
            '\x1b[31m⛊\x1b[0m ' +
                '\x1b[31mError happen while downloading boilerplate:\x1b[0m\n' +
                error,
        );
        deleteFolderSyncRecursive(downloadDir);
        ts.sys.exit(1);
    });

    console.log(
        '\x1b[32m♦\x1b[0m The boilerplate unpacked successfully\x1b[0m',
    );

    fs.renameSync(path.join(downloadDir, `boilerplate-${branch}`), directory);
    deleteFolderSyncRecursive(downloadDir);
    console.log(
        `\x1b[32m♦\x1b[0m Filled the directory ` +
            `\x1b[34m${directory}\x1b[0m`,
    );
}

type PostProcessFunction = (
    answers: PromptAnswers,
    options: ParsedOptions,
) => void;

const updatePackageJson: PostProcessFunction = function (answers, options) {
    let text = fs.readFileSync(
        path.join(answers.projectName, 'package.json'),
        'utf8',
    );

    text = text.replace(
        /"name": +"[^"]+"/g,
        `"name": "${camelToKebabCase(answers.projectName)}"`,
    );

    if (!answers.features.includes(FeatureKey.TypeScript)) {
        text = text.replace(/(, *\n *)?"typescript": "[^"]+",?/g, '');
        text = text.replace(/"ts-build": "[^"]+",?/g, '');
        text = text.replace(/npm run ts-build && ?/g, '');

        console.log(
            `\x1b[32m♦\x1b[0m Removed TypeScript feature from package.json\x1b[0m`,
        );
    }

    fs.writeFileSync(
        path.join(answers.projectName, 'package.json'),
        text,
        'utf8',
    );
};

const setFeatures: PostProcessFunction = function (answers, options) {
    console.log(`\x1b[36m♢\x1b[0m Setting up features\x1b[0m`);
    const features = answers.features;
    const directory = answers.projectName;

    if (!features.includes(FeatureKey.GithubConfigs)) {
        deleteFolderSyncRecursive(path.join(directory, '.github'));

        console.log(`\x1b[32m♦\x1b[0m Removed VSCode feature\x1b[0m`);
    }

    if (!features.includes(FeatureKey.IdeaConfigs)) {
        deleteFolderSyncRecursive(path.join(directory, '.idea-configs'));

        console.log(`\x1b[32m♦\x1b[0m Removed IDEA feature\x1b[0m`);
    } else {
        fs.renameSync(
            path.join(directory, '.idea-configs'),
            path.join(directory, '.idea'),
        );

        console.log(`\x1b[32m♦\x1b[0m Installed IDEA feature\x1b[0m`);
    }

    if (!features.includes(FeatureKey.MarkDownExamples)) {
        deleteFolderSyncRecursive(path.join(directory, 'src', 'md'));

        console.log(`\x1b[32m♦\x1b[0m Removed MarkDown Example feature\x1b[0m`);
    }

    if (!features.includes(FeatureKey.TypeScript)) {
        deleteFolderSyncRecursive(path.join(directory, 'src', 'ts'));

        const texGenerate = path.join(directory, 'scripts', 'tex-generate.js');
        fs.writeFileSync(
            texGenerate,
            fs
                .readFileSync(texGenerate, 'utf8')
                .replace(
                    /\/\/ Entrypoint for custom script.+\/\/ END Entrypoint for custom script/gs,
                    '',
                ),
            'utf8',
        );

        const mainTex = path.join(directory, 'src', 'tex', 'main.tex');
        fs.writeFileSync(
            mainTex,
            fs
                .readFileSync(mainTex, 'utf8')
                .replace(
                    /% Entrypoint for custom script.+% END Entrypoint for custom script/gs,
                    '',
                ),
            'utf8',
        );

        console.log(`\x1b[32m♦\x1b[0m Removed TypeScript entrypoint\x1b[0m`);
    }

    console.log(`\x1b[32m♦\x1b[0m Features setup complete\x1b[0m`);
};

const execInit: PostProcessFunction = function (answers, options) {
    console.log(`\x1b[36m♢\x1b[0m Downloading Node Modules\x1b[0m`);

    child_process.execSync('npm install -D', {
        cwd: answers.projectName,
        stdio: ['inherit', 'inherit', 'inherit'],
    });
    console.log(`\x1b[32m♦\x1b[0m Node Modules prepared\x1b[0m`);

    child_process.execSync('npm run prettier-fix', {
        cwd: answers.projectName,
        stdio: ['inherit', 'inherit', 'inherit'],
    });

    console.log(`\x1b[32m♦\x1b[0m Prettier applied\x1b[0m`);
};

const showSuccessMessage: PostProcessFunction = function (answers, options) {
    console.log(
        '\n\x1b[36m>\x1b[0m ' +
            `Project \x1b[34m${answers.projectName}\x1b[0m ` +
            'has been created.\x1b[0m' +
            '\n  \x1b[34m' +
            answers.projectName +
            '\x1b[0m\n\n' +
            '\x1b[36m>\x1b[0m ' +
            'Use \x1b[34mnpm run build\x1b[0m inside ' +
            'the project directory to build code',
    );
};

export async function newProject(
    answers: PromptAnswers,
    options: ParsedOptions,
): Promise<void> {
    await downloadBoilerplate(options.branch, answers.projectName);

    (<PostProcessFunction[]>[
        updatePackageJson,
        setFeatures,
        execInit,
        showSuccessMessage,
    ]).forEach(fun => fun(answers, options));
}

export const enum FeatureKey {
    IdeaConfigs = 'idea-configs',
    GithubConfigs = 'github-configs',
    MarkDownExamples = 'tex-examples',
    TypeScript = 'typescript',
}

export interface PromptAnswers {
    projectName: string;
    features: FeatureKey[];
}

async function promptQuestions(): Promise<PromptAnswers> {
    const { projectName }: { projectName: string } = await inquirer.prompt([
        {
            type: 'input',
            message: 'Enter the project name',
            name: 'projectName',
        },
    ]);

    if (!validateDirectory(projectName)) {
        const { confirm }: { confirm: boolean } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message:
                    'Execute this script inside an empty directory.\n' +
                    `  Directory \x1b[34m${projectName}\x1b[0m \x1b[1malready exists\x1b[0m.\n` +
                    `\n\x1b[31m⛊\x1b[0m\x1b[1m Are you sure you want to continue?`,
            },
        ]);

        if (!confirm) {
            ts.sys.exit(1);
        }
    }

    const answers: { features: FeatureKey[]; confirm: boolean } =
        await inquirer.prompt([
            {
                type: 'checkbox',
                message: 'Select features',
                name: 'feature',
                choices: [
                    {
                        key: FeatureKey.GithubConfigs,
                        name: 'GitHub configs',
                    },
                    {
                        key: FeatureKey.IdeaConfigs,
                        name: 'IDEA configs',
                        checked: true,
                    },
                    new inquirer.Separator(),
                    {
                        key: FeatureKey.MarkDownExamples,
                        name: 'Example MarkDown files',
                        checked: true,
                    },
                    {
                        key: FeatureKey.TypeScript,
                        name: 'Entrypoint for TypeScript code',
                    },
                ] as ChoiceCollection & { key: FeatureKey }[],
            },
            {
                type: 'confirm',
                name: 'confirm',
                message: `Are you going to:
 -> \x1b[34mCreate directory \x1b[35m${path.resolve(projectName)}\x1b[0m
 -> \x1b[34mDownload boilerplate into mentioned directory\x1b[0m
 -> \x1b[34mUse features listeed above\x1b[0m
`,
            },
        ]);

    if (!answers.confirm) {
        ts.sys.exit(1);
    }

    return {
        projectName,
        ...answers,
    };
}

export async function newProjectEntrypoint(args: string[]) {
    const options = parseOptions(args);
    if (options.help) {
        getHelp();
        ts.sys.exit(0);
    }

    const answers = await promptQuestions();

    await newProject(answers, options);
}
