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
        opt: (path: string, handler: (ctx: ICtx) => any) => void;
    }

    export interface ICtx<
        IBody = Record<string, any>,
        IParams = Record<string, any>,
        IQuery = Record<string, any>,
        IHeaders = Record<string, any>,
        ICookies = Record<string, any>,
    > {
        body: (Record<string, any> & IBody) | string | undefined;
        params: Record<string, any> & IParams;
        query: Record<string, any> & IQuery;
        headers: Record<string, any> & IHeaders;
        cookies: Record<string, any> & ICookies;
        request: Request;
    }

    export interface IRouter {
        path: string;
        method: keyof IRequestMethods;
        handler: (ctx: ICtx) => any;
    }

    export interface IHookContainer<T extends Function = Function> {
        fn: T;
    }

    export interface ILifeCycles {
        onStart?: (server: Server) => MaybePromise;
        onStop?: () => MaybePromise;
    }
}
