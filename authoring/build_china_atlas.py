"""Build the Song-Dynasty Mineral-Jade China Relief Atlas & Brass Armillary (Zone 04).
Run with: blender --background --factory-startup --python authoring/build_china_atlas.py
Exports: authoring/china-atlas.blend, assets/china-atlas.glb, dist/assets/china-atlas.glb
"""
from pathlib import Path
from math import sin, cos, pi, sqrt, exp
from random import Random
from shutil import copyfile
from tempfile import TemporaryDirectory
import os
import re
import bpy
from mathutils import Vector, noise

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
TAU = 2 * pi
rng = Random(404)

if not bpy.app.background:
    raise RuntimeError("Run build_china_atlas.py in background Blender")
bpy.ops.wm.read_factory_settings(use_empty=True)


def w(tx, ty, tz):
    """Three.js Y-up (tx, ty, tz) -> Blender Z-up (tx, -tz, ty)."""
    return Vector((tx, -tz, ty))


def linear(hexcolor, shade=1.0):
    def ch(i):
        s = int(hexcolor[i:i + 2], 16) / 255.0
        v = ((s + 0.055) / 1.055) ** 2.4 if s > 0.04045 else s / 12.92
        return min(1.0, max(0.0, v * shade))
    return (ch(0), ch(2), ch(4), 1.0)


def lerp_hex(h1, h2, t):
    t = max(0.0, min(1.0, t))
    c1 = [int(h1[i:i + 2], 16) for i in (0, 2, 4)]
    c2 = [int(h2[i:i + 2], 16) for i in (0, 2, 4)]
    out = [int(round(a + (b - a) * t)) for a, b in zip(c1, c2)]
    return f"{out[0]:02x}{out[1]:02x}{out[2]:02x}"


def make_pigment_mat(name, metallic=0.0, roughness=0.68, glow_color=None, glow=0.0, opacity=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    vc = mat.node_tree.nodes.new("ShaderNodeVertexColor")
    vc.layer_name = "Pigment"
    mat.node_tree.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if glow > 0 and glow_color:
        bsdf.inputs["Emission Color"].default_value = (*glow_color, 1.0)
        bsdf.inputs["Emission Strength"].default_value = glow
    if opacity < 1.0:
        bsdf.inputs["Alpha"].default_value = opacity
        mat.surface_render_method = "BLENDED"
    return mat


def make_named_mat(name, hexcolor, metallic=0.0, roughness=0.4, glow_hex=None, glow=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = linear(hexcolor)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if glow > 0 and glow_hex:
        bsdf.inputs["Emission Color"].default_value = linear(glow_hex)
        bsdf.inputs["Emission Strength"].default_value = glow
    return mat


# Materials
mat_mineral = make_pigment_mat("AtlasMineralJade", metallic=0.06, roughness=0.58)
mat_sea = make_pigment_mat("AtlasSeaBasin", metallic=0.14, roughness=0.38)
mat_brass = make_pigment_mat("ChinaGoldRim", metallic=0.86, roughness=0.28)
mat_bronze = make_pigment_mat("AtlasDarkBronze", metallic=0.62, roughness=0.46)
mat_river_main = make_named_mat("AtlasRiverFlowMat", "6cf2db", metallic=0.1, roughness=0.2, glow_hex="7ef7e4", glow=1.6)
mat_river_trib = make_named_mat("AtlasRiverTribMat", "48bfa8", metallic=0.1, roughness=0.25, glow_hex="5adbc2", glow=1.1)
mat_beacon_gold = make_pigment_mat("AtlasBeaconGoldGlow", metallic=0.22, roughness=0.24, glow_color=(1.0, 0.82, 0.44), glow=1.35)
mat_beacon_jade = make_pigment_mat("AtlasBeaconJadeGlow", metallic=0.18, roughness=0.26, glow_color=(0.48, 0.94, 0.84), glow=1.15)

# =============================================================================
# PARSE EXACT NATURAL EARTH SILHOUETTES FROM china-map.js
# =============================================================================
cmap_src = (REPO / "china-map.js").read_text(encoding="utf-8")


def extract_svg_path(const_name):
    m = re.search(rf'const\s+{const_name}\s*=\s*"([^"]+)"', cmap_src)
    if not m:
        raise RuntimeError(f"Could not find {const_name} in china-map.js")
    return m.group(1)


def sample_cubic_svg(d_str, steps_per_seg=4):
    tokens = re.findall(r"[MCZ]|-?\d+(?:\.\d+)?", d_str)
    pts = []
    i = 0
    cur = (0.0, 0.0)
    while i < len(tokens):
        tk = tokens[i]
        if tk == "M":
            cur = (float(tokens[i + 1]), float(tokens[i + 2]))
            pts.append(cur)
            i += 3
        elif tk == "C":
            p0 = cur
            p1 = (float(tokens[i + 1]), float(tokens[i + 2]))
            p2 = (float(tokens[i + 3]), float(tokens[i + 4]))
            p3 = (float(tokens[i + 5]), float(tokens[i + 6]))
            for s in range(1, steps_per_seg + 1):
                t = s / steps_per_seg
                u = 1.0 - t
                x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
                y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
                pts.append((x, y))
            cur = p3
            i += 7
        elif tk == "Z":
            i += 1
        else:
            i += 1
    # Remove near-duplicate closing vertex
    if len(pts) > 2 and (pts[0][0] - pts[-1][0])**2 + (pts[0][1] - pts[-1][1])**2 < 1e-3:
        pts.pop()
    return pts


def project_lonlat(lon, lat):
    sx = 32.0 + (lon - 73.2) * 14.0
    sy = 28.0 + (54.0 - lat) * 16.2
    return svg_to_xz(sx, sy)


ATLAS_CY = 1.38
ATLAS_CZ = -41.5


def svg_to_xz(sx, sy):
    tx = (sx - 468.0) * 0.0302
    tz = ATLAS_CZ + (sy - 328.0) * 0.0318
    return (tx, tz)


OUTLINE_XZ = [svg_to_xz(x, y) for x, y in sample_cubic_svg(extract_svg_path("OUTLINE"), 5)]
HAINAN_XZ = [svg_to_xz(x, y) for x, y in sample_cubic_svg(extract_svg_path("HAINAN"), 3)]
TAIWAN_XZ = [svg_to_xz(x, y) for x, y in sample_cubic_svg(extract_svg_path("TAIWAN"), 3)]

PLACES = [
    ("玉林", 110.15, 22.63, True), ("北海", 109.12, 21.48, False), ("南宁", 108.32, 22.82, False),
    ("防城港", 108.35, 21.69, False), ("贵港", 109.60, 23.11, False),
    ("贵阳", 106.63, 26.65, False), ("昆明", 102.72, 25.04, False), ("丽江", 100.23, 26.87, False),
    ("大理", 100.27, 25.60, False),
    ("武汉", 114.30, 30.59, False), ("长沙", 112.94, 28.23, False), ("张家界", 110.48, 29.13, False),
    ("杭州", 120.15, 30.27, False), ("苏州", 120.60, 31.30, True), ("无锡", 120.31, 31.49, False),
    ("上海", 121.47, 31.23, True), ("济南", 116.99, 36.67, False),
    ("郑州", 113.62, 34.75, False), ("洛阳", 112.45, 34.62, False), ("华阴", 110.09, 34.57, True),
    ("西安", 108.94, 34.34, False), ("北京", 116.40, 39.90, False),
]

RIVERS = [
    ("River_Spline_Yangtze", True, [[91.8, 34.4], [95.8, 33.0], [98.8, 31.2], [99.8, 28.2], [100.2, 26.8], [101.9, 26.5], [103.2, 27.2], [104.6, 28.8], [106.6, 29.6], [108.4, 30.8], [111.3, 30.7], [113.1, 29.5], [114.3, 30.6], [116.0, 29.8], [117.8, 31.2], [118.8, 32.1], [120.3, 31.9], [121.6, 31.4]]),
    ("River_Spline_Yellow", True, [[96.0, 34.8], [99.2, 34.6], [101.2, 35.6], [103.8, 36.1], [105.8, 37.6], [106.8, 39.8], [108.6, 40.8], [111.2, 40.2], [110.4, 36.8], [110.3, 34.6], [112.4, 34.8], [113.6, 34.9], [115.4, 35.4], [117.0, 36.7], [118.8, 37.8]]),
    ("River_Spline_Xijiang", True, [[103.6, 25.4], [105.2, 24.4], [106.6, 23.8], [108.3, 22.8], [109.6, 23.1], [111.3, 23.5], [112.8, 23.1], [113.6, 22.5]]),
    ("River_Spline_3", False, [[104.8, 34.7], [107.2, 34.4], [108.9, 34.4], [110.3, 34.6]]),
    ("River_Spline_4", False, [[106.8, 33.2], [109.5, 32.7], [112.1, 32.0], [114.3, 30.6]]),
    ("River_Spline_5", False, [[110.8, 25.4], [112.6, 26.9], [112.9, 28.2], [113.1, 29.4]]),
    ("River_Spline_6", False, [[110.4, 22.9], [110.15, 22.63], [109.6, 22.0], [109.12, 21.55]]),
]

# Sculpted Chinese mountain ranges in (lon, lat, peak_height, width_deg)
MOUNTAIN_CHAINS = [
    # Himalayas & Tibetan southern rim
    ([(81.0, 30.5), (86.0, 28.5), (91.5, 28.3), (96.5, 29.5)], 2.15, 2.3),
    # Kunlun & Qilian
    ([(79.0, 36.2), (86.0, 36.5), (94.0, 36.8), (100.5, 37.8)], 1.65, 2.0),
    # Tianshan
    ([(76.5, 41.2), (82.5, 42.8), (88.5, 43.2), (93.5, 42.5)], 1.38, 1.7),
    # Hengduan & Cangshan
    ([(98.6, 31.4), (99.4, 28.6), (100.1, 26.8), (100.4, 25.2), (101.2, 23.8)], 1.48, 1.55),
    # Qinling & Huashan
    ([(103.8, 33.7), (106.2, 33.8), (108.5, 33.9), (110.1, 34.4), (111.8, 34.1)], 1.08, 1.35),
    # Taihang & Yanshan
    ([(112.7, 35.3), (113.6, 37.2), (114.6, 39.2), (116.2, 40.4), (118.4, 40.7)], 0.96, 1.35),
    # Wuling / Zhangjiajie / Dabie
    ([(107.6, 27.4), (109.2, 28.4), (110.5, 29.2), (111.6, 30.1)], 0.88, 1.25),
    # Nanling & Wuyi
    ([(109.8, 25.1), (111.6, 25.0), (113.4, 25.2), (115.6, 25.8), (117.8, 27.6)], 0.82, 1.35),
    # Changbai & Greater Khingan
    ([(120.5, 45.0), (121.8, 48.0), (123.5, 51.0)], 0.78, 1.6),
    ([(126.5, 41.8), (128.2, 42.5), (129.8, 44.2)], 0.82, 1.3),
    # Altai (far northwest frontier)
    ([(85.5, 48.8), (88.5, 47.6), (91.0, 46.2)], 1.15, 1.4),
    # Dabie & Tianmu (lower Yangtze divides)
    ([(114.6, 31.8), (116.5, 31.2), (119.2, 30.3)], 0.72, 1.15),
    # Xuefeng & Wuyi (southern green ridges)
    ([(109.8, 27.2), (111.0, 27.6), (117.5, 27.2), (118.8, 28.4)], 0.85, 1.25),
]

CHAINS_XZ = [([project_lonlat(lon, lat) for lon, lat in pts], h, rad * 0.44) for pts, h, rad in MOUNTAIN_CHAINS]
RIVERS_XZ = [(name, is_main, [project_lonlat(lon, lat) for lon, lat in pts]) for name, is_main, pts in RIVERS]


def dist_point_seg(px, pz, ax, az, bx, bz):
    vx, vz = bx - ax, bz - az
    wx, wz = px - ax, pz - az
    l2 = vx * vx + vz * vz
    if l2 < 1e-8:
        return sqrt(wx * wx + wz * wz)
    t = max(0.0, min(1.0, (wx * vx + wz * vz) / l2))
    dx, dz = px - (ax + t * vx), pz - (az + t * vz)
    return sqrt(dx * dx + dz * dz)


def dist_polyline(px, pz, poly):
    best = 1e9
    for i in range(len(poly) - 1):
        d = dist_point_seg(px, pz, poly[i][0], poly[i][1], poly[i + 1][0], poly[i + 1][1])
        if d < best:
            best = d
    return best


def point_in_poly(x, z, poly):
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, zi = poly[i]
        xj, zj = poly[j]
        if ((zi > z) != (zj > z)) and (x < (xj - xi) * (z - zi) / (zj - zi + 1e-12) + xi):
            inside = not inside
        j = i
    return inside


def dist_to_border(x, z, poly):
    best = 1e9
    n = len(poly)
    for i in range(n):
        a = poly[i]
        b = poly[(i + 1) % n]
        d = dist_point_seg(x, z, a[0], a[1], b[0], b[1])
        if d < best:
            best = d
    return best


def terrain_height(tx, tz, is_island=False):
    """Sculpted Song-Dynasty ridged relief elevation above ATLAS_CY."""
    if is_island:
        # Gentle central spine for Taiwan / Hainan
        n1 = 1.0 - abs(noise.noise(Vector((tx * 0.75, tz * 0.75, 1.3))))
        return 0.14 + 0.34 * (n1 ** 1.8)

    # 1. Three-tier macro elevation (Tibetan plateau in west-southwest)
    tibet_d = sqrt(((tx + 5.6) / 4.2) ** 2 + ((tz + 39.2) / 3.0) ** 2)
    h = 0.08 + 0.56 * exp(-tibet_d * tibet_d * 1.1)

    # 2. Ridged mountain ranges (crisp carved peaks, zero cartoon cones!)
    n_ridge1 = 1.0 - abs(noise.noise(Vector((tx * 0.52, tz * 0.52, 0.7))))
    n_ridge2 = 1.0 - abs(noise.noise(Vector((tx * 1.25, tz * 1.25, 2.9))))
    ridge_detail = (n_ridge1 ** 1.7) * 0.68 + (n_ridge2 ** 1.9) * 0.32

    for poly, peak_h, width in CHAINS_XZ:
        d = dist_polyline(tx, tz, poly)
        if d < width * 2.4:
            env = exp(-(d * d) / (width * width))
            h += peak_h * env * (0.42 + 0.85 * ridge_detail)

    # Fine mineral micro-undulation across plains & hills
    h += 0.09 * (0.5 + 0.5 * noise.noise(Vector((tx * 0.38, tz * 0.38, 4.1))))

    # 3. Gentle river valley carving so rivers nestle naturally inside valleys
    for _, is_main, rpoly in RIVERS_XZ:
        if not is_main:
            continue
        dr = dist_polyline(tx, tz, rpoly)
        if dr < 0.75:
            carve = exp(-(dr * dr) / 0.14)
            h *= (1.0 - 0.58 * carve)

    return max(0.05, h)


def mineral_color(h, tx, tz):
    """Song-Dynasty 《千里江山图》 celadon -> malachite -> ochre -> azurite -> frost summit."""
    n = 0.5 + 0.5 * noise.noise(Vector((tx * 0.45, tz * 0.45, 7.2)))
    if h < 0.30:
        c = lerp_hex("3b8779", "59ac94", h / 0.30)
    elif h < 0.78:
        t = (h - 0.30) / 0.48
        c = lerp_hex("4c9e86", "276f78", t)
        if n > 0.58:
            c = lerp_hex(c, "948a62", min(1.0, (n - 0.58) * 1.15))
    elif h < 1.38:
        t = (h - 0.78) / 0.60
        c = lerp_hex("225c75", "1d3f68", t)
    else:
        t = min(1.0, (h - 1.38) / 0.75)
        c = lerp_hex("487c96", "e2efeb", t)
    return c


parts = []


class Part:
    def __init__(self, name, parent=None, mat=mat_mineral, origin=(0, 0, 0)):
        self.name = name
        self.parent = parent
        self.mat = mat
        self.origin = Vector(origin)
        self.verts = []
        self.faces = []
        self.pigment = []
        self.uvs = []
        self.has_uv = False
        self.smooth_ranges = []
        parts.append(self)

    def _loc(self, pt):
        return Vector(pt) - self.origin

    def mesh(self, points, faces, colors, face_uvs=None, smooth=False):
        start = len(self.verts)
        self.verts.extend(self._loc(p) for p in points)
        f0 = len(self.faces)
        for idx, f in enumerate(faces):
            self.faces.append(tuple(start + i for i in f))
            col = colors[idx] if isinstance(colors, list) else colors
            self.pigment.append(linear(col, 1.0 + rng.uniform(-0.025, 0.025)))
            if face_uvs is not None:
                self.has_uv = True
                self.uvs.append(face_uvs[idx])
            else:
                self.uvs.append([(0.0, 0.0)] * len(f))
        if smooth:
            self.smooth_ranges.append(range(f0, len(self.faces)))

    def lathe_t(self, tc, profile, sides=24, color="cfa25f", smooth=True):
        cx, cy, cz = tc
        pts = []
        for dy, r in profile:
            for i in range(sides):
                a = TAU * i / sides
                pts.append(w(cx + r * cos(a), cy + dy, cz + r * sin(a)))
        faces = [tuple(reversed(range(sides)))]
        for j in range(len(profile) - 1):
            lo = j * sides
            for i in range(sides):
                k = (i + 1) % sides
                faces.append((lo + i, lo + k, lo + k + sides, lo + i + sides))
        top_lo = (len(profile) - 1) * sides
        faces.append(tuple(range(top_lo, top_lo + sides)))
        self.mesh(pts, faces, color, smooth=smooth)

    def ring_t(self, tc, r_in, r_out, y_bot, y_top, sides=96, color="cfa25f", tilt_x=0.0, tilt_z=0.0):
        cx, cy, cz = tc
        pts = []
        for y in (y_bot, y_top):
            for r in (r_in, r_out):
                for i in range(sides):
                    a = TAU * i / sides
                    lx = r * cos(a)
                    lz = r * sin(a)
                    ly = y
                    # Apply optional tilt around X and Z
                    if tilt_x:
                        ly2 = ly * cos(tilt_x) - lz * sin(tilt_x)
                        lz = ly * sin(tilt_x) + lz * cos(tilt_x)
                        ly = ly2
                    if tilt_z:
                        lx2 = lx * cos(tilt_z) - ly * sin(tilt_z)
                        ly = lx * sin(tilt_z) + ly * cos(tilt_z)
                        lx = lx2
                    pts.append(w(cx + lx, cy + ly, cz + lz))
        # Rings: 0=bot_in, 1=bot_out, 2=top_in, 3=top_out
        faces = []
        for i in range(sides):
            k = (i + 1) % sides
            bi0, bi1 = i, k
            bo0, bo1 = sides + i, sides + k
            ti0, ti1 = 2 * sides + i, 2 * sides + k
            to0, to1 = 3 * sides + i, 3 * sides + k
            faces.append((ti0, to0, to1, ti1))  # top
            faces.append((bo0, bi0, bi1, bo1))  # bottom
            faces.append((bo0, bo1, to1, to0))  # outer
            faces.append((bi1, bi0, ti0, ti1))  # inner
        self.mesh(pts, faces, color, smooth=False)

    def box_t(self, tc, half_t, color="cfa25f"):
        cx, cy, cz = tc
        hx, hy, hz = half_t
        pts = [
            w(cx - hx, cy - hy, cz + hz), w(cx + hx, cy - hy, cz + hz),
            w(cx + hx, cy - hy, cz - hz), w(cx - hx, cy - hy, cz - hz),
            w(cx - hx, cy + hy, cz + hz), w(cx + hx, cy + hy, cz + hz),
            w(cx + hx, cy + hy, cz - hz), w(cx - hx, cy + hy, cz - hz),
        ]
        faces = [
            (3, 2, 1, 0), (4, 5, 6, 7),
            (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7),
        ]
        self.mesh(pts, faces, color)

    def finish(self):
        mesh = bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.verts, [], self.faces)
        mesh.materials.append(self.mat)
        pigment = mesh.color_attributes.new(name="Pigment", type="BYTE_COLOR", domain="CORNER")
        for poly, rgba in zip(mesh.polygons, self.pigment):
            for li in poly.loop_indices:
                pigment.data[li].color = rgba
        if self.has_uv:
            uv_layer = mesh.uv_layers.new(name="UVMap")
            for poly, fuv in zip(mesh.polygons, self.uvs):
                for li, uv in zip(poly.loop_indices, fuv):
                    uv_layer.data[li].uv = uv
        for r in self.smooth_ranges:
            for idx in r:
                mesh.polygons[idx].use_smooth = True
        mesh.update()
        obj = bpy.data.objects.new(self.name, mesh)
        obj.location = self.origin
        bpy.context.collection.objects.link(obj)
        if self.parent:
            obj.parent = self.parent
            obj.location = self.origin - self.parent.location
        return obj


def make_empty(name, tc, parent=None):
    obj = bpy.data.objects.new(name, None)
    loc = w(*tc)
    bpy.context.collection.objects.link(obj)
    if parent:
        obj.parent = parent
        obj.location = loc - parent.location
    else:
        obj.location = loc
    return obj


# =============================================================================
# 1. SCULPTED RELIEF LANDMASSES (Mainland + Hainan + Taiwan + Gilded Rim)
# =============================================================================
def build_landmass(name, rim_name, poly_xz, grid_nx, grid_nz, is_island=False):
    relief = Part(name, None, mat_mineral)
    rim = Part(rim_name, None, mat_brass)

    xs = [p[0] for p in poly_xz]
    zs = [p[1] for p in poly_xz]
    xmin, xmax = min(xs), max(xs)
    zmin, zmax = min(zs), max(zs)
    dx = (xmax - xmin) / grid_nx
    dz = (zmax - zmin) / grid_nz

    # Sample interior terrain grid
    grid_idx = {}
    pts = []
    heights = []
    for iz in range(grid_nz + 1):
        z = zmin + iz * dz
        for ix in range(grid_nx + 1):
            x = xmin + ix * dx
            if point_in_poly(x, z, poly_xz):
                db = dist_to_border(x, z, poly_xz)
                edge_taper = min(1.0, db / (0.55 if not is_island else 0.18))
                h = terrain_height(x, z, is_island) * (0.28 + 0.72 * edge_taper)
                grid_idx[(ix, iz)] = len(pts)
                pts.append(w(x, ATLAS_CY + h, z))
                heights.append((h, x, z))

    faces = []
    cols = []
    for iz in range(grid_nz):
        for ix in range(grid_nx):
            k00 = grid_idx.get((ix, iz))
            k10 = grid_idx.get((ix + 1, iz))
            k11 = grid_idx.get((ix + 1, iz + 1))
            k01 = grid_idx.get((ix, iz + 1))
            present = [k for k in (k00, k10, k11, k01) if k is not None]
            if len(present) == 4:
                # Two triangles oriented upward (Three.js +Y = Blender +Z)
                # Note: increasing iz -> increasing tz -> decreasing blender y!
                # So (k00, k01, k11) and (k00, k11, k10) have +Z normal in Blender!
                for tri in ((k00, k01, k11), (k00, k11, k10)):
                    faces.append(tri)
                    mh = sum(heights[v][0] for v in tri) / 3.0
                    mx = sum(heights[v][1] for v in tri) / 3.0
                    mz = sum(heights[v][2] for v in tri) / 3.0
                    cols.append(mineral_color(mh, mx, mz))
            elif len(present) == 3:
                # Order CCW in (x, -z)
                a, b, c = present
                pa, pb, pc = pts[a], pts[b], pts[c]
                cross_z = (pb.x - pa.x) * (pc.y - pa.y) - (pb.y - pa.y) * (pc.x - pa.x)
                tri = (a, b, c) if cross_z > 0 else (a, c, b)
                faces.append(tri)
                mh = sum(heights[v][0] for v in tri) / 3.0
                mx = sum(heights[v][1] for v in tri) / 3.0
                mz = sum(heights[v][2] for v in tri) / 3.0
                cols.append(mineral_color(mh, mx, mz))

    relief.mesh(pts, faces, cols, smooth=True)

    # Solid 2-tier sculpted jade cliff skirt + flat solid base cap using Blender earcut/curve fill
    # Build crisp beveled jade cliff wall around exact coastline polygon
    n = len(poly_xz)
    # Ensure consistent winding (CCW in Blender XY where y = -tz)
    area2 = 0.0
    for i in range(n):
        x0, z0 = poly_xz[i]
        x1, z1 = poly_xz[(i + 1) % n]
        area2 += x0 * (-z1) - x1 * (-z0)
    ring_xz = list(poly_xz) if area2 > 0 else list(reversed(poly_xz))

    # Create solid base plate under the sculpted terrain grid so zero gaps exist at coastline edges
    # Using Blender's own 2D curve fill -> triangulated mesh -> cleanly merged into relief!
    base_top_y = ATLAS_CY + 0.06
    base_mid_y = ATLAS_CY - 0.28
    base_bot_y = ATLAS_CY - 0.62

    # Skirt walls (2 chamfered jade-slate tiers)
    skirt_pts = []
    for y_lvl, scale_out in ((base_top_y, 0.0), (base_mid_y, 0.06), (base_bot_y, 0.14)):
        for i in range(n):
            px, pz = ring_xz[i]
            nx_p = ring_xz[(i + 1) % n]
            pr_p = ring_xz[(i - 1) % n]
            tx_v = nx_p[0] - pr_p[0]
            tz_v = nx_p[1] - pr_p[1]
            # Outward normal in (x, z) for CCW in (x, -z)
            # In (x, -z), tangent is (tx_v, -tz_v), outward right-hand normal is (-tz_v, -tx_v) -> in (x, z): (-tz_v, tx_v)
            ln = sqrt(tx_v * tx_v + tz_v * tz_v) + 1e-8
            ox, oz = (-tz_v / ln) * scale_out, (tx_v / ln) * scale_out
            skirt_pts.append(w(px + ox, y_lvl, pz + oz))
    skirt_faces = []
    skirt_cols = []
    for tier, col in ((0, "2b6662"), (1, "1c464a")):
        lo = tier * n
        hi = (tier + 1) * n
        for i in range(n):
            k = (i + 1) % n
            skirt_faces.append((hi + i, hi + k, lo + k, lo + i))
            skirt_cols.append(col)
    relief.mesh(skirt_pts, skirt_faces, skirt_cols, smooth=False)

    # Solid top cap flush at base_top_y (fills the 0.5-cell margin between grid & exact border)
    curve_data = bpy.data.curves.new(f"{name}_cap_curve", type="CURVE")
    curve_data.dimensions = "2D"
    curve_data.fill_mode = "BOTH"
    sp = curve_data.splines.new("POLY")
    sp.points.add(n - 1)
    for i, (px, pz) in enumerate(ring_xz):
        sp.points[i].co = (px, -pz, 0.0, 1.0)
    sp.use_cyclic_u = True
    c_obj = bpy.data.objects.new(f"{name}_cap_tmp", curve_data)
    bpy.context.collection.objects.link(c_obj)
    deps = bpy.context.evaluated_depsgraph_get()
    eval_mesh = c_obj.evaluated_get(deps).to_mesh()
    cap_pts = [Vector((v.co.x, v.co.y, base_top_y)) for v in eval_mesh.vertices]
    cap_faces = [tuple(p.vertices) for p in eval_mesh.polygons]
    cap_cols = ["33786e" for _ in cap_faces]
    relief.mesh(cap_pts, cap_faces, cap_cols, smooth=False)
    c_obj.evaluated_get(deps).to_mesh_clear()
    bpy.data.objects.remove(c_obj, do_unlink=True)
    bpy.data.curves.remove(curve_data)

    # Raised beveled brushed-gold coastline rim (鎏金岸线)
    rw = 0.065 if not is_island else 0.045
    rh = 0.085
    rim_pts = []
    for i in range(n):
        px, pz = ring_xz[i]
        nx_p = ring_xz[(i + 1) % n]
        pr_p = ring_xz[(i - 1) % n]
        tx_v = nx_p[0] - pr_p[0]
        tz_v = nx_p[1] - pr_p[1]
        ln = sqrt(tx_v * tx_v + tz_v * tz_v) + 1e-8
        ox, oz = (-tz_v / ln) * rw, (tx_v / ln) * rw
        # 4 cross-section points around coastline
        rim_pts.extend([
            w(px - ox * 0.4, base_top_y, pz - oz * 0.4),
            w(px + ox, base_top_y - 0.02, pz + oz),
            w(px + ox * 0.8, base_top_y + rh, pz + oz * 0.8),
            w(px - ox * 0.3, base_top_y + rh, pz - oz * 0.3),
        ])
    rim_faces = []
    for i in range(n):
        k = (i + 1) % n
        a, b = i * 4, k * 4
        rim_faces.append((a + 1, b + 1, b + 2, a + 2))  # outer bevel
        rim_faces.append((a + 2, b + 2, b + 3, a + 3))  # top gold crest
        rim_faces.append((a + 3, b + 3, b + 0, a + 0))  # inner face
    rim.mesh(rim_pts, rim_faces, "dfba72", smooth=False)


# =============================================================================
# 2. NOCTURNAL SEA BASIN & BRASS ARMILLARY MERIDIAN RINGS
# =============================================================================
def build_plinth_and_armillary():
    root = make_empty("China_Plinth_Frame", (0.0, 0.0, ATLAS_CZ))
    sea = Part("Atlas_Sea_Basin", root, mat_sea, origin=w(0.0, 0.0, ATLAS_CZ))
    bronze = Part("Atlas_Pedestal_Bronze", root, mat_bronze, origin=w(0.0, 0.0, ATLAS_CZ))
    brass = Part("Atlas_Compass_Brass", root, mat_brass, origin=w(0.0, 0.0, ATLAS_CZ))

    # Concentric bathymetry sea disk (R = 16.0) at y = ATLAS_CY - 0.52 with normalized planar UVs
    y_sea = ATLAS_CY - 0.52
    rings, segs = 12, 72
    pts = [w(0.0, y_sea, ATLAS_CZ)]
    uv_list = [(0.5, 0.5)]
    for j in range(1, rings + 1):
        r = 16.0 * (j / rings)
        for i in range(segs):
            a = TAU * i / segs
            rx, rz = r * cos(a), r * sin(a)
            pts.append(w(rx, y_sea, ATLAS_CZ + rz))
            uv_list.append((0.5 + rx / 32.0, 0.5 + rz / 32.0))
    faces = []
    cols = []
    face_uvs = []
    for i in range(segs):
        k = (i + 1) % segs
        faces.append((0, 1 + k, 1 + i))
        cols.append("122c38")
        face_uvs.append([uv_list[0], uv_list[1 + k], uv_list[1 + i]])
    for j in range(1, rings):
        lo = 1 + (j - 1) * segs
        hi = 1 + j * segs
        frac = j / rings
        col = lerp_hex("153240", "081520", frac)
        for i in range(segs):
            k = (i + 1) % segs
            faces.append((lo + i, lo + k, hi + k, hi + i))
            cols.append(col)
            face_uvs.append([uv_list[lo + i], uv_list[lo + k], uv_list[hi + k], uv_list[hi + i]])
    sea.mesh(pts, faces, cols, face_uvs=face_uvs, smooth=False)

    # Dark bronze stepped outer rim & lower architectural plinth skirt
    bronze.ring_t((0.0, y_sea, ATLAS_CZ), 15.85, 16.95, -0.95, 0.28, 72, "1d2b34")
    bronze.ring_t((0.0, y_sea, ATLAS_CZ), 14.50, 16.20, -1.65, -0.92, 32, "142028")

    # Graduated antique brass astrolabe meridian rings + 72 ticks + 4 cardinal pointers
    brass.ring_t((0.0, y_sea, ATLAS_CZ), 15.92, 16.22, 0.24, 0.36, 96, "d6ad66")
    brass.ring_t((0.0, y_sea, ATLAS_CZ), 16.65, 16.90, 0.22, 0.34, 96, "c0944f")
    for i in range(72):
        a = TAU * i / 72
        is_card = (i % 18 == 0)
        is_term = (i % 3 == 0)
        r0 = 16.22
        r1 = 16.65 if is_card else (16.56 if is_term else 16.42)
        tw = 0.085 if is_card else (0.045 if is_term else 0.022)
        rm = 0.5 * (r0 + r1)
        rl = 0.5 * (r1 - r0)
        ca, sa = cos(a), sin(a)
        cx, cz = rm * ca, ATLAS_CZ + rm * sa
        # Oriented tick quad
        p_pts = [
            w(cx - ca * rl - sa * tw, y_sea + 0.34, cz - sa * rl + ca * tw),
            w(cx + ca * rl - sa * tw, y_sea + 0.34, cz + sa * rl + ca * tw),
            w(cx + ca * rl + sa * tw, y_sea + 0.34, cz + sa * rl - ca * tw),
            w(cx - ca * rl + sa * tw, y_sea + 0.34, cz - sa * rl - ca * tw),
        ]
        brass.mesh(p_pts, [(0, 1, 2, 3)], "ecc87e" if is_card else "c89c56")
        if is_card:
            # Cardinal lotus brass finial perched on the outer compass ring
            brass.lathe_t((16.80 * ca, y_sea + 0.32, ATLAS_CZ + 16.80 * sa),
                          [(0, 0.22), (0.14, 0.26), (0.34, 0.14), (0.52, 0.04)], 12, "e6be72")

    # Separate slow-revolving outer celestial armillary ring (animated in unified.js!)
    orb = Part("Atlas_Orbital_Ring", None, mat_brass, origin=w(0.0, y_sea + 0.35, ATLAS_CZ))
    orb.ring_t((0.0, y_sea + 0.35, ATLAS_CZ), 17.65, 17.92, -0.07, 0.07, 96, "d9b26a", tilt_x=0.14, tilt_z=-0.06)
    for i in range(12):
        a = TAU * i / 12
        rx, rz = 17.78 * cos(a), 17.78 * sin(a)
        ry = -rz * sin(0.14)
        rz_t = rz * cos(0.14)
        orb.lathe_t((rx, y_sea + 0.35 + ry, ATLAS_CZ + rz_t), [(0, 0.14), (0.12, 0.14)], 10, "f2d28a")


# =============================================================================
# 3. LUMINOUS FLOWING RIVER RIBBONS (U = 0 -> 1 from source to estuary)
# =============================================================================
def build_rivers():
    for rname, is_main, pts_xz in RIVERS_XZ:
        # Subdivide polyline smoothly with Catmull-Rom interpolation
        dense = []
        n = len(pts_xz)
        for i in range(n - 1):
            p0 = pts_xz[max(0, i - 1)]
            p1 = pts_xz[i]
            p2 = pts_xz[i + 1]
            p3 = pts_xz[min(n - 1, i + 2)]
            for s in range(6):
                t = s / 6.0
                t2, t3 = t * t, t * t * t
                x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
                z = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
                dense.append((x, z))
        dense.append(pts_xz[-1])

        river = Part(rname, None, mat_river_main if is_main else mat_river_trib)
        r_pts = []
        m = len(dense)
        for i, (px, pz) in enumerate(dense):
            u = i / max(1, m - 1)
            prev = dense[max(0, i - 1)]
            nxt = dense[min(m - 1, i + 1)]
            tx_v, tz_v = nxt[0] - prev[0], nxt[1] - prev[1]
            ln = sqrt(tx_v * tx_v + tz_v * tz_v) + 1e-8
            nx, nz = -tz_v / ln, tx_v / ln
            # River widens naturally toward its estuary!
            hw = (0.095 + 0.085 * u) if is_main else (0.048 + 0.032 * u)
            h_val = terrain_height(px, pz, False)
            y_r = ATLAS_CY + h_val + 0.075
            r_pts.append(w(px - nx * hw, y_r, pz - nz * hw))
            r_pts.append(w(px + nx * hw, y_r, pz + nz * hw))
        r_faces = []
        r_uvs = []
        for i in range(m - 1):
            u0 = i / max(1, m - 1)
            u1 = (i + 1) / max(1, m - 1)
            a, b = i * 2, (i + 1) * 2
            r_faces.append((a, b, b + 1, a + 1))
            r_uvs.append([(u0, 0.0), (u1, 0.0), (u1, 1.0), (u0, 1.0)])
        river.mesh(r_pts, r_faces, "7cf5e2" if is_main else "56cbb8", face_uvs=r_uvs, smooth=True)


# =============================================================================
# 4. 22 SCULPTED BRONZE & LANTERN CITY BEACONS (City_Beacon_0..21)
# =============================================================================
def build_city_beacons():
    for idx, (cname, lon, lat, is_major) in enumerate(PLACES):
        tx, tz = project_lonlat(lon, lat)
        h_val = terrain_height(tx, tz, False)
        by = ATLAS_CY + h_val + 0.02
        root = make_empty(f"City_Beacon_{idx}", (tx, by, tz))
        make_empty(f"Anchor_City_Beacon_{idx}", (tx, by + 0.78, tz))

        base = Part(f"City_Beacon_Base_{idx}", root, mat_brass, origin=w(tx, by, tz))
        glow = Part(f"City_Beacon_Core_{idx}", root, mat_beacon_gold if is_major else mat_beacon_jade, origin=w(tx, by, tz))

        # Harmonized jewelry-scale bronze & crystal drop-pins (refined proportions, zero giant halo!)
        h_stem = 0.28 if is_major else 0.22
        r_base = 0.16 if is_major else 0.13
        base.lathe_t((tx, by, tz), [(0, r_base), (0.045, r_base * 0.85), (0.10, 0.08), (h_stem, 0.052)], 12, "dfb569" if is_major else "c8a160", smooth=True)
        glow.lathe_t((tx, by + h_stem, tz), [(0, 0.052), (0.11, 0.105 if is_major else 0.088), (0.28, 0.018)], 8, "ffd68a" if is_major else "8ae8d2", smooth=False)


build_landmass("China_Mainland_Relief_0", "China_Mainland_Relief_0_Rim", OUTLINE_XZ, 192, 136, is_island=False)
build_landmass("China_Hainan_Relief_0", "China_Hainan_Relief_0_Rim", HAINAN_XZ, 20, 16, is_island=True)
build_landmass("China_Taiwan_Relief_0", "China_Taiwan_Relief_0_Rim", TAIWAN_XZ, 18, 26, is_island=True)
build_plinth_and_armillary()
build_rivers()
build_city_beacons()

for p in parts:
    p.finish()

bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / "china-atlas.blend"), compress=True)

with TemporaryDirectory(dir=ROOT) as tmp:
    out_glb = Path(tmp) / "china-atlas.glb"
    res = bpy.ops.export_scene.gltf(
        filepath=str(out_glb),
        export_format="GLB",
        export_yup=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
    )
    if res != {"FINISHED"} or out_glb.read_bytes()[:4] != b"glTF":
        raise RuntimeError("Failed to export china-atlas.glb")
    for folder in (REPO / "assets", REPO / "dist/assets"):
        pending = Path(tmp) / (folder.parent.name + "-atlas.glb")
        copyfile(out_glb, pending)
        os.replace(pending, folder / "china-atlas.glb")
print("EXPORTED china-atlas.glb OK")
