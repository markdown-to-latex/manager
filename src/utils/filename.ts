import CyrillicToTranslit from 'cyrillic-to-translit-js';

const transliter = new CyrillicToTranslit();

export function translit(ruString: string): string {
    return transliter.transform(ruString);
}

export function getAbbreviation(ruString: string): string {
    return translit(ruString)
        .replace(/[#№]/g, '')
        .replace(/([a-zA-Z])[a-zA-Z]+/g, '$1')
        .replace(/ /g, '')
        .toUpperCase();
}
