# regex-copy
Copy and remove files with one command.
Also, a regular expression can filter files that will be copied or removed.

## Features
- Recursively copy the whole directory.
- Copy several directories (to one directory) at once. 
- Remove files after files were copied, if you want.
- Can be used in two-way (cli and es-module).

## As a cli tool
```bash
$ regex-copy -r '^(.*)\.js$' -d './dist' './src'
$ rgcp './src' './dist'
$ rgcp './src1' './src2' './dist'
$ rgcp './src1' './src2' './src3' ... './srcn' './dist'
$ rgcp './src' './dist' -e '**/*.ts' -r '**/*.js' -p '**/*.ts'
```
### Options
- `-e`: Determines which files to exclude from copy in glob pattern.
- `--exclude`: Determines which files to exclude from copy in glob pattern. It takes Array expressed by JSON string as a parameter.
- `-E`: Determines which files to exclude from copy in regular expression.
- `--regex-exclude`: Determines which files to exclude from copy in regular expression. It takes Array expressed by JSON string as a parameter.
- `-r`: Determines which files to remove in glob pattern.
- `--remove`: Determines which files to remove in glob pattern. It takes Array expressed by JSON string as a parameter.
- `-R`: Determines which files to remove in regular expression.
- `--regex-remove`: Determines which files to remove in regular expression. It takes Array expressed by JSON string as a parameter.
- `-p`: Determines which files to preserve in glob pattern.
- `--preserve`: Determines which files to preserve in glob pattern. It takes Array expressed by JSON string as a parameter.
- `-P`: Determines which files to preserve in regular expression.
- `--regex-preserve`: Determines which files to preserve in regular expression. It takes Array expressed by JSON string as a parameter.
- `-f`, `--flat`: Determines uncovering folder level.
- `-t`: Whether to test targets. If this flag set as `true`, no file system action will be performed
## As a es-module
```js
import { regexCopy } from "regex-copy";
regexCopy( [ ...[ paths ], dest ], { enlist, exclude, remove, preserve, flat, removeEmpty, test } )// Returns a Promise with undefined.
```
### Example
```js
import { regexCopy } from "regex-copy";
regexCopy( [ "C:/Users/Isitea/AppData/Local/Temp", "C:/Users/Default/AppData/Local/Temp", "C:/Temp" ], { exclude: [ /.+/, "**/*" ], remove: [ "**/*.tmp" ], preserve: [ "**/*" ], test: true } );
```

##


### Arguments:

| Name | Type | Required | Default | Description |
| ---- | ---- | -------- | ------- | ----------- |
| `path` | `string` | Yes | N/A | Source files or folder. It can be expressed with a glob pattern |
| `dest` | `string` | Yes | N/A | Destination folder path |
| `options.enlist` | `Array<RegExp,string>` | No | `[]` | Regular expression / glob pattern that determines which files to copy |
| `options.exclude` | `Array<RegExp,string>` | No | `[]` | Regular expression / glob pattern that determines which files to copy |
| `options.remove` | `Array<RegExp,string>` | No | `[]` | Regular expression / glob pattern that determines which files to copy |
| `options.preserve` | `Array<RegExp,string>` | No | `[]` | Regular expression / glob pattern that determines which files to copy |
| `options.flat` | `number` | No | `1` | Determines uncovering folder level. |
| `options.removeEmpty` | `boolean` | No | `true` | Wheter to remove empty source folder after remove |
| `options.test` | `boolean` | No | `false` | Whether to test targets. If this flag set as `true`, no file system action will be performed |

