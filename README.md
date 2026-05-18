# clean-modules 🧹

<a href="https://www.npmjs.com/package/clean-modules"><img src="https://img.shields.io/npm/v/clean-modules" /></a>
<a href="https://www.npmjs.com/package/clean-modules"><img src="https://img.shields.io/npm/dm/clean-modules" /></a>
<a href="https://www.npmjs.com/package/clean-modules"><img src="https://img.shields.io/node/v-lts/clean-modules" /></a>

Saves space by removing redundant files from your `node_modules`. Useful for CI caches
or reducing the size of serverless functions.

- Fully customizable through glob patterns, either via [CLI args](#positionals) or
  [config file](#glob-patterns-and-configuration-file).
- Pure Node.js, no separate binary or runtime needed.
- Fast.

## Table of contents

<details><summary>Click to open</summary>

- [Installation](#installation)
- [Quick start](#quick-start)
- [Commands](#commands)
  - [`clean-modules [clean]`](#clean-modules-clean)
    - [Positionals](#positionals)
    - [Options](#options)
  - [`clean-modules analyze`](#clean-modules-analyze)
    - [Positionals](#positionals-1)
    - [Options](#options-1)
- [Glob patterns and configuration file](#glob-patterns-and-configuration-file)
  - [Example configuration file](#example-configuration-file)
  - [Default globs](#default-globs)
    - [Common extra inclusions](#common-extra-inclusions)
    - [Common extra exclusions](#common-extra-exclusions)
- [Programmatic usage](#programmatic-usage)

</details>

## Installation

```bash
npm install --save-dev clean-modules
```

Project installation is optional. You can also install it globally, or run it directly via `npx clean-modules` or equivalent.

## Quick start

Run it in your project root:

```bash
npx clean-modules
```

Accept the confirmation prompt, and you'll see output like:

```
clean-modules

Cleaning up node_modules...
Done in 1.15s!

Results:
- size reduced: 314.4 MB
- files matched: 25741
- files removed: 25741
- empty dirs removed: 1361
```

_To include/exclude extra files or set other options, see the [clean command docs](#clean-modules-clean) below._

## Commands

### `clean-modules [clean]`

**Default command.** Cleans up your `node_modules` based on a set of _likely_ safe glob
patterns.

```bash
clean-modules [options] [globs...]
# or
clean-modules clean [options] [globs...]
```

#### Positionals

Glob patterns can be passed as positional arguments to include or exclude extra files. See the [Glob patterns](#glob-patterns-and-configuration-file) section for how the globs are
parsed.

```bash
# include all .d.ts files and @types folders
clean-modules "*.d.ts" "**/@types/**"

# exclude all sourcemap files and PNG files
clean-modules "!*.map.js" "!*.png"

# include .d.ts files but exclude PNG files
clean-modules "*.d.ts" "!*.png"
```

#### Options

| Flag                       | Description                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| `--directory <path>`, `-D` | Path to your `node_modules` directory.<br/>_Default: `./node_modules`_ |
| `--glob-file <path>`, `-f` | Path to a file with custom globs.<br/>_Default: `./.cleanmodules`_     |
| `--no-defaults`, `-n`      | Skip the default globs, use only globs explicitly set by you.          |
| `--keep-empty`, `-k`       | Skip removing empty folders after removing files.                      |
| `--yes`, `-y`              | Skip the confirmation prompt at the start.                             |
| `--dry-run`, `-d`          | Run without actually removing any files, just the final summary.       |
| `--silent`, `-s`           | Suppress all console output.                                           |
| `--json`, `-j`             | Only output a single JSON summary at the end.                          |
| `--fail-on-error`, `-e`    | Exit with a non-zero status code if any files failed.                  |
| `--help`, `-h`             | Show help.                                                             |
| `--version`, `-v`          | Show version.                                                          |

### `clean-modules analyze`

Compiles a list of all files that would be marked for cleaning and gives a breakdown of:

- Exact file path.
- What glob pattern(s) included it.
- How the patterns were parsed and passed to `picomatch`.
- Whether the file was included by default.

```bash
clean-modules analyze [options] [globs...]
```

Because of the amount of data it can be useful to pipe it somewhere:

```bash
clean-modules analyze > clean-modules-result.json
```

#### Positionals

Accepts the same positional globs as the [default clean command](#positionals).

#### Options

| Flag                       | Description                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| `--directory <path>`, `-D` | Path to your `node_modules` directory.<br/>_Default: `./node_modules`_ |
| `--glob-file <path>`, `-f` | Path to a file with custom globs.<br/>_Default: `./.cleanmodules`_     |
| `--no-defaults`, `-n`      | Skip the default globs, use only globs explicitly set by you.          |
| `--help`, `-h`             | Show help.                                                             |
| `--version`, `-v`          | Show version.                                                          |

## Glob patterns and configuration file

Custom globs can be provided to clean-modules in two ways:

- Via a configuration file (`.cleanmodules` by default, can be changed via `--glob-file`).
- As positional CLI arguments.

Both approaches accept the same .gitignore-like syntax, which is later converted to optimized [`picomatch`](https://github.com/micromatch/picomatch) compatible globs under the hood.

**Differences from regular gitignore syntax:**

- Casing is ignored.
- To include a directory the pattern _must_ end with `/`, `/*` or `/**`. This is to prevent
  directories matching common file names from being included by the globs.
- Extended glob matching is supported ([extglobs](https://www.gnu.org/software/bash/manual/html_node/Pattern-Matching.html)).

### Example configuration file

```sh
# to include directories, end patterns with / or /* or /**
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
consists of a large list of the most common files that are safe to remove.

That said, it's impossible to guarantee that all redundant files are removed (or that no removed
files are needed), and you might need to add custom exclusions depending on what packages you use.

#### Common extra inclusions

- `**/*.d.ts`: **If you don't use TypeScript.** TypeScript declaration files take up a lot of space
  in your `node_modules` folder, but they are most likely required to build your application. Useful
  locally even if you don't use TypeScript since they can be parsed by your IDE.

#### Common extra exclusions

- `!**/*.map.js`: **If you are running `clean-modules` locally or need source files in production.**
  Sourcemap files are removed by default since they take up a lot of space and don't
  break builds when removed. They can be nice to have though, especially while developing.

- `!*.{jpg,jpeg,png,gif,webp}`: **If you are using dependencies that provide image files.**
  Images and media files are removed by default since they take up a lot of space and are usually not
  included in libraries, but some dependencies might use them at runtime.

## Programmatic usage

```ts
import { analyze, clean } from 'clean-modules';

// analyze, all options are optional
const analyzeResult = await analyze({
  directory: '/path/to/node_modules',
  globFile: '/path/to/.cleanmodules',
  globs: ['**/*.d.ts'],
  noDefaults: false,
});

// clean, all options are optional
const cleanResult = await clean({
  directory: '/path/to/node_modules',
  globFile: '/path/to/.cleanmodules',
  globs: ['**/*.d.ts'],
  noDefaults: false,
  keepEmpty: false,
  dryRun: false,
});
```

Both functions return a result object that mirrors the JSON output of the corresponding CLI command:

- `clean` resolves to `{ files, removedFilesCount, reducedSize, removedEmptyDirs, failures }`.
- `analyze` resolves to `{ files, failures }`.

`failures` is a list of non-fatal filesystem errors encountered while crawling or removing files
(e.g. permission errors).
