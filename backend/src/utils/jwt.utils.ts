

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

type Role = "user" | "doctor" | "admin";

interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}


export const generateAccessToken = (id: string, email: string, role: Role) => {
  return jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: "24h" });
};


export const generateRefreshToken = (id: string, role?: Role) => {
  return jwt.sign({ id, role }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};


export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};


export const verifyRefreshToken = (token: string): { id: string; role?: Role } => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { id: string; role?: Role };
};

