import crypto from 'node:crypto';

const ZBASE32_ALPHABET = 'ybndrfg8ejkmcpqxot1uwisza345h769';

export function zBase32(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ZBASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ZBASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function splitEmailForWkd(email) {
  const value = String(email || '').trim();
  const at = value.lastIndexOf('@');
  if (at <= 0) return null;
  const localOriginal = value.slice(0, at);
  const domain = value.slice(at + 1).toLowerCase();
  const localMapped = localOriginal.replace(/[A-Z]/g, c => c.toLowerCase());
  const hu = zBase32(crypto.createHash('sha1').update(Buffer.from(localMapped, 'utf8')).digest());
  return { localOriginal, localMapped, domain, hu };
}

export function buildWkdUrls(email) {
  const parts = splitEmailForWkd(email);
  if (!parts) return null;
  const { localOriginal, domain, hu } = parts;
  return {
    ...parts,
    advancedHost: `openpgpkey.${domain}`,
    advancedUrl: `https://openpgpkey.${domain}/.well-known/openpgpkey/${domain}/hu/${hu}?l=${encodeURIComponent(localOriginal)}`,
    directUrl: `https://${domain}/.well-known/openpgpkey/hu/${hu}?l=${encodeURIComponent(localOriginal)}`
  };
}
