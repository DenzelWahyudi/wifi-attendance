import { networkInterfaces } from "node:os"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import babel from "@rolldown/plugin-babel"
import { defineConfig, type Plugin, type ViteDevServer } from "vite"
import tailwindcss from "@tailwindcss/vite"
import { renderUnicodeCompact } from "uqr"

function getPreferredNetworkIp(): string | null {
    const interfaces = networkInterfaces()
    let wifiIp: string | null = null
    let ethernetIp: string | null = null
    let fallbackIp: string | null = null

    for (const [name, addrs] of Object.entries(interfaces)) {
        if (!addrs) continue
        for (const addr of addrs) {
            const isIpv4 =
                addr.family === "IPv4" || (addr as { family: number | string }).family === 4
            if (!isIpv4 || addr.internal) continue

            const lower = name.toLowerCase()
            const isVirtual =
                /vethernet|wsl|virtual|vbox|docker|tailscale|zerotier|loopback/i.test(lower)

            if (/wi-fi|wlan|wireless|airport/i.test(lower)) {
                wifiIp = addr.address
                break
            } else if (!isVirtual && /ethernet|eth|en\d/i.test(lower) && !ethernetIp) {
                ethernetIp = addr.address
            } else if (!isVirtual && !fallbackIp) {
                fallbackIp = addr.address
            }
        }
        if (wifiIp) break
    }

    return wifiIp || ethernetIp || fallbackIp
}

const preferredIp = getPreferredNetworkIp()

function terminalQrcode(
    options: {
        filter?: (url: string) => boolean
        indent?: string
        border?: number
    } = {}
): Plugin {
    return {
        name: "terminal-qrcode",
        apply: "serve",
        configureServer(server: ViteDevServer) {
            const originalListen = server.listen
            // @ts-expect-error override listen to hook server listening event
            server.listen = function (...args: unknown[]) {
                const isRestart = args[1] === true
                if (!isRestart) {
                    server.httpServer?.on("listening", () => {
                        setTimeout(() => {
                            let networkUrls = server.resolvedUrls?.network
                            if (!networkUrls) return
                            if (options.filter) {
                                networkUrls = networkUrls.filter(options.filter)
                            }
                            if (networkUrls.length === 0) return

                            const indent = options.indent ?? "    "
                            const border = options.border ?? 2
                            const info = server.config.logger.info

                            info(`\n${indent}📱 Visit page on mobile:`)
                            for (const url of networkUrls) {
                                const qr = renderUnicodeCompact(url, { border })
                                const paddedQr = qr
                                    .split("\n")
                                    .map((line) => `${indent}${line}`)
                                    .join("\n")
                                info(`${indent}\x1b[36m${url}\x1b[0m\n\n${paddedQr}\n`)
                            }
                        }, 0)
                    })
                }
                // @ts-expect-error pass through arguments
                return originalListen.apply(this, args)
            }
        }
    }
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        babel({ presets: [reactCompilerPreset()] }),
        tailwindcss(),
        terminalQrcode({
            border: 2,
            indent: "    ",
            filter: (url) => (preferredIp ? url.includes(preferredIp) : true)
        })
    ],
    server: {
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: false,
                xfwd: true
            }
        }
    }
})
