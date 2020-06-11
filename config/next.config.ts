import withTMInitializer from 'next-transpile-modules'
import withBundleAnalyzer from '@next/bundle-analyzer'

import type { Configuration } from 'webpack'

// ? Not using ES6/TS import syntax here because dev-utils has special
// ? circumstances
// eslint-disable-next-line import/no-unresolved, @typescript-eslint/no-var-requires
require('./src/dev-utils').populateEnv();

const paths = {
    universe: `${__dirname}/src/`,
    multiverse: `${__dirname}/lib/`,
    // types/ is purposely excluded
    components: `${__dirname}/src/components/`,
    rbc: `${__dirname}/node_modules/react-bulma-components/src/components`
};

// ? Make Bulma work (it needs to be transpiled)
const withTM = withTMInitializer(['react-bulma-components']);

module.exports = () => {
    return withBundleAnalyzer({
        enabled: process.env.ANALYZE === 'true'
    })(withTM({
        // ? Renames the build dir "build" instead of ".next"
        distDir: 'build',

        sassOptions: {
            includePaths: [ require('path').join(__dirname, '/src') ]
        },

        // ? Webpack configuration
        // ! Note that the webpack configuration is executed twice: once
        // ! server-side and once client-side!
        webpack: (config: Configuration) => {
            // ? These are aliases that can be used during JS import calls
            // ! Note that you must also change these same aliases in tsconfig.json
            // ! Note that you must also change these same aliases in package.json (jest)
            config.resolve && (config.resolve.alias = {
                ...config.resolve.alias,
                universe: paths.universe,
                multiverse: paths.multiverse,
                // types/ is purposely excluded
                components: paths.components,
                rbc: paths.rbc,
            });

            return config;
        },

        // ? Select some environment variables defined in .env to push to the
        // ? client.
        // !! DO NOT PUT ANY SECRET ENVIRONMENT VARIABLES HERE !!
        env: {},

        // TODO: move these out of experimental when they're not experimental
        // TODO: anymore!
        experimental: {
            async rewrites() {
                return [
                    // {
                    //     source: '/x',
                    //     destination: '/y'
                    // }
                ];
            }
        }
    }));
};
