import type { MNyxor } from './types';
import { parseQuery, parseCookies } from './utils';

export class Nyxor {
    server: MNyxor.TServer | null = null;
    private options: MNyxor.INyxorOptions = {
        port: 8888,
        hostname: '0.0.0.0',
    };

    constructor(options?: MNyxor.INyxorOptions) {
        if (!options) return;
        Object.assign(this.options, options);
    }

    private createServer() {
        if (this.server) return this;
        this.server = Bun.serve({
            port: this.options.port,
            hostname: this.options.hostname,
            tls: this.options.https,
            fetch: async (request, server) => {
                const body = await this.createReqBody(request);
                const params = await this.createReqParams(request);
                const query = await this.createReqQuery(request);
                const headers = await this.createReqHeaders(request);
                const cookies = await this.createReqCookies(request);
                const ctx: MNyxor.ICtx = {
                    body,
                    params,
                    query,
                    headers,
                    cookies,
                    request,
                };

                return new Response(JSON.stringify(ctx));
            },
        });
        console.log(
            `Server listening on ${this.options.hostname}:${this.options.port}`
        );
        return this;
    }
    /** 解析body请求参数 */
    private createReqBody = async (req: Request) => {
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
    /** 解析路径请求参数 */
    private createReqParams = (req: Request) => {
        return {};
    };
    /** 解析get请求参数 */
    private createReqQuery = (req: Request) => {
        const query: Record<string, any> = {};
        const entries = new URL(req.url).searchParams.entries();
        for (const [key, value] of entries) {
            query[key] = value;
        }
        return query;
    };
    /** 解析请求头 */
    private createReqHeaders = (req: Request) => {
        const headers: Record<string, any> = {};
        req.headers.forEach((val, key) => {
            headers[key] = val;
        });
        return headers;
    };
    /** 解析cookie */
    private createReqCookies = (req: Request) => {
        const cookies = parseCookies(req.headers.get('cookie') || '');
        return cookies;
    };

    use(plugin: (ctx: Nyxor) => any) {
        plugin(this);
        return this;
    }
    all() {}
    get() {}
    post() {}
    put() {}
    delete() {}
    router() {}
    group() {}
    ws() {}

    onStart() {}
    onRequest() {}
    onParse() {}
    onTransform() {}
    onBeforeHandle() {}
    onAfterHandle() {}
    onAfterResponse() {}
    onError() {}
    onStop() {}

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
            this.options.port = args[0];
            if (typeof args[1] === 'string') {
                this.options.hostname = args[1];
            } else if (typeof args[1] === 'function') {
                // 当第二个参数是回调函数时，直接创建服务器
                this.createServer();
                args[1]();
                return;
            }
        } else if (typeof args[0] === 'object') {
            // 处理对象参数
            Object.assign(this.options, args[0] || {});
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
