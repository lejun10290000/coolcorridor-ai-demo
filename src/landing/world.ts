import * as THREE from 'three'

export type LandingQuality = 'high' | 'balanced' | 'fallback'
export type LandingChapter = 0 | 1 | 2

export interface TownshipWorld {
  scene: THREE.Scene
  update: (seconds: number, chapter: LandingChapter) => void
  setQuality: (quality: LandingQuality) => void
  dispose: () => void
}

const ground = new THREE.MeshStandardMaterial({ color: '#24342d', roughness: 0.96 })
const pathSurface = new THREE.MeshStandardMaterial({ color: '#b9a388', roughness: 0.9 })
const pathEdge = new THREE.MeshStandardMaterial({ color: '#e2c49a', roughness: 0.76, metalness: 0.08 })
const buildingMaterials = ['#bca38e', '#a89188', '#9c8b88', '#c6b8a4', '#776977'].map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.83, metalness: 0.06 }))
const roofMaterial = new THREE.MeshStandardMaterial({ color: '#403c43', roughness: 0.78 })
const glassMaterial = new THREE.MeshStandardMaterial({ color: '#f3c990', emissive: '#a4692b', emissiveIntensity: 0.46, roughness: 0.3, metalness: 0.18 })
const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#544133', roughness: 1 })
const foliageMaterials = ['#355e42', '#426d4b', '#55774b', '#294c3e'].map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.95 }))
const routeColors = ['#70e8bc', '#f9be66', '#f0766b']
type WindowInstance = { x: number; y: number; z: number; w: number; h: number; d: number }
type TreeInstance = { x: number; z: number; scale: number; materialIndex: number; index: number }
const unitBox = new THREE.BoxGeometry(1, 1, 1)
const trunkGeometry = new THREE.CylinderGeometry(0.12, 0.2, 2.35, 7)
const crownGeometries = [1.02, 1.06, 0.9].map(radius => new THREE.IcosahedronGeometry(radius, 1))

function random(seed: number) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

function box(parent: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number, cast = false) {
  const mesh = new THREE.Mesh(unitBox, material)
  mesh.position.set(x, y, z)
  mesh.scale.set(w, h, d)
  mesh.castShadow = cast
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function makeBuilding(parent: THREE.Object3D, x: number, z: number, w: number, d: number, h: number, index: number, windows: WindowInstance[]) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  parent.add(group)
  box(group, w, h, d, buildingMaterials[index % buildingMaterials.length], 0, h / 2, 0, true)
  box(group, w + 0.32, 0.16, d + 0.32, roofMaterial, 0, h + 0.08, 0, true)
  box(group, w + 0.48, 0.12, d + 0.48, pathEdge, 0, 0.18, 0)
  const floors = Math.max(2, Math.floor(h / 1.38))
  const frontColumns = Math.max(2, Math.floor(w / 1.12))
  for (let floor = 0; floor < floors; floor++) {
    const yy = 0.85 + floor * ((h - 1.4) / Math.max(1, floors - 1))
    for (let col = 0; col < frontColumns; col++) {
      const xx = -w / 2 + (col + 0.5) * w / frontColumns
      if ((floor + col + index) % 6 !== 0) windows.push({ x: x + xx, y: yy, z: z + d / 2 + 0.02, w: 0.36, h: 0.5, d: 0.035 })
      if ((floor + col + index) % 7 !== 0) windows.push({ x: x + xx, y: yy, z: z - d / 2 - 0.02, w: 0.36, h: 0.5, d: 0.035 })
    }
    const sideColumns = Math.max(2, Math.floor(d / 1.3))
    for (let col = 0; col < sideColumns; col++) {
      const zz = -d / 2 + (col + 0.5) * d / sideColumns
      windows.push({ x: x + w / 2 + 0.02, y: yy, z: z + zz, w: 0.035, h: 0.5, d: 0.36 })
    }
  }
  box(group, w * 0.22, 0.5, d * 0.25, roofMaterial, -w * 0.22, h + 0.4, 0, true)
}

function makeTreeInstances(parent: THREE.Object3D, records: TreeInstance[]) {
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, records.length)
  const crowns = foliageMaterials.map((material, materialIndex) => {
    const count = records.filter(record => record.materialIndex === materialIndex).length
    return crownGeometries.map(geometry => new THREE.InstancedMesh(geometry, material, count))
  })
  trunks.castShadow = true
  parent.add(trunks)
  crowns.flat().forEach(mesh => { mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh) })
  const instance = new THREE.Object3D()
  const crownOffsets = [[-0.42, 3.0, 0], [0.5, 3.25, 0.22], [0.05, 3.65, -0.2]]
  const setQuality = (quality: LandingQuality) => {
    const materialCounts = foliageMaterials.map(() => 0)
    records.forEach((record, trunkIndex) => {
      const scale = quality === 'high' || record.index % 2 === 0 ? record.scale : 0
      instance.position.set(record.x, 1.28 * record.scale, record.z)
      instance.scale.setScalar(scale)
      instance.updateMatrix()
      trunks.setMatrixAt(trunkIndex, instance.matrix)
      const crownIndex = materialCounts[record.materialIndex]++
      crownOffsets.forEach(([x, y, z], offsetIndex) => {
        instance.position.set(record.x + x * record.scale, y * record.scale, record.z + z * record.scale)
        instance.updateMatrix()
        crowns[record.materialIndex][offsetIndex].setMatrixAt(crownIndex, instance.matrix)
      })
    })
    ;[trunks, ...crowns.flat()].forEach(mesh => {
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
    })
  }
  setQuality('high')
  return setQuality
}

function ribbon(curve: THREE.CatmullRomCurve3, width: number, height: number, material: THREE.Material) {
  const steps = 96
  const points: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const p = curve.getPoint(t)
    const tangent = curve.getTangent(t)
    const nx = -tangent.z
    const nz = tangent.x
    points.push(p.x + nx * width / 2, height, p.z + nz * width / 2, p.x - nx * width / 2, height, p.z - nz * width / 2)
    uvs.push(0, t * 10, 1, t * 10)
    if (i < steps) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, material)
  mesh.receiveShadow = true
  return mesh
}

export function createTownshipWorld(): TownshipWorld {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#191321')
  scene.fog = new THREE.FogExp2('#352b35', 0.014)
  const world = new THREE.Group()
  scene.add(world)
  box(world, 62, 0.65, 48, ground, 0, -0.37, 0)
  const lawn = new THREE.MeshStandardMaterial({ color: '#314a38', roughness: 1 })
  box(world, 58, 0.12, 44, lawn, 0, 0.01, 0)
  const lane = new THREE.MeshStandardMaterial({ color: '#514c4d', roughness: 1 })
  box(world, 58, 0.05, 2.2, lane, 0, 0.1, -18)
  box(world, 58, 0.05, 2.2, lane, 0, 0.1, 18)

  const mainPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-28, 0, -6), new THREE.Vector3(-20, 0, -5), new THREE.Vector3(-11, 0, -2),
    new THREE.Vector3(-3, 0, 2), new THREE.Vector3(5, 0, 0), new THREE.Vector3(13, 0, 3), new THREE.Vector3(28, 0, 7),
  ])
  world.add(ribbon(mainPath, 3.9, 0.14, pathEdge))
  world.add(ribbon(mainPath, 3.1, 0.16, pathSurface))
  const sidePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-18, 0, 21), new THREE.Vector3(-12, 0, 10), new THREE.Vector3(-3, 0, 2),
    new THREE.Vector3(7, 0, -10), new THREE.Vector3(13, 0, -21),
  ])
  world.add(ribbon(sidePath, 2.1, 0.135, pathEdge))
  world.add(ribbon(sidePath, 1.75, 0.17, pathSurface))
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 0.16, 40), pathEdge)
  plaza.position.set(-2, 0.12, 1.8)
  plaza.receiveShadow = true
  world.add(plaza)
  const plazaInner = new THREE.Mesh(new THREE.CylinderGeometry(4.65, 4.65, 0.18, 40), pathSurface)
  plazaInner.position.set(-2, 0.16, 1.8)
  plazaInner.receiveShadow = true
  world.add(plazaInner)
  const fountain = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.3, 24), roofMaterial)
  fountain.position.set(-2, 0.37, 1.8)
  world.add(fountain)
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.99, 0.99, 0.06, 24), new THREE.MeshStandardMaterial({ color: '#6caab0', metalness: 0.34, roughness: 0.25, emissive: '#1b4b53', emissiveIntensity: 0.24 }))
  water.position.set(-2, 0.54, 1.8)
  world.add(water)

  const rng = random(1409)
  let buildingIndex = 0
  const windows: WindowInstance[] = []
  for (const x of [-24, -17, -10, -2, 7, 16, 24]) {
    for (const z of [-13, 13]) {
      if ((x === -2 && z === 13) || (x === -2 && z === -13)) continue
      const h = 3.7 + rng() * 5.7
      makeBuilding(world, x + (rng() - 0.5) * 1.3, z + (rng() - 0.5) * 1.2, 3.5 + rng() * 2.0, 4.2 + rng() * 1.8, h, buildingIndex++, windows)
    }
  }
  for (const x of [-26, -14, 0, 14, 26]) {
    makeBuilding(world, x, -23.5, 4.4, 3.5, 7 + rng() * 7, buildingIndex++, windows)
  }
  const windowMesh = new THREE.InstancedMesh(unitBox, glassMaterial, windows.length)
  const instanceObject = new THREE.Object3D()
  windows.forEach((window, index) => {
    instanceObject.position.set(window.x, window.y, window.z)
    instanceObject.scale.set(window.w, window.h, window.d)
    instanceObject.updateMatrix()
    windowMesh.setMatrixAt(index, instanceObject.matrix)
  })
  windowMesh.instanceMatrix.needsUpdate = true
  windowMesh.computeBoundingSphere()
  world.add(windowMesh)
  const trees: TreeInstance[] = []
  for (let i = 0; i < 40; i++) {
    const t = (i + 0.4) / 41
    const p = mainPath.getPoint(t)
    const tangent = mainPath.getTangent(t)
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x)
    const side = i % 2 ? 1 : -1
    const distance = 3.7 + rng() * 1.5
    const point = p.clone().addScaledVector(normal, side * distance)
    trees.push({ x: point.x, z: point.z, scale: 0.8 + rng() * 0.32, materialIndex: i % foliageMaterials.length, index: i })
  }
  for (let i = 0; i < 28; i++) {
    const x = -27 + rng() * 54
    const z = (i % 2 ? 18 : -18) + (rng() - 0.5) * 6
    trees.push({ x, z, scale: 0.55 + rng() * 0.3, materialIndex: (i + 41) % foliageMaterials.length, index: i + 40 })
  }
  const setTreeQuality = makeTreeInstances(world, trees)
  const shelter = new THREE.Group()
  shelter.position.set(8, 0, 0)
  world.add(shelter)
  for (const x of [-2.5, 0, 2.5]) for (const z of [-1.45, 1.45]) box(shelter, 0.12, 2.9, 0.12, roofMaterial, x, 1.5, z, true)
  box(shelter, 6.2, 0.18, 3.45, new THREE.MeshStandardMaterial({ color: '#896e61', metalness: 0.25, roughness: 0.45 }), 0, 3, 0, true)
  for (const x of [-25, -16, -7, 2, 12, 22]) {
    const p = mainPath.getPoint((x + 28) / 56)
    box(world, 0.08, 2.55, 0.08, roofMaterial, p.x, 1.3, p.z - 3.1)
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd4a0' }))
    lamp.position.set(p.x, 2.62, p.z - 3.1)
    world.add(lamp)
  }

  const routeGroup = new THREE.Group()
  world.add(routeGroup)
  const routeMaterials = routeColors.map(color => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92, depthWrite: false }))
  const routeHaloMaterials = routeColors.map(color => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.23, depthWrite: false, blending: THREE.AdditiveBlending }))
  const routeCurves: THREE.CatmullRomCurve3[] = []
  const fractions: [number, number][] = [[0.02, 0.33], [0.33, 0.66], [0.66, 0.98]]
  fractions.forEach(([start, end], i) => {
    const pts = Array.from({ length: 28 }, (_, step) => {
      const p = mainPath.getPoint(start + (end - start) * step / 27)
      return new THREE.Vector3(p.x, 0.28, p.z)
    })
    const curve = new THREE.CatmullRomCurve3(pts)
    routeCurves.push(curve)
    routeGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 70, 0.27, 7, false), routeHaloMaterials[i]))
    routeGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 70, 0.095, 7, false), routeMaterials[i]))
  })
  const routeMarker = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff4d1' }))
  routeGroup.add(routeMarker)
  const routeGlow = new THREE.PointLight('#75e4b9', 5, 5)
  routeMarker.add(routeGlow)

  const hemi = new THREE.HemisphereLight('#e2c5b5', '#1b302d', 2.8)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight('#ffb365', 3.5)
  sun.position.set(-17, 25, -17)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.left = -35
  sun.shadow.camera.right = 35
  sun.shadow.camera.top = 30
  sun.shadow.camera.bottom = -30
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 80
  sun.shadow.bias = -0.001
  scene.add(sun)
  const violet = new THREE.PointLight('#8f5fa8', 23, 36)
  violet.position.set(11, 9, 7)
  scene.add(violet)
  const amber = new THREE.PointLight('#eeb273', 25, 34)
  amber.position.set(-11, 8, 1)
  scene.add(amber)

  return {
    scene,
    update(seconds, chapter) {
      const p = Number.isFinite(seconds) ? (seconds * 0.095) % 1 : 0
      const marker = routeCurves[Math.max(0, Math.min(2, Math.floor(p * 3)))]
      if (!marker) return
      routeMarker.position.copy(marker.getPoint((p * 3) % 1))
      routeMaterials.forEach((material, index) => { material.opacity = (chapter === 2 ? 0.95 : 0.68) + Math.sin(seconds * 1.4 - index) * 0.08 })
      routeHaloMaterials.forEach((material, index) => { material.opacity = (chapter === 2 ? 0.3 : 0.2) + Math.sin(seconds * 1.4 - index) * 0.05 })
      routeGlow.intensity = chapter === 2 ? 6 : 3.5
      violet.intensity = chapter === 2 ? 32 : 19
    },
    setQuality(quality) {
      sun.castShadow = quality === 'high'
      setTreeQuality(quality)
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      scene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return
        geometries.add(object.geometry)
        const meshMaterials = Array.isArray(object.material) ? object.material : [object.material]
        meshMaterials.forEach(material => materials.add(material))
      })
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(material => material.dispose())
    },
  }
}
