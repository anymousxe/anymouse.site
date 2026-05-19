// Vercel serverless function — receives commission requests and forwards to Discord
// Webhook URL is stored in env var DISCORD_WEBHOOK_URL (never exposed to client)

const RATE_LIMIT = new Map() // ip -> { count, resetAt }
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 3

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(405).json({ error: 'method not allowed' })
    }

    // simple ip rate limit
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
        .toString()
        .split(',')[0]
        .trim()
    const now = Date.now()
    const entry = RATE_LIMIT.get(ip)
    if (entry && entry.resetAt > now) {
        if (entry.count >= RATE_MAX) {
            return res.status(429).json({ error: 'too many requests, slow down' })
        }
        entry.count++
    } else {
        RATE_LIMIT.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    }

    let body = req.body
    if (typeof body === 'string') {
        try { body = JSON.parse(body) } catch { body = {} }
    }
    if (!body || typeof body !== 'object') body = {}

    const name = String(body.name || '').trim().slice(0, 100)
    const contact = String(body.contact || '').trim().slice(0, 150)
    const type = String(body.type || '').trim().slice(0, 60)
    const budget = String(body.budget || '').trim().slice(0, 80)
    const details = String(body.details || '').trim().slice(0, 2500)

    if (!name || !contact || !type || !details) {
        return res.status(400).json({ error: 'missing required fields' })
    }

    if (details.length < 20) {
        return res.status(400).json({ error: 'please describe what you want in a bit more detail (at least 20 chars)' })
    }

    // contact must look like an email, discord username, or twitter handle
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact)
    const isDiscord = /^@?[a-z0-9._]{2,32}$/i.test(contact) && !contact.includes(' ')
    const isTwitter = /^@?[a-z0-9_]{1,15}$/i.test(contact) && !contact.includes(' ')

    if (!isEmail && !isDiscord && !isTwitter) {
        return res.status(400).json({ error: 'contact must be a real email, discord username, or twitter @handle' })
    }

    // basic spam check — block obvious junk
    const junkPattern = /^(test|asdf|qwerty|aaaa|hello|hi|none|n\/a)$/i
    if (junkPattern.test(name) || junkPattern.test(contact)) {
        return res.status(400).json({ error: 'please use a real name and contact' })
    }

    const webhook = process.env.DISCORD_WEBHOOK_URL
    if (!webhook) {
        console.error('DISCORD_WEBHOOK_URL not set')
        return res.status(500).json({ error: 'server not configured' })
    }

    const embed = {
        title: 'new commission request',
        color: 0xf0f0f0,
        fields: [
            { name: 'name', value: name, inline: true },
            { name: 'contact', value: contact, inline: true },
            { name: 'type', value: type, inline: true },
            { name: 'budget', value: budget || '(not specified)', inline: true },
            { name: 'details', value: details.slice(0, 1024) },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: `ip: ${ip}` },
    }

    try {
        const r = await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'anymouse.site commissions',
                embeds: [embed],
            }),
        })
        if (!r.ok) {
            const text = await r.text().catch(() => '')
            console.error('discord webhook failed', r.status, text)
            return res.status(502).json({ error: 'failed to deliver' })
        }
        return res.status(200).json({ ok: true })
    } catch (e) {
        console.error('webhook error', e)
        return res.status(500).json({ error: 'unexpected error' })
    }
}
