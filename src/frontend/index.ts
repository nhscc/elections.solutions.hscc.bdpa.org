import { fetchEndpoint } from 'multiverse/fetch-endpoint'

/**
 * 
 * @param {*} url 
 */
export function defaultSWRFetcher(url: string) {
     return fetchEndpoint.get(url, { rejects: true }).then(o => o.data);
}
