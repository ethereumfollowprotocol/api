import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import qrcode from 'qr-image'

import type { Services } from '#/service'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

const efplogoSVG = `
<rect width="12" height="12" rx="2" x="14" y="14" fill="#333333" />
<rect width="10" height="10" rx="2" x="15" y="15" fill="url(#grad-logo)" />
<rect width="10" height="10" rx="2" x="15" y="15" fill="white" fill-opacity="0.5" />
<path d="M3.62302 5.58664L5.4049995 2.4337845L7.398153 5.58664L5.4049995 6.73439175L3.62302 5.58664Z" fill="url(#paint1_linear_564_124)" transform="translate(14.5, 14.5)"/>
<path d="M3.62302 5.58664L5.4049995 2.4337845L7.398153 5.58664L5.4049995 6.73439175L3.62302 5.58664Z" fill="#333333" transform="translate(14.5, 14.5)"/>
<path d="M5.4049995 7.08007725L3.62302 5.932326L5.4049995 8.6012145L7.398153 5.932326L5.4049995 7.08007725Z" fill="url(#paint2_linear_564_124)" transform="translate(14.5, 14.5)"/>
<path d="M5.4049995 7.08007725L3.62302 5.932326L5.4049995 8.6012145L7.398153 5.932326L5.4049995 7.08007725Z" fill="#333333" transform="translate(14.5, 14.5)"/>
<path d="M7.9374555 7.49682225H7.398153V8.223864H6.651423H6.651423V8.7312105H7.398153V9.62638425H7.9374555V8.7312105H8.833887V8.223864H7.9374555V7.49682225Z" fill="url(#paint3_linear_564_124)" transform="translate(14.5, 14.5)"/>
<path d="M7.9374555 7.49682225H7.398153V8.223864H6.651423H6.651423V8.7312105H7.398153V9.62638425H7.9374555V8.7312105H8.833887V8.223864H7.9374555V7.49682225Z" fill="#333333" transform="translate(14.5, 14.5)"/>
`

const getGradientText = (nameOrAddress: string | Address) =>
  `<text width="100" height="5" y="41" x="50%" fill="#eeeeee">${
    isAddress(nameOrAddress)
      ? `${nameOrAddress.slice(0, 6)}…${nameOrAddress.slice(38, 42)}`
      : nameOrAddress.length > 18
        ? `${nameOrAddress.slice(0, 18)}…`
        : nameOrAddress
  }</text>`

const getProfileImage = async (ensAvatar: string) => {
  // Fetch the image data
  const res = await fetch(ensAvatar)
  if (!res.ok) {
    return '' // Return an empty string if the image cannot be fetched
  }
  // const arrayBuffer = await res.arrayBuffer()
  // const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
  // // Determine the image MIME type (assuming JPEG or PNG)
  // const contentType = res.headers.get('Content-Type') || 'image/png'

  return `<rect x="14.5" y="14.5" width="11" height="11" rx="2" fill="#333333" /><image width="10" height="10" x="15" rx="1" y="15" href="${ensAvatar}" /><rect x="14.5" y="14.5" width="11" height="11" rx="2" fill="transparent" stroke="#333333" stroke-width="1" />`
}

export function qr(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/qr', async context => {
    const { addressOrENS } = context.req.param()

    let address: Address
    let ensName: string | null = null
    let ensAvatar: string | undefined

    if (isAddress(addressOrENS)) {
      address = addressOrENS.toLowerCase() as Address
      const ensProfile = await services.ens(env(context)).getENSProfile(address)
      ensName = ensProfile.name
      ensAvatar = ensProfile.avatar
    } else {
      ensName = addressOrENS
      address = await services.ens(env(context)).getAddress(addressOrENS)
      ensAvatar = (await services.ens(env(context)).getENSProfile(address)).avatar
      if (!isAddress(address)) {
        return context.json({ response: 'ENS name not valid or does not exist' }, 404)
      }
    }

    const profileImageSVG = ensAvatar ? await getProfileImage(ensAvatar) : ''

    let image = qrcode.imageSync(`https://ethfollow.xyz/${address}`, { type: 'svg' }).toString('utf-8')
    image = image
      .replace(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 39 39">',
        `<svg xmlns="http://www.w3.org/2000/svg" height="100%" width="100%" viewBox="0 0 39 44">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#FFE067;stop-opacity:1" />
                <stop offset="80%" style="stop-color:#FFF7D9;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="grad-logo" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#FFE067;stop-opacity:1" />
              <stop offset="80%" style="stop-color:#FFF7D9;stop-opacity:1" />
            </linearGradient>
          </defs>
          <style>
            text {
              font-family: sans-serif;
              font-size: 3.5px;
              font-weight: bold;
              text-anchor: middle;
              dominant-baseline: middle;
            }
          </style>
        <rect width="100%" height="100%" fill="#333333"/>`
      )
      .replace(/<path/g, '<path fill="url(#grad1)" ')

    const svgWithLogo = image.replace(
      '</svg>',
      `${efplogoSVG}${profileImageSVG}${getGradientText(ensName || address)}</svg>`
    )

    context.header('Content-Type', 'image/svg+xml;charset=utf-8')
    return context.body(svgWithLogo)
  })
}
