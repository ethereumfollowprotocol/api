import * as photon from '@cf-wasm/photon'
import { AwsClient } from 'aws4fetch'
import type { Environment } from '#/types/index'

import type { Address } from '#/types'

export interface IS3Cache {
  cacheImage: (imageUrl: string, address: Address) => Promise<string>
}

export class S3Cache implements IS3Cache {
  aws: {
    fetch(input: Request | string, init: {}): Promise<Response>
  }
  endpoint: string

  constructor(env: Environment) {
    this.aws = new AwsClient({
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_ACCESS_KEY_SECRET
    })
    this.endpoint = `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/`
  }

  async cacheImage(imageURL: string, address: Address): Promise<string> {
    //get image
    const inputBytes = await fetch(imageURL)
      .then(res => res.arrayBuffer())
      .then(buffer => new Uint8Array(buffer))

    const inputImage = photon.PhotonImage.new_from_byteslice(inputBytes)

    //resize
    const height = 500
    const width = 500

    const outputImage = photon.resize(inputImage, height, width, 1 as unknown as typeof photon.SamplingFilter)
    const outputBytes = outputImage.get_bytes()
    inputImage.free()
    outputImage.free()

    //upload
    const fileTarget = `${this.endpoint}${address.toLowerCase()}.png`
    const _result = await this.aws.fetch(fileTarget, {
      body: outputBytes,
      method: 'PUT',
      headers: {
        'Content-Type': 'image/png'
      }
    })
    // check result

    return `${this.endpoint}${address.toLowerCase()}.png`
  }
}
