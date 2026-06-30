export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'design',
        'refactor',
        'test',
        'perf',
        'build',
        'ci',
        'chore',
        'rename',
        'remove',
        'init',
        'revert',
      ],
    ],
    'scope-enum': [2, 'always', ['web', 'native', 'docs', 'shared', 'config', 'repo', 'storybook']],
    'scope-empty': [0],
    'subject-case': [0],
  },
};
