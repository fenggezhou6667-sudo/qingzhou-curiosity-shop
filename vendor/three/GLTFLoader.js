/**
 * Lightweight self-contained glTF 2.0 / GLB Loader for Three.js ES module
 * Supports binary GLB & JSON glTF, interleaved bufferView strides, sparse accessors,
 * TRS / Matrix4 transforms, PBR metallic-roughness materials, KHR_materials_emissive_strength,
 * and embedded textures without external CDN dependencies.
 */
import {
  BufferAttribute,
  BufferGeometry,
  ClampToEdgeWrapping,
  Color,
  DoubleSide,
  FrontSide,
  Group,
  ImageBitmapLoader,
  Line,
  LineLoop,
  LineSegments,
  LinearFilter,
  LinearMipmapLinearFilter,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MirroredRepeatWrapping,
  NearestFilter,
  Object3D,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Quaternion,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  Vector3
} from './three.module.js';

const COMPONENT_TYPED_ARRAYS = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
};

const TYPE_SIZES = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

const TEXTURE_WRAPPINGS = {
  33071: ClampToEdgeWrapping,
  33648: MirroredRepeatWrapping,
  10497: RepeatWrapping
};

const TEXTURE_FILTERS = {
  9728: NearestFilter,
  9729: LinearFilter,
  9984: NearestFilter,
  9985: LinearFilter,
  9986: LinearMipmapLinearFilter,
  9987: LinearMipmapLinearFilter
};

export class GLTFLoader {
  constructor(manager) {
    this.manager = manager || null;
  }

  load(url, onLoad, onProgress, onError) {
    this.loadAsync(url, onProgress)
      .then((gltf) => {
        if (onLoad) onLoad(gltf);
      })
      .catch((err) => {
        if (onError) onError(err);
        else console.error('GLTFLoader error:', err);
      });
  }

  async loadAsync(url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`GLTFLoader: failed to fetch "${url}" (${res.status} ${res.statusText})`);
    }
    const basePath = url.slice(0, url.lastIndexOf('/') + 1);
    const buf = await res.arrayBuffer();
    return this.parseAsync(buf, basePath);
  }

  parse(data, path, onLoad, onError) {
    this.parseAsync(data, path)
      .then((gltf) => {
        if (onLoad) onLoad(gltf);
      })
      .catch((err) => {
        if (onError) onError(err);
        else console.error('GLTFLoader parse error:', err);
      });
  }

  async parseAsync(data, basePath = '') {
    let json;
    const buffers = [];

    if (data instanceof ArrayBuffer) {
      const magic = new DataView(data, 0, 4).getUint32(0, true);
      if (magic === 0x46546c67) {
        const view = new DataView(data);
        const version = view.getUint32(4, true);
        if (version !== 2) {
          throw new Error(`GLTFLoader: unsupported glTF version ${version}`);
        }
        const totalLength = view.getUint32(8, true);
        let offset = 12;
        while (offset < totalLength && offset + 8 <= data.byteLength) {
          const chunkLength = view.getUint32(offset, true);
          const chunkType = view.getUint32(offset + 4, true);
          const chunkStart = offset + 8;
          const chunkEnd = chunkStart + chunkLength;
          if (chunkType === 0x4e4f534a) {
            const text = new TextDecoder().decode(new Uint8Array(data, chunkStart, chunkLength));
            json = JSON.parse(text);
          } else if (chunkType === 0x004e4942) {
            buffers[0] = data.slice(chunkStart, chunkEnd);
          }
          offset = (chunkEnd + 3) & ~3;
        }
      } else {
        json = JSON.parse(new TextDecoder().decode(data));
      }
    } else if (typeof data === 'string') {
      json = JSON.parse(data);
    } else {
      json = data;
    }

    if (!json || !json.asset) {
      throw new Error('GLTFLoader: invalid glTF payload');
    }

    const jsonBuffers = json.buffers || [];
    for (let i = 0; i < jsonBuffers.length; i++) {
      if (buffers[i]) continue;
      const bDef = jsonBuffers[i];
      if (!bDef.uri) {
        buffers[i] = new ArrayBuffer(0);
      } else if (bDef.uri.startsWith('data:')) {
        const res = await fetch(bDef.uri);
        buffers[i] = await res.arrayBuffer();
      } else {
        const res = await fetch(basePath + bDef.uri);
        if (!res.ok) throw new Error(`GLTFLoader: failed to load buffer ${bDef.uri}`);
        buffers[i] = await res.arrayBuffer();
      }
    }

    const parser = new GLTFParser(json, buffers, basePath);
    return parser.parse();
  }
}

class GLTFParser {
  constructor(json, buffers, basePath) {
    this.json = json;
    this.buffers = buffers;
    this.basePath = basePath;
    this.accessorCache = new Map();
    this.materialCache = new Map();
    this.textureCache = new Map();
    this.imageCache = new Map();
  }

  readAccessor(index) {
    if (this.accessorCache.has(index)) {
      return this.accessorCache.get(index);
    }

    const acc = this.json.accessors[index];
    const TypedArray = COMPONENT_TYPED_ARRAYS[acc.componentType];
    if (!TypedArray) {
      throw new Error(`GLTFLoader: unsupported componentType ${acc.componentType}`);
    }

    const itemSize = TYPE_SIZES[acc.type] || 1;
    const count = acc.count;
    const elemBytes = TypedArray.BYTES_PER_ELEMENT;
    let array;

    if (acc.bufferView !== undefined) {
      const bv = this.json.bufferViews[acc.bufferView];
      const buffer = this.buffers[bv.buffer || 0];
      const baseByteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
      const stride = bv.byteStride || 0;

      if (stride && stride !== itemSize * elemBytes) {
        array = new TypedArray(count * itemSize);
        const srcView = new DataView(buffer);
        const little = true;
        for (let i = 0; i < count; i++) {
          const itemOffset = baseByteOffset + i * stride;
          for (let k = 0; k < itemSize; k++) {
            const bytePos = itemOffset + k * elemBytes;
            let v = 0;
            switch (acc.componentType) {
              case 5120: v = srcView.getInt8(bytePos); break;
              case 5121: v = srcView.getUint8(bytePos); break;
              case 5122: v = srcView.getInt16(bytePos, little); break;
              case 5123: v = srcView.getUint16(bytePos, little); break;
              case 5125: v = srcView.getUint32(bytePos, little); break;
              case 5126: v = srcView.getFloat32(bytePos, little); break;
            }
            array[i * itemSize + k] = v;
          }
        }
      } else {
        const sliced = buffer.slice(baseByteOffset, baseByteOffset + count * itemSize * elemBytes);
        array = new TypedArray(sliced);
      }
    } else {
      array = new TypedArray(count * itemSize);
    }

    if (acc.sparse) {
      const sparseCount = acc.sparse.count;
      const idxBv = this.json.bufferViews[acc.sparse.indices.bufferView];
      const IdxArray = COMPONENT_TYPED_ARRAYS[acc.sparse.indices.componentType];
      const idxBuf = this.buffers[idxBv.buffer || 0];
      const idxOffset = (idxBv.byteOffset || 0) + (acc.sparse.indices.byteOffset || 0);
      const indices = new IdxArray(idxBuf.slice(idxOffset, idxOffset + sparseCount * IdxArray.BYTES_PER_ELEMENT));

      const valBv = this.json.bufferViews[acc.sparse.values.bufferView];
      const valBuf = this.buffers[valBv.buffer || 0];
      const valOffset = (valBv.byteOffset || 0) + (acc.sparse.values.byteOffset || 0);
      const values = new TypedArray(valBuf.slice(valOffset, valOffset + sparseCount * itemSize * elemBytes));

      for (let i = 0; i < sparseCount; i++) {
        const targetIndex = indices[i];
        for (let k = 0; k < itemSize; k++) {
          array[targetIndex * itemSize + k] = values[i * itemSize + k];
        }
      }
    }

    const attr = new BufferAttribute(array, itemSize, acc.normalized === true);
    this.accessorCache.set(index, attr);
    return attr;
  }

  async loadTexture(index, isColor) {
    const key = `${index}_${isColor ? 1 : 0}`;
    if (this.textureCache.has(key)) return this.textureCache.get(key);

    const texDef = (this.json.textures || [])[index];
    if (!texDef || texDef.source === undefined) return null;

    const imgDef = (this.json.images || [])[texDef.source];
    if (!imgDef) return null;

    let bitmap = this.imageCache.get(texDef.source);
    if (!bitmap) {
      let blob;
      if (imgDef.bufferView !== undefined) {
        const bv = this.json.bufferViews[imgDef.bufferView];
        const buf = this.buffers[bv.buffer || 0];
        const slice = buf.slice(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
        blob = new Blob([slice], { type: imgDef.mimeType || 'image/png' });
      } else if (imgDef.uri) {
        const url = imgDef.uri.startsWith('data:') ? imgDef.uri : this.basePath + imgDef.uri;
        const res = await fetch(url);
        blob = await res.blob();
      }
      if (blob && typeof createImageBitmap === 'function') {
        bitmap = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
      } else if (blob) {
        const objUrl = URL.createObjectURL(blob);
        bitmap = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => { URL.revokeObjectURL(objUrl); resolve(img); };
          img.onerror = reject;
          img.src = objUrl;
        });
      }
      if (bitmap) this.imageCache.set(texDef.source, bitmap);
    }

    if (!bitmap) return null;
    const texture = new Texture(bitmap);
    texture.flipY = false;
    if (isColor) texture.colorSpace = SRGBColorSpace;

    const sampler = (this.json.samplers || [])[texDef.sampler] || {};
    texture.wrapS = TEXTURE_WRAPPINGS[sampler.wrapS] || RepeatWrapping;
    texture.wrapT = TEXTURE_WRAPPINGS[sampler.wrapT] || RepeatWrapping;
    texture.magFilter = TEXTURE_FILTERS[sampler.magFilter] || LinearFilter;
    texture.minFilter = TEXTURE_FILTERS[sampler.minFilter] || LinearMipmapLinearFilter;
    texture.needsUpdate = true;

    this.textureCache.set(key, texture);
    return texture;
  }

  async loadMaterial(index) {
    if (index === undefined) {
      return new MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0.1 });
    }
    if (this.materialCache.has(index)) return this.materialCache.get(index);

    const def = (this.json.materials || [])[index] || {};
    const pbr = def.pbrMetallicRoughness || {};
    const isUnlit = Boolean(def.extensions && def.extensions.KHR_materials_unlit);

    const params = {
      name: def.name || '',
      side: def.doubleSided ? DoubleSide : FrontSide
    };

    const baseColorFactor = pbr.baseColorFactor || [1, 1, 1, 1];
    params.color = new Color().setRGB(
      baseColorFactor[0],
      baseColorFactor[1],
      baseColorFactor[2],
      'srgb-linear'
    );

    if (def.alphaMode === 'BLEND') {
      params.transparent = true;
      params.opacity = baseColorFactor[3];
    } else if (def.alphaMode === 'MASK') {
      params.alphaTest = def.alphaCutoff !== undefined ? def.alphaCutoff : 0.5;
    } else if (baseColorFactor[3] < 1) {
      params.opacity = baseColorFactor[3];
    }

    if (pbr.baseColorTexture) {
      const tex = await this.loadTexture(pbr.baseColorTexture.index, true);
      if (tex) params.map = tex;
    }

    let material;
    if (isUnlit) {
      material = new MeshBasicMaterial(params);
    } else {
      params.metalness = pbr.metallicFactor !== undefined ? pbr.metallicFactor : 1.0;
      params.roughness = pbr.roughnessFactor !== undefined ? pbr.roughnessFactor : 1.0;

      if (pbr.metallicRoughnessTexture) {
        const mrTex = await this.loadTexture(pbr.metallicRoughnessTexture.index, false);
        if (mrTex) {
          params.metalnessMap = mrTex;
          params.roughnessMap = mrTex;
        }
      }
      if (def.normalTexture) {
        const nTex = await this.loadTexture(def.normalTexture.index, false);
        if (nTex) params.normalMap = nTex;
      }

      const emissiveFactor = def.emissiveFactor || [0, 0, 0];
      params.emissive = new Color().setRGB(
        emissiveFactor[0],
        emissiveFactor[1],
        emissiveFactor[2],
        'srgb-linear'
      );
      const emStrength = def.extensions?.KHR_materials_emissive_strength?.emissiveStrength;
      if (emStrength !== undefined) {
        params.emissiveIntensity = emStrength;
      }
      if (def.emissiveTexture) {
        const emTex = await this.loadTexture(def.emissiveTexture.index, true);
        if (emTex) params.emissiveMap = emTex;
      }

      material = new MeshStandardMaterial(params);
    }

    this.materialCache.set(index, material);
    return material;
  }

  async buildMesh(meshIndex, nodeName) {
    const meshDef = this.json.meshes[meshIndex];
    const primitives = meshDef.primitives || [];
    const built = [];

    for (let i = 0; i < primitives.length; i++) {
      const prim = primitives[i];
      const geometry = new BufferGeometry();
      const attrs = prim.attributes || {};

      if (attrs.POSITION !== undefined) {
        geometry.setAttribute('position', this.readAccessor(attrs.POSITION));
      }
      if (attrs.NORMAL !== undefined) {
        geometry.setAttribute('normal', this.readAccessor(attrs.NORMAL));
      }
      if (attrs.TEXCOORD_0 !== undefined) {
        geometry.setAttribute('uv', this.readAccessor(attrs.TEXCOORD_0));
      }
      if (attrs.TEXCOORD_1 !== undefined) {
        geometry.setAttribute('uv1', this.readAccessor(attrs.TEXCOORD_1));
      }
      if (attrs.COLOR_0 !== undefined) {
        geometry.setAttribute('color', this.readAccessor(attrs.COLOR_0));
      }

      if (prim.indices !== undefined) {
        let indexAttr = this.readAccessor(prim.indices);
        if (indexAttr.array instanceof Uint8Array) {
          indexAttr = new BufferAttribute(new Uint16Array(indexAttr.array), 1);
        }
        geometry.setIndex(indexAttr);
      }

      const mode = prim.mode !== undefined ? prim.mode : 4;
      if (attrs.NORMAL === undefined && mode === 4 && attrs.POSITION !== undefined) {
        geometry.computeVertexNormals();
      }
      geometry.computeBoundingSphere();

      const material = await this.loadMaterial(prim.material);
      if (attrs.COLOR_0 !== undefined) {
        material.vertexColors = true;
      }

      let obj;
      if (mode === 0) {
        const ptMat = new PointsMaterial({ color: material.color || 0xffffff, size: 0.08 });
        obj = new Points(geometry, ptMat);
      } else if (mode === 1) {
        obj = new LineSegments(geometry, material);
      } else if (mode === 2) {
        obj = new LineLoop(geometry, material);
      } else if (mode === 3) {
        obj = new Line(geometry, material);
      } else {
        obj = new Mesh(geometry, material);
      }

      obj.name = primitives.length === 1 ? (nodeName || meshDef.name || '') : `${nodeName || meshDef.name || 'mesh'}_${i}`;
      obj.userData = { ...(meshDef.extras || {}) };
      built.push(obj);
    }

    if (built.length === 1) {
      return built[0];
    }
    const group = new Group();
    group.name = nodeName || meshDef.name || '';
    for (const child of built) group.add(child);
    return group;
  }

  async buildNode(nodeIndex, cameras) {
    const nodeDef = this.json.nodes[nodeIndex] || {};
    let obj;

    if (nodeDef.mesh !== undefined) {
      obj = await this.buildMesh(nodeDef.mesh, nodeDef.name);
    } else if (nodeDef.camera !== undefined) {
      const camDef = (this.json.cameras || [])[nodeDef.camera];
      if (camDef && camDef.type === 'perspective' && camDef.perspective) {
        const p = camDef.perspective;
        const fov = p.yfov ? (p.yfov * 180) / Math.PI : 45;
        obj = new PerspectiveCamera(fov, p.aspectRatio || 1, p.znear || 0.1, p.zfar || 2000);
        cameras.push(obj);
      } else {
        obj = new Object3D();
      }
    } else {
      obj = new Group();
    }

    obj.name = nodeDef.name || obj.name || `node_${nodeIndex}`;
    if (nodeDef.extras) {
      obj.userData = { ...obj.userData, ...nodeDef.extras };
    }

    if (nodeDef.matrix) {
      const mat = new Matrix4().fromArray(nodeDef.matrix);
      mat.decompose(obj.position, obj.quaternion, obj.scale);
    } else {
      if (nodeDef.translation) obj.position.fromArray(nodeDef.translation);
      if (nodeDef.rotation) obj.quaternion.fromArray(nodeDef.rotation);
      if (nodeDef.scale) obj.scale.fromArray(nodeDef.scale);
    }

    if (nodeDef.children) {
      for (const childIdx of nodeDef.children) {
        const childObj = await this.buildNode(childIdx, cameras);
        obj.add(childObj);
      }
    }

    return obj;
  }

  async parse() {
    const scenes = [];
    const cameras = [];
    const sceneDefs = this.json.scenes || [{ nodes: [] }];

    for (let s = 0; s < sceneDefs.length; s++) {
      const sceneDef = sceneDefs[s];
      const group = new Group();
      group.name = sceneDef.name || `Scene_${s}`;
      for (const nodeIdx of sceneDef.nodes || []) {
        const child = await this.buildNode(nodeIdx, cameras);
        group.add(child);
      }
      scenes.push(group);
    }

    const defaultSceneIndex = this.json.scene !== undefined ? this.json.scene : 0;
    return {
      scene: scenes[defaultSceneIndex] || new Group(),
      scenes,
      cameras,
      asset: this.json.asset,
      parser: this
    };
  }
}
