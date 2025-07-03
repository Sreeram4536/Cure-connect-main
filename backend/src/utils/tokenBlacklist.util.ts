import BlacklistedToken from '../models/tokenBlacklistModel';
import { JwtPayload } from "jsonwebtoken";

export async function addTokenToBlacklist(token: string, expiresAt: Date) {
  await BlacklistedToken.create({ token, expiresAt });
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const found = await BlacklistedToken.findOne({ token });
  return !!found;
}

export async function removeTokenFromBlacklist(token: string) {
  await BlacklistedToken.deleteOne({ token });
}
