// ? To regenerate this file (i.e. if you changed it and want your changes to
// ? be permanent), call `npm run regenerate` afterwards

// ! Be sure that tasks expected to run on npm install (marked @dependent) have
// ! all required packages listed under "dependencies" instead of
// ! "devDependencies" in this project's package.json

import { relative as rel, basename } from 'path'
import { transformSync as babel } from '@babel/core'
import gulp from 'gulp'
import tap from 'gulp-tap'
import log from 'fancy-log'

// ? Not using ES6/TS import syntax here because dev-utils has special
// ? circumstances
// eslint-disable-next-line import/no-unresolved, @typescript-eslint/no-var-requires
const { populateEnv } = require('./src/dev-utils');

const regenTargets = [
    `config/*.[jt]s`
];

// * CHECKENV

export const checkEnv = async () => populateEnv();

checkEnv.description = `Throws an error if any expected environment variables are not properly set `
    + `(see expectedEnvVariables key in package.json)`;

// * REGENERATE

// ? If you change this function, run `npm run regenerate` twice: once to
// ? compile this new function and once again to compile itself with the newly
// ? compiled logic. If there is an error that prevents regeneration, you can
// ? run `npm run generate` then `npm run regenerate` instead.
export const regenerate = () => {
    populateEnv();

    log(`Regenerating targets: "${regenTargets.join('" "')}"`);

    process.env.BABEL_ENV = 'generator';

    return gulp.src(regenTargets)
        .pipe(tap(file => {
            file.contents = file.contents && Buffer.from(babel(file.contents.toString('utf8'), {
                filename: file.path,
                sourceFileName: rel(__dirname, file.path)
            })?.code || '');

            const name = basename(file.basename, '.ts');
            file.basename = name == file.basename ? name : `${name}.js`;
        }))
        .pipe(gulp.dest('.'));
};

regenerate.description = 'Invokes babel on the files in config, transpiling them into their project root versions';
