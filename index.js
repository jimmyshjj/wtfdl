'use strict'

/**
 * static files (404.html, sw.js, conf.js)
 */
const ASSET_URL = 'https://jimmyshjj.github.io/wtfdl/'
// 前缀，如果自定义路由为example.com/gh/*，将PREFIX改为 '/gh/'，注意，少一个杠都会错！
const PREFIX = '/'
// 分支文件使用jsDelivr镜像的开关，0为关闭，默认关闭
const Config = {
    jsdelivr: 0
}

const whiteList = [] // 白名单，路径里面有包含字符的才会通过，e.g. ['/username/']

/** @type {ResponseInit} */
const PREFLIGHT_INIT = {
    status: 204,
    headers: new Headers({
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS',
        'access-control-max-age': '1728000',
    }),
}


const exp1 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:releases|archive)\/.*$/i
const exp2 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:blob|raw)\/.*$/i
const exp3 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:info|git-).*$/i
const exp4 = /^(?:https?:\/\/)?raw\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+?\/.+$/i
const exp5 = /^(?:https?:\/\/)?gist\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+$/i
const exp6 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/tags.*$/i
// 自定义+github.io,oisd.nl,huggingface.co
const exp7 = /^(?:https?:\/\/)?\w+\.github\.io\/.*$/i
const exp8 = /^(?:https?:\/\/)?(?:small|big|nsfw)\.oisd\.nl(?:\/\w+)?$/i
const exp9 = /^(?:https?:\/\/)?huggingface\.co\/.+?\/.+?\/(?:blob|resolve|raw)\/.*$/i
// 匹配所有
const exp0 = /^(?!favicon\.ico$)(?:https?:\/\/)?[^\/]+?\.[^\/]+?.*$/i



/**
 * @param {any} body
 * @param {number} status
 * @param {Object<string, string>} headers
 */
function makeRes(body, status = 200, headers = {}) {
    headers['access-control-allow-origin'] = '*'
    return new Response(body, {status, headers})
}


/**
 * @param {string} urlStr
 */
function newUrl(urlStr) {
    try {
        return new URL(urlStr)
    } catch (err) {
        return null
    }
}


addEventListener('fetch', e => {
    const ret = fetchHandler(e)
        .catch(err => makeRes('cfworker error:\n' + err.stack, 502))
    e.respondWith(ret)
})


function checkUrl(u) {
    for (let i of [exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8, exp9, exp0]) {
        if (u.search(i) === 0) {
            return true
        }
    }
    return false
}

/**
 * @param {FetchEvent} e
 */
async function fetchHandler(e) {
    const req = e.request
    const urlStr = req.url
    const urlObj = new URL(urlStr)
    let path = urlObj.searchParams.get('q')
    if (path) {
        return Response.redirect('https://' + urlObj.host + PREFIX + path, 301)
    }
    // cfworker 会把路径中的 `//` 合并成 `/`
    path = urlObj.href.substr(urlObj.origin.length + PREFIX.length).replace(/^https:\/+/, 'https://').replace(/^http:\/+/, 'http://')
    if (path.search(exp1) === 0 || path.search(exp5) === 0 || path.search(exp6) === 0 || path.search(exp3) === 0 || path.search(exp4) === 0 || path.search(exp7) === 0 || path.search(exp8) === 0 || path.search(exp9) === 0) {
        return httpHandler(req, path)
    } else if (path.search(exp2) === 0) {
        if (Config.jsdelivr) {
            const newUrl = path.replace('/blob/', '@').replace(/^(?:https?:\/\/)?github\.com/, 'https://cdn.jsdelivr.net/gh')
            return Response.redirect(newUrl, 302)
        } else {
            path = path.replace('/blob/', '/raw/')
            return httpHandler(req, path)
        }
    } else if (path.search(exp4) === 0) {
        const newUrl = path.replace(/(?<=com\/.+?\/.+?)\/(.+?\/)/, '@$1').replace(/^(?:https?:\/\/)?raw\.(?:githubusercontent|github)\.com/, 'https://cdn.jsdelivr.net/gh')
        return Response.redirect(newUrl, 302)
    } else if (path.search(exp0) === 0) {
        return httpHandler(req, path)
    } else {
        return fetch(ASSET_URL + path)
    }
}


/**
 * @param {Request} req
 * @param {string} pathname
 */
function httpHandler(req, pathname) {
    const reqHdrRaw = req.headers

    // preflight
    if (req.method === 'OPTIONS' &&
        reqHdrRaw.has('access-control-request-headers')
    ) {
        return new Response(null, PREFLIGHT_INIT)
    }

    const reqHdrNew = new Headers(reqHdrRaw)

    let urlStr = pathname
    let flag = !Boolean(whiteList.length)
    for (let i of whiteList) {
        if (urlStr.includes(i)) {
            flag = true
            break
        }
    }
    if (!flag) {
        return new Response("blocked", {status: 403})
    }
    if (urlStr.search(/^https?:\/\//) !== 0) {
        urlStr = 'https://' + urlStr
    }
    const urlObj = newUrl(urlStr)

    /** @type {RequestInit} */
    const reqInit = {
        method: req.method,
        headers: reqHdrNew,
        redirect: 'manual',
        body: req.body
    }
    return proxy(urlObj, reqInit)
}


/**
 *
 * @param {URL} urlObj
 * @param {RequestInit} reqInit
 */
async function proxy(urlObj, reqInit) {
    if (!urlObj) {
        const status = 600
        return ErrorPage(status);
    }
    const res = await fetch(urlObj.href, reqInit)
    const resHdrOld = res.headers
    const resHdrNew = new Headers(resHdrOld)

    const status = res.status

    if (status >= 400 && status < 600) {
        return ErrorPage(status);
    }
    
    if (resHdrNew.has('location')) {
        let _location = resHdrNew.get('location')
        if (checkUrl(_location))
            resHdrNew.set('location', PREFIX + _location)
        else {
            reqInit.redirect = 'follow'
            return proxy(newUrl(_location), reqInit)
        }
    }
    resHdrNew.set('access-control-expose-headers', '*')
    resHdrNew.set('access-control-allow-origin', '*')
    // 检查是否已存在Content-Disposition头
    if (!resHdrNew.has('Content-Disposition')) {
        // 如果不存在，设置为下载形式，默认名称为downloaded-file
        resHdrNew.set('Content-Disposition', 'attachment');
    }
    resHdrNew.delete('content-security-policy')
    resHdrNew.delete('content-security-policy-report-only')
    resHdrNew.delete('clear-site-data')

    return new Response(res.body, {
        status,
        headers: resHdrNew,
    })
}

/**
 * 返回一个简单的错误页面
 * @param {number} status
 */
function ErrorPage(status)  {
    const errorMessage = getStatusMessage(status);
    const body = `
        <html lang="en"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="initial-scale=1, minimum-scale=1, width=device-width">
    <title>Error ${status} (${errorMessage})!!</title>
    <style>
    *{margin:0;padding:0}html,code{font:15px/22px arial,sans-serif}html{background:#fff;color:#222;padding:15px}body{margin:7% auto 0;max-width:390px;min-height:180px;padding:30px 0 15px}* > body{background:url(/www.google.cn/images/errors/robot.png) 100% 5px no-repeat;padding-right:205px}p{margin:11px 0 22px;overflow:hidden}ins{color:#777;text-decoration:none}a img{border:0}@media screen and (max-width:772px){body{background:none;margin-top:0;max-width:none;padding-right:0}}#logo{background:url(/upload.wikimedia.org/wikipedia/commons/4/4b/Cloudflare_Logo.svg) no-repeat;margin-left:-5px}@media only screen and (min-resolution:192dpi){#logo{background:url(//www.google.cn/images/logos/errorpage/error_logo-150x54-2x.png) no-repeat 0% 0%/100% 100%;border-image:url(//www.google.cn/images/logos/errorpage/error_logo-150x54-2x.png) 0}}@media only screen and (-webkit-min-device-pixel-ratio:2){#logo{background:url(//www.google.cn/images/logos/errorpage/error_logo-150x54-2x.png) no-repeat;background-size:100% 100%}}#logo{display:inline-block;height:54px;width:150px}
    </style>
    </head><body><a href="${PREFIX}"><span id="logo" aria-label="Google"></span></a>
    <p><b>${status} ${errorMessage}.</b> <ins>That’s an error.</ins>
    </p><p>  <ins>That’s all we know.</ins>
    </p></body></html>`;
    if (status >= 200 && status < 600) {
        return makeRes(body, status, {'content-type': 'text/html'});
    } else {
        return makeRes(body, status=404, {'content-type': 'text/html'});
    }
}

/**
 * 返回状态码对应的简短叙述
 * @param {number} status
 */
function getStatusMessage(status) {
    const statusMessages = {
        // 4xx Client Errors
        400: 'Bad Request',
        401: 'Unauthorized',
        402: 'Payment Required',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        406: 'Not Acceptable',
        407: 'Proxy Authentication Required',
        408: 'Request Timeout',
        409: 'Conflict',
        410: 'Gone',
        411: 'Length Required',
        412: 'Precondition Failed',
        413: 'Payload Too Large',
        414: 'URI Too Long',
        415: 'Unsupported Media Type',
        416: 'Range Not Satisfiable',
        417: 'Expectation Failed',
        418: 'I\'m a Teapot',
        421: 'Misdirected Request',
        422: 'Unprocessable Content',
        423: 'Locked',
        424: 'Failed Dependency',
        425: 'Too Early',
        426: 'Upgrade Required',
        428: 'Precondition Required',
        429: 'Too Many Requests',
        431: 'Request Header Fields Too Large',
        451: 'Unavailable For Legal Reasons',

        // 5xx Server Errors
        500: 'Internal Server Error',
        501: 'Not Implemented',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout',
        505: 'HTTP Version Not Supported',
        506: 'Variant Also Negotiates',
        507: 'Insufficient Storage',
        508: 'Loop Detected',
        510: 'Not Extended',
        511: 'Network Authentication Required',

        // Cloudflare Unofficial Codes
        520: 'Web Server Returned an Unknown Error',
        521: 'Web Server Is Down',
        522: 'Connection Timed Out',
        523: 'Origin Is Unreachable',
        524: 'A Timeout Occurred',
        525: 'SSL Handshake Failed',
        526: 'Invalid SSL Certificate',
        527: 'Railgun Error',
        530: 'Cloudflare Error 530',
        561: 'Unauthorized',
        599: 'Network Connect Timeout Error',
        // 自定义
        600: 'Upstream Returned NULL',
    };

    return statusMessages[status] || 'Unknown Error';
}