import jwt from 'jsonwebtoken'
import express from "express";

const SFU_TOKEN_SECRET = process.env.SFU_SECRET
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

if (!SFU_TOKEN_SECRET || !INTERNAL_API_KEY) {
    console.error('Missing required environment variables: SFU_TOKEN_SECRET, INTERNAL_API_KEY')
    process.exit(1)
}

const sfuTokenSecret: string = SFU_TOKEN_SECRET!
export const internalApiKey: string = INTERNAL_API_KEY!

const allowedOrigins: string[] = (process.env.SFU_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(o => o.trim())
    .filter(o => o.length > 0)

if (allowedOrigins.length === 0) {
    console.warn('SFU_ALLOWED_ORIGINS is unset — accepting WebSocket upgrades from any origin')
}

export interface RoomTokenClaims {
    userId: string
    roomId: string
    displayName?: string
}

export function verifyRoomToken(token: string, expectedRoomId: string, expectedPeerId: string): RoomTokenClaims {
    const claims = jwt.verify(token, sfuTokenSecret, {algorithms: ['HS256']}) as any

    if (String(claims.roomId) !== String(expectedRoomId)) {
        throw new Error('Token roomId does not match')
    }
    if (String(claims.userId) !== String(expectedPeerId)) {
        throw new Error('Token userId does not match the claimed peerId')
    }

    return {
        userId: String(claims.userId),
        roomId: String(claims.roomId),
        displayName: claims.displayName
    }
}

export function isOriginAllowed(origin: string | undefined): boolean {
    if (allowedOrigins.length === 0) return true
    if (!origin) return true
    return allowedOrigins.includes(origin)
}

export function requireInternalApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
    const key = req.headers['x-internal-api-key']
    if (!key || key !== internalApiKey) {
        return res.status(403).json({ error: 'Forbidden' })
    }
    next()
}
