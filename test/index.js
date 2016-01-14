import fs from 'fs'
import koa from 'koa'
import serve from '../dist'
import request from 'supertest'

describe('koa-etag', () => {
    describe('when body is missing', () => {
        it('should not add ETag', (done) => {
            var app = koa()

            app.use(serve())
            app.use(function *(next){
              yield next
            })

            request(app.listen())
              .get('/')
              .end(done)
        })
    })

    describe('when ETag is exists', () => {
        it('should not add ETag', (done) => {
            var app = koa()

            app.use(serve())
            app.use(function *(next){
                this.body = {hi : 'etag'}
                this.etag = 'etaghaha'
                yield next
            })

            request(app.listen())
              .get('/')
              .expect('etag', '"etaghaha"')
              .expect({hi: 'etag'})
              .expect(200, done)
        })
    })

    describe('when body is a string', () => {
        it('should add ETag', (done) => {
            var app = koa()

            app.use(serve())
            app.use(function *(next){
              yield next
              this.body = 'Hello Wolrd'
            })

            request(app.listen())
              .get('/')
              .expect('ETag', '"b-Lp1rL925HXig8/BxlMmOng"')
              .end(done)
        })
    })

    describe('when body is a Buffer', () => {
        it('should add ETag', (done) => {
            var app = koa()

            app.use(serve())
            app.use(function *(next){
                yield next
                this.body = new Buffer('Hello World')
            })

            request(app.listen())
              .get('/')
              .expect('ETag', '"b-sQqNsWTgdUEFt6mb5y4/5Q"')
              .end(done)
        })
    })

    describe('when body is JSON', () => {
        it('should add ETag', (done) => {
            var app = koa()

            app.use(serve())
            app.use(function *(next){
                yield next
                this.body = {foo : 'bar'}
            })

            request(app.listen())
              .get('/')
              .expect('ETag', '"d-m7WPJhkuS6APAeLnsTa72A"')
              .end(done)
        })
    })

    describe('when body is a stream with a .path', () => {
        it('should add ETag', (done) => {
            var app = koa()

            app.use(serve())
            app.use(function *(next){
                yield next
                this.body = fs.createReadStream('package.json')
            })

            request(app.listen())
              .get('/')
              .expect('ETag', /^W\/.+/)
              .end(done)
        })
    })

    describe('when with options', () => {
        it('should add weak ETag', (done) => {
            var app = koa()

            app.use(serve('.', {weak : true}))
            app.use(function *(next){
                yield next
                this.body = 'Hello World'
            })

            request(app.listen())
              .get('/')
              .expect('ETag', 'W/"b-sQqNsWTgdUEFt6mb5y4/5Q"')
              .end(done)
        })
    })
})

describe('koa-static', () => {
    describe('when defer: false', () => {
        describe('when root = "."', () => {
            it('should serve from cwd', (done) => {
                var app = koa()

                app.use(serve('.'))

                request(app.listen())
                  .get('/package.json')
                  .expect(200, done)
            })
        })

        describe('when path is not a file', () => {
            it('should 404', (done) => {
                var app = koa()

                app.use(serve('test/fixtures'))

                request(app.listen())
                  .get('/something')
                  .expect(404, done)
            })
        })

        describe('when upstream middleware responds', () => {
            it('should respond', (done) => {
              var app = koa()

              app.use(serve('test/fixtures'))
              app.use(function *(next){
                  yield next
                  this.body = 'hey'
              })

              request(app.listen())
                .get('/hello.txt')
                .expect(200)
                .expect('world', done)
            })
        })

        describe('the path is valid', () => {
            it('should serve the file', (done) => {
              var app = koa()

              app.use(serve('test/fixtures'))

              request(app.listen())
                .get('/hello.txt')
                .expect(200)
                .expect('world', done)
            })
        })

        describe('.index', () => {
            describe('when present', () => {
                it('should alter the index file supported', (done) => {
                    var app = koa()

                    app.use(serve('test/fixtures', {
                        index: 'index.txt'
                    }))

                    request(app.listen())
                      .get('/')
                      .expect(200)
                      .expect('Content-Type', 'text/plain; charset=utf-8')
                      .expect('text index', done)
                })
            })

            describe('when omitted', () => {
                it('should use index.html', (done) => {
                    var app = koa()

                    app.use(serve('test/fixtures'))

                    request(app.listen())
                      .get('/world/')
                      .expect(200)
                      .expect('Content-Type', 'text/html; charset=utf-8')
                      .expect('html index', done)
                })
            })

            describe('when disabled', () => {
                it('should not use index.html', (done) => {
                    var app = koa()

                    app.use(serve('test/fixtures', {
                        index : false
                    }))

                    request(app.listen())
                      .get('/world/')
                      .expect(404, done)
                })
            })
        })

        describe('when method is not `GET` or `HEAD`', () => {
            it('should 404', (done) => {
                var app = koa()

                app.use(serve('test/fixtures'))

                request(app.listen())
                  .post('/hello.txt')
                  .expect(404, done)
            })
        })
    })

    describe('when defer: true', () => {
        describe('when upstream middleware responds', () => {
            it('should do nothing', (done) => {
                var app = koa()

                app.use(serve('test/fixtures', {
                    defer : true
                }))
                app.use(function *(next){
                    yield next
                    this.body = 'hey'
                })

                request(app.listen())
                  .get('/hello.txt')
                  .expect(200)
                  .expect('hey', done)
            })
        })

        describe('the path is valid', () => {
            it('should serve the file', (done) => {
                var app = koa()

                app.use(serve('test/fixtures', {
                    defer : true
                }))

                request(app.listen())
                  .get('/hello.txt')
                  .expect(200)
                  .expect('world', done)
            })
        })

        describe('.index', () => {
            describe('when present', () => {
                it('should alter the index file supported', (done) => {
                    var app = koa()

                    app.use(serve('test/fixtures', {
                        defer : true,
                        index : 'index.txt'
                    }))

                    request(app.listen())
                      .get('/')
                      .expect(200)
                      .expect('Content-Type', 'text/plain; charset=utf-8')
                      .expect('text index', done)
                })
            })

            describe('when omitted', () => {
                it('should use index.html', (done) => {
                    var app = koa()

                    app.use(serve('test/fixtures', {
                        defer : true
                    }))

                    request(app.listen())
                      .get('/world/')
                      .expect(200)
                      .expect('Content-Type', 'text/html; charset=utf-8')
                      .expect('html index', done)
                })
            })
        })

        describe('when path is not a file', () => {
            it('should 404', (done) => {
                var app = koa()

                app.use(serve('test/fixtures', {
                    defer : true
                }))

                request(app.listen())
                  .get('/something')
                  .expect(404, done)
            })
        })

        describe('it should not handle the request', () => {
            it('when status=204', (done) => {
                var app = koa()

                app.use(serve('test/fixtures', {
                    defer : true
                }))
                app.use(function *(next){
                  this.status = 204
                })

                request(app.listen())
                  .get('/something%%%/')
                  .expect(204, done)
            })

            it('when body=""', (done) => {
                var app = koa()

                app.use(serve('test/fixtures', {
                    defer : true
                }))
                app.use(function *(next){
                  this.body = ''
                })

                request(app.listen())
                  .get('/something%%%/')
                  .expect(200, done)
            })
        })

        describe('when method is not `GET` or `HEAD`', () => {
            it('should 404', (done) => {
                var app = koa()

                app.use(serve('test/fixtures', {
                    defer : true
                }))

                request(app.listen())
                  .post('/hello.txt')
                  .expect(404, done)
            })
        })
    })
})

describe('combo', () => {
    describe('css', () => {
        it('not combine', (done) => {
            var app = koa()

            app.use(serve('test/fixtures'))

            request(app.listen())
              .get('/css.css')
              .expect('Content-Length', 3)
              .expect('Content-Type', /css/)
              .expect('Last-Modified', /GMT/)
              .expect('ETag', /^W\/.+/)
              .expect('css', done)
        })

        it('combine', (done) => {
            var app = koa()

            app.use(serve('test/fixtures'))

            request(app.listen())
              .get('/??css.css?t=1,b.css,css.css?t=2')
              .expect('Content-Length', 10)
              .expect('Content-Type', /css/)
              .expect('Last-Modified', /GMT/)
              .expect('ETag', '"a-i+arDT4UglFpsxjvp/UotA"')
              .expect('cssbcsscss', done)
        })
    })

    describe('javascript', () => {
        it('not combine', (done) => {
            var app = koa()

            app.use(serve('test/fixtures'))

            request(app.listen())
              .get('/js.js')
              .expect('js', done)
        })

        it('combine', (done) => {
            var app = koa()

            app.use(serve('test/fixtures'))

            request(app.listen())
              .get('/??js.js?t=1,js.js,js.js?t=2')
              .expect('jsjsjs', done)
        })
    })

    describe('not file', () => {
        it('some files not found', (done) => {
            var app = koa()

            app.use(serve('test/fixtures'))

            request(app.listen())
              .get('/??js.js?t=1,a.js,b.js?t=3,js.js?t=2')
              .expect('jsjs', done)
        })

        it('all files not found', (done) => {
            var app = koa()

            app.use(serve('test/fixtures'))

            request(app.listen())
              .get('/??1.js?t=1,a.js,b.js?t=3,4.js?t=2')
              .expect(404, done)
        })
    })

    describe('other identifier', () => {
        it('&& identifier', (done) => {
            var app = koa()

            app.use(serve('test/fixtures', {
                identifier : '&&'
            }))

            request(app.listen())
              .get('/&&js.js?t=1,a.js,b.js?t=3,js.js?t=2')
              .expect('jsjs', done)
        })

        it('combo& identifier', (done) => {
            var app = koa()

            app.use(serve('test/fixtures', {
                identifier : 'combo&'
            }))

            request(app.listen())
              .get('/combo&js.js?t=1,a.js,b.js?t=3,js.js?t=2')
              .expect('jsjs', done)
        })
    })

    describe('other', () => {
        it('when method is not `GET` or `HEAD`', (done) => {
            var app = koa()

            app.use(serve('test/fixtures'))

            request(app.listen())
              .post('/??js.js?t=1,a.js,b.js?t=3,js.js?t=2')
              .expect(404, done)
        })

        it('combine other file', (done) => {
            var app = koa()

            app.use(serve('test/fixtures'))

            request(app.listen())
              .get('/??css.css,hello.txt,js.js?t=1')
              .expect('cssjs', done)
        })
    })
})
