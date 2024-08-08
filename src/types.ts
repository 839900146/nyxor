import type { BunFile, Server } from 'bun';

export type MaybePromise<T = any> = T | Promise<T>;

export module MNyxor {
    export type TServer = Server;

    interface IHttpsOption {
        key: string | BunFile | Buffer;
        cert: string;
        serverName?: string;
    }

    export interface INyxorOptions {
        port?: number;
        hostname?: string;
        prefix?: string;
        https?: IHttpsOption | IHttpsOption[];
    }

    export interface IRequestMethods {
        all: (path: string, handler: (ctx: ICtx) => any) => void;
        get: (path: string, handler: (ctx: ICtx) => any) => void;
        post: (path: string, handler: (ctx: ICtx) => any) => void;
        put: (path: string, handler: (ctx: ICtx) => any) => void;
        delete: (path: string, handler: (ctx: ICtx) => any) => void;
        head: (path: string, handler: (ctx: ICtx) => any) => void;
        options: (path: string, handler: (ctx: ICtx) => any) => void;
    }

    export interface ICtx<
        IQuery = Record<string, any>,
        IBody = Record<string, any>,
        IParams = Record<string, any>,
        IHeaders = Record<string, any>,
        ICookies = Record<string, any>,
    > {
        query: Record<string, any> & IQuery;
        params: Record<string, any> & IParams;
        body: (Record<string, any> & IBody) | string | undefined;
        headers: Record<string, any> & IHeaders;
        cookies: Record<string, any> & ICookies;
        request: Request;
        method: 'get' | 'post' | 'put' | 'delete' | 'head' | 'options';
        url: string;
        origin: string;
        href: string;
        protocol: string;
        host: string;
        hostname: string;
        port: string;
        pathname: string;
        hash: string;
    }

    export interface IRouter {
        path: string;
        method: keyof IRequestMethods;
        handler: (ctx: ICtx) => any;
    }

    export interface IHookContainer<T extends Function = Function> {
        fn: T;
    }

    export interface IHookStart {
        (server: Server): MaybePromise<void>;
    }

    export interface IHookBeforeHandle {
        (ctx: ICtx, router: IRouter): MaybePromise<void>;
    }

    export interface IHookTransformResponse {
        (ctx: ICtx, response?: any): MaybePromise;
    }

    export interface IHookTransformCtx {
        (ctx: ICtx): MaybePromise<ICtx>;
    }

    export interface IHookAfterHandle {
        (ctx: ICtx, response?: any): MaybePromise;
    }

    export interface IHookStop {
        (ctx: ICtx): MaybePromise<void>;
    }

    export interface IHookError {
        (ctx: ICtx, err: any): MaybePromise;
    }

    export interface IHookParseBody {
        (request: Request): MaybePromise<Record<string, any>>;
    }

    export interface IHookParseQuery {
        (url: URL): MaybePromise<Record<string, any>>;
    }

    export interface IHookParseParams {
        (url: URL): MaybePromise<Record<string, any>>;
    }

    export interface IHookParseHeaders {
        (headers: Headers): MaybePromise<Record<string, any>>;
    }

    export interface IHookParseCookies {
        (request: Request): MaybePromise<Record<string, any>>;
    }

    export interface IHooks {
        onStart: IHookContainer<IHookStart>;
        onBeforeHandle: IHookContainer<IHookBeforeHandle>;
        onTransformResponse: IHookContainer<IHookTransformResponse>;
        onTransformCtx: IHookContainer<IHookTransformCtx>;
        onAfterHandle: IHookContainer<IHookAfterHandle>;
        onStop: IHookContainer<IHookStop>;
        onError: IHookContainer<IHookError>;

        onParseQuery: IHookContainer<IHookParseQuery>;
        onParseParams: IHookContainer<IHookParseParams>;
        onParseBody: IHookContainer<IHookParseBody>;
        onParseHeaders: IHookContainer<IHookParseHeaders>;
        onParseCookies: IHookContainer<IHookParseCookies>;
    }
}
