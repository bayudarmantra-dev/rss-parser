/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { FetchRSS } from './fetchRSS.js';

export default {
	async fetch(request, env, ctx) {
		const { searchParams } = new URL(request.url);
		let feedURL = searchParams.get('feed');
		//let feedURL = 'https://reddit.com/r/indonesia/.rss';

		if (!feedURL) {
			return new Response(JSON.stringify({
				status: 400,
				message: 'No URL provided'
			}), {
				headers: {
					'Content-Type':'application/json;charset=UTF-8',
					'Access-Control-Allow-Origin':'*'
				}
			});
		}
		
		const feed = await new FetchRSS(feedURL).get();
		return new Response(JSON.stringify(feed), {
			headers: {
				'Content-Type':'application/json;charset=UTF-8',
				'Access-Control-Allow-Origin':'*'
			}
		});
	},
};
