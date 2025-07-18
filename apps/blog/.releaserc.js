const path = require('path');

module.exports = {
  extends: 'semantic-release-monorepo',
  branches: ['main'],
  tagFormat: 'blog-v${version}',
  plugins: [
    ['@semantic-release/commit-analyzer', {
      preset: 'conventionalcommits',
      releaseRules: [
        { type: 'feat', scope: 'blog', release: 'minor' },
        { type: 'fix', scope: 'blog', release: 'patch' },
        { type: 'perf', scope: 'blog', release: 'patch' },
        { type: 'chore', scope: 'blog', release: false },
        { type: 'docs', scope: 'blog', release: false },
        { type: 'style', scope: 'blog', release: false },
        { type: 'refactor', scope: 'blog', release: 'patch' },
        { type: 'test', scope: 'blog', release: false },
        { breaking: true, release: 'major' }
      ],
      parserOpts: {
        noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES']
      }
    }],
    ['@semantic-release/release-notes-generator', {
      preset: 'conventionalcommits',
      presetConfig: {
        types: [
          { type: 'feat', section: 'Features' },
          { type: 'fix', section: 'Bug Fixes' },
          { type: 'perf', section: 'Performance Improvements' },
          { type: 'refactor', section: 'Code Refactoring' },
          { type: 'build', section: 'Build System' },
          { type: 'ci', section: 'Continuous Integration' }
        ]
      }
    }],
    ['@semantic-release/changelog', {
      changelogFile: 'CHANGELOG.md'
    }],
    ['@semantic-release/npm', {
      npmPublish: false
    }],
    ['@semantic-release/github', {
      assets: [
        { path: 'CHANGELOG.md', label: 'Changelog' }
      ]
    }],
    ['@semantic-release/git', {
      assets: ['package.json', 'CHANGELOG.md'],
      message: 'chore(blog): release ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
    }]
  ]
};