import { statSync, rmSync, cpSync, rmdirSync } from "fs";
import { opendir, readdir } from "node:fs/promises";
import { posix } from "node:path";
const absPath = posix.resolve;
export async function regexCopy(paths, opts) {
    async function walker({ src, base }) {
        for await (const entry of await opendir(src)) {
            const fullpath = `${src}/${entry.name}`;
            if (entry.isDirectory()) {
                const isEmpty = await walker({ src: `${src}/${entry.name}`, base });
                if (removeEmpty && isEmpty === 0) {
                    if (test)
                        console.log(`rm Dir: ${src}/${entry.name}`);
                    else
                        rmdirSync(fullpath);
                }
            }
            else {
                fileSystem(fullpath, base);
            }
        }
        return [...(await readdir(src))].length;
    }
    function fileSystem(source, pathBase) {
        const isInclude = (regex) => regex.test(source);
        if (enlist.some(isInclude) && !exclude.some(isInclude)) {
            if (test) {
                console.log(`  From: ${source}`);
                console.log(`cp  To: ${dst}/${uncover(source.replace(pathBase, ""), flat)}`);
            }
            else
                cpSync(source, `${dst}/${uncover(source.replace(pathBase, ""), flat)}`);
        }
        if (remove.some(isInclude) && !preserve.some(isInclude)) {
            if (test)
                console.log(`rmFile: ${source}`);
            else
                rmSync(source);
        }
    }
    const { flat = 1, removeEmpty = true, test = false, reset = false } = opts;
    const { enlist = [], exclude = [], remove = [], preserve = [] } = Object.fromEntries(Object.entries(opts)
        .filter(([, value]) => (value instanceof Array))
        .map(([key, value]) => [key, value.map(Glob2Regex)]));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sPaths = paths.filter((descript) => (!!descript.match("->")));
    const nPaths = paths.filter((descript) => (!descript.match("->")));
    const dst = entryPoint(nPaths.pop());
    enlist.push(...nPaths.filter((descript) => (!descript.match("->"))).map(Glob2Regex));
    try {
        if (statSync(dst) && reset) {
            rmSync(dst, { recursive: true });
        }
    }
    // eslint-disable-next-line no-empty
    catch { }
    const flag = {};
    for (const src of nPaths.map(entryPoint)) {
        if (!flag[src])
            flag[src] = true;
        else
            continue;
        await walker({ src, base: src.replace(/(?<base>.*)\/(.+?)$/, "$<base>") });
    }
}
export function entryPoint(source, isSource = -1) {
    let path = source.replace(/\\/g, "/").replace(/(!?{|\*).*/, "").replace(/\/$/, "");
    if (isSource > -1) {
        while (statSync(path).isFile()) {
            path = path.replace(/\/[^/]+$/, "");
        }
    }
    return absPath(path);
}
function Glob2Regex(pattern) {
    if (pattern instanceof RegExp)
        return pattern;
    try {
        const ctrl = statSync(pattern.replace(/\/$/, ""));
        if (ctrl.isDirectory()) {
            pattern = `${pattern.replace(/\/$/, "")}/**/*`;
        }
        else if (ctrl.isFile()) {
            return new RegExp(pattern.replace(/\//g, "\\/").replace(/\./g, "\\."));
        }
    }
    // eslint-disable-next-line no-empty
    catch { }
    pattern = pattern.replace(/^(\.\.?\/)+/, "")
        .replace(/\?/g, ".")
        .replace(/(?<!\*)\*(?!\*)/g, "[^/]+")
        .replace(/\*\*\//g, "([^/]+\\/)*?");
    for (const [matched] of pattern.matchAll(/!?{[^}]+?}/g)) {
        pattern = pattern.replace(matched, matched.replace(/,/g, "|").replace(/!{([^}]+?)}/, "(?!($1))[^/]*").replace(/{([^}]+?)}/, "($1)[^/]*"));
    }
    return new RegExp(pattern.replace(/(\.[\w\d]+)$/, "$1$"));
}
function uncover(path, covers = 1) {
    return path.replace(RegExp(`^\\.?\\/([^/]+\\/){0,${covers}}`), "");
}
