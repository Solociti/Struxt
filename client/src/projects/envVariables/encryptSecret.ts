/**
 * Converts a hex string to a Uint8Array.
 *
 * @param hex
 */
function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(hex.length / 2);
  const result = new Uint8Array(buf);
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return result;
}

/**
 * Converts a Uint8Array to a lowercase hex string.
 *
 * @param bytes
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Encrypts a secret value client-side using hybrid X25519 + AES-256-GCM.
 * The server never sees the plaintext — only the ephemeral public key and cipher text are sent.
 *
 * Encrypted format: iv (12 bytes) || cipher text || authTag (16 bytes).
 *
 * @param projectPublicKeyHex Raw 32-byte X25519 public key from the server.
 * @param plaintext
 */
export async function encryptSecret(
  projectPublicKeyHex: string,
  plaintext: string,
): Promise<{ ephemeralPublicKeyHex: string; encryptedValueHex: string }> {
  const subtle = crypto.subtle;

  const serverPublicKey = await subtle.importKey(
    "raw",
    hexToBytes(projectPublicKeyHex),
    { name: "X25519" },
    false,
    [],
  );

  const ephemeralKeyPair = (await subtle.generateKey({ name: "X25519" }, true, [
    "deriveKey",
  ])) as CryptoKeyPair;

  const aesKey = await subtle.deriveKey(
    { name: "X25519", public: serverPublicKey },
    ephemeralKeyPair.privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherText = await subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoded,
  );

  const combined = new Uint8Array(12 + cipherText.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherText), 12);

  const ephemeralRaw = new Uint8Array(
    await subtle.exportKey("raw", ephemeralKeyPair.publicKey),
  );

  return {
    ephemeralPublicKeyHex: bytesToHex(ephemeralRaw),
    encryptedValueHex: bytesToHex(combined),
  };
}
