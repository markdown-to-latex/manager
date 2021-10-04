// See https://geedew.com/remove-a-directory-that-is-not-empty-in-nodejs/
import * as fs from 'fs';

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

export function camelToKebabCase(str: string): string {
    if (!str) {
        return '';
    }
    str = str[0].toLowerCase() + str.slice(1);
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}
