import isServer from 'multiverse/is-server-side'

export function getEnv(loud=false) {
    const env = {
        NODE_ENV: process.env.NODE_ENV || process.env.BABEL_ENV || process.env.APP_ENV || 'unknown',
        DUMMY_DB_PATH: (process.env.MONGODB_URI || '').toString(),
    };

    if(loud && env.NODE_ENV == 'development') {
        /* eslint-disable-next-line no-console */
        console.info(env);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if(env.NODE_ENV == 'unknown' || isServer() && env.DUMMY_DB_PATH === '')
        throw new Error('illegal environment detected, check environment variables');

    return env;
}
