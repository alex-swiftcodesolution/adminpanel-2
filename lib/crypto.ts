import CryptoJS from "crypto-js";

/**
 * Decrypt a ticket_key returned by Tuya.
 * @param encryptedKey  hex string from Tuya
 * @param accessKey     your Tuya accessKey (plain string)
 */
export function decryptTicketKey(
  encryptedKey: string,
  accessKey: string
): string {
  const key = CryptoJS.enc.Utf8.parse(accessKey);
  const iv = CryptoJS.enc.Utf8.parse(accessKey.slice(0, 16)); // first 16 bytes as IV

  // Pass encryptedKey directly as base64-like string (CryptoJS handles hex via fromHex)
  const decrypted = CryptoJS.AES.decrypt(
    CryptoJS.enc.Hex.parse(encryptedKey).toString(CryptoJS.enc.Base64),
    key,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );
  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Encrypt a plain password with a ticket_key.
 * @param plainPassword  password the user typed
 * @param ticketKey      decrypted ticket_key
 */
export function encryptPasswordWithTicket(
  plainPassword: string,
  ticketKey: string
): string {
  const key = CryptoJS.enc.Utf8.parse(ticketKey);
  const iv = CryptoJS.enc.Utf8.parse(ticketKey.slice(0, 16));

  const encrypted = CryptoJS.AES.encrypt(plainPassword, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
}
