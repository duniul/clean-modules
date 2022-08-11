# clean-modules

## 2.0.6

### Patch Changes

- [`c823749`](https://github.com/duniul/clean-modules/commit/c823749f6b6023538ed326d556c7c0f7f4cc8e0c)
  Reduce `console` instead of `console.log` ([@duniul](https://github.com/duniul))

## 2.0.5

### Patch Changes

- [`6a7fb5c`](https://github.com/duniul/clean-modules/commit/6a7fb5c015d9f1869fa8b016d63c8cd390a5e2a1)
  Fix path issues on Windows. ([#14](https://github.com/duniul/clean-modules/pull/14),
  [@duniul](https://github.com/duniul))

## 2.0.4

### Patch Changes

- [`0f5fa14`](https://github.com/duniul/clean-modules/commit/0f5fa148b81a6bca1650430596ebc34779a4b126)
  Remove custom help and version options in favor of yargs builtins.
  ([#10](https://github.com/duniul/clean-modules/pull/10), [@duniul](https://github.com/duniul))

## 2.0.3

### Patch Changes

- [`31b35c4`](https://github.com/duniul/clean-modules/commit/31b35c4e7aa2bc7ffc76300bb9177c43f794940a)
  Wrap globs with parantheses to prevent issues with scoped packages.
  ([@duniul](https://github.com/duniul))
- [`a71a8e4`](https://github.com/duniul/clean-modules/commit/a71a8e4ca29a35e74806267e379a85c2e5764721)
  Improve globs for files with optional file extensions. ([@duniul](https://github.com/duniul))
- [`735bf95`](https://github.com/duniul/clean-modules/commit/735bf9586bac7fab59f01170bf192090de274903)
  Bump dependencies ([@duniul](https://github.com/duniul))
- [`6d4eceb`](https://github.com/duniul/clean-modules/commit/6d4ecebe33034be2a2997ebb93d8c1cb012f363a)
  Make files included by dir globs excludable. ([@duniul](https://github.com/duniul))
- [`8e77f83`](https://github.com/duniul/clean-modules/commit/8e77f830c5b523d47906f87c8e68a988e55f5cdf)
  Change `--directory` to expect a string. ([#7](https://github.com/duniul/clean-modules/pull/7),
  [@ImedAdel](https://github.com/ImedAdel))

## 2.0.2

### Patch Changes

- [`403045d`](https://github.com/duniul/clean-modules/commit/403045d275c36f2c27f13646fdb45ed53902b01a)
  Use existing `.cleanmodules` file by default. ([@duniul](https://github.com/duniul))

## 2.0.1

### Patch Changes

- [`61decf7`](https://github.com/duniul/clean-modules/commit/61decf7fd9b635f35daba10a58e7464c4db26b4a)
  Include `.cleanmodules-default` file. ([@duniul](https://github.com/duniul))

# 2.0.0

### BREAKING CHANGES

- [`d6c66f2`](https://github.com/duniul/clean-modules/commit/d6c66f2ab75ec03a573b848c396d74316fc085d6)
  Node versions lower than 12 are no longer supported.
  ([#5](https://github.com/duniul/clean-modules/pull/5), [@duniul](https://github.com/duniul))
- [`6aa9d55`](https://github.com/duniul/clean-modules/commit/6aa9d556fe0fa42b70966c6e7788442dae7a3426)
  A path to `node_modules` should now be supplied to the `--directory` option instead of a
  positional. ([#5](https://github.com/duniul/clean-modules/pull/5),
  [@duniul](https://github.com/duniul))
- [`6aa9d55`](https://github.com/duniul/clean-modules/commit/6aa9d556fe0fa42b70966c6e7788442dae7a3426)
  The `--analyze` option has been replaced by a separate command.
  ([#5](https://github.com/duniul/clean-modules/pull/5), [@duniul](https://github.com/duniul))

### Minor Changes

- [`43832f0`](https://github.com/duniul/clean-modules/commit/43832f08582ef55f33c7ee481c949a267a8f8a1d)
  Add glob file support. ([#5](https://github.com/duniul/clean-modules/pull/5),
  [@duniul](https://github.com/duniul))

## 1.0.4

### Patch Changes

- [`6aa9d55`](https://github.com/duniul/clean-modules/commit/6aa9d556fe0fa42b70966c6e7788442dae7a3426)
  Bump dependencies. ([@duniul](https://github.com/duniul))
- [`541ba1b`](https://github.com/duniul/clean-modules/commit/541ba1b3ca033b90df414fdcf6cea5f655daf3ae)
  Don't fail on invalid file paths. ([#2](https://github.com/duniul/clean-modules/pull/2),
  [@duniul](https://github.com/duniul))

## 1.0.3

### Patch Changes

- [`17bc9c0`](https://github.com/duniul/clean-modules/commit/17bc9c029f8197a7cb4514fd11eef32023855243)
  Restrict license glob. ([@duniul](https://github.com/duniul))

## 1.0.2

### Patch Changes

- [`75283b3`](https://github.com/duniul/clean-modules/commit/75283b3b0e5a42597e90209f60f85e83fc7429d7)
  Add correct bin link. ([@duniul](https://github.com/duniul))

## 1.0.1

### Patch Changes

- [`75de40e`](https://github.com/duniul/clean-modules/commit/75de40eca44847cefb269b2b36ce2f36b27a93ca)
  Set `engines` to Node >=10. ([@duniul](https://github.com/duniul))
