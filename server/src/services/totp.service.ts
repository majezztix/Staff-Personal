import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import { env } from '../lib/env.js'

export function generateSecret(label: string) {
  const secret = speakeasy.generateSecret({
    name: `${env.TOTP_ISSUER} (${label})`,
    issuer: env.TOTP_ISSUER,
    length: 20,
  })
  return {
    base32: secret.base32,
    otpauthUrl: secret.otpauth_url!,
  }
}

export async function toQrDataUrl(otpauthUrl: string): Promise<string> {
  return qrcode.toDataURL(otpauthUrl, { width: 256, margin: 1 })
}

export function verifyToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  })
}
