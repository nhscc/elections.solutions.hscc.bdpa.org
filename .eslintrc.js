const restrictedGlobals = require('confusing-browser-globals');

module.exports = {
    'parser': 'babel-eslint',
    'plugins': [
        'react',
        'react-hooks',
        'flowtype',
        //'jsx-a11y',
    ],
    'extends': [
        'eslint:recommended',
        'plugin:react/recommended',
        'react-app',
        'plugin:flowtype/recommended',
        //'plugin:jsx-a11y/recommended'
    ],
    'parserOptions': {
        'ecmaVersion': 8,
        'sourceType': 'module',
        'ecmaFeatures': {
            'impliedStrict': true,
            'experimentalObjectRestSpread': true,
            'jsx': true,
        }
    },
    'env': {
        'es6': true,
        'node': true,
        'jest': true,
        'browser': true,
        'webextensions': true,
    },
    'rules': {
        'flowtype/space-after-type-colon': 'off',
        'no-console': 'off',
        'no-unused-vars': 'warn',
        'no-restricted-globals': ['warn'].concat(restrictedGlobals),
        'react/prop-types': 'off',
        //'jsx-a11y/anchor-is-valid': 'off',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'no-useless-rename': 'off'
    }
};
