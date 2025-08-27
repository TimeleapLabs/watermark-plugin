import { Client, Wallet } from '@timeleap/client'
import { Sia } from '@timeleap/sia'
import { WatermarkImage, type Args } from '@shared/models/watermarker'

import { Busboy } from '@fastify/busboy';
import { Readable } from 'node:stream';

interface ParsedFormData {
    file: Uint8Array;
    type: string;
    fields: { [key: string]: string };
}

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

Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);

        if (req.method === 'POST' && url.pathname === '/watermark') {
            try {
                const formData = await new Promise<ParsedFormData>((resolve, reject) => {
                    const busboy = new Busboy({ headers: { 'content-type': req.headers.get('content-type') as string } });
                    const formFields: { [key: string]: string } = {};
                    let fileBuffer: Uint8Array | null = null;
                    let fileType: string | null = null;

                    busboy.on('file', (name, fileStream, info) => {
                        const chunks: Uint8Array[] = [];
                        fileStream.on('data', chunk => chunks.push(chunk));
                        fileStream.on('end', () => {
                            fileBuffer = new Uint8Array(Buffer.concat(chunks));
                            fileType = (info as unknown as { mimeType: string }).mimeType;
                        });
                        fileStream.on('error', reject);
                    });

                    busboy.on('field', (name, value, info) => {
                        formFields[name] = value;
                    });

                    busboy.on('finish', () => {
                        if (fileBuffer && fileType) {
                            resolve({
                                file: fileBuffer,
                                type: fileType,
                                fields: formFields
                            });
                        } else {
                            reject(new Error('File upload failed.'));
                        }
                    });

                    busboy.on('error', reject);

                    if (req.body) {
                        Readable.fromWeb(req.body).pipe(busboy);
                    } else {
                        reject(new Error('Request body is empty.'));
                    }
                });

                const imageBuffer = formData.file;
                const fileType = formData.type;
                const watermarkText = formData.fields.watermarkText as string;
                const location = formData.fields.location as string;

                if (!imageBuffer) {
                    return new Response('No valid image file provided.', { status: 400 });
                }

                const args = {
                    text: watermarkText || 'Default',
                    location: location || 'southeast',
                    image: imageBuffer
                } as Args;

                // Estimate the response size for Sia buffer allocation
                const estimatedSize =
                    imageBuffer.length +
                    Buffer.byteLength(args.text, "ascii") +
                    Buffer.byteLength(args.location, "ascii") +
                    64;

                const buffer = Sia.alloc(estimatedSize);

                console.log('Receiving request via web, sending to worker...');

                // Call the watermarking function and await the response
                const response = await waterMarker.addWatermarkToImage(buffer, args);

                if (response.ok) {
                    console.log('Successfully received watermarked image from worker.');
                    // Return the watermarked image data as a proper HTTP response
                    return new Response(response.watermarkedImage, {
                        headers: {
                            'Content-Type': fileType,
                            'Content-Disposition': 'inline; filename="watermarked.jpg"'
                        }
                    });
                } else {
                    console.error('Operation failed.');
                    return new Response('Watermarking operation failed.', { status: 500 });
                }

            } catch (error) {
                console.error('An error occurred:', error);
                return new Response('An error occurred during watermarking.', { status: 500 });
            }
        }

        return new Response(Bun.file('./ui/index.html'), {
            headers: {
                'Content-Type': 'text/html'
            }
        });
    },
});

console.log('Server listening on http://localhost:3000');
console.log('Open http://localhost:3000 in your browser to start.');
