declare namespace NodeJS {
    interface ProcessEnv {
        WORKER_PUBLIC_KEY: string
        PLUGIN_PRIVATE_KEY: string
        APP_ID: number
    }
}
