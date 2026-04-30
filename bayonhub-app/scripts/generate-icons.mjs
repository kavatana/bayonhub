import { createCanvas } from "canvas"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const outputDir = resolve(__dirname, "../public/icons")

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const context = canvas.getContext("2d")
  const radius = size * 0.2

  context.beginPath()
  context.moveTo(radius, 0)
  context.lineTo(size - radius, 0)
  context.quadraticCurveTo(size, 0, size, radius)
  context.lineTo(size, size - radius)
  context.quadraticCurveTo(size, size, size - radius, size)
  context.lineTo(radius, size)
  context.quadraticCurveTo(0, size, 0, size - radius)
  context.lineTo(0, radius)
  context.quadraticCurveTo(0, 0, radius, 0)
  context.closePath()
  context.clip()

  context.fillStyle = "#E53935"
  context.fillRect(0, 0, size, size)

  context.fillStyle = "#ffffff"
  context.font = `bold ${Math.round(size * 0.56)}px Arial, Helvetica, sans-serif`
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText("B", size / 2, size / 2 + size * 0.02)

  return canvas.toBuffer("image/png")
}

await mkdir(outputDir, { recursive: true })
await writeFile(resolve(outputDir, "icon-192.png"), drawIcon(192))
await writeFile(resolve(outputDir, "icon-512.png"), drawIcon(512))
