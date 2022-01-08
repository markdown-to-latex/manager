// See https://geedew.com/remove-a-directory-that-is-not-empty-in-nodejs/
import * as fs from 'fs';
import * as child_process from 'child_process';

export function deleteFolderSyncRecursive(path: string): void {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            const curPath = path + '/' + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                // recurse
                deleteFolderSyncRecursive(curPath);
            } else {
                // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

export function getGitVersion(): string {
    const v = child_process.execSync('git version', {
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    return v.toString().split('\n')[0];
}

export function createGitRepository(path: string): void {
    child_process.execSync('git init', {
        cwd: path,
        stdio: ['inherit', 'inherit', 'inherit'],
    });
}

export function camelToKebabCase(str: string): string {
    if (!str) {
        return '';
    }
    str = str[0].toLowerCase() + str.slice(1);
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}
