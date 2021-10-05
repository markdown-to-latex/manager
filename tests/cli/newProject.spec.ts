import {
    FeatureKey,
    newProject,
    ParsedOptions,
    PromptAnswers,
} from '../../src/cli/newProject';
import * as fs from 'fs';
import * as path from 'path';
import { deleteFolderSyncRecursive } from '../../src/cli/utils';

function projectPrepare(answers: PromptAnswers, options: ParsedOptions) {
    beforeAll(async () => {
        if (fs.existsSync(answers.projectName)) {
            deleteFolderSyncRecursive(answers.projectName);
            console.log('Removed directory with test project');
        }

        fs.mkdirSync('dist', { recursive: true });
        await newProject(answers, options);
    });
}

describe('newProject: default project', () => {
    const answers: PromptAnswers = {
        projectName: 'dist/default-project',
        features: [
            FeatureKey.TypeScript,
            FeatureKey.IdeaConfigs,
            FeatureKey.GithubConfigs,
            FeatureKey.MarkDownExamples,
        ],
    };

    const options: ParsedOptions = {
        branch: 'develop',
        help: false,
    };

    projectPrepare(answers, options);

    [
        '.',
        'package.json',
        'src/md/main.md',
        'src/ts',
        'scripts/tex-build.js',
        '.idea',
    ].forEach(value =>
        test(`In project: file ${value} exists`, () => {
            expect(
                fs.existsSync(path.join(answers.projectName, value)),
            ).toBeTruthy();
        }),
    );

    ['.idea-configs'].forEach(value =>
        test(`In project: file ${value} does not exists`, () => {
            expect(
                fs.existsSync(path.join(answers.projectName, value)),
            ).not.toBeTruthy();
        }),
    );

    test('main.tex contains entrypoint', () => {
        expect(
            fs.readFileSync(
                path.join(answers.projectName, 'src/tex/main.tex'),
                'utf8',
            ),
        ).toContain('./dist/random-number.tex');
    });

    test('package.json contains project name', () => {
        expect(
            fs.readFileSync(
                path.join(answers.projectName, 'package.json'),
                'utf8',
            ),
        ).toContain(answers.projectName);
    });

    test('tex-generate.js contains entrypoint', () => {
        expect(
            fs.readFileSync(
                path.join(answers.projectName, 'scripts/tex-generate.js'),
                'utf8',
            ),
        ).toContain("require('../dist/js/random-number-generator.js')");
    });
});

describe('newProject: no features', () => {
    const answers: PromptAnswers = {
        projectName: 'dist/no-features',
        features: [],
    };

    const options: ParsedOptions = {
        branch: 'develop',
        help: false,
    };

    projectPrepare(answers, options);

    ['.', 'package.json', 'scripts/tex-build.js'].forEach(value =>
        test(`In project: file ${value} exists`, () => {
            expect(
                fs.existsSync(path.join(answers.projectName, value)),
            ).toBeTruthy();
        }),
    );

    ['src/md/main.md', 'src/ts', '.idea-configs', '.idea', '.github'].forEach(
        value =>
            test(`In project: file ${value} does not exists`, () => {
                expect(
                    fs.existsSync(path.join(answers.projectName, value)),
                ).not.toBeTruthy();
            }),
    );

    test('Main tex does not contain entrypoint', () => {
        expect(
            fs.readFileSync(
                path.join(answers.projectName, 'src/tex/main.tex'),
                'utf8',
            ),
        ).not.toContain('./dist/random-number.tex');
    });

    test('package.json contains project name', () => {
        const packageJsonContent = fs.readFileSync(
            path.join(answers.projectName, 'package.json'),
            'utf8',
        );

        expect(packageJsonContent).toContain(answers.projectName);
        expect(packageJsonContent).not.toContain('"typescript"');
        expect(packageJsonContent).not.toContain('"ts-build"');
        expect(packageJsonContent).not.toContain('npm run ts-build');
    });

    test('tex-generate.js does not contain entrypoint', () => {
        expect(
            fs.readFileSync(
                path.join(answers.projectName, 'scripts/tex-generate.js'),
                'utf8',
            ),
        ).not.toContain("require('../dist/js/random-number-generator.js')");
    });
});
