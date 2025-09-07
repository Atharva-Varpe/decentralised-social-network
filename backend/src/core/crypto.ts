import * as crypto from 'crypto';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export async function generateKeyPair(): Promise<KeyPair> {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    }, (err, publicKey, privateKey) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          publicKey: publicKey.replace(/\n/g, '').replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, ''),
          privateKey
        });
      }
    });
  });
}

export function signMessage(message: string, privateKey: string): string {
  const sign = crypto.createSign('SHA256');
  sign.update(message);
  sign.end();
  return sign.sign(privateKey, 'hex');
}

export function verifySignature(message: string, signature: string, publicKey: string): boolean {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(message);
    verify.end();
    const fullPublicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
    return verify.verify(fullPublicKey, signature, 'hex');
  } catch (error) {
    return false;
  }
}

export function hashMessage(message: string): string {
  return crypto.createHash('sha256').update(message).digest('hex');
}
