import type { MNyxor } from './types';
import { parseQuery, parseCookies } from './utils';
import { version as _version } from '../package.json';
import { NyxorHooks } from './hooks';

export class Nyxor {
    version = _version;
    private hooks = new NyxorHooks();
    private server: MNyxor.TServer | null = null;
    private routers: Map<
        keyof MNyxor.IRequestMethods,
        Map<string, MNyxor.IRouter>
    > = new Map();
    private config: MNyxor.INyxorOptions = {
        port: 8888,
        hostname: '0.0.0.0',
    };

    constructor(options?: MNyxor.INyxorOptions) {
        if (!options) return;
        Object.assign(this.config, options);
    }

    private createServer() {
        if (this.server) return this;
        this.server = Bun.serve({
            port: this.config.port,
            hostname: this.config.hostname,
            tls: this.config.https,
            fetch: async request => {
                const ctx = await this.createCtx(request);
                const result = await this.handleRequest(ctx);
                return result;
            },
        });
        this.hooks.trigger('onStart', this.server);
        console.log(
            `Server listening on ${this.config.hostname}:${this.config.port}`
        );
        return this;
    }
    /** 解析body请求参数 */
    private createReqBody = async (req: Request) => {
        let _body = await this.hooks.trigger('onParseBody', req);
        if (_body) return _body;

        const content_type = req.headers.get('content-type');

        let body: string | Record<string, any> | undefined;

        if (req.method === 'GET' || req.method === 'HEAD') return;

        switch (content_type) {
            case 'application/json':
                body = await req.json();
                break;
            case 'text/plain':
                body = await req.text();
                break;
            case 'application/x-www-form-urlencoded':
                body = parseQuery(await req.text());
                break;
            case 'application/octet-stream':
                body = await req.arrayBuffer();
                break;
            case 'multipart/form-data':
                body = {};

                const form = await req.formData();
                const keys = Object.keys(form);
                for (const key of keys) {
                    if (body[key]) continue;

                    const value = form.getAll(key);
                    if (value.length === 1) body[key] = value[0];
                    else body[key] = value;
                }

                break;
        }

        return body;
    };
    /** 解析get请求参数 */
    private createReqQuery = async (url: URL) => {
        let _query = await this.hooks.trigger('onParseQuery', url);
        if (_query) return _query;

        const query: Record<string, any> = {};
        const entries = url.searchParams.entries();
        for (const [key, value] of entries) {
            query[key] = value;
        }
        return query;
    };
    /** 解析路径参数 */
    private createReqParams = async (url: URL) => {
        let _params = await this.hooks.trigger('onParseParams', url);
        if (_params) return _params;
        return {};
    };
    /** 解析请求头 */
    private createReqHeaders = async (req: Request) => {
        let _headers = await this.hooks.trigger('onParseHeaders', req.headers);
        if (_headers) return _headers;

        const headers: Record<string, any> = {};
        req.headers.forEach((val, key) => {
            headers[key] = val;
        });
        return headers;
    };
    /** 解析cookie */
    private createReqCookies = async (req: Request) => {
        let _cookie = await this.hooks.trigger('onParseCookies', req);
        if (_cookie) return _cookie;

        let cookieStr = req.headers.get('cookie') || '';
        if (!cookieStr) return {};
        return parseCookies(cookieStr);
    };
    /** 创建上下文 */
    private createCtx = async (req: Request) => {
        const url = new URL(req.url);
        const query = await this.createReqQuery(url);
        const params = await this.createReqParams(url);
        const body = await this.createReqBody(req);
        const headers = await this.createReqHeaders(req);
        const cookies = await this.createReqCookies(req);
        const ctx: MNyxor.ICtx = {
            query,
            params,
            body,
            headers,
            cookies,
            method: req.method.toLowerCase() as any,
            request: req,
            url: req.url,
            origin: url.origin,
            href: url.href,
            protocol: url.protocol,
            host: url.host,
            hostname: url.hostname,
            port: url.port,
            pathname: url.pathname,
            hash: url.hash,
        };

        let _ctx = await this.hooks.trigger('onTransformCtx', ctx);

        return _ctx || ctx;
    };
    /** 请求处理程序 */
    private handleRequest = async (ctx: MNyxor.ICtx) => {
        // 从路由配置中获取对应的处理器
        let router = this.routers
            .get(ctx.method as keyof MNyxor.IRequestMethods)
            ?.get(ctx.pathname);

        // 如果没有找到对应的路由，则直接返回404响应
        if (!router) {
            return new Response('Not Found', { status: 404 });
        }

        // 触发请求前的钩子
        await this.hooks.trigger('onBeforeHandle', ctx, router);

        // 执行路由处理器，并等待结果
        let result = await router.handler(ctx);

        // 触发响应转换的钩子
        result =
            (await this.hooks.trigger('onTransformResponse', ctx, result)) ||
            result;

        // 触发请求处理后的钩子
        result =
            (await this.hooks.trigger('onAfterHandle', ctx, result)) || result;

        // 根据结果类型构造响应
        if (result instanceof Response) {
            return result;
        }

        if (
            typeof result === 'string' ||
            result instanceof Buffer ||
            result instanceof ArrayBuffer
        ) {
            return new Response(result);
        }

        if (typeof result === 'object' && result !== null) {
            return new Response(JSON.stringify(result));
        }

        return new Response(String(result));
    };
    /** 添加路由 */
    private addRouter = (
        method: keyof MNyxor.IRequestMethods,
        path: string,
        handler: (ctx: MNyxor.ICtx) => any
    ) => {
        let maps = this.routers.get(method);
        if (!maps) {
            maps = new Map();
            this.routers.set(method, maps);
        }
        maps.set(path, {
            path,
            method,
            handler,
        });
    };

    use = (plugin: (ctx: Nyxor) => any) => {
        plugin(this);
        return this;
    };

    all: MNyxor.IRequestMethods['all'] = (path, handler) => {
        this.addRouter('all', path, handler);
    };
    get: MNyxor.IRequestMethods['get'] = (path, handler) => {
        this.addRouter('get', path, handler);
    };
    post: MNyxor.IRequestMethods['post'] = (path, handler) => {
        this.addRouter('post', path, handler);
    };
    put: MNyxor.IRequestMethods['put'] = (path, handler) => {
        this.addRouter('put', path, handler);
    };
    delete: MNyxor.IRequestMethods['delete'] = (path, handler) => {
        this.addRouter('delete', path, handler);
    };
    head: MNyxor.IRequestMethods['head'] = (path, handler) => {
        this.addRouter('head', path, handler);
    };
    options: MNyxor.IRequestMethods['options'] = (path, handler) => {
        this.addRouter('options', path, handler);
    };

    onStart = (fn: MNyxor.IHookStart) => {
        this.hooks.onStart(fn);
    };

    onBeforeHandle = (fn: MNyxor.IHookBeforeHandle) => {
        this.hooks.onBeforeHandle(fn);
    };

    onTransformResponse = (fn: MNyxor.IHookTransformResponse) => {
        this.hooks.onTransformResponse(fn);
    };

    onAfterHandle = (fn: MNyxor.IHookAfterHandle) => {
        this.hooks.onAfterHandle(fn);
    };

    onStop = (fn: MNyxor.IHookStop) => {
        this.hooks.onStop(fn);
    };

    onError = (fn: MNyxor.IHookError) => {
        this.hooks.onError(fn);
    };

    listen(): void;
    listen(cb: () => void): void;
    listen(port: number): void;
    listen(port: number, cb: () => void): void;
    listen(port: number, host: string, cb: () => void): void;
    listen(options: MNyxor.INyxorOptions, cb: () => void): void;
    listen(...args: any[]): void {
        // 根据参数类型处理不同的逻辑
        if (typeof args[0] === 'number') {
            // 处理端口和可选的主机名
            this.config.port = args[0];
            if (typeof args[1] === 'string') {
                this.config.hostname = args[1];
            } else if (typeof args[1] === 'function') {
                // 当第二个参数是回调函数时，直接创建服务器
                this.createServer();
                args[1]();
                return;
            }
        } else if (typeof args[0] === 'object') {
            // 处理对象参数
            Object.assign(this.config, args[0] || {});
        }

        // 最后创建服务器，如果有回调函数则执行
        if (typeof args[args.length - 1] === 'function') {
            this.createServer();
            args[args.length - 1]();
        } else {
            this.createServer();
        }
    }
}
