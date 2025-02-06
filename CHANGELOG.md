# Changelog

All notable changes to this project will be documented in this file.

## [4.0.1] - 2025-02-06

### ⚙️ Miscellaneous Tasks

- *(release)* Updated CHANGELOG.md and bump version increased
- *(readme)* Updated

## [4.0.0] - 2025-01-28

### 🐛 Bug Fixes

- *(request)* According to cds-types v9 `TypedRequest` was renamed to `Request`

### ⚙️ Miscellaneous Tasks

- *(release)* Updated CHANGELOG.md and bump version increased
- *(workflows)* Small modifications to release and tests
- *(test)* Updates tests after renaming `TypedRequest` to `Request`
- *(readme)* Changed `TypedRequest` to only `Request`
- *(workflow)* Commented unit testing

## [3.2.7] - 2025-01-14

### 🐛 Bug Fixes

- *(dispatcher)* Fixed `CDS_DISPATCHER.ALLENTITIES` due to cds `8.6.0`

### 🧪 Testing

- *(cds-typer)* Updated generated cds typed entities

### ⚙️ Miscellaneous Tasks

- *(release)* Updated CHANGELOG.md and bump version increased

## [3.2.6] - 2024-11-25

### ⚙️ Miscellaneous Tasks

- *(release)* Updated CHANGELOG.md and bump version increased
- *(readme)* Fixed deployment badge
- *(actions)* Renamed enforce-label and tests github actions for better visibility

## [3.2.5] - 2024-11-21

### ⚙️ Miscellaneous Tasks

- *(release)* Updated CHANGELOG.md and bump version increased
- *(readme)* Small changes to README.md
- *(readme)* Changed `build` shield to deployment.yml

## [3.2.4] - 2024-11-19

### 🚀 Features

- *(postinstall)* Regenerated postinstall scripts

### 🐛 Bug Fixes

- Updated "ActionReturn" type to be compatible with the latest version of "cds-typer"
- *(postinstall)* Fixed `postinstall` on `windows 10` by using the `cross-spawn` package
- *(github-actions)* Fixed actions after were refactored

### ⚙️ Miscellaneous Tasks

- *(deployment,release)* Refactored github actions for better visibility by moving some steps
- *(readme)* Small update to `last commit` shield
- *(test)* Extending tests for windows
- *(github-action)* Fixed the release github action after refactoring
- *(release)* Fixed create pull request of the release workflow

## [3.2.3] - 2024-11-14

### ⚙️ Miscellaneous Tasks

- *(tsdoc)* Removed unnecesary tsdoc from some properties and rearanged a bit some tsdocs
- *(readme)* Fixed the shield of the `last commit` by changing to `dev` branch
- Version bump to 3.2.3

## [3.2.2] - 2024-11-13

### 🚜 Refactor

- *(env)* Moved Verifier outside of postinstall folder, added esm and cjs to compilation of env
- *(tsup)* Added `cjs` and `esm` to compilation of postinstall

### ⚙️ Miscellaneous Tasks

- *(readme)* Readme updates
- *(eslint)* Added eslint to ignore
- *(gitignore)* Removed dispatcher form gitignore
- Version bump to 3.2.2

## [3.2.1] - 2024-11-12

### 🐛 Bug Fixes

- *(env)* Fixed `@Env` when project was `mbt build` for production ready

### ⚙️ Miscellaneous Tasks

- Version bump to 3.2.1

## [3.2.0] - 2024-11-12

### 🚀 Features

- *(env)* New `@Env` parameter decorator to fetch cds env directly into method parameter
- *(postinstall)* `npm install` will generate `@dispatcher` folder which contains env interfaces

### 🐛 Bug Fixes

- *(tests)* Fixed tests by adding a `npm run build` before testing the new `@Env` decorator
- *(tests)* Added `npm run build` before e2e tests
- *(test)* Excluded from ignore the `@dispatcher folder` for test

### ⚙️ Miscellaneous Tasks

- *(commitlint)* Removed mandatory scopes
- *(lint)* Added `dist` and `@dispatcher` folder to lint ignore
- *(test)* Test workflow now tests the newly `@Env` decorator on all platforms (windows,mac,linux)
- *(test)* Updated tests for the newly `@Env` decorator
- *(readme)* Updated readme with the usage of the new `@Env` decorator
- *(gitignore)* Updated .gitignore
- Version bump to 3.2.0
- *(tsup)* Split compilation into 2 parts, one for postinstall one for the library
- *(dist)* PostInstall will always be pushed to dist as is needed for `npm install` command
- *(gitignore)* Excluded from gitingore the `./dist/postinstall` as is needed when `npm install`
- *(tsconfig)* Excluded form compilation the `./dist/postinstall`

## [3.1.2] - 2024-11-05

### ⚙️ Miscellaneous Tasks

- *(tests)* Updated tests
- *(github)* Added linguist-vendored to be excluded from github stats the html files
- *(readme)* Updated readme
- Version bump to 3.1.2

## [3.1.1] - 2024-11-04

### 🚀 Features

- *(locale)* New `@Locale` decorator to get the locale in the parameter method
- *(validator)* `@Validate` now can behave like an `if-else` by catching the flags in the method

### 🐛 Bug Fixes

- *(gitattributes)* Fix gittattributes
- *(package)* Reverted back the deleted lint-staged
- *(readme)* Fixed readme anchors

### ⚙️ Miscellaneous Tasks

- *(gitattributes)* Added gitattribute to remove the lib/docs from the stats of githubc
- *(commitlint)* Removed mandatory scopes
- *(gitattributes)* Refactored to remove from that github stats html files
- Version bump to 3.1.0
- *(actions)* Refactored github actions to split the bump and release and deployment
- Version bump to 3.1.1

## [3.0.0] - 2024-08-21

### 🚀 Features

- *(dispatcher)* Added outboxed srv, changes to CDSDipatcher affected by migration of cds to v8

### 🚜 Refactor

- *(util)* Deprecated SRV in favor of CDS_DISPATCHER.SRV
- *(types)* Eslint v9 changes
- *(types)* Created custom Constructable type as sap deleted it in v8

### ⚙️ Miscellaneous Tasks

- *(config)* Migrated to ESLint v9
- *(config)* Commitlintrc, new type enums
- *(readme)* Readme updated
- *(config)* Removed deprecated husky sh
- *(build)* Dropped node 21 and changed cds-dk to latest
- *(e2e)* Generated cds-typer new entities
- *(e2e)* Cleanup testing files
- *(unit)* Updated unit tests due to migration of v8
- *(unit)* Cds-format has been used on this file
- *(e2e)* Fixed a date in a CSV which failed when deployed
- *(e2e)* Added 2 instead of cents for the minorUnit as deployed it failed
- *(e2e)* Updated newman tests
- *(build)* Dropped ubuntu-latest on the matrix of the tests
- Version bump to 3.0.0
- *(build)* Dropped unit tests as fails on github actions
- *(build)* Commented the needs of test-e2e

## [2.1.4] - 2024-07-18

### 📚 Documentation

- *(doc)* Readme updated

### ⚙️ Miscellaneous Tasks

- Version bump to 2.1.4

## [2.1.3] - 2024-07-16

### 📚 Documentation

- *(doc)* Readme updated
- *(doc)* Removed from README.md unused types

### 🧪 Testing

- *(tests)* Updated tests due to cds-typer version increase

### ⚙️ Miscellaneous Tasks

- *(build)* Added node version 21 and restricted cds-dk to 7.9.5
- Version bump to 2.1.3

## [2.1.2] - 2024-07-11

### 🐛 Bug Fixes

- *(config)* Fixed package.json script

### 📚 Documentation

- *(doc)* Created technical documentation

### ⚙️ Miscellaneous Tasks

- Version bump to 2.1.2

## [2.1.1] - 2024-07-10

### ⚙️ Miscellaneous Tasks

- *(config)* Commit lint type enum now follows cliff categories
- *(build)* Package will be deployed for testing internally on github npm
- *(config)* Fixing release workflow
- *(config)* Fixing release workflow
- *(config)* Prettier, eslint will not touch docs folder
- *(doc)* Added typedoc configs
- *(tests)* Tests updated to to increase of cds-typer version
- *(doc)* Added new typedoc/jsdoc description and changed some descriptions
- Version bump to 2.1.1

## [2.1.0] - 2024-06-19

### 🚀 Features

- *(decorators)* Added new events to the prepend decorator

### 🧪 Testing

- *(tests)* Updated tests after adding new prepend events

### ⚙️ Miscellaneous Tasks

- *(build)* Added create PR step in release workflow
- *(build)* Updated pull-requests to write
- *(doc)* Refactored AfterAll, BeforeAll and OnAll documentation
- Version bump to 2.1.0

## [2.0.26] - 2024-06-17

### 🧪 Testing

- *(tests)* Added allhandler.ts file to show example of usage of the overload for entityhandler

### ⚙️ Miscellaneous Tasks

- *(config)* Commitlint added to husky and lint-staged
- *(config)* Added .md files to prettier and release now uses conventional commits
- *(doc)* Small changes to documentation of the project
- Version bump to 2.0.23
- *(build)* Added create pull request to release.yml
- Version bump to 2.0.24
- *(build)* Changes to release.yml workflow
- Version bump to 2.0.25
- *(build)* Added initial version of to 2.0.24
- *(build)* Changes to name of the release
- Version bump to 2.0.25
- *(build)* Changes to release.yml
- Version bump to 2.0.26

## [2.0.22] - 2024-06-07

### ⚙️ Miscellaneous Tasks

- Readme updates.
- Version bump to 2.0.22

## [2.0.21] - 2024-06-05

### ⚙️ Miscellaneous Tasks

- Readme updates
- Version bump to 2.0.21

## [2.0.20] - 2024-06-04

### 🚀 Features

- Added new decorator `AfterReadEachInstance`

### ⚙️ Miscellaneous Tasks

- Version bump to 2.0.20

## [2.0.19] - 2024-06-03

### 🚀 Features

- Updated tests
- Added `@AfterAll`, `@BeforeAll`, `@OnAll` decorators to combine multiple decorators in only one go, new `@EntityHandler` overload decorator to support all entities

### ⚙️ Miscellaneous Tasks

- Bump versions
- Update readme
- Version bump to 2.0.19

## [2.0.18] - 2024-05-14

### ⚙️ Miscellaneous Tasks

- Version bump to 2.0.18

## [2.0.17] - 2024-05-14

### ⚙️ Miscellaneous Tasks

- Version bump to 2.0.17

## [2.0.16] - 2024-05-14

### ⚙️ Miscellaneous Tasks

- Version bump to 2.0.16

### Update

- Release.yml

## [2.0.15] - 2024-05-14

### ⚙️ Miscellaneous Tasks

- Version bump to 2.0.15

### Update

- Release workflow by adding to publish github npm the organizaiton

## [2.0.14] - 2024-05-14

### ⚙️ Miscellaneous Tasks

- Version bump to 2.0.14

### Update

- Added to `release workflow` the publish to github npm
- Readme added tip for cds typer

## [2.0.13] - 2024-05-07

### 🚀 Features

- New `@PrependDraft` decorator which can be used to catch the event before reaching the original event.

### ⚙️ Miscellaneous Tasks

- Version bump to 2.0.13

### Update

- Unit test & e2e tests for `@PrependDraft`
- Package versions
- Readme.md with `@PrependDraft`

## [2.0.12] - 2024-04-29

### 🚀 Features

- New @Prepend, @Res and @AfterReadSingleInstance decorators.

### ⚙️ Miscellaneous Tasks

- Changes to versions
- Version bump to 2.0.12

### Update

- Unit test & e2e tests
- Readme.md for @Prepend, @Res and @AfterReadSingleInstance

### Updated

- Tests

## [2.0.11] - 2024-04-19

### ⚙️ Miscellaneous Tasks

- Version bump to 2.0.11

### Update

- Readme

## [2.0.10] - 2024-04-18

### ⚙️ Miscellaneous Tasks

- Version bump to 2.0.10

### Update

- Readme.md

## [2.0.9] - 2024-04-17

### 🐛 Bug Fixes

- NextEvent now returns `Function` instead of `void`

### ⚙️ Miscellaneous Tasks

- Updated eslintignore
- Version bump to 2.0.9

### Update

- Tests

## [2.0.8] - 2024-04-17

### 🐛 Bug Fixes

- Package.version increased manually due to inconsistency between NPM version and github version.

### ⚙️ Miscellaneous Tasks

- Version bump to 2.0.8

## [2.0.7] - 2024-04-17

### 🐛 Bug Fixes

- `GetQueryType['columns']['forDelete'] was replaced by ['forSelect'] as delete does not has type columns

### ⚙️ Miscellaneous Tasks

- Version bump to 2.0.6

### Update

- E2e tests & unit tests

## [2.0.6] - 2024-04-17

### ⚙️ Miscellaneous Tasks

- Version bump to 2.0.5

### Update

- Readme

## [2.0.5] - 2024-04-16

### ⚙️ Miscellaneous Tasks

- Cleanup project
- Version bump to 2.0.4

## [2.0.4] - 2024-04-16

### ⚙️ Miscellaneous Tasks

- Version bump to 2.0.3

### Update

- Tests
- Clean up project and refactored `findRequest` method

## [2.0.3] - 2024-04-16

### Update

- README

## [2.0.2] - 2024-04-16

### 🐛 Bug Fixes

- ExecutionAllowedForRoles renamed to ExecutionAllowedForRole

### ⚙️ Miscellaneous Tasks

- Version bump to 2.0.2

## [2.0.1] - 2024-04-16

### 🐛 Bug Fixes

- FieldsFormatter now works as expected when parameter decorators are being used

### ⚙️ Miscellaneous Tasks

- Settings.json updates
- Update package-lock.json
- Version bump to 2.0.1

### Feautre

- New decorator `ExecutionAllowedForRoles` to allow execution of methods when user roles are being used

### Update

- Tests
- README

## [2.0.0] - 2024-04-15

### 🚀 Features

- New decorators added : `@Req` `@Results / @Result` `@Next` `@Error` `@IsPresent` `@IsRole` `@IsColumnSupplied` `@GetQueryProperty` `@GetRequestProperty` `@SingleInstanceSwitch`
- Final refactoring for new parameter decorators.

### ⚙️ Miscellaneous Tasks

- Deleted files
- Package.json changes to scrips.
- Moved files
- Updated devcontainer
- Jsdoc updated
- Version bump to 2.0.0

### Update

- Readme.md

### Upadte

- E2e tests

### Update

- Tests.yaml
- Unit tests
- Tests
- Readme.md
- Added connectivity sdk
- Prettierignore
- Types for GetQuery decorator
- Tests

### Updated

- .eslintrc
- Tests

## [1.1.2] - 2024-04-02

### 🚀 Features

- Added to formatter the following actions: 'camelCase', 'kebabCase' and 'snakeCasse'

### ⚙️ Miscellaneous Tasks

- Version bump to 1.1.2

## [1.1.1] - 2024-04-01

### 🚀 Features

- Added more actions to `@Validate` & `@FieldsFormatter`

### ⚙️ Miscellaneous Tasks

- Added launch.json and settings.json for `.vscode` folder.
- Added `.devcontainer` for easy development around team.
- Version bump to 1.1.1

### Update

- README
- Package.json versions

### Updated

- Tests

## [1.1.0] - 2024-03-28

### 🚀 Features

- New `@FieldsFormatter` decorator which can be used to format the fields based on predefined actions before reaching the callback. `@Validate` decorator can be used to validate fields based on on predefined actions.

### ⚙️ Miscellaneous Tasks

- Added `.vscode` predefined settings for inlay TS
- Version bump to 1.1.0

### Update

- Unit tests
- E2e tests for`@Validator` and `@FieldsFormatter`
- Added documentation for 2 new decorators `@FieldsFormatter` and `@Validate`
- Package.json versions increased.
- Files moved

## [1.0.6] - 2024-03-14

### ⚙️ Miscellaneous Tasks

- Version bump to 1.0.6

### Update

- Readme and workflow actions versions
- Readme.md

## [1.0.5] - 2024-03-08

### ⚙️ Miscellaneous Tasks

- Version bump to 1.0.5

### FIX

- Middleware next now is a Promise, it must be called with await next(), initially this was not a promise and caused issue when req.reject was used.

### Update

- Readme

## [1.0.4] - 2024-03-08

### ⚙️ Miscellaneous Tasks

- Version bump to 1.0.4

### Chore

- Updated versions

## [1.0.3] - 2024-02-22

### ⚙️ Miscellaneous Tasks

- Version bump to 1.0.3

### Update

- Readme

## [1.0.2] - 2024-02-14

### ⚙️ Miscellaneous Tasks

- Version bump to 1.0.2

### Update

- Next middleware now returns unknown.

## [1.0.1] - 2024-02-13

### ⚙️ Miscellaneous Tasks

- Version bump to 1.0.1

## [1.0.0] - 2024-01-30

### ⚙️ Miscellaneous Tasks

- Version bump to 1.0.0

### UPDATE

- README.md

## [0.1.25] - 2024-01-29

### ⚙️ Miscellaneous Tasks

- Version bump to 0.1.25

## [0.1.24] - 2024-01-22

### ⚙️ Miscellaneous Tasks

- Version bump to 0.1.24

## [0.1.23] - 2024-01-22

### ⚙️ Miscellaneous Tasks

- Version bump to 0.1.23

### Deleted

- Tests file

### Updated

- Tests due to fail on github of the unit tests

## [0.1.22] - 2024-01-18

### ⚙️ Miscellaneous Tasks

- Version bump to 0.1.22

## [0.1.21] - 2024-01-17

### ⚙️ Miscellaneous Tasks

- Version bump to 0.1.21

## [0.1.20] - 2024-01-16

### ⚙️ Miscellaneous Tasks

- Version bump to 0.1.20

## [0.1.19] - 2023-12-21

### ⚙️ Miscellaneous Tasks

- Version bump to 0.1.19

### Updated

- Tests, readme and development process updates

## [0.1.18] - 2023-12-18

### ⚙️ Miscellaneous Tasks

- Version bump to 0.1.18

### Updated

- Package.json versions

## [0.1.17] - 2023-12-15

### ⚙️ Miscellaneous Tasks

- Version bump to 0.1.17

## [0.1.16] - 2023-12-06

### ⚙️ Miscellaneous Tasks

- Version bump to 0.1.16

## [0.1.15] - 2023-12-05

### ⚙️ Miscellaneous Tasks

- Version bump to 0.1.15

## [0.1.14] - 2023-11-27

### ⚙️ Miscellaneous Tasks

- Version bump to 0.1.14

## [0.1.13] - 2023-11-14

### ⚙️ Miscellaneous Tasks

- Version bump to 0.1.13

<!-- generated by git-cliff -->
