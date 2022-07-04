import { statSync } from "node:fs";
import { argv } from 'node:process';
import { regexCopy, entryPoint } from "../dist/node.js";

const [ exec, bin, ...args ] = argv;
const opts = { exclude: [], remove: [], preserve: [], flat: 1, removeEmpty: true, test: false };
const cliConfig = {
    "-e": "exclude", "-E": "exclude",
    "--exclude": "exclude", "--regex-exclude": "exclude",
    "-r": "remove", "-R": "remove",
    "--remove": "remove", "--regex-remove": "remove",
    "-p": "preserve", "-P": "preserve",
    "--preserve": "preserve", "--regex-preserve": "preserve",
    "--reset": "reset",
}
let paths = [];
function checkValidity ( path ) {
    try {
        if ( statSync( path ).isDirectory() ) return true;
        else {
            console.error( `Invalid path (is not directory): '${ path }'` );
            return false;
        }
    }
    catch ( e ) {
        console.error( `Invalid path (does not exist): '${ path }'` );
        return false;
    }
}

function checkPath ( path ) {
    return ( path.match( /^-/ ) ? null : path.match( /^(\w:\/|\.{0,2}\/)?([^/]+?\/)*?[^/]+?$/ ) )
}

await main()
    .then( async function () {
        if ( paths.length < 2 ) throw "An insufficient number of arguments. (Lack of paths)";
        else {
            paths = paths.filter( ( p, i, arr ) => ( ( ( i + 1 < arr.length ) && checkValidity( entryPoint( p ) ) ) || ( i + 1 === arr.length ) ) )
            if ( paths.length < 2 ) throw "An insufficient number of arguments. (Lack of valid paths)";
        }
        regexCopy( paths, opts );
    } )
    .catch( function ( e ) {
        console.log( e.message || e );
    } )

async function main () {
    for ( let i = 0; i < args.length; i++ ) {
        const arg = args[ i ];
        switch ( arg ) {
            case "-e":
            case "-r":
            case "-p":
                {
                    if ( !!checkPath( args[ i + 1 ] ) ) opts[ cliConfig[ arg ] ].push( args[ ++i ] );
                    break;
                }
            case "-E":
            case "-R":
            case "-P":
                {
                    opts[ cliConfig[ arg ] ].push( new RegExp( args[ ++i ] ) );
                    break;
                }
            case "--exclude":
            case "--remove":
            case "--preserve": {
                JSON.parse( args[ ++i ] ).forEach( ( path ) => ( !!checkPath( path ) ? opts[ cliConfig[ arg ] ].push( path ) : false ) );
                break;
            }
            case "--regex-exclude":
            case "--regex-remove":
            case "--regex-preserve": {
                JSON.parse( args[ ++i ] ).forEach( ( regex ) => opts[ cliConfig[ arg ] ].push( new RegExp( regex ) ) );
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
            case "--reset": {
                opts.reset = true;
                break;
            }
            default:
                if ( !!checkPath( arg ) ) paths.push( arg );
                else console.log( `Unknown parameter '${ arg }' is ignored.` );
        }
    }

}
