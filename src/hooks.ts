import type { MNyxor } from './types';

export class NyxorHooks {
    private events: Record<keyof MNyxor.IHooks, Function[]> = {
        onStart: [],
        onBeforeHandle: [],
        onTransformResponse: [],
        onTransformCtx: [],
        onAfterHandle: [],
        onStop: [],
        onError: [],

        onParseQuery: [],
        onParseParams: [],
        onParseBody: [],
        onParseHeaders: [],
        onParseCookies: [],
    };

    onStart = (fn: MNyxor.IHookStart) => {
        this.events.onStart.push(fn);
    };

    onBeforeHandle = (fn: MNyxor.IHookBeforeHandle) => {
        this.events.onBeforeHandle.push(fn);
    };

    onTransformResponse = (fn: MNyxor.IHookBeforeHandle) => {
        this.events.onTransformResponse.push(fn);
    };

    onAfterHandle = (fn: MNyxor.IHookBeforeHandle) => {
        this.events.onAfterHandle.push(fn);
    };

    onStop = (fn: MNyxor.IHookBeforeHandle) => {
        this.events.onStop.push(fn);
    };

    onError = (fn: MNyxor.IHookBeforeHandle) => {
        this.events.onError.push(fn);
    };

    trigger = async <
        K extends keyof MNyxor.IHooks,
        V extends Parameters<MNyxor.IHooks[K]['fn']>,
    >(
        hook: K,
        ...args: V
    ) => {
        let result: ReturnType<MNyxor.IHooks[K]['fn']> | undefined;
        for (const fn of this.events[hook]) {
            let _result = await fn.call(null, ...args, result);
            if (_result) result = _result;
        }

        if (result && (result as any) instanceof Response) {
            return result.json();
        }

        return result;
    };
}
