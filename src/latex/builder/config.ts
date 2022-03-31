export type LatexFlagParameterType = string | number | boolean | null;

export interface LatexFlags extends Record<string, LatexFlagParameterType> {
    synctex: boolean;
    outputDirectory: string;
    interaction: string;
    shellEscape: null;
    haltOnError: null;
    fileLineError: null;
    outputFormat: string;

    [arg: string]: LatexFlagParameterType;
}

export type LatexFlagsPartial = Partial<LatexFlags>;

export class LatexFlagsE {
    public flags: LatexFlagsPartial;

    constructor(flags: LatexFlagsPartial) {
        this.flags = flags;
    }

    public get args(): string[] {
        return Object.entries(this.flags)
            .map(d => LatexFlagsE._getFlag(d[0], d[1]))
            .filter(d => d !== undefined) as string[];
    }

    private static _getFlag(
        key: string,
        flag?: LatexFlagParameterType,
    ): string | undefined {
        if (flag === undefined) {
            return undefined;
        }

        if (typeof flag === 'string') {
            return `-${key}=${flag}`;
        }
        if (typeof flag === 'number') {
            return `-${key}=${flag}`;
        }
        if (typeof flag === 'boolean') {
            return `-${key}=${flag ? 1 : 0}`;
        }

        return `-${key}`;
    }

    public filterFlags(packet: LatexPacketType): LatexFlagsE {
        if (packet == 'miktex') {
            const newConfig = { ...this.flags };
            delete newConfig['fileLineError'];
            delete newConfig['outputFormat'];

            return new LatexFlagsE(newConfig);
        }

        return new LatexFlagsE({ ...this.flags });
    }
}

type LatexPacketType = 'miktex' | 'texlive';

export interface LatexBuilderConfig {
    indexFile: string;
    executable: string;
    packet: LatexPacketType;
    cwd: string;
    flags: LatexFlagsPartial;
}
