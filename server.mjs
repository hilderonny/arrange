import { start } from './arrange.mjs'

start(
    process.env.ARRANGE_DATABASE_DIRECTORY,
    process.env.ARRANGE_USE_SSL,
    process.env.ARRANGE_PRIVATE_KEY_FILE,
    process.env.ARRANGE_PUBLIC_CERTIFICATE_FILE,
    process.env.ARRANGE_PORT,
    process.env.ARRANGE_TOKEN_SECRET,
    [
        './modules/home/module.mjs',
        './modules/users/module.mjs',
        './modules/todo/module.mjs'
    ]
)