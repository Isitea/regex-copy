export interface Options {
    enlist?: Array<string | RegExp>;
    exclude: Array<string | RegExp>;
    remove: Array<string | RegExp>;
    preserve: Array<string | RegExp>;
    flat: number;
    removeEmpty: boolean;
    test?: boolean;
}
export declare function regexCopy(paths: Array<string>, opts: Options): Promise<void>;
export declare function entryPoint(source: string): Promise<string>;
