import { Client, Wallet } from '@timeleap/client'
import { Sia } from '@timeleap/sia'
import { WatermarkImage, type Args } from '@repo/models/watermarker'

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
