import type { UserConfig } from '@commitlint/types';
import { RuleConfigSeverity } from '@commitlint/types';

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      RuleConfigSeverity.Error,
      'always',
      ['feat', 'fix', 'doc', 'perf', 'refactor', 'style', 'test', 'chore', 'revert', 'delete'],
    ],
    'scope-enum': [
      RuleConfigSeverity.Error,
      'always',
      [
        'dispatcher',
        'metadata',
        'decorators',
        'types',
        'validator',
        'formatter',
        'parameter',
        'validation',
        'middleware',
        'util',
        // Changes that affect the build system or external dependencies.
        'build',
        // config: Changes to prettier, lint, github actions, husky, lint-staged ...
        'config',
        // doc: Changes to documentation.
        'doc',
        // deps: Updates to dependencies.
        'deps',
        // e2e-tests, unit, integration: Changes to all tests
        'tests',
      ],
    ],
    'scope-empty': [RuleConfigSeverity.Error, 'never'],
    'subject-empty': [RuleConfigSeverity.Error, 'never'],
  },
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
};

export default Configuration;
