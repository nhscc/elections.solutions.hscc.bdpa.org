/* @flow */

const sourceMapPlugin = 'babel-plugin-source-map-support';
const sourceMapValue = 'inline';

// ? Next.js-specific Babel settings
const nextBabelPreset = ['next/babel', {
    'preset-env': {
        // ? By default, we want to be IE 9 compatible until React itself is
        // ? no longer works with IE 9
        //// targets: 'last 2 chrome versions',
        targets: {
            ie: 11,
        },

        // ? If users import all core-js they're probably not concerned with
        // ? bundle size. We shouldn't rely on magic to try and shrink it.
        useBuiltIns: false,

        // ? Do not transform modules to CJS
        // ! MUST BE FALSE (see: https://nextjs.org/docs/advanced-features/customizing-babel-config)
        modules: false,

        // ? Exclude transforms that make all code slower
        exclude: ['transform-typeof-symbol'],
    },
    'preset-react': {},
    'transform-runtime': {},
    'class-properties': {
        // ? Justification: https://tinyurl.com/yakv4ggx
        loose: true
    },
    'styled-jsx': {
        'plugins': [
            ['styled-jsx-plugin-sass', {
                "sassOptions": {
                    "includePaths": ["./src"],
                    "precision": 10
                }
            }]
        ]
    }
}];

// ? Transpile targets for jest tests
const jestTestTargets = 'last 2 chrome versions';

module.exports = {
    plugins: [
        '@babel/plugin-proposal-export-default-from',
        '@babel/plugin-proposal-numeric-separator',
        '@babel/plugin-proposal-throw-expressions',
        '@babel/plugin-proposal-nullish-coalescing-operator',
        '@babel/plugin-proposal-json-strings',
        // * https://babeljs.io/blog/2018/09/17/decorators
        ['@babel/plugin-proposal-decorators', { 'decoratorsBeforeExport': true }],
        '@babel/plugin-proposal-function-bind',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread'
    ],
    presets: [
        ['@babel/preset-flow'],
        ['@babel/preset-react']
    ],
    // ? Sub-keys under the "env" config key will augment the above
    // ? configuration depending on the value of NODE_ENV and friends. Default
    // ? is: development
    env: {
        production: {
            // ? Handled by Next.js and Webpack
            /* sourceMaps: sourceMapValue,
            plugins: [sourceMapPlugin], */
            presets: [nextBabelPreset]
        },
        test: {
            sourceMaps: sourceMapValue,
            plugins: [sourceMapPlugin],
            presets: [
                ['@babel/preset-env', { targets: jestTestTargets }],
                ['@babel/preset-react', { development: true }]
            ]
        },
        development: {
            // ? Handled by Next.js and Webpack
            /* sourceMaps: sourceMapValue,
            plugins: [sourceMapPlugin], */
            presets: [nextBabelPreset]
        },
        generator: {
            sourceMaps: sourceMapValue,
            plugins: [sourceMapPlugin],
            comments: false,
            presets: [
                ['@babel/preset-env', {
                    targets: {
                        node: true
                    }
                }]
            ]
        },
        debug: { /* defined elsewhere */ },
    }
};

// ? The "debug" environment copies the "development" environment, with a twist!
module.exports.env.debug = Object.assign({}, module.exports.env.development);
module.exports.env.debug.presets = [
    ...module.exports.env.debug.presets,
    ['@babel/preset-react', { development: true }],
];
