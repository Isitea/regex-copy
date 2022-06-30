import { opendir, rmdir, readdir, cp, rm, stat } from "node:fs/promises";
import { posix } from "node:path";
const absPath = posix.resolve;
export async function regexCopy(paths, opts) {
    async function worker({ src, base }) {
        for await (const entry of await opendir(src)) {
            const fullpath = `${src}/${entry.name}`;
            const isInclude = (regex) => regex.test(fullpath);
            if (entry.isDirectory()) {
                const isEmpty = await worker({ src: `${src}/${entry.name}`, base });
                if (removeEmpty && isEmpty === 0) {
                    if (test)
                        console.log(`rm Dir: ${src}/${entry.name}`);
                    else
                        rmdir(fullpath);
                }
            }
            else {
                if (enlist.some(isInclude) && !exclude.some(isInclude)) {
                    if (test) {
                        console.log(`  From: ${fullpath}`);
                        console.log(`cp  To: ${dst}/${uncover(fullpath.replace(base, ""), flat)}`);
                    }
                    else
                        await cp(fullpath, `${dst}/${uncover(fullpath.replace(base, ""), flat)}`);
                }
                //else if ( test ) {
                //    console.log( `cpPass: ${ fullpath }` )
                //}
                if (remove.some(isInclude) && !preserve.some(isInclude)) {
                    if (test)
                        console.log(`rmFile: ${fullpath}`);
                    else
                        await rm(fullpath);
                }
                //else if ( test ) {
                //    console.log( `rmPass: ${ fullpath }` )
                //}
            }
        }
        return [...(await readdir(src))].length;
    }
    const dst = await entryPoint(paths.pop());
    const { flat = 1, removeEmpty = true, test = false } = opts;
    const { enlist = [], exclude = [], remove = [], preserve = [] } = Object.fromEntries(Object.entries(opts).filter(([, value]) => (value instanceof Array)).map(([key, value]) => [key, value.map(Glob2Regex)]));
    enlist.push(...paths.filter(path => !!path.match(/\*/)).map(Glob2Regex));
    paths = await Promise.all(paths.map(entryPoint));
    const flag = {};
    for (const src of paths) {
        if (!flag[src])
            flag[src] = true;
        else
            continue;
        await worker({ src, base: src.replace(/(?<base>.*)\/(.+?)$/, "$<base>") });
    }
}
export async function entryPoint(source) {
    let path = source.replace(/\\/g, "/").replace(/(!?{|\*).?$/, "").replace(/\/$/, "");
    while ((await stat(path)).isFile()) {
        path = path.replace(/\/[^/]+$/, "");
    }
    return absPath(path);
}
function Glob2Regex(pattern) {
    if (pattern instanceof RegExp)
        return pattern;
    pattern = pattern.replace(/^(\.\.?\/)+/, "")
        .replace(/\?/g, ".")
        .replace(/(?<!\*)\*(?!\*)/g, "[^/]+")
        .replace(/\*\*\//g, "([^/]+\\/)*?");
    for (const [matched] of pattern.matchAll(/!?{[^}]+?}/g)) {
        pattern = pattern.replace(matched, matched.replace(/,/g, "|").replace(/!{([^}]+?)}/, "(?!($1))[^/]*").replace(/{([^}]+?)}/, "($1)[^/]*"));
    }
    return new RegExp(pattern.replace(/(\.[\w\d]+)$/, "$1\$"));
}
function uncover(path, covers = 1) {
    return path.replace(RegExp(`^\\.?\\/([^/]+\\/){0,${covers}}`), "");
}
