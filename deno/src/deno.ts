interface Path {
    src: string,
    base: string
}

export interface Options {
    enlist?: Array<string | RegExp>,
    exclude: Array<string | RegExp>,
    remove: Array<string | RegExp>,
    preserve: Array<string | RegExp>,
    flat: number,
    removeEmpty: boolean,
    test?: boolean
}

interface OptionsInRegex {
    enlist?: Array<RegExp>,
    exclude: Array<RegExp>,
    remove: Array<RegExp>,
    preserve: Array<RegExp>,
    flat: number,
    removeEmpty: boolean,
    test?: boolean
}

type Paths = {
    [ key in string ]: boolean
}

export async function regexCopy( paths: Array<string>, opts: Options ): Promise<void> {
    async function worker( { src, base }: Path ): Promise<number> {
        for await ( const entry of Deno.readDir( src ) ) {
            const fullpath = `${ src }/${ entry.name }`;
            const isInclude = ( regex: RegExp ): boolean => regex.test( fullpath );
            if ( entry.isDirectory ) {
                const isEmpty = await worker( { src: `${ src }/${ entry.name }`, base } );
                if ( removeEmpty && isEmpty === 0 ) {
                    if ( test ) console.log( `rm Dir: ${ src }/${ entry.name }` );
                    else Deno.remove( fullpath );
                }
            }
            else {
                if ( enlist.some( isInclude ) && !exclude.some( isInclude ) ) {
                    if ( test ) {
                        console.log( `  From: ${ fullpath }` );
                        console.log( `cp  To: ${ dst }/${ uncover( fullpath.replace( base, "" ), flat ) }` );
                    }
                    else await Deno.copyFile( fullpath, `${ dst }/${ uncover( fullpath.replace( base, "" ), flat ) }` );
                }

                if ( remove.some( isInclude ) && !preserve.some( isInclude ) ) {
                    if ( test ) console.log( `rmFile: ${ fullpath }` )
                    else await Deno.remove( fullpath );
                }
            }
        }

        return [ ...Deno.readDirSync( src ) ].length;
    }
    const dst = await entryPoint( <string>paths.pop() );
    const { flat = 1, removeEmpty = true, test = false } = opts;
    const { enlist = [], exclude = [], remove = [], preserve = [] }: OptionsInRegex = <OptionsInRegex>Object.fromEntries( Object.entries( opts ).filter( ( [ , value ] ) => ( value instanceof Array ) ).map( ( [ key, value ] ) => [ key, value.map( Glob2Regex ) ] ) );
    enlist.push( ...paths.filter( path => !!path.match( /\*/ ) ).map( Glob2Regex ) );
    paths = await Promise.all( paths.map( entryPoint ) );
    const flag = {} as Paths;
    for ( const src of paths ) {
        if ( !flag[ src ] ) flag[ src ] = true;
        else continue;
        await worker( { src, base: src.replace( /(?<base>.*)\/(.+?)$/, "$<base>" ) } );
    }
}

export function entryPoint( source: string ): Promise<string> {
    let path = source.replace( /\\/g, "/" ).replace( /(!?{|\*).?$/, "" ).replace( /\/$/, "" );
    while ( Deno.statSync( path ).isFile ) {
        path = path.replace( /\/[^/]+$/, "" );
    }
    return Deno.realPath( path );
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

function uncover( path: string, covers = 1 ): string {
    return path.replace( RegExp( `^\\.?\\/([^/]+\\/){0,${ covers }}` ), "" );
}
