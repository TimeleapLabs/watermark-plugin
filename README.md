# watermark-plugin

To install dependencies:

```bash
bun install
```

To run:

```bash
tlp init
```

Chose `./timeleap` for location of nodes and select both broker and worker

Now that you have the secrets file in `./timeleap/secrets` path, you can make your `.env` file in the root

```bash
cp .env.example .env
```

You need to use plugin's key for `PLUGIN_PRIVATE_KEY`

## Generating a Key

The `apps/plugin` package provides a utility for generating a key.

From the root of the repository, run:

```sh
bun run --filter @apps/plugin generate:key
```

Save the results, use `sk` for the env. other one is the public key and you're gonna need it the `config.yaml`

And fill the rest of the fields from `./timeleap/secrets`

```env
WORKER_PUBLIC_KEY=
BROKER_URI=
BROKER_PUBLIC_KEY=
```

```bash
cd timeleap && tlp compose up --build
```
