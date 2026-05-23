# clean-modules

## 4.0.0

### Major Changes

- **BREAKING** `analyze()` now returns `{ files, failures }` instead of an array of per-file results. _[`bc65618`](https://github.com/duniul/clean-modules/commit/bc65618725939650805dbee32a1845856a5360c6) [@duniul](https://github.com/duniul)_
- **BREAKING** Package is now ESM only. CLI usage works the same as before, but breaks CJS usage of the programmatic API. _[`ac6de03`](https://github.com/duniul/clean-modules/commit/ac6de030f64469d64916c7b64fbff5b81721c047) [@duniul](https://github.com/duniul)_
- **BREAKING** Minimum supported Node version is now v22. _[`6fd8cde`](https://github.com/duniul/clean-modules/commit/6fd8cde1fe1db521062afb0f3c6ffec4a63e6cca) [@duniul](https://github.com/duniul)_

### Minor Changes

- Update `picomatch` dependency to v4. _[`00c3cd6`](https://github.com/duniul/clean-modules/commit/00c3cd60a0dd4072d40aedf0ad52e46b50f1ebdf) [@duniul](https://github.com/duniul)_
- Surface non-fatal filesystem failures instead of swallowing them silently. _[`bc65618`](https://github.com/duniul/clean-modules/commit/bc65618725939650805dbee32a1845856a5360c6) [@duniul](https://github.com/duniul)_
- Add new `--fail-on-error` flag which exits with a non-zero status code when any failure is recorded. Exit code stays `0` by default, matching prior behavior. _[`bc65618`](https://github.com/duniul/clean-modules/commit/bc65618725939650805dbee32a1845856a5360c6) [@duniul](https://github.com/duniul)_

### Patch Changes

- Remove potentially unsafe `doc/` and `docs/` from default patterns. _[`293e149`](https://github.com/duniul/clean-modules/commit/293e1492305175e4f2ed54f434d78dc3be4c1d30) [@duniul](https://github.com/duniul)_
- Remove `pretty-bytes`, `pretty-ms`, `supports-color`, and `clipanion` dependencies. _[`d428e34`](https://github.com/duniul/clean-modules/commit/d428e34f2f758c4ee1e18a93a923c7cc0997cd00) [`61b97e7`](https://github.com/duniul/clean-modules/commit/61b97e7d96e124c641f9c16a0e84f7deb86bbfd2) [`dfb87bc`](https://github.com/duniul/clean-modules/commit/dfb87bcea37ae6916ac2404dcaf73e13583d058b) [@duniul](https://github.com/duniul)_
- Replace `clipanion` with Node's built-in `parseArgs` for CLI args parsing. _[`61b97e7`](https://github.com/duniul/clean-modules/commit/61b97e7d96e124c641f9c16a0e84f7deb86bbfd2) [`dfb87bc`](https://github.com/duniul/clean-modules/commit/dfb87bcea37ae6916ac2404dcaf73e13583d058b) [@duniul](https://github.com/duniul)_
- Clearly indicate which steps were skipped in `--dry-run` output. _[`c3bd4b2`](https://github.com/duniul/clean-modules/commit/c3bd4b21bdbd5ba8a311994a05109da8e6808f10) [@duniul](https://github.com/duniul)_
- Set `"sideEffects": false` in package.json. _[`f67c2c9`](https://github.com/duniul/clean-modules/commit/f67c2c9fe7b3b4e461b2ea38823f439e4cba5e8e) [@duniul](https://github.com/duniul)_
- Fix `repository` definition in package.json. _[`47b01ae`](https://github.com/duniul/clean-modules/commit/47b01ae18030e89ea4d6af90bb9020c0556dbf69) [@duniul](https://github.com/duniul)_
- Fix the default hint shown for the `--directory` option. _[`b44d0ef`](https://github.com/duniul/clean-modules/commit/b44d0effe6679f8be0b74f145ffaa6b275df328d) [@duniul](https://github.com/duniul)_
- Fix globs not starting with `/` being incorrectly prefixed with an extra `**`. _[`34a3b27`](https://github.com/duniul/clean-modules/commit/34a3b278ded6b9f87a923e6a761295bc4f1356ec) [@duniul](https://github.com/duniul)_
- Ensure `--keep-empty` is respected by `clean` command. _[`695f83e`](https://github.com/duniul/clean-modules/commit/695f83eda9921a23e886040329f0e546e2df6c36) [@duniul](https://github.com/duniul)_
- Skip confirmation prompt in CI/without TTY, require --yes or -y. _[`b0a1838`](https://github.com/duniul/clean-modules/commit/b0a183847f98cab08d3da6c3742c1ef114d0214a) [@duniul](https://github.com/duniul)_
- Avoid parsing default globs twice in `analyze`. _[`6f878df`](https://github.com/duniul/clean-modules/commit/6f878df7290afdc5abd5e2a784de51582d912e5b) [@duniul](https://github.com/duniul)_
- Avoid redundant `readdir` calls when removing empty parent directories. _[`540c372`](https://github.com/duniul/clean-modules/commit/540c37287b97ada49f7ce3eb1dc72b438ca3178f) [@duniul](https://github.com/duniul)_
- Update minor dependency versions. _[`7491637`](https://github.com/duniul/clean-modules/commit/749163777904a4e09f88bf4eb09adae05dbd8234) [@duniul](https://github.com/duniul)_
- Update the default file patterns. _[`9ab2ba3`](https://github.com/duniul/clean-modules/commit/9ab2ba39e384fbf9a9db5d862bf01734afe680e1) [@duniul](https://github.com/duniul)_

## 3.1.1

### Patch Changes

- Respect `directory` option in `analyze` command. _[`529502e`](https://github.com/duniul/clean-modules/commit/529502e1de3da64b87dd40f631b0abd6f91879b7) [@duniul](https://github.com/duniul)_

## 3.1.0

### Minor Changes

- Add default patterns for GitHub Pages, JetBrains, airtap, husky, bmp, release-it, Windows, and GNU COPYING. _[`#35`](https://github.com/duniul/clean-modules/pull/35) [`89fcb28`](https://github.com/duniul/clean-modules/commit/89fcb2862ab07bbd52cded0288b3bf694a974238) [@sdavids](https://github.com/sdavids)_

### Patch Changes

- Include up to 2 fraction digits when reporting reduced size. _[`89dd555`](https://github.com/duniul/clean-modules/commit/89dd5554b44e8229ba8be7d6a2472d4c14bd9c02) [@duniul](https://github.com/duniul)_

## 3.0.5

### Patch Changes

- Add `adoc` to the AsciiDoc glob in `.cleanmodules-default`. _[`#32`](https://github.com/duniul/clean-modules/pull/32) [`e0b0239`](https://github.com/duniul/clean-modules/commit/e0b0239ea1fbddde9382ead635716a8d2253a41b) [@sdavids](https://github.com/sdavids)_
- Add glob for OSSMETADATA to `.cleanmodules-default`. _[`#30`](https://github.com/duniul/clean-modules/pull/30) [`cf70c0b`](https://github.com/duniul/clean-modules/commit/cf70c0b326320078a08d91a98a9f4216100477c4) [@sdavids](https://github.com/sdavids)_
- Add glob for new ESLint config files to `.cleanmodules-default`. _[`#28`](https://github.com/duniul/clean-modules/pull/28) [`680825a`](https://github.com/duniul/clean-modules/commit/680825ae8b554bc047627c51c032e01990f4b9f6) [@sdavids](https://github.com/sdavids)_

## 3.0.4

### Patch Changes

- Add `.stylelintrc*(.*)` to `.cleanmodules-default`. _[`#24`](https://github.com/duniul/clean-modules/pull/24) [`31fb7eb`](https://github.com/duniul/clean-modules/commit/31fb7eb5a2807a54888f60d1d704b1ef565d1d9d) [@SukkaW](https://github.com/SukkaW)_

## 3.0.3

### Patch Changes

- Fix `import.meta.url` not being transpiled to an equivalent value for CJS builds. _[`#22`](https://github.com/duniul/clean-modules/pull/22) [`efa65b5`](https://github.com/duniul/clean-modules/commit/efa65b5aa011053f57279eb9233c83331549e3f8) [@duniul](https://github.com/duniul)_

## 3.0.2

<sup>(includes 3.0.0 and 3.0.1, which were unpublished)</sup>

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

### Major changes

- **BREAKING** Node versions lower than 12 are no longer supported. _[`#5`](https://github.com/duniul/clean-modules/pull/5) [`d6c66f2`](https://github.com/duniul/clean-modules/commit/d6c66f2ab75ec03a573b848c396d74316fc085d6) [@duniul](https://github.com/duniul)_
- **BREAKING** A path to `node_modules` should now be supplied to the `--directory` option instead of a positional. _[`#5`](https://github.com/duniul/clean-modules/pull/5) [`6aa9d55`](https://github.com/duniul/clean-modules/commit/6aa9d556fe0fa42b70966c6e7788442dae7a3426) [@duniul](https://github.com/duniul)_
- **BREAKING** The `--analyze` option has been replaced by a separate command. _[`#5`](https://github.com/duniul/clean-modules/pull/5) [`6aa9d55`](https://github.com/duniul/clean-modules/commit/6aa9d556fe0fa42b70966c6e7788442dae7a3426) [@duniul](https://github.com/duniul)_

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
