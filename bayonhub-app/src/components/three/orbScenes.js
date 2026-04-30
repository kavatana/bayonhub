import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera.js"
import { Float32BufferAttribute } from "three/src/core/BufferAttribute.js"
import { Color } from "three/src/math/Color.js"
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial.js"
import { Mesh } from "three/src/objects/Mesh.js"
import { Scene } from "three/src/scenes/Scene.js"
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js"

const CUBE_VERTICES = [
  -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1,
  1, -1, -1, -1, -1, -1, -1, 1, -1, 1, -1, -1, -1, 1, -1, 1, 1, -1,
  -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, -1, 1, 1, -1, 1, -1,
  1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, -1, 1, 1, 1,
  -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, -1, 1, -1,
  -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, -1, 1, -1, 1, -1, -1, 1,
]

function createRenderer(host, camera) {
  const renderer = new SVGRenderer()
  const resizeObserver = new ResizeObserver(() => {
    const width = host.clientWidth || 200
    const height = host.clientHeight || 200
    renderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  })

  host.appendChild(renderer.domElement)
  resizeObserver.observe(host)

  return { renderer, resizeObserver }
}

function createWireCube(size, material) {
  const mesh = new Mesh(undefined, material)
  mesh.geometry.setAttribute("position", new Float32BufferAttribute(CUBE_VERTICES, 3))
  mesh.scale.set(size, size, size)
  return mesh
}

export function mountHeroOrbScene(host) {
  const targetRotation = { x: 0, y: 0 }
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, 1, 0.1, 100)
  const primaryColor = new Color(getComputedStyle(host).color)
  const material = new MeshBasicMaterial({
    color: primaryColor,
    transparent: true,
    opacity: 0.84,
    wireframe: true,
  })
  const mesh = createWireCube(1.45, material)
  const { renderer, resizeObserver } = createRenderer(host, camera)
  let frameId = 0

  camera.position.z = 6
  scene.add(mesh)

  const handleMouseMove = (event) => {
    targetRotation.x = (event.clientY / window.innerHeight - 0.5) * 0.3
    targetRotation.y = (event.clientX / window.innerWidth - 0.5) * 0.3
  }

  window.addEventListener("mousemove", handleMouseMove, { passive: true })

  const animate = () => {
    mesh.rotation.x += (targetRotation.x - mesh.rotation.x) * 0.05
    mesh.rotation.y += 0.004 + (targetRotation.y - mesh.rotation.y) * 0.05
    renderer.render(scene, camera)
    frameId = window.requestAnimationFrame(animate)
  }
  animate()

  return () => {
    window.cancelAnimationFrame(frameId)
    window.removeEventListener("mousemove", handleMouseMove)
    resizeObserver.disconnect()
    mesh.geometry.dispose()
    material.dispose()
    renderer.dispose?.()
    renderer.domElement.remove()
  }
}

export function mountEmptyOrbScene(host) {
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, 1, 0.1, 100)
  const primaryColor = new Color(getComputedStyle(host).color)
  const material = new MeshBasicMaterial({
    color: primaryColor,
    transparent: true,
    opacity: 0.76,
    wireframe: true,
  })
  const mesh = createWireCube(0.95, material)
  const { renderer, resizeObserver } = createRenderer(host, camera)
  const startedAt = performance.now()
  let frameId = 0

  camera.position.z = 4
  scene.add(mesh)

  const animate = () => {
    const elapsed = (performance.now() - startedAt) / 1000
    mesh.position.y = Math.sin(elapsed * 1.2) * 0.12
    mesh.rotation.y += 0.01
    renderer.render(scene, camera)
    frameId = window.requestAnimationFrame(animate)
  }
  animate()

  return () => {
    window.cancelAnimationFrame(frameId)
    resizeObserver.disconnect()
    mesh.geometry.dispose()
    material.dispose()
    renderer.dispose?.()
    renderer.domElement.remove()
  }
}
