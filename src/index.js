import koaEtag from 'koa-etag'
import combine from './combine'
import koaStatic from 'koa-static'

export default function (root = '.', options = {}) {
    let etag, serve, combo

    etag = koaEtag({
        weak: options.weak
    })

    combo = combine(root, {
        identifier : options.identifier
    })

    serve = koaStatic(root, {
        defer: options.defer,
        index: options.index,
        maxage: options.maxage,
        hidden: options.hidden
    })

    return function *(next) {
        yield etag.call(this, combo.call(this, serve.call(this, next)))
    }
}
