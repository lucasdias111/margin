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

export function verifyRoomToken(token: string, expectedRoomId: string): void {
    const claims = jwt.verify(token, sfuTokenSecret, { algorithms: ['HS256'] }) as any
    if (String(claims.roomId) !== String(expectedRoomId)) {
        throw new Error('Token roomId does not match')
    }
}

export function requireInternalApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
    const key = req.headers['x-internal-api-key']
    if (!key || key !== internalApiKey) {
        return res.status(403).json({ error: 'Forbidden' })
    }
    next()
}