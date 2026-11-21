"""Build the Nocturnal Jiangnan Canal, Stepped Huizhou Horse-Head Gable Houses,
Single-Arch Stone Bridge, Eave Cat & 6 Wupeng Lantern Boats (Zone 05).
Run with: blender --background --factory-startup --python authoring/build_jiangnan_river.py
Exports: authoring/jiangnan-river.blend, assets/jiangnan-river.glb, dist/assets/jiangnan-river.glb
"""
from pathlib import Path
from math import sin, cos, pi, sqrt
from random import Random
from shutil import copyfile
from tempfile import TemporaryDirectory
import os
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
TAU = 2 * pi
rng = Random(505)

if not bpy.app.background:
    raise RuntimeError("Run build_jiangnan_river.py in background Blender")
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


def make_pigment_mat(name, metallic=0.0, roughness=0.78, glow_color=None, glow=0.0):
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
    return mat


def make_named_mat(name, hexcolor, roughness=0.5):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = linear(hexcolor)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


mat_plaster = make_pigment_mat("RiverPlasterPigment", metallic=0.0, roughness=0.86)
mat_tile = make_pigment_mat("RiverTilePigment", metallic=0.06, roughness=0.62)
mat_wood = make_pigment_mat("RiverTimberPigment", metallic=0.04, roughness=0.60)
mat_stone = make_pigment_mat("RiverGranitePigment", metallic=0.02, roughness=0.82)
mat_foliage = make_pigment_mat("RiverWillowPigment", metallic=0.0, roughness=0.85)
mat_brass = make_pigment_mat("RiverBrassPigment", metallic=0.82, roughness=0.32)
mat_win_glow = make_pigment_mat("RiverWindowGlow", metallic=0.0, roughness=0.3, glow_color=(1.0, 0.68, 0.28), glow=2.0)
mat_lantern = make_pigment_mat("RiverLanternGlow", metallic=0.0, roughness=0.25, glow_color=(1.0, 0.72, 0.30), glow=2.6)
mat_water = make_named_mat("RiverWaterBase", "0d222c", roughness=0.15)

parts = []


class Part:
    def __init__(self, name, parent=None, mat=mat_plaster, origin=(0, 0, 0)):
        self.name = name
        self.parent = parent
        self.mat = mat
        self.origin = Vector(origin)
        self.verts = []
        self.faces = []
        self.pigment = []
        self.smooth_ranges = []
        parts.append(self)

    def _loc(self, pt):
        return Vector(pt) - self.origin

    def mesh(self, points, faces, color="ffffff", jitter=0.035, smooth=False):
        start = len(self.verts)
        self.verts.extend(self._loc(p) for p in points)
        f0 = len(self.faces)
        for f in faces:
            self.faces.append(tuple(start + i for i in f))
            self.pigment.append(linear(color, 1.0 + rng.uniform(-jitter, jitter)))
        if smooth:
            self.smooth_ranges.append(range(f0, len(self.faces)))

    def box_t(self, tc, half_t, color="ffffff", jitter=0.03):
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
        self.mesh(pts, faces, color, jitter)

    def lathe_t(self, tc, profile, sides=16, color="ffffff", jitter=0.02, smooth=True):
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
        self.mesh(pts, faces, color, jitter, smooth=smooth)

    def rod_t(self, p1_t, p2_t, r1, r2, color="ffffff", sides=8, smooth=True):
        p = w(*p1_t)
        q = w(*p2_t)
        axis = q - p
        if axis.length < 1e-6:
            return
        d = axis.normalized()
        u = d.orthogonal().normalized()
        v = d.cross(u)
        pts = []
        for frac, rad in ((0.0, r1), (1.0, r2)):
            c = p + axis * frac
            for i in range(sides):
                a = TAU * i / sides
                pts.append(c + (u * cos(a) + v * sin(a)) * rad)
        faces = [tuple(reversed(range(sides)))]
        for i in range(sides):
            k = (i + 1) % sides
            faces.append((i, k, k + sides, i + sides))
        faces.append(tuple(range(sides, 2 * sides)))
        self.mesh(pts, faces, color, 0.02, smooth=smooth)

    def finish(self):
        mesh = bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.verts, [], self.faces)
        mesh.materials.append(self.mat)
        pigment = mesh.color_attributes.new(name="Pigment", type="BYTE_COLOR", domain="CORNER")
        for poly, rgba in zip(mesh.polygons, self.pigment):
            for li in poly.loop_indices:
                pigment.data[li].color = rgba
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


WATER_Y = -6.50


# =============================================================================
# 1. NOCTURNAL CANAL WATER SURFACE (River_Bed)
# =============================================================================
def build_river_bed():
    bed = Part("River_Bed", None, mat_water)
    nx, nz = 24, 48
    xmin, xmax = -11.0, 11.0
    zmin, zmax = -126.0, -54.0
    pts = []
    for iz in range(nz + 1):
        z = zmin + (zmax - zmin) * iz / nz
        for ix in range(nx + 1):
            x = xmin + (xmax - xmin) * ix / nx
            pts.append(w(x, WATER_Y, z))
    faces = []
    for iz in range(nz):
        for ix in range(nx):
            a = iz * (nx + 1) + ix
            b = a + 1
            c = a + (nx + 1) + 1
            d = a + (nx + 1)
            faces.append((a, d, c, b))
    bed.mesh(pts, faces, "0e232e", 0.0)


# =============================================================================
# 2. STEPPED HUIZHOU WATERFRONT ARCHITECTURE (River_Bank_Left & River_Bank_Right)
# =============================================================================
def build_huizhou_house(plaster, tile, wood, stone, glow, lantern, side, zc, depth, height, inset=0.0):
    """Build an authentic Huizhou dwelling facing the canal at x = side * (8.4 + inset)."""
    face_x = side * (8.45 + inset)
    back_x = side * (14.4 + inset)
    cx = 0.5 * (face_x + back_x)
    hw = abs(back_x - face_x) * 0.5
    hd = depth * 0.5
    base_y = -4.85
    wall_top = base_y + height

    # Wet stone plinth base + whitewashed plaster main body
    stone.box_t((cx, base_y + 0.35, zc), (hw + 0.04, 0.35, hd + 0.04), "4c565c", 0.05)
    plaster.box_t((cx, base_y + height * 0.5 + 0.25, zc), (hw, height * 0.5 - 0.15, hd), rng.choice(["cfc9bc", "c7c2b6", "d4cec0"]), 0.03)

    # Timber horizontal gallery fascia & 2nd-floor wooden veranda (美人靠) on canal face
    fx = face_x - side * 0.06
    mid_y = base_y + height * 0.48
    wood.box_t((fx, mid_y, zc), (0.14, 0.10, hd + 0.06), "3c261b", 0.03)
    wood.box_t((fx, wall_top - 0.12, zc), (0.18, 0.12, hd + 0.12), "352117", 0.03)
    # Vertical timber corner pilasters
    for sz in (-hd + 0.16, hd - 0.16):
        wood.box_t((fx, base_y + height * 0.5 + 0.1, zc + sz), (0.10, height * 0.5, 0.11), "382319", 0.03)

    # Carved wooden lattice windows (1st & 2nd floor) glowing warm amber
    win_xs = fx - side * 0.05
    num_w = 2 if depth < 6.8 else 3
    for floor_idx, wy in enumerate((base_y + height * 0.27, base_y + height * 0.72)):
        for k in range(num_w):
            wz = zc + (k - (num_w - 1) * 0.5) * (depth / (num_w + 0.35))
            wh = 0.62 if floor_idx == 1 else 0.54
            ww = 0.48
            wood.box_t((win_xs, wy, wz), (0.05, wh + 0.07, ww + 0.07), "3f281c", 0.02)
            # Warm oil-lamp lit windows along canal (higher warm glow ratio for inviting waterfront)
            if rng.random() < 0.88 or zc > -88.0:
                glow.box_t((win_xs - side * 0.035, wy, wz), (0.035, wh, ww), rng.choice(["ffc670", "ffb658", "ffd488"]), 0.05)
            else:
                plaster.box_t((win_xs - side * 0.035, wy, wz), (0.035, wh, ww), "24333d", 0.03)
            # Delicate thin cross lattice mullions sitting cleanly over the glowing paper pane
            wood.box_t((win_xs - side * 0.072, wy, wz), (0.014, wh, 0.022), "4a3022", 0.02)
            wood.box_t((win_xs - side * 0.072, wy, wz), (0.014, 0.022, ww), "4a3022", 0.02)

    # Curved pitched dark-slate Jiangnan roof with individual tile flute ribs & upturned eave!
    ridge_y = wall_top + 1.55
    eave_x = face_x - side * 0.82
    eave_y = wall_top - 0.22
    # Sloping roof deck (front slope facing canal + back slope)
    r_segs = 5
    for s in range(r_segs):
        t0, t1 = s / r_segs, (s + 1) / r_segs
        # Slight upward curve near the eave (举折飞檐!)
        x0 = cx + (eave_x - cx) * t0
        x1 = cx + (eave_x - cx) * t1
        y0 = ridge_y + (eave_y - ridge_y) * t0 - 0.24 * sin(t0 * pi)
        y1 = ridge_y + (eave_y - ridge_y) * t1 - 0.24 * sin(t1 * pi)
        pts = [
            w(x0, y0, zc - hd - 0.14), w(x1, y1, zc - hd - 0.14),
            w(x1, y1, zc + hd + 0.14), w(x0, y0, zc + hd + 0.14),
            w(x0, y0 - 0.14, zc - hd - 0.14), w(x1, y1 - 0.14, zc - hd - 0.14),
            w(x1, y1 - 0.14, zc + hd + 0.14), w(x0, y0 - 0.14, zc + hd + 0.14),
        ]
        # Ensure upward normal regardless of side
        top_f = (0, 1, 2, 3) if side < 0 else (3, 2, 1, 0)
        tile.mesh(pts, [top_f, (4, 7, 6, 5), (0, 3, 7, 4), (1, 5, 6, 2)], "26333d", 0.04)
    # Fluted tile ribs down the canal-facing slope
    n_ribs = max(8, int(depth * 2.1))
    for r in range(n_ribs):
        rz = zc - hd + (r + 0.5) * (depth / n_ribs)
        tile.rod_t((cx, ridge_y + 0.04, rz), (eave_x, eave_y + 0.05, rz), 0.055, 0.065, "31414d", 5, smooth=False)
    # Roof ridge beam
    tile.box_t((cx, ridge_y + 0.10, zc), (0.14, 0.14, hd + 0.20), "1f2b34", 0.03)

    # Authentic 3-Tier Stepped Huizhou 马头墙 (Horse-Head Gable Walls) on both z-ends!
    for end_s in (-1, 1):
        gz = zc + end_s * (hd + 0.12)
        tiers = [
            (cx, hw * 0.42, ridge_y + 0.72),
            (cx + (face_x - cx) * 0.46, hw * 0.34, ridge_y + 0.20),
            (face_x - side * 0.10, 0.52, wall_top + 0.35),
        ]
        for tx, tw, ty_top in tiers:
            th = (ty_top - base_y) * 0.5
            plaster.box_t((tx, base_y + th, gz), (tw, th, 0.14), "d9d3c5", 0.02)
            # Dark charcoal tile coping cap + upturned eaves lip on each step!
            tile.box_t((tx, ty_top + 0.08, gz), (tw + 0.14, 0.09, 0.26), "232f38", 0.03)
            tile.box_t((tx - side * (tw + 0.08), ty_top + 0.18, gz), (0.12, 0.07, 0.24), "2c3a44", 0.03)

    # Hanging riverside warm silk lantern beneath the eave
    if rng.random() < 0.72:
        lx = eave_x + side * 0.16
        ly = eave_y - 0.62
        lz = zc + rng.uniform(-hd * 0.35, hd * 0.35)
        wood.rod_t((lx, eave_y, lz), (lx, ly + 0.36, lz), 0.02, 0.02, "2f1d14", 6)
        lantern.lathe_t((lx, ly, lz), [(0, 0.06), (0.10, 0.19), (0.26, 0.19), (0.36, 0.06)], 12, "ffbe5c")
        wood.lathe_t((lx, ly + 0.35, lz), [(0, 0.08), (0.04, 0.08)], 10, "3d2418")
        wood.lathe_t((lx, ly - 0.18, lz), [(0, 0.015), (0.18, 0.04)], 6, "a62b22")  # crimson tassel


def build_willow(wood, foliage, tx, ty, tz, lean_x):
    """Graceful riverside weeping willow with sculpted dark-jade leafy crown clouds & subtle arched wisps."""
    base = (tx, ty, tz)
    mid = (tx + lean_x * 0.65, ty + 1.9, tz + rng.uniform(-0.3, 0.3))
    top = (tx + lean_x * 1.45, ty + 3.2, tz + rng.uniform(-0.4, 0.4))
    wood.rod_t(base, mid, 0.22, 0.14, "36251c", 8)
    wood.rod_t(mid, top, 0.14, 0.07, "3f2c21", 8)
    for i in range(7):
        a = TAU * i / 7 + rng.uniform(-0.2, 0.2)
        b_end = (top[0] + cos(a) * 1.05 + lean_x * 0.35, top[1] + rng.uniform(-0.25, 0.65), top[2] + sin(a) * 1.15)
        wood.rod_t(mid if i % 2 == 0 else top, b_end, 0.055, 0.018, "3c2a20", 6)
        # Soft teardrop leafy willow canopy puffs instead of stiff straight sticks
        for k in range(3):
            px = b_end[0] + rng.uniform(-0.32, 0.32)
            py = b_end[1] - k * 0.42 + rng.uniform(-0.1, 0.12)
            pz = b_end[2] + rng.uniform(-0.32, 0.32)
            r_puff = rng.uniform(0.32, 0.52) * (1.0 - k * 0.18)
            foliage.lathe_t((px, py - r_puff * 1.1, pz),
                            [(0, 0.04), (r_puff * 0.55, r_puff * 0.72), (r_puff * 1.25, r_puff * 0.92), (r_puff * 1.85, r_puff * 0.52), (r_puff * 2.1, 0.04)],
                            9, rng.choice(["1a3833", "22453e", "15302c", "294e45"]), 0.05, smooth=True)


def build_banks():
    for side, bname in ((-1, "River_Bank_Left"), (1, "River_Bank_Right")):
        root = make_empty(bname, (side * 10.0, -5.0, -82.0))
        plaster = Part(f"{bname}_Plaster", root, mat_plaster, origin=w(side * 10.0, -5.0, -82.0))
        tile = Part(f"{bname}_Tiles", root, mat_tile, origin=w(side * 10.0, -5.0, -82.0))
        wood = Part(f"{bname}_Timber", root, mat_wood, origin=w(side * 10.0, -5.0, -82.0))
        stone = Part(f"{bname}_Granite", root, mat_stone, origin=w(side * 10.0, -5.0, -82.0))
        glow = Part(f"{bname}_WinGlow", root, mat_win_glow, origin=w(side * 10.0, -5.0, -82.0))
        lantern = Part(f"{bname}_Lanterns", root, mat_lantern, origin=w(side * 10.0, -5.0, -82.0))
        willow = Part(f"{bname}_Willows", root, mat_foliage, origin=w(side * 10.0, -5.0, -82.0))

        # Dressed granite canal quay embankment (z = -56 .. -122)
        stone.box_t((side * 11.4, -5.85, -89.0), (3.8, 1.0, 33.5), "39444c", 0.04)
        # Beveled stone coping lip overhanging water slightly
        stone.box_t((side * 7.62, -4.85, -89.0), (0.28, 0.14, 33.5), "525f68", 0.04)
        # Wet darker stone water-line band
        stone.box_t((side * 7.56, -6.32, -89.0), (0.08, 0.24, 33.5), "222c33", 0.03)
        # Stone water-steps (水埠头) & mooring bollards
        for sz in (-69.5, -81.5, -97.5):
            for step in range(4):
                stone.box_t((side * (7.25 - step * 0.22), -5.05 - step * 0.34, sz), (0.25, 0.15, 1.15), "48555e", 0.03)
            stone.lathe_t((side * 7.55, -4.72, sz + 1.5), [(0, 0.12), (0.48, 0.10), (0.55, 0.13)], 10, "5a6770")

        # Staggered Huizhou dwellings along both banks (organic heights & slight setbacks)
        z_cursor = -63.0
        specs = [
            (7.2, 4.4, 0.2),
            (6.4, 5.4, -0.15),
            (7.6, 4.8, 0.25),
            (6.8, 5.7, 0.0),
            (7.4, 4.9, 0.3),
            (7.0, 5.2, 0.1),
            (7.2, 4.6, 0.2),
        ]
        for depth, height, inset in specs:
            zc = z_cursor - depth * 0.5
            build_huizhou_house(plaster, tile, wood, stone, glow, lantern, side, zc, depth - 0.35, height, inset)
            z_cursor -= depth

        # Riverside weeping willows framing the canal
        build_willow(wood, willow, side * 7.8, -4.80, -76.5, -side * 1.1)
        build_willow(wood, willow, side * 7.9, -4.80, -96.5, -side * 1.0)


# =============================================================================
# 3. SCULPTED SINGLE-ARCH JIANGNAN STONE BRIDGE (+ DISTANT MIST BRIDGE)
# =============================================================================
def build_stone_bridge(name, zc, span=15.6, arch_rise=3.85, width=2.45, with_lanterns=True):
    root = make_empty(name, (0.0, -4.5, zc))
    stone = Part(f"{name}_Masonry", root, mat_stone, origin=w(0.0, -4.5, zc))
    wood = Part(f"{name}_Rails", root, mat_wood, origin=w(0.0, -4.5, zc))
    lantern = Part(f"{name}_Lanterns", root, mat_lantern, origin=w(0.0, -4.5, zc))

    segs = 28
    half_s = span * 0.5
    hw = width * 0.5
    base_y = -6.55

    # Arch deck & underside masonry voussoirs
    for i in range(segs):
        u0, u1 = i / segs, (i + 1) / segs
        x0 = -half_s + span * u0
        x1 = -half_s + span * u1
        # Smooth humpback Jiangnan arch curve
        s0, s1 = sin(u0 * pi), sin(u1 * pi)
        y_top0 = -4.75 + arch_rise * (s0 ** 1.15)
        y_top1 = -4.75 + arch_rise * (s1 ** 1.15)
        # Semicircular arch opening underneath for central 72% of span
        y_bot0 = base_y + max(0.0, (arch_rise - 0.65) * sin(max(0.0, min(1.0, (u0 - 0.10) / 0.80)) * pi))
        y_bot1 = base_y + max(0.0, (arch_rise - 0.65) * sin(max(0.0, min(1.0, (u1 - 0.10) / 0.80)) * pi))

        # Bridge body segment (solid stone spandrel + arch ring)
        pts = [
            w(x0, y_bot0, zc - hw), w(x1, y_bot1, zc - hw),
            w(x1, y_bot1, zc + hw), w(x0, y_bot0, zc + hw),
            w(x0, y_top0, zc - hw), w(x1, y_top1, zc - hw),
            w(x1, y_top1, zc + hw), w(x0, y_top0, zc + hw),
        ]
        stone.mesh(pts, [
            (4, 7, 6, 5), (0, 1, 2, 3),
            (0, 4, 5, 1), (3, 2, 6, 7),
        ], "59646b" if i % 2 == 0 else "4f5961", 0.03)

        # Carved arch voussoir accent trim along front & back edges
        for sz in (-hw - 0.06, hw + 0.06):
            stone.rod_t((x0, y_bot0 + 0.14, zc + sz), (x1, y_bot1 + 0.14, zc + sz), 0.16, 0.16, "6e787e", 6, smooth=False)
            # Curved parapet handrail
            wood.rod_t((x0, y_top0 + 0.88, zc + sz * 0.92), (x1, y_top1 + 0.88, zc + sz * 0.92), 0.085, 0.085, "4e3222", 6, smooth=False)
            stone.rod_t((x0, y_top0 + 0.34, zc + sz * 0.92), (x1, y_top1 + 0.34, zc + sz * 0.92), 0.09, 0.09, "5e6870", 6, smooth=False)

        # Carved granite lotus parapet posts every 2 segments
        if i % 2 == 0:
            for sz in (-hw + 0.06, hw - 0.06):
                stone.box_t((x0, y_top0 + 0.48, zc + sz), (0.09, 0.48, 0.09), "6c767c", 0.03)
                stone.lathe_t((x0, y_top0 + 0.96, zc + sz), [(0, 0.11), (0.08, 0.12), (0.19, 0.04)], 8, "7b858b")

    # Warm stone lanterns flanking the arch crown & approaches
    if with_lanterns:
        for lx in (-2.4, 2.4):
            u = (lx + half_s) / span
            ly = -4.75 + arch_rise * (sin(u * pi) ** 1.15)
            for sz in (-hw + 0.08, hw - 0.08):
                stone.lathe_t((lx, ly + 0.95, zc + sz), [(0, 0.14), (0.12, 0.18), (0.48, 0.18), (0.64, 0.24), (0.76, 0.04)], 8, "69747a", smooth=False)
                lantern.lathe_t((lx, ly + 1.08, zc + sz), [(0, 0.13), (0.34, 0.13)], 10, "ffca74")


# =============================================================================
# 4. FOREGROUND SCULPTED TIMBER EAVE (River_Eave) & BLACK CAT (Roof_Cat_3D)
# =============================================================================
def build_eave_and_cat():
    ex, ey, ez = -4.75, -3.15, -72.0
    root = make_empty("River_Eave", (ex, ey, ez))
    wood = Part("Eave_Cedar_Frame", root, mat_wood, origin=w(ex, ey, ez))
    tile = Part("Eave_Clay_Tiles", root, mat_tile, origin=w(ex, ey, ez))
    brass = Part("Eave_Lantern_Frame", root, mat_brass, origin=w(ex, ey, ez))
    lantern = Part("Eave_Palace_Lantern", root, mat_lantern, origin=w(ex, ey, ez))

    # Sloped eave roof jutting from left waterfront house toward the canal
    # Slopes gently downward from x=-8.2 (y=-1.45) to x=-2.45 (y=-2.85), z in [-74.6, -69.2]
    x_in, y_in = -8.2, -1.45
    x_out, y_out = -2.45, -2.85
    z0, z1 = -74.6, -69.2

    # Main beam, fascia & exposed rafters
    wood.box_t((x_out - 0.45, y_out - 0.22, -71.9), (0.16, 0.18, 2.75), "3b2419", 0.03)
    for i in range(9):
        rz = z0 + 0.25 + i * ((z1 - z0 - 0.5) / 8.0)
        wood.rod_t((x_in, y_in - 0.14, rz), (x_out + 0.12, y_out - 0.12, rz), 0.075, 0.065, "4a2e20", 6, smooth=False)
    # Two sturdy cedar support posts anchored down to the stone quay (y = -6.80)
    for pz in (-74.1, -69.7):
        wood.box_t((-6.25, -4.55, pz), (0.16, 2.35, 0.16), "362117", 0.03)
        wood.box_t((-6.25, -6.58, pz), (0.24, 0.26, 0.24), "556068", 0.03)  # stone column plinth
        # Diagonal carved bracket strut up to the eave purlin
        wood.rod_t((-6.25, -3.55, pz), (-3.15, -2.92, pz), 0.09, 0.08, "42281c", 6, smooth=False)

    # Roof deck + 16 scalloped barrel-tile flutes with upturned eave drip-tiles!
    pts = [
        w(x_in, y_in, z0), w(x_out, y_out, z0), w(x_out, y_out, z1), w(x_in, y_in, z1),
        w(x_in, y_in - 0.12, z0), w(x_out, y_out - 0.12, z0), w(x_out, y_out - 0.12, z1), w(x_in, y_in - 0.12, z1),
    ]
    tile.mesh(pts, [(0, 1, 2, 3), (4, 7, 6, 5), (1, 5, 6, 2)], "263540", 0.03)
    for i in range(17):
        rz = z0 + 0.14 + i * ((z1 - z0 - 0.28) / 16.0)
        tile.rod_t((x_in, y_in + 0.06, rz), (x_out + 0.08, y_out + 0.08, rz), 0.085, 0.095, "334554" if i % 2 == 0 else "2a3a47", 7, smooth=True)
        # Circular clay eave drip-tile cap (瓦当)
        tile.lathe_t((x_out + 0.06, y_out + 0.06, rz), [(0, 0.09), (0.06, 0.09)], 8, "3f5362")

    # Hanging Sculpted Ribbed Silk Palace Lantern under the eave (-3.05, -4.15, -70.7)
    lx, ly, lz = -3.05, -4.15, -70.7
    brass.rod_t((lx, y_out - 0.16, lz), (lx, ly + 0.85, lz), 0.025, 0.025, "b88c4f", 8)
    brass.lathe_t((lx, ly + 0.72, lz), [(0, 0.26), (0.08, 0.28), (0.14, 0.16)], 12, "c89c5b")
    brass.lathe_t((lx, ly - 0.08, lz), [(0, 0.16), (0.08, 0.26)], 12, "c89c5b")
    lantern.lathe_t((lx, ly, lz), [(0, 0.24), (0.18, 0.42), (0.54, 0.42), (0.72, 0.24)], 16, "ffca76")
    # 8 curved dark-wood ribs hugging the silk lantern globe
    for i in range(8):
        a = TAU * i / 8
        brass.rod_t((lx + 0.24 * cos(a), ly, lz + 0.24 * sin(a)), (lx + 0.43 * cos(a), ly + 0.36, lz + 0.43 * sin(a)), 0.018, 0.018, "4a2e1e", 5)
        brass.rod_t((lx + 0.43 * cos(a), ly + 0.36, lz + 0.43 * sin(a)), (lx + 0.24 * cos(a), ly + 0.72, lz + 0.24 * sin(a)), 0.018, 0.018, "4a2e1e", 5)
    # Crimson silk tassel beneath lantern
    wood.rod_t((lx, ly - 0.08, lz), (lx, ly - 0.52, lz), 0.045, 0.022, "b33126", 8)

    # --- Sculpted Eave Black Cat (Roof_Cat_3D at -3.25, -2.62, -71.5) ---
    cx, cy, cz = -3.25, -2.58, -71.5
    cat_root = make_empty("Roof_Cat_3D", (cx, cy, cz))
    make_empty("Anchor_Roof_Cat_3D", (cx, cy + 1.05, cz))
    cat = Part("Eave_Cat_Mesh", cat_root, mat_tile, origin=w(cx, cy, cz))
    eyes = Part("Eave_Cat_Eyes", cat_root, mat_lantern, origin=w(cx, cy, cz))

    # Seated body watching the boats on the river
    cat.lathe_t((cx, cy, cz), [(0, 0.24), (0.14, 0.32), (0.44, 0.28), (0.64, 0.19)], 16, "1d222c")
    # Head turned gracefully toward the glowing river
    cat.lathe_t((cx + 0.06, cy + 0.58, cz - 0.08), [(0, 0.14), (0.12, 0.21), (0.26, 0.20), (0.34, 0.12)], 16, "222834")
    # Pointed ears
    cat.rod_t((cx - 0.06, cy + 0.84, cz - 0.06), (cx - 0.10, cy + 1.04, cz - 0.08), 0.075, 0.01, "242a38", 5)
    cat.rod_t((cx + 0.18, cy + 0.84, cz - 0.10), (cx + 0.22, cy + 1.04, cz - 0.12), 0.075, 0.01, "242a38", 5)
    # Graceful S-curved tail
    cat.rod_t((cx - 0.20, cy + 0.12, cz + 0.12), (cx - 0.42, cy + 0.36, cz + 0.24), 0.055, 0.042, "202632", 8)
    cat.rod_t((cx - 0.42, cy + 0.36, cz + 0.24), (cx - 0.36, cy + 0.66, cz + 0.20), 0.042, 0.025, "202632", 8)
    # Subtle glowing golden cat eyes
    eyes.lathe_t((cx + 0.20, cy + 0.72, cz - 0.18), [(0, 0.025), (0.04, 0.025)], 8, "ffd478")
    eyes.lathe_t((cx + 0.06, cy + 0.72, cz - 0.24), [(0, 0.025), (0.04, 0.025)], 8, "ffd478")


# =============================================================================
# 5. SIX SCULPTED CURVED WUPENG LANTERN BOATS (River_Boat_Lantern_0..5)
# =============================================================================
def build_wupeng_boats():
    boat_coords = [
        (-2.80, -6.44, -71.0, 0.14),
        (2.40, -6.44, -74.5, -0.18),
        (-0.50, -6.44, -79.2, 0.06),
        (-3.60, -6.44, -83.5, 0.22),
        (3.10, -6.44, -86.8, -0.12),
        (0.40, -6.44, -90.5, 0.04),
    ]
    for idx, (bx, by, bz, yaw) in enumerate(boat_coords):
        root = make_empty(f"River_Boat_Lantern_{idx}", (bx, by, bz))
        if idx == 2:
            make_empty("Anchor_River_Boat_Lantern_2", (bx, by + 1.15, bz))

        hull = Part(f"Boat_Hull_{idx}", root, mat_wood, origin=w(bx, by, bz))
        canopy = Part(f"Boat_Wupeng_{idx}", root, mat_tile, origin=w(bx, by, bz))
        brass = Part(f"Boat_Hook_{idx}", root, mat_brass, origin=w(bx, by, bz))
        lamp = Part(f"Boat_Lantern_{idx}", root, mat_lantern, origin=w(bx, by, bz))

        ca, sa = cos(yaw), sin(yaw)

        def bpt(lx, ly, lz):
            return (bx + lx * ca - lz * sa, by + ly, bz + lx * sa + lz * ca)

        # Curved tapered Jiangnan wooden hull (bow at +lz, stern at -lz)
        z_stations = [
            (-1.65, 0.04, 0.34, 0.26),  # upturned stern tip
            (-1.25, 0.38, 0.12, 0.34),
            (-0.60, 0.62, 0.02, 0.36),
            (0.00, 0.68, 0.00, 0.36),
            (0.65, 0.60, 0.02, 0.36),
            (1.28, 0.36, 0.12, 0.35),
            (1.72, 0.05, 0.38, 0.28),   # upturned prow tip
        ]
        # Build hull cross-section rings (5 pts per station: port gunwale, port chine, keel, stbd chine, stbd gunwale)
        h_pts = []
        for zs, hw, y_keel, y_gun in z_stations:
            for sx, sy in ((-hw, y_gun), (-hw * 0.72, y_keel + 0.06), (0.0, y_keel), (hw * 0.72, y_keel + 0.06), (hw, y_gun)):
                h_pts.append(w(*bpt(sx, sy, zs)))
        h_faces = []
        for s in range(len(z_stations) - 1):
            lo, hi = s * 5, (s + 1) * 5
            for k in range(4):
                h_faces.append((lo + k, lo + k + 1, hi + k + 1, hi + k))
            # Interior floorboard deck connecting port & stbd chine
            h_faces.append((lo + 1, hi + 1, hi + 3, lo + 3))
        hull.mesh(h_pts, h_faces, "6d4c35", 0.03, smooth=True)

        # Arched ribbed woven-bamboo canopy (乌篷) covering z in [-0.72, +0.62]
        arch_segs = 10
        z_ribs = [-0.72, -0.45, -0.18, 0.09, 0.36, 0.62]
        c_pts = []
        for zr in z_ribs:
            for k in range(arch_segs + 1):
                ang = pi * (k / arch_segs)
                lx = -0.58 * cos(ang)
                ly = 0.34 + 0.56 * sin(ang)
                c_pts.append(w(*bpt(lx, ly, zr)))
        c_faces = []
        stride = arch_segs + 1
        for r in range(len(z_ribs) - 1):
            lo, hi = r * stride, (r + 1) * stride
            for k in range(arch_segs):
                c_faces.append((lo + k, hi + k, hi + k + 1, lo + k + 1))
        canopy.mesh(c_pts, c_faces, "2f2622", 0.04, smooth=True)
        # Raised bamboo arch ribs for silhouette texture
        for zr in z_ribs:
            for k in range(arch_segs):
                a0, a1 = pi * k / arch_segs, pi * (k + 1) / arch_segs
                p0 = bpt(-0.60 * cos(a0), 0.34 + 0.58 * sin(a0), zr)
                p1 = bpt(-0.60 * cos(a1), 0.34 + 0.58 * sin(a1), zr)
                hull.rod_t(p0, p1, 0.028, 0.028, "4f392a", 5)

        # Sculling oar resting along starboard stern
        hull.rod_t(bpt(0.45, 0.34, -0.30), bpt(0.82, 0.08, -1.75), 0.032, 0.022, "825e40", 6)

        # Slender brass bow-hook + glowing warm paper river lantern at prow (+1.28)
        p_base = bpt(0.0, 0.34, 1.12)
        p_top = bpt(0.0, 0.94, 1.38)
        p_tip = bpt(0.0, 0.88, 1.54)
        brass.rod_t(p_base, p_top, 0.022, 0.018, "b88c4f", 6)
        brass.rod_t(p_top, p_tip, 0.018, 0.014, "b88c4f", 6)
        lamp_c = bpt(0.0, 0.48, 1.54)
        lamp.lathe_t(lamp_c, [(0, 0.06), (0.09, 0.19), (0.27, 0.19), (0.36, 0.06)], 14, "ffd078")
        brass.lathe_t(bpt(0.0, 0.83, 1.54), [(0, 0.08), (0.04, 0.08)], 10, "4a2e1e")
        brass.lathe_t(bpt(0.0, 0.44, 1.54), [(0, 0.08), (0.04, 0.08)], 10, "4a2e1e")


build_river_bed()
build_banks()
build_stone_bridge("River_Arched_Bridge", -91.5, span=15.8, arch_rise=3.85, width=2.45, with_lanterns=True)
build_stone_bridge("River_Distant_Bridge", -111.5, span=15.8, arch_rise=3.20, width=1.95, with_lanterns=False)
build_eave_and_cat()
build_wupeng_boats()

for p in parts:
    p.finish()

bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / "jiangnan-river.blend"), compress=True)

with TemporaryDirectory(dir=ROOT) as tmp:
    out_glb = Path(tmp) / "jiangnan-river.glb"
    res = bpy.ops.export_scene.gltf(
        filepath=str(out_glb),
        export_format="GLB",
        export_yup=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
    )
    if res != {"FINISHED"} or out_glb.read_bytes()[:4] != b"glTF":
        raise RuntimeError("Failed to export jiangnan-river.glb")
    for folder in (REPO / "assets", REPO / "dist/assets"):
        pending = Path(tmp) / (folder.parent.name + "-river.glb")
        copyfile(out_glb, pending)
        os.replace(pending, folder / "jiangnan-river.glb")
print("EXPORTED jiangnan-river.glb OK")
