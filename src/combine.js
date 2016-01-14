import fs from 'co-fs'
import {join, resolve, normalize, extname, basename} from 'path'

export default function (root = '.', options = {}) {
    root = normalize(resolve(root))
    options.identifier = options.identifier || '??'

    return function *combo(next){
        let url = decode(this.url)
        
        if(this.idempotent && url.indexOf(options.identifier) !== -1){
            let result, parts, last_modified

            result = ''
            last_modified = 0
            parts = url.split(options.identifier)

            for(let item of parts[1].split(',')){
                item = join(root, parts[0], substring(item, 0, item.indexOf('?')))

                if(!~['.css', '.js'].indexOf(ext(item))){
                    continue
                }

                try{
                    let stats = yield fs.stat(item)

                    if(stats.isFile()){
                        if(last_modified === 0 || stats.mtime > last_modified){
                            last_modified = stats.mtime
                        }

                        result += yield fs.createReadStream(item)
                    }
                }catch(err){
                    if (~['ENOENT', 'ENAMETOOLONG', 'ENOTDIR'].indexOf(err.code)){
                        continue
                    }

                    err.status = 500
                    throw err
                }
            }

            if(result){
                this.status = 200
                this.body = result
                this.type = mime(url)
                this.set('Content-Length', result.length);
                this.set('Last-Modified', last_modified.toUTCString())
            }else{
                this.status = 404
            }
        }else{
            yield next
        }
    }
}

function substring(str, start, end){
    return str.substring(start, end === -1 ? str.length : end)
}

function mime(url){
    let mime = {
      '.css' : 'text/css',
      '.js' : 'application/javascript'
    }

    return mime[ext(url)]
}

function ext(path){
    path = extname(basename(path))
    return substring(path, 0, path.indexOf('?'))
}

function decode(url){
    try{
        return decodeURIComponent(url)
    }catch(err){
        return url
    }
}
