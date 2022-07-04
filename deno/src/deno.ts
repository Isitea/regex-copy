interface Path {
    src: string,
    base: string
}

interface Options {
    enlist?: Array<string | RegExp>;
    exclude?: Array<string | RegExp>;
    remove?: Array<string | RegExp>;
    preserve?: Array<string | RegExp>;
    flat?: number;
    removeEmpty?: boolean;
    test?: boolean;
    reset?: boolean;
}

interface OptionsInRegex {
    enlist?: Array<RegExp>;
    exclude?: Array<RegExp>;
    remove?: Array<RegExp>;
    preserve?: Array<RegExp>;
    flat?: number;
    removeEmpty?: boolean;
    test?: boolean;
    reset?: boolean;
}

type Paths = {
    [ key in string ]: boolean
}

export async function regexCopy( paths: Array<string>, opts: Options ): Promise<void> {
    async function walker( { src, base }: Path ): Promise<number> {
        for await ( const entry of Deno.readDir( src ) ) {
            const fullpath = `${ src }/${ entry.name }`;
            if ( entry.isDirectory ) {
                const isEmpty = await walker( { src: `${ src }/${ entry.name }`, base } );
                if ( removeEmpty && isEmpty === 0 ) {
                    if ( test ) console.log( `rm Dir: ${ src }/${ entry.name }` );
                    else Deno.remove( fullpath );
                }
            }
            else {
                fileSystem( fullpath, base );
            }
        }

        return [ ...Deno.readDirSync( src ) ].length;
    }

    function fileSystem( source: string, pathBase: string ): void {
        const isInclude = ( regex: RegExp ): boolean => regex.test( source );
        const copyTarget = enlist.some( isInclude ) && !exclude.some( isInclude );
        if ( remove.some( isInclude ) && !preserve.some( isInclude ) ) {
            if ( copyTarget ) {
                if ( test ) {
                    console.log( `  From: ${ source }` );
                    console.log( `cp  To: ${ dst }/${ uncover( source.replace( pathBase, "" ), flat ) }` );
                }
                else Deno.copyFileSync( source, `${ dst }/${ uncover( source.replace( pathBase, "" ), flat ) }` );
            }
            if ( test ) console.log( `rmFile: ${ source }` )
            else Deno.removeSync( source );
        }
        else if ( copyTarget ) {
            if ( test ) {
                console.log( `  From: ${ source }` );
                console.log( `cp  To: ${ dst }/${ uncover( source.replace( pathBase, "" ), flat ) }` );
            }
            else Deno.copyFile( source, `${ dst }/${ uncover( source.replace( pathBase, "" ), flat ) }` );
        }
    }

    const { flat = 1, removeEmpty = true, test = false, reset = false } = opts;
    const { enlist = [], exclude = [], remove = [], preserve = [] }: OptionsInRegex
        = <OptionsInRegex>Object.fromEntries(
            Object.entries( opts )
                .filter( ( [ , value ] ) => ( value instanceof Array ) )
                .map( ( [ key, value ] ) => [ key, value.map( Glob2Regex ) ] )
        );

    // deno-lint-ignore no-unused-vars
    const sPaths = paths.filter( ( descript: string ) => ( !!descript.match( "->" ) ) );
    const nPaths = paths.filter( ( descript: string ) => ( !descript.match( "->" ) ) );
    const dst = entryPoint( <string>nPaths.pop() );
    enlist.push( ...nPaths.filter( ( descript: string ) => ( !descript.match( "->" ) ) ).map( Glob2Regex ) );
    try {
        if ( Deno.statSync( dst ) && reset ) {
            Deno.removeSync( dst, { recursive: true } );
        }
    }
    // deno-lint-ignore no-empty
    catch { }

    const flag = {} as Paths;
    for ( const src of nPaths.map( entryPoint ) ) {
        if ( !flag[ src ] ) flag[ src ] = true;
        else continue;
        await walker( { src, base: src.replace( /(?<base>.*)\/(.+?)$/, "$<base>" ) } );
    }
}

export function entryPoint( source: string, isSource = -1 ): string {
    let path = source.replace( /\\/g, "/" ).replace( /(!?{|\*).*$/, "" ).replace( /\/$/, "" );
    if ( isSource > -1 ) {
        while ( Deno.statSync( path ).isFile ) {
            path = path.replace( /\/[^/]+$/, "" );
        }
    }

    return Deno.realPathSync( path );
}

function Glob2Regex( pattern: string | RegExp ): RegExp {
    if ( pattern instanceof RegExp ) return pattern;
    try {
        const ctrl = Deno.statSync( pattern.replace( /\/$/, "" ) );
        if ( ctrl.isDirectory ) {
            pattern = `${ pattern.replace( /\/$/, "" ) }/**/*`
        }
        else if ( ctrl.isFile ) {
            return new RegExp( pattern.replace( /\//g, "\\/" ).replace( /\./g, "\\." ) );
        }
    }
    // deno-lint-ignore no-empty
    catch { }
    pattern = pattern.replace( /^(\.\.?\/)+/, "" )
        .replace( /\?/g, "." )
        .replace( /(?<!\*)\*(?!\*)/g, "[^/]+" )
        .replace( /\*\*\//g, "([^/]+\\/)*?" );
    for ( const [ matched ] of pattern.matchAll( /!?{[^}]+?}/g ) ) {
        pattern = pattern.replace( matched, matched.replace( /,/g, "|" ).replace( /!{([^}]+?)}/, "(?!($1))[^/]*" ).replace( /{([^}]+?)}/, "($1)[^/]*" ) );
    }

    return new RegExp( pattern.replace( /(\.[\w\d]+)$/, "$1$" ) );
}

function uncover( path: string, covers = 1 ): string {
    return path.replace( RegExp( `^\\.?\\/([^/]+\\/){0,${ covers }}` ), "" );
}
