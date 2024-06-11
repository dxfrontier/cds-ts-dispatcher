import type { UserConfig } from '@commitlint/types';
import { RuleConfigSeverity } from '@commitlint/types';

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [RuleConfigSeverity.Error, 'always', ['feat', 'chore', 'fix', 'test', 'style', 'refactor']],
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
        // docs: Changes to documentation.
        'docs',
        // deps: Updates to dependencies.
        'deps',
        // e2e-tests, unit, integration: Changes to all tests
        'tests',
        'other-functionality',
      ],
    ],
    'scope-empty': [RuleConfigSeverity.Error, 'never'],
    'subject-empty': [RuleConfigSeverity.Error, 'never'],
  },
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
};

export default Configuration;
