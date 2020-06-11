import { fetchEndpoint } from 'multiverse/fetch-endpoint'

/**
 * 
 */
export const UserActions = {
    noAction: 'no_action',
};

/**
 * 
 */
export type UserAction = $Keys<typeof UserActions>;

/**
 * 
 * @param {*} url 
 */
export function defaultSWRFetcher(url: string): Promise {
     return fetchEndpoint.get(url, { rejects: true }).then(o => o.data);
}
