import { start } from './arrange.mjs'

start(
    process.env.ARRANGE_DATABASE_DIRECTORY,
    process.env.ARRANGE_PRIVATE_KEY_FILE,
    process.env.ARRANGE_PUBLIC_CERTIFICATE_FILE,
    process.env.ARRANGE_HTTPS_PORT,
    process.env.ARRANGE_TOKEN_SECRET,
    [
        '../arrange-home/module.mjs',
        '../arrange-users/module.mjs',
        '../arrange-todo/module.mjs'
    ]
)