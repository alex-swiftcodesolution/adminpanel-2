// src/lib/crypto.ts
import CryptoJS from "crypto-js";

export const decryptTicketKey = (
  encryptedKey: string,
  accessKey: string
): string => {
  if (!encryptedKey || !accessKey) {
    throw new Error("Missing encryptedKey or accessKey");
  }

  const md5Hash = CryptoJS.MD5(accessKey).toString();
  const key = CryptoJS.enc.Hex.parse(md5Hash);
  const iv = CryptoJS.enc.Hex.parse(md5Hash.slice(0, 32));

  let ciphertext: string;
  try {
    ciphertext = CryptoJS.enc.Hex.parse(encryptedKey).toString(
      CryptoJS.enc.Base64
    );
  } catch {
    throw new Error("Invalid hex format in ticket_key");
  }

  const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // Get raw WordArray
  const wordArray = decrypted as CryptoJS.lib.WordArray;

  // Force to 16 bytes (32 hex chars), pad with 0 if needed
  const bytes = wordArray.sigBytes;
  if (bytes === 0) throw new Error("Decryption failed");

  const hex = wordArray.toString(CryptoJS.enc.Hex);
  const paddedHex = hex.padEnd(32, "0").slice(0, 32); // exactly 32 chars

  return paddedHex;
};

/*
export const encryptPasswordWithTicket = (
  plainPassword: string,
  ticketKeyHex: string
): string => {
  if (!ticketKeyHex || ticketKeyHex.length !== 32) {
    throw new Error(
      `Invalid ticketKey: must be 32 hex chars, got ${ticketKeyHex?.length}`
    );
  }

  const key = CryptoJS.enc.Hex.parse(ticketKeyHex);
  const iv = CryptoJS.enc.Hex.parse(ticketKeyHex); // full 16 bytes

  const encrypted = CryptoJS.AES.encrypt(plainPassword, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
};
*/

export const encryptPasswordWithTicket = (
  plainPassword: string,
  ticketKeyHex: string
): string => {
  if (!ticketKeyHex || ticketKeyHex.length !== 32) {
    throw new Error(
      `Invalid ticketKey: must be 32 hex chars, got ${ticketKeyHex?.length}`
    );
  }

  // Wi-Fi lock requires exactly 7 characters - DO NOT pad with "0"
  // Just validate and trim/reject if wrong length
  if (plainPassword.length !== 7) {
    throw new Error(
      `Password must be exactly 7 characters, got ${plainPassword.length}`
    );
  }

  const key = CryptoJS.enc.Hex.parse(ticketKeyHex);

  // Encrypt the plain text password (CryptoJS will handle PKCS7 padding automatically)
  const encrypted = CryptoJS.AES.encrypt(plainPassword, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });

  return encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();
};
