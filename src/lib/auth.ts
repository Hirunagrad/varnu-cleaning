import { SignJWT, jwtVerify } from "jose";
import { User } from "./types";

const secretKey = process.env.JWT_SECRET || "default_super_secret_key_change_me_in_prod";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: { user: User; expires: Date }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(payload.expires)
    .sign(key);
}

export async function decrypt(input: string): Promise<{ user: User; expires: string } | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload as { user: User; expires: string };
  } catch (err) {
    return null;
  }
}
