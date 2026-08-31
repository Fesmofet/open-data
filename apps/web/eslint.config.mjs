import nextEslintPluginNext from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import baseConfig from '../../eslint.config.mjs';

export default [
  {
    plugins: {
      '@next/next': nextEslintPluginNext,
      'react-hooks': reactHooks,
    },
  },
  ...baseConfig,
  ...nx.configs['flat/react-typescript'],
  {
    ignores: ['.next/**/*'],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lucide-react',
              message:
                'Import icons from @/icons only. lucide-react is allowed in src/icons/packs/**.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXOpeningElement[name.name="svg"]',
          message:
            'Use @/icons instead of inline <svg>. Allowed: src/icons/**, line-chart-svg.tsx, star-rating.tsx, src/modules/map/**.',
        },
      ],
    },
  },
  {
    files: ['src/icons/**/*.ts', 'src/icons/**/*.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: [
      'src/modules/currency/presentation/components/line-chart-svg.tsx',
      'src/modules/object/presentation/components/star-rating.tsx',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['src/modules/map/**/*.ts', 'src/modules/map/**/*.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['src/icons/packs/**/*.ts', 'src/icons/packs/**/*.tsx'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
];
