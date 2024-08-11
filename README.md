# WTFDL

## Overview
WTFDL allows you to download whatever the fuck you want using Cloudflare Workers.

## Demo
[wtfdl.workers.jimmyshjj.top](https://wtfdl.workers.jimmyshjj.top)
This demo is provided for demonstration purposes only. It is not optimized for actual use, lacks speed optimization, and requires Cloudflare verification. Please deploy your own instance for personal use.

## Usage
The usage of this service is straightforward. Simply follow the steps below:

**Download Whatever You Want:** 
- HTTPS: `https://enter.what.the.fuck.url.you.want`
- HTTP: `http://both.https.and.http.are.fucking.ok`

## Deployment on Cloudflare Workers
1. Visit the [Cloudflare Workers](https://workers.cloudflare.com) homepage.
2. Sign up or log in to your account.
3. Click on `Start building` and choose a subdomain for your worker.
4. Create a new Worker by clicking `Create a Worker`.
5. Copy the content of the [index.js](https://raw.githubusercontent.com/jimmyshjj/wtfdl/master/index.js) file into the code editor on the left side of the screen.
6. Click `Save and deploy`.

### Configuration Options
- **ASSET_URL**: The URL for static assets (this refers to the single-page application currently displayed).
- **PREFIX**: The URL prefix. By default, it's set to `"/"`. If you're using a custom route like `example.com/gh/*`, set `PREFIX` to `'/gh/'`. Be careful with slashes, as missing or extra slashes can cause errors!

## Cloudflare Workers Billing
You can monitor your usage on the `overview` page. The free plan includes 100,000 requests per day with a limit of 1,000 requests per minute. 

If this isn’t sufficient, you can upgrade to the premium plan for $5 per month, which includes 10 million requests per month (additional requests are billed at $0.5 per million requests).

## Changelog
- **2024.08.11**: Initial release.

## License
This project is forked from [hunshcn/gh-proxy](https://github.com/hunshcn/gh-proxy) and is licensed under the MIT License.