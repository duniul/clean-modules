# clean-modules

## 3.0.0

### Major Changes

- **BREAKING** Replace `-i,--include` and `-e,--exclude` with globs passed as positional arguments. This makes them consistent with the glob file patterns. _[`de47cf2`](https://github.com/duniul/clean-modules/commit/de47cf22adb5a44507a0dde1caa763fd98c16eba) [@duniul](https://github.com/duniul)_

  To migrate, move included and excluded globs to the end of the command, and prefix any exclusion globs with `!`.

  ```sh
  # before
  clean-modules --include "foo" "bar" --exclude "baz" "qux"

  # after
  clean-modules "foo" "bar" "!baz" "!qux"
  ```

- **BREAKING** Replace old programmatic API with one that better correspond to the CLI commands. See the README for information on how to import them. _[`6c8dfff`](https://github.com/duniul/clean-modules/commit/6c8dfff6f151d56a661a7759d36e35162889afad) [@duniul](https://github.com/duniul)_
- **BREAKING** Drop support for Node 12, require Node >= 14. _[`0ebf930`](https://github.com/duniul/clean-modules/commit/0ebf9307371cbd6d4a966139f020a8d1a9e0d0a1) [@duniul](https://github.com/duniul)_

### Patch Changes

- Replace `yargs` with `clipanion` for CLI parsing. _[`de47cf2`](https://github.com/duniul/clean-modules/commit/de47cf22adb5a44507a0dde1caa763fd98c16eba) [@duniul](https://github.com/duniul)_
- Don't remove `tsconfig.json` files by default, as they can be shared. _[`17603eb`](https://github.com/duniul/clean-modules/commit/17603ebcdd9d27d46abdce4805e8dfbe0deae3ae) [@duniul](https://github.com/duniul)_
- Update `pretty-bytes`, `pretty-ms` and `supports-color`. _[`e198b46`](https://github.com/duniul/clean-modules/commit/e198b468174afa9b72fe160a553a659bfe255bf0) [@duniul](https://github.com/duniul)_
- Remove `arg` as a runtime dependency. _[`95b0dcf`](https://github.com/duniul/clean-modules/commit/95b0dcf0693b6c14635497c866d717ae89820299) [@duniul](https://github.com/duniul)_
- Try to avoid test util files when cleaning up test files. _[`cf7ede5`](https://github.com/duniul/clean-modules/commit/cf7ede5037e865851afff1e3b22502e5fb165fca) [@duniul](https://github.com/duniul)_
- Fix issue where `--glob-file` could be passed as an array, causing a crash. _[`de47cf2`](https://github.com/duniul/clean-modules/commit/de47cf22adb5a44507a0dde1caa763fd98c16eba) [@duniul](https://github.com/duniul)_

<details><summary>Updated 0 dependencies</summary>

<small>

</small>

</details>

## 2.0.6

### Patch Changes

- Reduce `console` instead of `console.log` _[`#16`](https://github.com/duniul/clean-modules/pull/16) [`a0077d5`](https://github.com/duniul/clean-modules/commit/a0077d579b17650b284c4a5bc4f452e66356a423) [@Miikis](https://github.com/Miikis)_

## 2.0.5

### Patch Changes

- Fix path issues on Windows. _[`#14`](https://github.com/duniul/clean-modules/pull/14) [`6a7fb5c`](https://github.com/duniul/clean-modules/commit/6a7fb5c015d9f1869fa8b016d63c8cd390a5e2a1) [@duniul](https://github.com/duniul)_

## 2.0.4

### Patch Changes

- Remove custom help and version options in favor of yargs builtins. _[`#10`](https://github.com/duniul/clean-modules/pull/10) [`0f5fa14`](https://github.com/duniul/clean-modules/commit/0f5fa148b81a6bca1650430596ebc34779a4b126) [@duniul](https://github.com/duniul)_

## 2.0.3

### Patch Changes

- Wrap globs with parantheses to prevent issues with scoped packages. _[`31b35c4`](https://github.com/duniul/clean-modules/commit/31b35c4e7aa2bc7ffc76300bb9177c43f794940a) [@duniul](https://github.com/duniul)_
- Improve globs for files with optional file extensions. _[`a71a8e4`](https://github.com/duniul/clean-modules/commit/a71a8e4ca29a35e74806267e379a85c2e5764721) [@duniul](https://github.com/duniul)_
- Bump dependencies _[`735bf95`](https://github.com/duniul/clean-modules/commit/735bf9586bac7fab59f01170bf192090de274903) [@duniul](https://github.com/duniul)_
- Make files included by dir globs excludable. _[`6d4eceb`](https://github.com/duniul/clean-modules/commit/6d4ecebe33034be2a2997ebb93d8c1cb012f363a) [@duniul](https://github.com/duniul)_
- Change `--directory` to expect a string. _[`#7`](https://github.com/duniul/clean-modules/pull/7) [`8e77f83`](https://github.com/duniul/clean-modules/commit/8e77f830c5b523d47906f87c8e68a988e55f5cdf) [@ImedAdel](https://github.com/ImedAdel)_

## 2.0.2

### Patch Changes

- Use existing `.cleanmodules` file by default. _[`403045d`](https://github.com/duniul/clean-modules/commit/403045d275c36f2c27f13646fdb45ed53902b01a) [@duniul](https://github.com/duniul)_

## 2.0.1

### Patch Changes

- Include `.cleanmodules-default` file. _[`61decf7`](https://github.com/duniul/clean-modules/commit/61decf7fd9b635f35daba10a58e7464c4db26b4a) [@duniul](https://github.com/duniul)_

# 2.0.0

### BREAKING CHANGES

- Node versions lower than 12 are no longer supported. _[`#5`](https://github.com/duniul/clean-modules/pull/5) [`d6c66f2`](https://github.com/duniul/clean-modules/commit/d6c66f2ab75ec03a573b848c396d74316fc085d6) [@duniul](https://github.com/duniul)_
- A path to `node_modules` should now be supplied to the `--directory` option instead of a positional. _[`#5`](https://github.com/duniul/clean-modules/pull/5) [`6aa9d55`](https://github.com/duniul/clean-modules/commit/6aa9d556fe0fa42b70966c6e7788442dae7a3426) [@duniul](https://github.com/duniul)_
- The `--analyze` option has been replaced by a separate command. _[`#5`](https://github.com/duniul/clean-modules/pull/5) [`6aa9d55`](https://github.com/duniul/clean-modules/commit/6aa9d556fe0fa42b70966c6e7788442dae7a3426) [@duniul](https://github.com/duniul)_

### Minor Changes

- Add glob file support. _[`#5`](https://github.com/duniul/clean-modules/pull/5) [`43832f0`](https://github.com/duniul/clean-modules/commit/43832f08582ef55f33c7ee481c949a267a8f8a1d) [@duniul](https://github.com/duniul)_

## 1.0.4

### Patch Changes

- Bump dependencies. _[`6aa9d55`](https://github.com/duniul/clean-modules/commit/6aa9d556fe0fa42b70966c6e7788442dae7a3426) [@duniul](https://github.com/duniul)_
- Don't fail on invalid file paths. _[`#2`](https://github.com/duniul/clean-modules/pull/2) [`541ba1b`](https://github.com/duniul/clean-modules/commit/541ba1b3ca033b90df414fdcf6cea5f655daf3ae) [@duniul](https://github.com/duniul)_

## 1.0.3

### Patch Changes

- Restrict license glob. _[`17bc9c0`](https://github.com/duniul/clean-modules/commit/17bc9c029f8197a7cb4514fd11eef32023855243) [@duniul](https://github.com/duniul)_

## 1.0.2

### Patch Changes

- Add correct bin link. _[`75283b3`](https://github.com/duniul/clean-modules/commit/75283b3b0e5a42597e90209f60f85e83fc7429d7) [@duniul](https://github.com/duniul)_

## 1.0.1

### Patch Changes

- Set `engines` to Node >=10. _[`75de40e`](https://github.com/duniul/clean-modules/commit/75de40eca44847cefb269b2b36ce2f36b27a93ca) [@duniul](https://github.com/duniul)_
