# clean-modules 🧹

<a href="https://www.npmjs.com/package/clean-modules"><img src="https://img.shields.io/npm/v/clean-modules" /></a>
<a href="https://www.npmjs.com/package/clean-modules"><img src="https://img.shields.io/node/v-lts/clean-modules" /></a>
<a href="https://www.npmjs.com/package/clean-modules"><img src="https://img.shields.io/npm/dm/clean-modules?color=blue" /></a>
<a href="https://bundlephobia.com/result?p=clean-modules"><img src="https://img.shields.io/bundlephobia/min/clean-modules?color=brightgreen" /></a>

> Clean up/prune unnecessary files and reduce the size of your `node_modules` directory. Useful for
> CI caches or for reducing the size of serverless functions.

- 🧹 Removes directories and files that are unnecessary and **safe to remove in production**
- 🛠 Easily customizable through glob patterns (either through [CLI args](#positionals) or a
  [configuration file](#glob-patterns-and-configuration-file))
- 📁 Cleans up empty directories after removing files
- ⚡️ Super fast, but still written in Node
- 🔍 Allows analyzing results, like which pattern excluded which file
- 🧑‍💻 Supports both CLI and programmatic usage

<p align="center">
  <img alt="Small project" title="Small project" src="images/small-project.png" width="240" />
  <img alt="Large project" title="Large project" src="images/large-project.png" width="240" />
  <img alt="Dry run" title="Dry run" src="images/dry-run.png" width="240" />
</p>

## Table of contents

<details><summary>Click to open</summary>

- [Quick start](#quick-start)
- [Installation](#installation)
- [Commands](#commands)
  - [`clean-modules clean` (default command) 🧹](#clean-modules-clean-default-command-)
    - [Usage](#usage)
    - [Positionals](#positionals)
    - [Options](#options)
      - [`--directory | -D`](#--directory---d)
      - [`--glob-file | -f`](#--glob-file---f)
      - [`--no-defaults | -n`](#--no-defaults---n)
      - [`--keep-empty | -k`](#--keep-empty---k)
      - [`--dry-run | -d`](#--dry-run---d)
      - [`--json | -j`](#--json---j)
      - [`--yes | -y`](#--yes---y)
  - [`clean-modules analyze` 🔎](#clean-modules-analyze-)
    - [Usage](#usage-1)
    - [Positionals](#positionals-1)
    - [Options](#options-1)
    - [Example output](#example-output)
- [Glob patterns and configuration file](#glob-patterns-and-configuration-file)
  - [Example configuration file](#example-configuration-file)
  - [Default globs](#default-globs)
    - [Common extra inclusions](#common-extra-inclusions)
    - [Common extra exclusions](#common-extra-exclusions)
- [Programmatic usage](#programmatic-usage)
- [Alternatives](#alternatives)
  - [Comparisons](#comparisons)
    - [clean-modules (this project)](#clean-modules-this-project)
    - [yarn autoclean](#yarn-autoclean)
    - [modclean](#modclean)
    - [node-prune](#node-prune)
    - [nm-prune](#nm-prune)

</details>

## Quick start

Simply run the command in the directory where your `node_modules` are:

```bash
clean-modules
```

You can also pass any options that you need, like custom globs or a path to a specific
`node_modules` directory.

```bash
clean-modules --directory "path/to/node_modules" "extra/included/file/glob.txt" "!extra/excluded/glob.ts
```

Check out the [command](#clean-modules-clean-default-command-🧹) section for all available options.

## Installation

`clean-modules` can be installed globally if you only want to use it as a CLI tool. You can also
install it locally if you want to use it in a package command.

```bash
# global
npm install --global clean-modules

# dev dependency
npm install --save-dev clean-modules
```

## Commands

### `clean-modules clean` (default command) 🧹

The default command, cleans up your `node_modules` based on a set of _most likely_ safe glob
patterns and removes empty directories.

#### Usage

```bash
clean-modules [options] <...globs>
```

#### Positionals

Extra glob patterns can be passed as positional arguments. By default they are combined with the globs loaded from the the default globs file and any custom globs file passed through the [`--glob-file`](#glob-file---f) option.

For information on how the globs are parsed, see the [Glob patterns](#glob-patterns-and-configuration-file) section.

**Example**:

```bash
# include all TypeScript declaration files and @types folders
clean-modules "**/*.d.ts" "**/@types/**"

# exclude all sourcemap files and PNG files
clean-modules "!**/*.map.js" "!**/*.png"

# include .d.ts files but exclude PNG files
clean-modules "**/*.d.ts" "!**/*.png"
```

#### Options

##### `--directory | -D`

`string` [default: `./node_modules`]

Accepts a path to a directory to run the script on.

**Example**:

```bash
clean-modules --directory "path/to/custom/node_modules"
```

##### `--glob-file | -f`

`string` [default: `./.cleanmodules`]

Accepts a path to a file from which clean-modules should read any custom globs. See the
[glob patterns](#glob-patterns-and-configuration-file) section for information about how the glob
file works and what patterns work.

##### `--no-defaults | -n`

`boolean`

Excludes all default globs, using only custom globs added through the
[glob file](#glob-patterns-and-configuration-file) or by the include or exclude options. Useful if
you want complete control over what files to include.

See the [`.cleanmodules-default`](./cleanmodules-default) to see what patterns are included by
default by default.

##### `--keep-empty | -k`

`boolean`

Skips removing empty folders after removing files.

##### `--dry-run | -d`

`boolean`

Runs the script and prints the result without actually removing any files. Does not count the number
of removed empty directories.

##### `--json | -j`

`boolean`

Only logs a final JSON dump at the end of the script (useful for logs or services).

##### `--yes | -y`

`boolean`

Skips the confirmation prompt at the start of the script.

### `clean-modules analyze` 🔎

Compiles a list of all files that would be included by `clean-modules` and gives a breakdown of:

- exact file path
- what glob patterns it was included by
- how the patterns were formatted and passed along to `picomatch`
- if the file was included by default

#### Usage

```bash
clean-modules analyze [options]
```

Because of the amount of data it can be useful to pipe it somewhere, like:

```bash
clean-modules analyze >> clean-modules-result.json
```

#### Positionals

The `analyze` command accepts the same type of positionals as the [default command]().

#### Options

The `analyze` command accepts several of the default command's options and applies them in the same
way:

- [`--directory`](#directory---d)
- [`--glob-file`](#glob-file---f)
- [`--no-defaults`](#no-defaults---n)

#### Example output

```json
[
  {
    "filePath": "/Users/me/projects/foo/node_modules/dependency/__tests__/test1.js",
    "includedByDefault": true,
    "includedByGlobs": [
      {
        "original": "__tests__/",
        "derived": "/Users/me/projects/foo/node_modules/dependency/**/__tests__/**"
      }
    ]
  }
  // ...
]
```

## Glob patterns and configuration file

clean-modules accepts globs from either a configuration file (`.cleanmodules` next to
`node_modules` by default) or CLI arguments. It uses
[`.gitignore`-like](https://www.atlassian.com/git/tutorials/saving-changes/gitignore) glob patterns
that are converted to valid [`picomatch`](https://github.com/micromatch/picomatch) globs, which is
what is used to match file paths under the hood.

**Differences from regular gitignore syntax:**

- To include a directory the pattern _must_ end with `/`, `/*` or `/**`
  - This is to prevent directories matching common file names from being included by the globs.
- Casing is ignored.

**Like with .gitignore, globs should use forward-slashes as separators on all operative systems (including Windows)!**

### Example configuration file

```ignore
# this is a comment (starts with a #)

# to include include directories, end patterns with / or /* or /**
dep1/
dep1/*
dep2/**

# files are matched in any directory by default
**/*.test.js
# is the same as
*.test.js

# use a leading / to include a file or directory at a specific place
/dep4/this/specific/directory/**
/dep4/this/specific/file.js

# to exclude a path, prepend it with a !
!/not/this/directory/
!not-me.js

# to use leading exclamation marks without excluding, escape them
\!(*.d).ts
```

### Default globs

The default globs can be found in the [`.cleanmodules-default`](./.cleanmodules-default) file. It
only contains inclusions (as exclusions would override custom inclusions) and consists of a large
list of the most common files that are safe to remove.

That said, it's impossible to guarantee that none of the files are needed, and you might need to do
custom exclusions depending on what packages you use.

#### Common extra inclusions

- `**/*.d.ts`: **If you don't use TypeScript.** TypeScript declaration files take up a lot of space
  in your `node_modules` folder, but they are most likely required to build your application. Useful
  locally even if you don't use TypeScript since they can be parsed by your IDE.

#### Common extra exclusions

- `!**/*.map.js`: **If you are running `clean-modules` locally or need source files in production.**
  `clean-modules` removes sourcemap files by default since they take up a lot of space and does not
  break builds when removed. They can be nice to have though, especially while developing.

## Programmatic usage

Clean modules can be used programmatically too!

Simply import the corresponding function from the package:

````ts
import { clean, analyze } from 'clean-modules';

// analyze, all options are optional
const analyzeResult = await analyze({
  directory: '/path/to/node_modules',
  globFile: '/path/to/.cleanmodules',
  globs: ['**/*.js'],
  noDefaults: false,
});

// clean, all options are optional
const cleanResult = await clean({
  directory: '/path/to/node_modules',
  globFile: '/path/to/.cleanmodules',
  globs: ['**/*.js'],
  noDefaults: false,
  keepEmpty: false,
  dryRun: false,
});
````

## Alternatives

The most common issues I found with available tools are:

- They only allow inclusion/exclusion of file names, not file paths. This prevents you from e.g.
  excluding subdirectories of a specific folder, like `@types/react-native`.
- They include too many, or too few, patterns by default. Lots of them also include patterns like
  `*.ts` by default, which breaks TypeScript declaration files on build.
- They are too slow (only relevant when running on large projects)
- They are abandoned or don't respond to issues.

### Comparisons

#### clean-modules (this project)

- ✅ Inclusion/exclusion through file path globs
- ✅ Fast
- ✅ Safe list of files and folders included by default (for production use)
- ✅ Cleans up empty directories

#### [yarn autoclean](https://classic.yarnpkg.com/en/docs/cli/autoclean/)

- ✅ Included with Yarn by default
- ✅ Inclusion/exclusion through globs
- ⛔️ Very slow compared to alternatives
- ⛔️ Runs on every install, both locally and in CI
- ⛔️ Small list of files included by default

#### [modclean](https://github.com/ModClean/modclean)

- ✅ Cleans up empty directories
- ✅ Safe list of files and folders included by default
- ⛔️ Slow, only slightly faster than `yarn clean`
- ⛔️ Only allows inclusion/exclusion by file name globs, not file path
- ⛔️ Complains about empty folders that doesn't exist
- ⛔️ Abandoned

#### [node-prune](https://github.com/tj/node-prune)

- ✅ Fastest option available
- ⛔️ Written in Go and might require separate binary download
- ⛔️ Removes some dangerous files by default (like `.d.ts` files and `assets` folder)
- ⛔️ Only allows inclusion/exclusion by file name globs, not file path
- ⛔️ Globs are very limited since it uses Go's `filepath.Match`
- ⛔️ Does not remove empty folders

#### [nm-prune](https://github.com/tuananh/node-prune)

- ✅ Fast
- ⛔️ Removes some dangerous files by default (like `.d.ts` files and `assets` folder)
- ⛔️ Only allows inclusion/exclusion by file name, not file paths or globs
- ⛔️ Does not remove empty folders
- ⛔️ Small list of files included by default
