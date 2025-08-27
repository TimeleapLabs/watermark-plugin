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

⚠️This step requires you to have updated compose.yml, config.yml and secrets⚠️

```bash
cs timeleap && tlp compose up --build
```

This project was created using `bun init` in bun v1.2.19. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
