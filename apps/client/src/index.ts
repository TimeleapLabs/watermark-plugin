import { Client, Wallet } from '@timeleap/client'
import { Sia } from '@timeleap/sia'
import { WatermarkImage, type Args } from '@shared/models/watermarker'

const createClient = async () => {
    const wallet = await Wallet.random()
    const client = await Client.connect(wallet, {
        uri: process.env.BROKER_URI,
        publicKey: process.env.BROKER_PUBLIC_KEY,
    })
    const waterMarker = WatermarkImage.connect(client)

    return { client, waterMarker }
}

const { client, waterMarker } = await createClient()
const arrayBuffer = await Bun.file("debug.jpg").arrayBuffer();
const imageBuffer = new Uint8Array(arrayBuffer);

const args = { text: "test", location: "southwest", image: imageBuffer } as Args

const estimatedSize =
    imageBuffer.length +
    Buffer.byteLength(args.text, "ascii") +
    Buffer.byteLength(args.location, "ascii") +
    64;

const buffer = Sia.alloc(estimatedSize);

console.log('Sending request to worker...');
await waterMarker.addWatermarkToImage(buffer, args)
console.log('Request sent. Waiting for response...');

await new Promise(resolve => setTimeout(resolve, 10000)); // Waits for 10 seconds

client.close()
console.log('Client closed.');