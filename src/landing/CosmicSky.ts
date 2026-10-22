import * as THREE from 'three'

/** A camera-centred, depth-tested sky: one draw call, no texture seams or foreground overlays. */
export function createCosmicSky() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform float uTime;
      varying vec3 vDirection;

      float hash21(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise2(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
                   mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float hash31(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
      }
      float stars(vec3 direction, float scale, float threshold, float time) {
        vec3 position = direction * scale;
        vec3 cell = floor(position);
        float seed = hash31(cell);
        float radial = length(fract(position) - 0.5);
        float core = 1.0 - smoothstep(0.08, 0.22, radial);
        float twinkle = 0.78 + 0.22 * sin(time * 0.52 + seed * 37.0);
        return step(threshold, seed) * core * twinkle;
      }

      void main() {
        vec3 direction = normalize(vDirection);
        float time = uTime;
        float altitude = smoothstep(-0.58, 0.08, direction.y);
        vec3 colour = mix(vec3(0.027, 0.017, 0.075), vec3(0.104, 0.038, 0.220), altitude);

        // Two slowly crossing cloud fields add depth without scrolling a flat texture.
        vec2 field = vec2(direction.x + direction.z * 0.37, direction.y + direction.z * 0.19);
        float violet = noise2(field * 3.8 + vec2(time * 0.012, -time * 0.006));
        float magenta = noise2(field * 6.7 + vec2(-time * 0.018, time * 0.009));
        float cloud = smoothstep(0.40, 0.77, violet * 0.72 + magenta * 0.28);
        float cloudVeil = smoothstep(-0.53, -0.04, direction.y);
        colour += vec3(0.38, 0.105, 0.53) * cloud * cloudVeil;
        colour += vec3(0.29, 0.052, 0.30) * smoothstep(0.54, 0.76, magenta) * cloudVeil * 0.48;

        // Curved, directional filaments live on the distant dome, never over architecture.
        float sweep = direction.y - (-0.16 + 0.11 * sin(direction.x * 5.6 + direction.z * 2.7 + time * 0.075));
        float secondary = direction.y - (-0.045 + 0.055 * sin(direction.z * 7.0 - direction.x * 3.8 - time * 0.053));
        float ribbon = exp(-pow(sweep * 12.0, 2.0)) * (0.42 + 0.58 * violet);
        float fine = exp(-pow((sweep + 0.024) * 35.0, 2.0)) * 0.38;
        float highRibbon = exp(-pow(secondary * 23.0, 2.0)) * 0.28;
        float lightThread = exp(-pow((direction.y - (-0.11 + 0.045 * sin(direction.x * 8.0 + direction.z * 4.0 + time * 0.13))) * 54.0, 2.0));
        colour += vec3(0.43, 0.18, 0.65) * ribbon;
        colour += vec3(0.49, 0.30, 0.72) * fine;
        colour += vec3(0.42, 0.15, 0.52) * highRibbon;
        colour += vec3(0.70, 0.42, 0.86) * lightThread * (0.42 + 0.26 * violet);

        // Sparse 3-D star cells have no longitude seam; each depth layer drifts differently.
        vec3 farDirection = normalize(direction + vec3(time * 0.00010, 0.0, 0.0));
        vec3 nearDirection = normalize(direction + vec3(-time * 0.00021, time * 0.00006, 0.0));
        float distantStars = stars(farDirection, 46.0, 0.935, time) * 0.38;
        float nearStars = stars(nearDirection, 92.0, 0.982, time + 5.0) * 0.64;
        colour += vec3(0.73, 0.66, 0.95) * (distantStars + nearStars) * smoothstep(-0.53, -0.06, direction.y);

        gl_FragColor = vec4(colour, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(100, 40, 24), material)
  mesh.name = 'CosmicSky'
  mesh.renderOrder = -1000
  mesh.frustumCulled = false
  mesh.raycast = () => {}
  return {
    mesh,
    update(seconds: number, camera: THREE.Camera) {
      mesh.position.copy(camera.position)
      material.uniforms.uTime.value = seconds
    },
  }
}
