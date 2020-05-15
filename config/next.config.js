/* @flow */

import withTMInitializer from 'next-transpile-modules'
import withBundleAnalyzer from '@next/bundle-analyzer'
import DotenvWebpackPlugin from 'dotenv-webpack'
import { populateEnv } from './src/dev-utils'

populateEnv();

const paths = {
    universe: `${__dirname}/src/`,
    multiverse: `${__dirname}/lib/`,
    components: `${__dirname}/src/components/`,
    rbc: `${__dirname}/node_modules/react-bulma-components/src/components`
};

// ? Make Bulma work (it needs to be transpiled)
const withTM = withTMInitializer(['react-bulma-components']);

module.exports = () => {
    return withBundleAnalyzer({
        enabled: process.env.ANALYZE === 'true'
    })(withTM({
        sassOptions: {
            includePaths: [ require('path').join(__dirname, '/src') ]
        },

        // ? Webpack configuration
        // ! Note that the webpack configuration is executed twice: once
        // ! server-side and once client-side!
        webpack: (config: Object, { isServer }: Object) => {
            // ? These are aliases that can be used during JS import calls
            // ! Note that you must also change these same aliases in .flowconfig
            // ! Note that you must also change these same aliases in package.json (jest)
            config.resolve.alias = Object.assign({}, config.resolve.alias, {
                universe: paths.universe,
                multiverse: paths.multiverse,
                components: paths.components,
                rbc: paths.rbc,
            });

            if(isServer) {
                // ? Add referenced environment variables defined in .env to bundle
                config.plugins.push(new DotenvWebpackPlugin());
            }

            else {
                // ? Stops Next from throwing a tantrum over server-side
                // ? modules depending on node's `fs` builtin
                config.node = {
                  fs: 'empty'
                }
            }

            return config;
        }
    }));
};
