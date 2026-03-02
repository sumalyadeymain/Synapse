// This runs once before any requests — forces ALL Node.js fetch (undici) to use IPv4
// Fixes "TypeError: fetch failed" in route handlers when ISP/network blocks IPv6

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const dns = require('node:dns')
        dns.setDefaultResultOrder('ipv4first')

        const { setGlobalDispatcher, Agent } = await import('undici')
        setGlobalDispatcher(new Agent({
            connect: { family: 4 }, // Force IPv4 for all outbound fetch calls
        }))
        console.log('[instrumentation] ✅ Forced Node DNS and undici global dispatcher to IPv4')
    }
}
