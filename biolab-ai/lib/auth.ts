import { SignJWT, jwtVerify } from "jose";
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "@/lib/constants";

// The secrets must be Uint8Array for jose
const accessTokenSecret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET ?? "dev-access-secret");
const refreshTokenSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret");

export interface TokenPayload {
    userId: string;
    role: string;
    email: string;
}

// Helper: Convert ArrayBuffer to Hex String
function bufferToHex(buffer: ArrayBuffer | ArrayBufferView) {
    const bytes = ArrayBuffer.isView(buffer) ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) : new Uint8Array(buffer);
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

// Helper: Convert Hex String to ArrayBuffer
function hexToBuffer(hex: string) {
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes.buffer;
}

// Cloudflare Edge compatible password hashing using PBKDF2
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    const hash = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        256
    );

    return bufferToHex(salt) + ":" + bufferToHex(hash);
}

// Verify password against PBKDF2 hash
export async function comparePassword(password: string, hashed: string): Promise<boolean> {
    const [saltHex, hashHex] = hashed.split(":");
    if (!saltHex || !hashHex) return false;

    const encoder = new TextEncoder();
    const salt = hexToBuffer(saltHex);
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    const hashToVerify = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        256
    );

    return bufferToHex(hashToVerify) === hashHex;
}

export async function issueAccessToken(payload: TokenPayload) {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(`${ACCESS_TOKEN_MAX_AGE}s`)
        .sign(accessTokenSecret);
}

export async function issueRefreshToken(payload: TokenPayload) {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(`${REFRESH_TOKEN_MAX_AGE}s`)
        .sign(refreshTokenSecret);
}

export async function verifyAccessToken(token: string) {
    const { payload } = await jwtVerify(token, accessTokenSecret);
    return payload as unknown as TokenPayload;
}

export async function verifyRefreshToken(token: string) {
    const { payload } = await jwtVerify(token, refreshTokenSecret);
    return payload as unknown as TokenPayload;
}

export async function hashToken(token: string) {
    return await hashPassword(token);
}

export async function compareToken(token: string, hashed: string) {
    return await comparePassword(token, hashed);
}
