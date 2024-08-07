class Nyxor {
    use(plugin: (ctx: Nyxor) => any) {
        plugin(this);
        return this;
    }
    all() {}
    get() {}
    post() {}
    put() {}
    delete() {}
    ws() {}
    listen() {}
}

export default Nyxor;
