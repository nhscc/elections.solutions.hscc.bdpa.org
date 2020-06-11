// * Every now and then, take best practices from CRA
// * https://tinyurl.com/yakv4ggx

// ! This is pretty aggressive. It targets modern browsers only.
// ? For some projects, less aggressive targets will make much more
// ? sense!
const targets = 'Chrome >= 60, Safari >= 10.1, iOS >= 10.3, Firefox >= 54, Edge >= 15';
// ? Something like the following might be more appropriate:
//const targets = '>1% in US and not ie 11';

// ? Next.js-specific Babel settings
const nextBabelPreset = ['next/babel', {
    'preset-env': {
        targets: targets,

        // ? If users import all core-js they're probably not concerned with
        // ? bundle size. We shouldn't rely on magic to try and shrink it.
        useBuiltIns: false,

        // ? Do not transform modules to CJS
        // ! MUST BE FALSE (see: https://nextjs.org/docs/#customizing-babel-config)
        modules: false,

        // ? Exclude transforms that make all code slower
        exclude: ['transform-typeof-symbol'],
    },
    'class-properties': {
        // ? Justification: https://github.com/facebook/create-react-app/issues/4263
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

module.exports = {
    parserOpts: { strictMode: true },
    plugins: [
        '@babel/plugin-proposal-export-default-from',
        '@babel/plugin-proposal-numeric-separator',
        '@babel/plugin-proposal-throw-expressions',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-nullish-coalescing-operator',
        '@babel/plugin-proposal-json-strings',
        // * https://babeljs.io/blog/2018/09/17/decorators
        // ? We're using the legacy proposal b/c that's what TypeScript wants
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        '@babel/plugin-proposal-function-bind',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-transform-typescript',
    ],
    presets: [
        ['@babel/typescript', {
            allowDeclareFields: true
        }],
        ['@babel/preset-react']
    ],
    // ? Sub-keys under the "env" config key will augment the above
    // ? configuration depending on the value of NODE_ENV and friends. Default
    // ? is: development
    env: {
        // * Used by Vercel and manual deployments
        production: {
            // ? Source maps are handled by Next.js and Webpack
            presets: [nextBabelPreset]
        },
        // * Used by `npm run dev`; is also the default environment
        development: {
            // ? Source maps are handled by Next.js and Webpack
            presets: [nextBabelPreset]
        },
        // * Used by Jest
        test: {
            sourceMaps: 'both',
            presets: [
                ['@babel/preset-env', { targets: targets }],
                ['@babel/preset-react', { development: true }]
            ]
        },
        // * Used by `npm run generate` and `npm run regenerate`
        generator: {
            sourceMaps: 'inline',
            comments: false,
            presets: [
                ['@babel/preset-env', {
                    targets: {
                        node: true
                    }
                }]
            ]
        }
    }
};

// ? The "debug" environment copies the "development" environment, with a twist!
module.exports.env.debug = Object.assign({}, module.exports.env.development);
module.exports.env.debug.presets = [
    ...module.exports.env.debug.presets,
    ['@babel/preset-react', { development: true }],
];
