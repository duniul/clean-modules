## [2.0.5](https://github.com/duniul/clean-modules/compare/v2.0.4...v2.0.5) (2022-07-01)


### Bug Fixes

* fix path issues on Windows ([6a7fb5c](https://github.com/duniul/clean-modules/commit/6a7fb5c015d9f1869fa8b016d63c8cd390a5e2a1))

## [2.0.4](https://github.com/duniul/clean-modules/compare/v2.0.3...v2.0.4) (2021-09-25)


### Bug Fixes

* remove custom help and version options in favor of yargs builtins ([0f5fa14](https://github.com/duniul/clean-modules/commit/0f5fa148b81a6bca1650430596ebc34779a4b126))

## [2.0.3](https://github.com/duniul/clean-modules/compare/v2.0.2...v2.0.3) (2021-09-04)


### Bug Fixes

* wrap globs with parantheses to prevent issues with scoped packages ([31b35c4](https://github.com/duniul/clean-modules/commit/31b35c4e7aa2bc7ffc76300bb9177c43f794940a))
* **defaults:** improve globs for files with optional file extensions ([a71a8e4](https://github.com/duniul/clean-modules/commit/a71a8e4ca29a35e74806267e379a85c2e5764721))
* **deps:** bump dependencies ([735bf95](https://github.com/duniul/clean-modules/commit/735bf9586bac7fab59f01170bf192090de274903))
* **exclude:** make files included by dir globs excludable ([6d4eceb](https://github.com/duniul/clean-modules/commit/6d4ecebe33034be2a2997ebb93d8c1cb012f363a))
* change --directory to expect a string ([#7](https://github.com/duniul/clean-modules/issues/7)) ([8e77f83](https://github.com/duniul/clean-modules/commit/8e77f830c5b523d47906f87c8e68a988e55f5cdf))

## [2.0.2](https://github.com/duniul/clean-modules/compare/v2.0.1...v2.0.2) (2021-05-31)


### Bug Fixes

* existing .cleanmodules file by default ([403045d](https://github.com/duniul/clean-modules/commit/403045d275c36f2c27f13646fdb45ed53902b01a))

## [2.0.1](https://github.com/duniul/clean-modules/compare/v2.0.0...v2.0.1) (2021-05-31)


### Bug Fixes

* include `.cleanmodules-default` file ([61decf7](https://github.com/duniul/clean-modules/commit/61decf7fd9b635f35daba10a58e7464c4db26b4a))

# [2.0.0](https://github.com/duniul/clean-modules/compare/v1.0.3...v2.0.0) (2021-05-31)


### Bug Fixes

* **deps:** bump dependencies ([6aa9d55](https://github.com/duniul/clean-modules/commit/6aa9d556fe0fa42b70966c6e7788442dae7a3426))
* don't fail on invalid file paths ([541ba1b](https://github.com/duniul/clean-modules/commit/541ba1b3ca033b90df414fdcf6cea5f655daf3ae))


### chore

* **node:** bump minimum Node version to Node 12 ([d6c66f2](https://github.com/duniul/clean-modules/commit/d6c66f2ab75ec03a573b848c396d74316fc085d6))


### Features

* add glob file support, make `analyze` a separate command ([43832f0](https://github.com/duniul/clean-modules/commit/43832f08582ef55f33c7ee481c949a267a8f8a1d))


### BREAKING CHANGES

* **node:** Node versions lower than 12 are no longer supported
* path to node_modules should now be supplied to the --directory option instead of a positional
* the --analyze option has been replaced by a separate command

## [1.0.4](https://github.com/duniul/clean-modules/compare/v1.0.3...v1.0.4) (2021-04-14)


### Bug Fixes

* **deps:** bump dependencies ([6aa9d55](https://github.com/duniul/clean-modules/commit/6aa9d556fe0fa42b70966c6e7788442dae7a3426))
* don't fail on invalid file paths ([541ba1b](https://github.com/duniul/clean-modules/commit/541ba1b3ca033b90df414fdcf6cea5f655daf3ae))

## [1.0.3](https://github.com/duniul/clean-modules/compare/v1.0.2...v1.0.3) (2020-12-09)


### Bug Fixes

* restrict license glob ([17bc9c0](https://github.com/duniul/clean-modules/commit/17bc9c029f8197a7cb4514fd11eef32023855243))

## [1.0.2](https://github.com/duniul/clean-modules/compare/v1.0.1...v1.0.2) (2020-12-09)


### Bug Fixes

* add correct bin link ([75283b3](https://github.com/duniul/clean-modules/commit/75283b3b0e5a42597e90209f60f85e83fc7429d7))

## [1.0.1](https://github.com/duniul/clean-modules/compare/v1.0.0...v1.0.1) (2020-12-07)


### Bug Fixes

* set engines to node >=10 ([75de40e](https://github.com/duniul/clean-modules/commit/75de40eca44847cefb269b2b36ce2f36b27a93ca))

# 1.0.0 (2020-12-07)


### Bug Fixes

* rename project to clean-modules ([71b356c](https://github.com/duniul/clean-modules/commit/71b356cda4f5587e5db526bcd7a82c9e575f2b4f))


### Features

* initial commit ([06e90d9](https://github.com/duniul/clean-modules/commit/06e90d944633dea3854b0a3f2571c0ebac874ad0))
