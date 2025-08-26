import { Sia } from "@timeleap/sia";
import { Client, Function } from "@timeleap/client";

export interface Args {
  text: string;
  location: string;
  image: Uint8Array | Buffer;
}

export function encodeArgs(sia: Sia, args: Args): Sia {
  sia.addString8(args.text);
  sia.addString8(args.location);
  sia.addByteArray32(args.image);
  return sia;
}

export function decodeArgs(sia: Sia): Args {
  return {
    text: sia.readString8(),
    location: sia.readString8(),
    image: sia.readByteArray32(),
  };
}

export interface Fee {
  amount: number;
  currency: string;
}

export function encodeFee(sia: Sia, fee: Fee): Sia {
  sia.addUInt64(fee.amount);
  sia.addString8(fee.currency);
  return sia;
}

export function decodeFee(sia: Sia): Fee {
  return {
    amount: sia.readUInt64(),
    currency: sia.readString8(),
  };
}

export interface WatermarkImageCall {
  uuid: Uint8Array | Buffer;
  plugin: string;
  method: string;
  timeout: number;
  fee: Fee;
  args: Args;
}

export function encodeWatermarkImageCall(
  sia: Sia,
  watermarkImageCall: WatermarkImageCall,
): Sia {
  sia.addByteArray8(watermarkImageCall.uuid);
  sia.addString8(watermarkImageCall.plugin);
  sia.addString8(watermarkImageCall.method);
  sia.addUInt64(watermarkImageCall.timeout);
  encodeFee(sia, watermarkImageCall.fee);
  encodeArgs(sia, watermarkImageCall.args);
  return sia;
}

export function decodeWatermarkImageCall(sia: Sia): WatermarkImageCall {
  return {
    uuid: sia.readByteArray8(),
    plugin: sia.readString8(),
    method: sia.readString8(),
    timeout: sia.readUInt64(),
    fee: decodeFee(sia),
    args: decodeArgs(sia),
  };
}

export interface WatermarkImageResponse {
  opcode: number;
  appId: number;
  uuid: Uint8Array | Buffer;
  error?: number;
  ok?: boolean;
  watermarkedImage?: Uint8Array | Buffer;
}

export function encodeWatermarkImageResponse(
  sia: Sia,
  watermarkImageResponse: WatermarkImageResponse,
): Sia {
  sia.addUInt8(watermarkImageResponse.opcode);
  sia.addUInt64(watermarkImageResponse.appId);
  sia.addByteArray8(watermarkImageResponse.uuid);
  sia.addUInt16(watermarkImageResponse.error ?? 0);
  sia.addBool(watermarkImageResponse.ok ?? false);
  sia.addByteArray32(
    watermarkImageResponse.watermarkedImage ?? new Uint8Array(0),
  );
  return sia;
}

export function decodeWatermarkImageResponse(sia: Sia): WatermarkImageResponse {
  return {
    opcode: sia.readUInt8(),
    appId: sia.readUInt64(),
    uuid: sia.readByteArray8(),
    error: sia.readUInt16(),
    ok: sia.readBool(),
    watermarkedImage: sia.readByteArray32(),
  };
}

export class WatermarkImage {
  private methods: Map<string, Function> = new Map();
  private pluginName = "swiss.timeleap.watermarker";

  constructor(private client: Client) {}

  static connect(client: Client): WatermarkImage {
    return new WatermarkImage(client);
  }

  private getMethod(
    method: string,
    timeout: number,
    fee: { currency: string; amount: number },
  ): Function {
    if (!this.methods.has(method)) {
      this.methods.set(
        method,
        this.client.method({
          plugin: this.pluginName,
          method,
          timeout,
          fee,
        }),
      );
    }
    return this.methods.get(method)!;
  }

  public async addWatermarkToImage(
    sia: Sia,
    args: Args,
  ): Promise<{
    ok: boolean;
    watermarkedImage: Uint8Array | Buffer;
  }> {
    encodeArgs(sia, args);
    const method = this.getMethod("addWatermarkToImage", 5000, {
      currency: "USD",
      amount: 1,
    });
    const response = await method.populate(sia).invoke();
    const respOk = response.readBool();
    const respWatermarkedImage = response.readByteArray32();
    return {
      ok: respOk,
      watermarkedImage: respWatermarkedImage,
    };
  }
}
