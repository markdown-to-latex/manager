import { getAbbreviation, translit } from '../../src/utils/filename';

describe('translit', () => {
    test('Simple string', () => {
        expect(translit('Тестирование транслита')).toEqual(
            'Testirovanie translita',
        );
    });

    test('English, Cyrillic, number and other characters', () => {
        expect(translit('123')).toEqual('123');
        expect(translit('Test строка для #12 тестирова_ния $№9')).toEqual(
            'Test stroka dlya #12 testirova_niya $№9',
        );
    });
});

describe('getAbbreviation', () => {
    test('Simple string', () => {
        expect(getAbbreviation('Тестирование документа')).toEqual('TD');
    });
    test('Cyrillic, number and other characters', () => {
        expect(getAbbreviation('Лабораторная работа №2')).toEqual('LR2');
    });
});
