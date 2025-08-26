import { Identity, OpCodes, Wallet } from '@timeleap/client'
import { decodeWatermarkImageCall, encodeWatermarkImageResponse } from '@repo/models/watermarker'
import { Uuid25 } from 'uuid25'
import { Sia } from '@timeleap/sia'
import sharp from 'sharp'

const worker = await Identity.fromBase58(process.env.WORKER_PUBLIC_KEY)
const wallet = await Wallet.fromBase58(process.env.PLUGIN_PRIVATE_KEY)
const appId = process.env.APP_ID ?? 0

Bun.serve({
    port: 3000,
    fetch(req, server) {
        if (server.upgrade(req)) {
            return;
        }
        return new Response("This server only supports WebSocket connections", { status: 400 });
    }, websocket: {
        async message(ws, message: Buffer) {
            if (!(await worker.verify(message))) {
                console.error('Invalid signature')
                return
            }

            const { uuid, plugin, method, args } = decodeWatermarkImageCall(
                new Sia(message).skip(9),
            )

            const resultImage = await sharp(args.image).toBuffer();

            const textedSVG = Buffer.from(
                `<svg height="40" width="200"> <text x="0" y="20" font-size="20" fill="#fff">${args.text}</text></svg>`)


            const watermarkedImageBuffer = await sharp(resultImage)
                .composite([
                    {
                        input: textedSVG,
                        gravity: isValidPosition(args.location) ? args.location : "southeast",
                    },
                ])
                .toBuffer();

            const response = await wallet.signSia(

                encodeWatermarkImageResponse(Sia.alloc(512), {
                    opcode: OpCodes.RPCResponse,
                    appId,
                    uuid,
                    ok: true,
                    watermarkedImage: watermarkedImageBuffer
                }),
            )
        }, // a message is received

        open() {
            console.info('Hey, a new connection just happend')
        }, // a socket is opened
        close(ws, code, message) { }, // a socket is closed
        drain(ws) { }, // the socket is ready to receive more data
    },
});

const watermarkPositions = [
    'north',
    'northeast',
    'east',
    'southeast',
    'south',
    'southwest',
    'west',
    'northwest',
    'center',
]

type WatermarkPosition = typeof watermarkPositions[number]

const isValidPosition = (pos: string): pos is WatermarkPosition => {
    return watermarkPositions.includes(pos as WatermarkPosition)
}