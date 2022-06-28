import { regexCopy, entryPoint, Options } from "../src/deno.ts";

const [ , , ...args ] = Deno.args;
const opts: Options = { exclude: [], remove: [], preserve: [], flat: 1, removeEmpty: true, test: false };
const cliConfig = {
    "-e": "exclude", "-E": "exclude",
    "--exclude": "exclude", "--regex-exclude": "exclude",
    "-r": "remove", "-R": "remove",
    "--remove": "remove", "--regex-remove": "remove",
    "-p": "preserve", "-P": "preserve",
    "--preserve": "preserve", "--regex-preserve": "preserve",
}
let paths: string[] = [];
function checkValidity( path: string ): boolean {
    try {
        if ( Deno.statSync( path ).isDirectory ) return true;
        else {
            console.error( `Invalid path (is not directory): '${ path }'` );
            return false;
        }
    }
    catch {
        console.error( `Invalid path (does not exist): '${ path }'` );
        return false;
    }
}

function checkPath( path: string ): boolean {
    return ( path.match( /^-/ ) ? false : !!path.match( /^(\w:\/|\.{0,2}\/)?([^/]+?\/)*?[^/]+?$/ ) )
}

await main()

async function main() {
    for ( let i = 0; i < args.length; i++ ) {
        const arg = args[ i ];
        switch ( arg ) {
            case "-e":
            case "-r":
            case "-p":
                {
                    if ( checkPath( args[ i + 1 ] ) ) opts[ <"exclude" | "remove" | "preserve">cliConfig[ arg ] ].push( args[ ++i ] );
                    break;
                }
            case "-E":
            case "-R":
            case "-P":
                {
                    opts[ <"exclude" | "remove" | "preserve">cliConfig[ arg ] ].push( new RegExp( args[ ++i ] ) );
                    break;
                }
            case "--exclude":
            case "--remove":
            case "--preserve": {
                JSON.parse( args[ ++i ] ).forEach( ( path: string ) => ( checkPath( path ) ? opts[ <"exclude" | "remove" | "preserve">cliConfig[ arg ] ].push( path ) : false ) );
                break;
            }
            case "--regex-exclude":
            case "--regex-remove":
            case "--regex-preserve": {
                JSON.parse( args[ ++i ] ).forEach( ( regex: string ) => opts[ <"exclude" | "remove" | "preserve">cliConfig[ arg ] ].push( new RegExp( regex ) ) );
                break;
            }
            case "-t": {
                opts.test = true;
                break;
            }
            case "-pE":
            case "--preserve-empty": {
                opts.removeEmpty = false;
                break;
            }
            case "-f":
            case "--flat": {
                opts.flat = parseInt( args[ ++i ] );
                if ( opts.flat < 0 ) opts.flat = 0;
                break;
            }
            default:
                if ( checkPath( arg ) ) paths.push( arg );
                else console.log( `Unknown parameter '${ arg }' is ignored.` );
        }
    }

    try {
        if ( paths.length < 2 ) throw "An insufficient number of arguments. (Lack of paths)";
        else {
            paths = paths.filter( ( p, i, arr ) => ( ( ( i + 1 < arr.length ) && checkValidity( entryPoint( p ) ) ) || ( i + 1 === arr.length ) ) )
            if ( paths.length < 2 ) throw "An insufficient number of arguments. (Lack of valid paths)";
        }
        await regexCopy( paths, opts );
    }
    catch ( e ) {
        console.log( e.message || e );
    }

}
