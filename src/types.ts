import type { BunFile, Server } from 'bun';

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
        all: (path: string, handler: (req: any, res: any) => any) => void;
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
}
