import { createHash, randomInt } from 'node:crypto';

export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

export function generateSecurePassword(length = 24): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';

  for (let i = 0; i < length; i += 1) {
    result += chars[randomInt(chars.length)];
  }

  return result;
}
