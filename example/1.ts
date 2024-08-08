import { Nyxor } from '../src';

const app = new Nyxor();

app.onTransformResponse(async (ctx, response) => {
    console.log('transform response', response);
    return new Response(
        JSON.stringify({
            code: 211,
            msg: 'test',
        })
    );
});

app.onAfterHandle(async (ctx, response) => {
    if (response instanceof Object) {
        console.log('after handle', await response.json());
    }
    if (typeof response === 'object' && response !== null) {
        response.code = 9999;
    }
    return response;
});

app.get('/api/list', ctx => {
    return {
        code: 444,
        data: 'hello world',
    };
});

app.post('/api/list', async ctx => {
    await Bun.sleep(3000);
    return {
        code: 444,
        data: 'hello dog',
    };
});

app.listen(() => {
    console.log('started');
});
