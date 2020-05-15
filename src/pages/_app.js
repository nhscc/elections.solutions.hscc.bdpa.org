/* @flow */

import * as React from 'react'
import Head from 'next/head'

import 'universe/global.scss'

// ? This is the file where you should store app-wide data and make app-wide
// ? changes, like a shared layout. More details here:
// ? https://nextjs.org/docs/#custom-app

// ? The difference between _app and _document: _app is used to initialize pages
// ? (and runs on both client and server) while _document just represents the
// ? surrounding markup (i.e. html, head, body) and is only run on the server
// ? where it's necessary to generate markup.

// ?? Resolution order
// ?
// ?? On the server:
// ? 1. app.getInitialProps
// ? 2. page.getInitialProps (and getServerSideProps)
// ? 3. document.getInitialProps (not called during static optimization)
// ? 4. app.render
// ? 5. page.render
// ? 6. document.render
// ?
// ?? On the server with error (https://tinyurl.com/y6peoe42):
// ? 1. document.getInitialProps (ctx.req is empty if pre-rendered)
// ? 2. app.render
// ? 3. page.render
// ? 4. document.render
// ?
// ?? On the client:
// ? 1. app.getInitialProps
// ? 2. page.getInitialProps (note that getServerSideProps is server-side only!)
// ? 3. app.render
// ? 4. page.render

export default function App({ Component, pageProps }: any) {
    return (// * ContextProvider(s) for passing down state could go here
        <React.Fragment>
            <Head>
                <title>[DEMO] BDPA Elections</title>
                <meta name="viewport"
                    /* Use minimum-scale=1 to enable GPU rasterization */
                    content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no" />
                <link key="font"
                            rel="stylesheet"
                            href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
            </Head>
            <React.StrictMode>
                <Component { ...pageProps } />
                <script src="https://kit.fontawesome.com/ddd45b5c03.js" crossOrigin="anonymous"></script>
            </React.StrictMode>
        </React.Fragment>
    );
}
