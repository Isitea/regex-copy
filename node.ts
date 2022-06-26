import { opendir, rmdir, readdir, cp, rm } from "node:fs/promises";
import { type } from "node:os";
import { posix } from "node:path";
const absPath = posix.resolve;

interface Path {
    src: string,
    base: string
}

interface Options {
    enlist: Array<string>,
    exclude: Array<string>,
    remove: Array<string>,
    preserve: Array<string>,
    flat: number,
    removeEmpty: boolean,
    test: boolean
}

interface OptionsInRegex {
    enlist: Array<RegExp>,
    exclude: Array<RegExp>,
    remove: Array<RegExp>,
    preserve: Array<RegExp>,
    flat: number,
    removeEmpty: boolean
}

type Paths = {
    [ key in string ]: boolean
}

export async function regexCopy( paths: Array<string>, opts: Options ): Promise<void> {
    async function worker( { src, base }: Path ): Promise<Array<string>> {
        for await ( const entry of await opendir( src ) ) {
            const fullpath = `${ src }/${ entry.name }`;
            const isInclude = ( regex: RegExp ): boolean => regex.test( fullpath );
            if ( entry.isDirectory() ) {
                const isEmpty = await worker( { src: `${ src }/${ entry.name }`, base } );
                if ( removeEmpty && isEmpty.length === 0 ) {
                    if ( test ) console.log( `rm Dir: ${ src }/${ entry.name }` );
                    else rmdir( fullpath );
                }
            }
            else {
                if ( enlist.some( isInclude ) && !exclude.some( isInclude ) ) {
                    if ( test ) {
                        console.log( `  From: ${ fullpath }` );
                        console.log( `cp  To: ${ dst }/${ uncover( fullpath.replace( base, "" ), flat ) }` );
                    }
                    else await cp( fullpath, `${ dst }/${ uncover( fullpath.replace( base, "" ), flat ) }` );
                }
                //else if ( test ) {
                //    console.log( `cpPass: ${ fullpath }` )
                //}

                if ( remove.some( isInclude ) && !preserve.some( isInclude ) ) {
                    if ( test ) console.log( `rmFile: ${ fullpath }` )
                    else await rm( fullpath );
                }
                //else if ( test ) {
                //    console.log( `rmPass: ${ fullpath }` )
                //}
            }
        }

        return readdir( src );
    }
    const dst = entryPoint( <string>paths.pop() );
    const { flat = 1, removeEmpty = true, test = false }: Options = opts;
    const { enlist = [], exclude = [], remove = [], preserve = [] }: OptionsInRegex = <OptionsInRegex>Object.fromEntries( Object.entries( opts ).filter( ( [ , value ] ) => ( value instanceof Array ) ).map( ( [ key, value ] ) => [ key, value.map( Glob2Regex ) ] ) );
    enlist.push( ...paths.filter( path => !!path.match( /\*/ ) ).map( Glob2Regex ) );
    paths = paths.map( entryPoint );
    let flag = {} as Paths;
    for ( const src of paths ) {
        if ( !flag[ src ] ) flag[ src ] = true;
        else continue;
        await worker( { src, base: src.replace( /(?<base>.*)\/(.+?)$/, "$<base>" ) } );
    }
}

export function entryPoint( source: string ): string {
    return absPath( source.replace( /\\/g, "/" ).replace( /(!?{|\*).+$/, "" ) );
}

function Glob2Regex( pattern: string | RegExp ): RegExp {
    if ( pattern instanceof RegExp ) return pattern;
    pattern = pattern.replace( /^(\.\.?\/)+/, "" )
        .replace( /\?/g, "." )
        .replace( /(?<!\*)\*(?!\*)/g, "[^/]+" )
        .replace( /\*\*\//g, "([^/]+\\/)*?" );
    for ( const [ matched ] of pattern.matchAll( /!?{[^}]+?}/g ) ) {
        pattern = pattern.replace( matched, matched.replace( /,/g, "|" ).replace( /!{([^}]+?)}/, "(?!($1))[^/]*" ).replace( /{([^}]+?)}/, "($1)[^/]*" ) );
    }

    return new RegExp( pattern.replace( /(\.[\w\d]+)$/, "$1\$" ) );
}

function uncover( path: string, covers: number = 1 ): string {
    return path.replace( RegExp( `^\\.?\\/([^/]+\\/){0,${ covers }}` ), "" );
}
