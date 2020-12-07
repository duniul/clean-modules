import { makeGlobber } from './utils/glob';

export const DEFAULT_DIRS = [
  // test
  '__tests__',
  'test',
  'tests',
  'powered-test',

  // docs
  'docs',
  'doc',

  // IDE
  '.idea',
  '.vscode',

  // examples
  'example',
  'examples',

  // code coverage
  'coverage',
  '.nyc_output',
  '.nycrc',

  // CI/CD
  '.circleci',
  '.github',

  // git
  '.git',

  // other
  'website',
];

export const DEFAULT_FILES = [
  /*
   * EXTENSIONS
   */

  // tests
  '*.test.*',

  // source maps
  '*.map',

  // docs/text
  '*.@(md|mkd|markdown|mdown)',
  '*.mustache',
  '*.asciidoc',
  '*.DOCS',

  // compiled
  '!(*.d).ts', // don't remove declaration files
  '*.coffee',

  // compressed
  '*.zip',
  '*.7z',
  '*.rar',
  '*.tar',
  '*.tgz',

  // images
  '*.@(jpg|jpeg)',
  '*.png',
  '*.gif',

  // compiled
  '*.h',
  '*.c',
  '*.hpp',
  '*.cpp',
  '*.o',
  '*.mk',

  // other
  '*.log',
  '*.tlog',
  '*.patch',
  '*.sln',
  '*.pdb',
  '*.jst',
  '*.swp',
  '*.lock',
  '*.vcxproj*',

  /*
    SPECIFIC FILES
  */

  // build scripts/files
  'makefile*',
  'gemfile*',
  'gulpfile*',
  'gruntfile*',
  'rakefile*',

  // CI/CD
  'Jenkinsfile',
  '.travis.yml',
  '.gitlab-ci.yml',
  '.appveyor.yml',
  'circle.yml',

  // Mac OS
  '.DS_Store',

  // linters
  '.eslintrc*',
  '.stylelintrc*',
  'stylelint.config.js',
  '.htmllintrc*',
  'htmllint.js',
  '.jshintrc*',
  '.lint',
  'tslint.json',

  // prettier
  '.prettierrc*',
  'prettier.config.js',

  // testing
  'test.js',
  'jest.config.js',
  'karma.conf.js',
  'wallaby.js',
  'wallaby.conf.js',
  '.coveralls.yml',

  // docs
  'readme*',
  'changelog*',
  'changes*',
  'authors*',
  'contributors*',
  'contributing*',
  'notice*',

  // licenses
  'license*',
  'licence*',

  // typescript
  'tsconfig.json',
  '.tsbuildinfo',

  // npm
  '.npmrc',

  // ignore files
  '.*ignore',

  // yarn
  'yarn.lock',
  '.yarnclean',
  '.yarn-metadata.json',

  // git
  '.gitmodules',
  '.gitattributes',

  // misc configs
  '.babelrc',
  '.editorconfig',
  '.tern-project',
  '.flowconfig',
  '.documentup.json',
  '.yo-rc.json',
  '_config.yml',
  'bower.json',
  '.vimrc*',

  // other
  'binding.gyp',
  'component.json',
  'composer.json',

  '.jamignore',
  '.jscsrc',
  '*.todo',
  '*.md',
  '*.markdown',
  'contributors',
  '*.orig',
  '*.rej',
  '.zuul.yml',
  '.editorconfig',
  '.npmrc',
  '.jshintignore',
  '.eslintignore',
  '.lint',
  '.lintignore',
  'cakefile',
  '.istanbul.yml',
];

// To save time, wrap globs into one instead of passing as string array.
function wrapGlobs(globs: string[]) {
  return '**/@(' + globs.join('|') + ')';
}

export const DEFAULT_DIRS_GLOB = wrapGlobs(DEFAULT_DIRS);
export const DEFAULT_FILES_GLOB = wrapGlobs(DEFAULT_FILES);

export const isDefaultDir = makeGlobber(DEFAULT_DIRS_GLOB);
export const isDefaultFile = makeGlobber(DEFAULT_FILES_GLOB);
