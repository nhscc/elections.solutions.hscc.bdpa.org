/* @flow */

import type { NextApiRequest, NextApiResponse } from 'next'

export type HTTPStatusCode =
      100 | 101 | 102

    | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
    | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308

    | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418
    | 419 | 420 | 420 | 422 | 423 | 424 | 424 | 425 | 426 | 428 | 429 | 431 | 444 | 449 | 450 | 451 | 451 | 494 | 495
    | 496 | 497 | 499

    | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 509 | 510 | 511 | 598 | 599;

export type NextSessionRequest = NextApiRequest & { session: Object };

export type NextParamsResponseQuery = {
    +res: NextApiResponse,
    query: Object
};

export type NextParamsResponseStatus = {
    +res: NextApiResponse,
    status: HTTPStatusCode
};

export type NextParamsResponseStatusQuery = NextParamsResponseQuery & NextParamsResponseStatus;

export type NextParamsRR = {
    +req: NextApiRequest,
    +res: NextApiResponse
};

export type NextParamsRRWithSession = {
    ...NextParamsRR,
    +req: NextSessionRequest
};

export type NextParamsRRQWithSession = {
    ...NextParamsRRWithSession,
    query: Object
};
