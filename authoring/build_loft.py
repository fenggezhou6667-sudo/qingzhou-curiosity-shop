"""Build the sculpted Jiangnan Scholar's Attic (02 Study + 03 Moonlit Lab).
Run with: blender --background --factory-startup --python authoring/build_loft.py
Exports: authoring/loft-sanctuary.blend, assets/loft-sanctuary.glb, dist/assets/loft-sanctuary.glb
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
rng = Random(203)

if not bpy.app.background:
    raise RuntimeError("Run build_loft.py in background Blender")
bpy.ops.wm.read_factory_settings(use_empty=True)


def w(tx, ty, tz):
    """Convert Three.js Y-up (tx, ty, tz) into Blender Z-up (tx, -tz, ty)."""
    return Vector((tx, -tz, ty))


def linear(hexcolor, shade=1.0):
    def ch(i):
        s = int(hexcolor[i:i + 2], 16) / 255.0
        v = ((s + 0.055) / 1.055) ** 2.4 if s > 0.04045 else s / 12.92
        return min(1.0, max(0.0, v * shade))
    return (ch(0), ch(2), ch(4), 1.0)


def make_pigment_mat(name, metallic=0.0, roughness=0.72, glow_color=None, glow=0.0, opacity=1.0):
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


def make_named_mat(name, hexcolor, metallic=0.0, roughness=0.6, glow_hex=None, glow=0.0, opacity=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = linear(hexcolor)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if glow > 0 and glow_hex:
        bsdf.inputs["Emission Color"].default_value = linear(glow_hex)
        bsdf.inputs["Emission Strength"].default_value = glow
    if opacity < 1.0:
        bsdf.inputs["Alpha"].default_value = opacity
        mat.surface_render_method = "BLENDED"
    return mat


# Materials (preserving all unified.js dynamic material hook names)
mat_clay = make_pigment_mat("LoftCraftPigment", metallic=0.0, roughness=0.78)
mat_wood_pig = make_pigment_mat("LoftTimberPigment", metallic=0.04, roughness=0.56)
mat_brass = make_pigment_mat("WarmBrass", metallic=0.84, roughness=0.28)
mat_lamp_glow = make_pigment_mat("LoftLampGlow", metallic=0.0, roughness=0.25, glow_color=(1.0, 0.72, 0.34), glow=2.4)
mat_jade_glow = make_pigment_mat("LoftJadeGlow", metallic=0.0, roughness=0.35, glow_color=(0.35, 0.92, 0.78), glow=1.2)
mat_ember = make_pigment_mat("LoftEmberGlow", metallic=0.0, roughness=0.4, glow_color=(1.0, 0.32, 0.10), glow=2.0)

# Hooked materials overridden/enhanced by unified.js
mat_desk_top = make_named_mat("DeskTopWood", "5c3c28", metallic=0.02, roughness=0.48)
mat_lime_wall = make_named_mat("LimeWall", "d4cbb8", metallic=0.0, roughness=0.88)
mat_dark_wood = make_named_mat("DarkWood", "3b261c", metallic=0.04, roughness=0.58)
mat_warm_oak = make_named_mat("WarmOak", "6a4630", metallic=0.03, roughness=0.54)
mat_book_spread = make_named_mat("BookSpreadMat", "efe3cb", metallic=0.0, roughness=0.92)
mat_ink_pool = make_named_mat("InkPoolGloss", "0f1318", metallic=0.12, roughness=0.18)
mat_ink_stone = make_named_mat("InkStone", "252c35", metallic=0.08, roughness=0.42)
mat_celadon = make_named_mat("CeladonCup", "97bcb0", metallic=0.05, roughness=0.18)
mat_tea = make_named_mat("TeaLiquid", "7e622d", metallic=0.02, roughness=0.12)
mat_emerald = make_named_mat("EmeraldShade", "2c8f72", metallic=0.12, roughness=0.22, glow_hex="40b892", glow=0.55)
mat_glass = make_named_mat("GlassCase", "cff6ef", metallic=0.04, roughness=0.08, opacity=0.22)
mat_bp = [make_named_mat(f"LabBlueprintMat_{i}", "203a48", roughness=0.65) for i in range(3)]
mat_slide = [make_named_mat(f"HerbariumSlideMat_{i}", "1d3430", roughness=0.65) for i in range(4)]

parts = []


class Part:
    def __init__(self, name, parent=None, mat=mat_clay, origin=(0, 0, 0), custom_props=None):
        self.name = name
        self.parent = parent
        self.mat = mat
        self.origin = Vector(origin)  # Blender coords
        self.custom_props = custom_props or {}
        self.verts = []
        self.faces = []
        self.pigment = []
        self.uvs = []
        self.has_uv = False
        self.smooth_ranges = []
        parts.append(self)

    def _to_local(self, pt):
        return Vector(pt) - self.origin

    def mesh(self, points, faces, color="ffffff", jitter=0.03, face_uvs=None, smooth=False):
        start = len(self.verts)
        self.verts.extend(self._to_local(p) for p in points)
        f_start = len(self.faces)
        for idx, face in enumerate(faces):
            self.faces.append(tuple(start + i for i in face))
            self.pigment.append(linear(color, 1.0 + rng.uniform(-jitter, jitter)))
            if face_uvs is not None:
                self.has_uv = True
                self.uvs.append(face_uvs[idx])
            else:
                self.uvs.append([(0.0, 0.0)] * len(face))
        if smooth:
            self.smooth_ranges.append(range(f_start, len(self.faces)))

    def box_t(self, tc, half_t, color="ffffff", jitter=0.03, uv_top=False):
        """Axis-aligned box in Three.js coords: center (tx,ty,tz), half-extents (hx,hy,hz)."""
        cx, cy, cz = tc
        hx, hy, hz = half_t
        # Corners in Blender coords via w()
        # Bottom (ty-hy), Top (ty+hy)
        pts = [
            w(cx - hx, cy - hy, cz + hz),  # 0 front-left-bot
            w(cx + hx, cy - hy, cz + hz),  # 1 front-right-bot
            w(cx + hx, cy - hy, cz - hz),  # 2 back-right-bot
            w(cx - hx, cy - hy, cz - hz),  # 3 back-left-bot
            w(cx - hx, cy + hy, cz + hz),  # 4 front-left-top
            w(cx + hx, cy + hy, cz + hz),  # 5 front-right-top
            w(cx + hx, cy + hy, cz - hz),  # 6 back-right-top
            w(cx - hx, cy + hy, cz - hz),  # 7 back-left-top
        ]
        faces = [
            (3, 2, 1, 0),  # bottom
            (4, 5, 6, 7),  # top
            (0, 1, 5, 4),  # front (+z)
            (1, 2, 6, 5),  # right (+x)
            (2, 3, 7, 6),  # back (-z)
            (3, 0, 4, 7),  # left (-x)
        ]
        fuvs = None
        if uv_top:
            fuvs = [
                [(0, 0), (1, 0), (1, 1), (0, 1)],
                [(0, 0), (1, 0), (1, 1), (0, 1)],  # 4:front-left(v=0), 5:front-right(v=0), 6:back-right(v=1), 7:back-left(v=1)
                [(0, 0), (1, 0), (1, 1), (0, 1)],
                [(0, 0), (1, 0), (1, 1), (0, 1)],
                [(0, 0), (1, 0), (1, 1), (0, 1)],
                [(0, 0), (1, 0), (1, 1), (0, 1)],
            ]
        self.mesh(pts, faces, color, jitter, face_uvs=fuvs)

    def quad_top_t(self, tc, hw, hd, color="ffffff", jitter=0.0):
        """Single upward-facing quad in Three.js coords with exact upright UVs (flipY=false)."""
        cx, cy, cz = tc
        pts = [
            w(cx - hw, cy, cz + hd),  # front-left  -> blender UV (0, 0) -> glTF (0, 1) bottom
            w(cx + hw, cy, cz + hd),  # front-right -> blender UV (1, 0) -> glTF (1, 1) bottom
            w(cx + hw, cy, cz - hd),  # back-right  -> blender UV (1, 1) -> glTF (1, 0) top
            w(cx - hw, cy, cz - hd),  # back-left   -> blender UV (0, 1) -> glTF (0, 0) top
        ]
        fuvs = [[(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]]
        self.mesh(pts, [(0, 1, 2, 3)], color, jitter, face_uvs=fuvs)

    def lathe_t(self, tc, profile, sides=24, color="ffffff", jitter=0.02, smooth=True):
        """Revolve profile [(dy, r), ...] around Three.js +Y vertical axis at tc."""
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

    def rod_t(self, p1_t, p2_t, r1, r2, color="ffffff", sides=10, smooth=True):
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
        for k, v in self.custom_props.items():
            obj[k] = v
        bpy.context.collection.objects.link(obj)
        if self.parent:
            obj.parent = self.parent
            obj.location = self.origin - self.parent.location
        return obj


def make_empty(name, tc, parent=None, props=None):
    obj = bpy.data.objects.new(name, None)
    loc = w(*tc)
    bpy.context.collection.objects.link(obj)
    if parent:
        obj.parent = parent
        obj.location = loc - parent.location
    else:
        obj.location = loc
    for k, v in (props or {}).items():
        obj[k] = v
    return obj


# =============================================================================
# 1. LOFT ARCHITECTURAL SANCTUARY (Walls, Wainscoting, Pitched Rafters, Bookcase)
# =============================================================================
def build_architecture():
    root = make_empty("Loft_Timber_Frame", (0, 0, 0))
    plaster = Part("Loft_Plaster_Walls", root, mat_lime_wall)
    timber = Part("Loft_Cedar_Beams", root, mat_wood_pig)
    decor = Part("Loft_Room_Decor", root, mat_clay)
    brass = Part("Loft_Room_Brass", root, mat_brass)
    glow = Part("Loft_Room_Glow", root, mat_lamp_glow)

    # Room bounds: x in [-10.8, 10.8], y in [5.4, 15.8], z in [-14.0, 4.5]
    # Floorboards (dark warm cedar planks)
    for i in range(22):
        z = -13.6 + i * 0.82
        timber.box_t((0, 5.32, z), (10.9, 0.08, 0.39), rng.choice(["36241a", "3d291e", "312017"]), 0.04)

    # Back wall with large centered window opening: x in [-3.4, 3.4], y in [8.2, 13.0]
    plaster.box_t((-7.1, 10.6, -14.18), (3.7, 5.2, 0.18), "d6ccb6", 0.02)   # left of window
    plaster.box_t((7.1, 10.6, -14.18), (3.7, 5.2, 0.18), "d6ccb6", 0.02)    # right of window
    plaster.box_t((0.0, 6.8, -14.18), (3.4, 1.4, 0.18), "d6ccb6", 0.02)     # below window
    plaster.box_t((0.0, 14.4, -14.18), (3.4, 1.4, 0.18), "d6ccb6", 0.02)    # above window

    # Side walls
    plaster.box_t((-10.85, 10.6, -4.8), (0.18, 5.2, 9.6), "cfc5b0", 0.02)
    plaster.box_t((10.85, 10.6, -4.8), (0.18, 5.2, 9.6), "cfc5b0", 0.02)

    # Cedar timber wainscoting (护墙板) along lower walls
    timber.box_t((-7.1, 6.95, -13.92), (3.65, 1.55, 0.06), "452c20", 0.03)
    timber.box_t((7.1, 6.95, -13.92), (3.65, 1.55, 0.06), "452c20", 0.03)
    timber.box_t((0.0, 6.75, -13.92), (3.45, 1.35, 0.06), "452c20", 0.03)
    timber.box_t((-10.62, 6.95, -4.8), (0.06, 1.55, 9.4), "3f281d", 0.03)
    timber.box_t((10.62, 6.95, -4.8), (0.06, 1.55, 9.4), "3f281d", 0.03)
    # Dado rail trim
    timber.box_t((-7.1, 8.52, -13.86), (3.68, 0.08, 0.09), "5c3b2a", 0.02)
    timber.box_t((7.1, 8.52, -13.86), (3.68, 0.08, 0.09), "5c3b2a", 0.02)

    # Structural cedar posts along back & side walls + carved knee braces (雀替)
    for px in (-10.4, -7.2, -3.55, 3.55, 7.2, 10.4):
        timber.box_t((px, 10.6, -13.82), (0.20, 5.2, 0.22), "3b2419", 0.03)
    for pz in (-10.0, -5.8, -1.5):
        timber.box_t((-10.48, 10.6, pz), (0.22, 5.2, 0.20), "382218", 0.03)
        timber.box_t((10.48, 10.6, pz), (0.22, 5.2, 0.20), "382218", 0.03)
        # Overhead tie beams
        timber.box_t((0.0, 14.3, pz), (10.6, 0.22, 0.22), "362117", 0.03)
        # Bracket corbels on left & right
        timber.box_t((-9.85, 13.78, pz), (0.48, 0.26, 0.14), "4c3022", 0.03)
        timber.box_t((9.85, 13.78, pz), (0.48, 0.26, 0.14), "4c3022", 0.03)

    # Sloped dark-cedar plank ceiling & exposed rafters
    for side in (-1, 1):
        for i in range(9):
            z = -13.5 + i * 2.1
            timber.rod_t((0.0, 16.5, z), (side * 10.8, 14.3, z), 0.12, 0.12, "331f16", 6, smooth=False)
    timber.box_t((0.0, 16.6, -5.0), (0.28, 0.28, 9.6), "2d1b13", 0.02)

    # Window outer wooden frame & sill + outer moonlight veranda balustrade
    timber.box_t((0.0, 8.15, -13.85), (3.65, 0.14, 0.36), "4c3022", 0.03)   # deep window sill
    timber.box_t((0.0, 13.05, -13.85), (3.65, 0.16, 0.32), "42291d", 0.03)  # window lintel
    # Outer balcony rail at z = -15.3 so looking out window frames nocturnal sky
    timber.box_t((0.0, 8.85, -15.35), (4.6, 0.07, 0.09), "38241a", 0.03)
    timber.box_t((0.0, 7.65, -15.35), (4.6, 0.06, 0.08), "322017", 0.03)
    for rx in (-3.6, -2.4, -1.2, 0.0, 1.2, 2.4, 3.6):
        timber.box_t((rx, 8.25, -15.35), (0.055, 0.62, 0.055), "3a261c", 0.03)

    # Left back-wall antique scholar's bookcase (多宝格) behind Study desk (x in [-9.6, -4.4])
    bx, bz = -7.0, -13.25
    timber.box_t((bx, 10.6, bz - 0.32), (2.25, 2.55, 0.05), "2f1d14", 0.02)  # back panel
    for sx in (-2.2, -0.75, 0.75, 2.2):
        timber.box_t((bx + sx, 10.6, bz), (0.07, 2.55, 0.34), "4a2f21", 0.03)
    for sy in (8.15, 9.35, 10.55, 11.75, 13.05):
        timber.box_t((bx, sy, bz), (2.26, 0.065, 0.36), "543626", 0.03)
    # Neatly stacked classical blue/ochre/crimson thread-bound books on shelves
    book_cols = ["274056", "344d5c", "6f3e34", "8a6c48", "3a5248", "463b4e"]
    for sy in (8.22, 9.42, 10.62, 11.82):
        for bay in (-1.45, 0.0, 1.45):
            if rng.random() < 0.78:
                # Standing books
                for k in range(rng.randint(4, 7)):
                    bh = rng.uniform(0.55, 0.78)
                    decor.box_t((bx + bay - 0.45 + k * 0.14, sy + bh * 0.5, bz + 0.02),
                                (0.055, bh * 0.5, 0.22), rng.choice(book_cols), 0.06)
            else:
                # Horizontal stack + small celadon vase
                for k in range(3):
                    decor.box_t((bx + bay - 0.15, sy + 0.05 + k * 0.10, bz + 0.02),
                                (0.34, 0.045, 0.22), rng.choice(book_cols), 0.05)
                decor.lathe_t((bx + bay + 0.38, sy, bz + 0.04),
                              [(0, 0.12), (0.14, 0.19), (0.36, 0.15), (0.48, 0.08), (0.58, 0.10)],
                              16, "7fa79b")

    # Right back-wall framed botanical cabinet & hanging brass astronomical chart (x in [4.5, 9.4])
    rx_c = 7.0
    timber.box_t((rx_c, 11.1, -13.88), (1.75, 1.45, 0.06), "4c3022", 0.02)
    decor.box_t((rx_c, 11.1, -13.81), (1.58, 1.28, 0.02), "1b303a", 0.03)  # dark indigo star-chart backing
    for r_ring in (0.42, 0.78, 1.08):
        for i in range(28):
            a0, a1 = TAU * i / 28, TAU * (i + 1) / 28
            brass.rod_t((rx_c + r_ring * cos(a0), 11.1 + r_ring * sin(a0), -13.78),
                        (rx_c + r_ring * cos(a1), 11.1 + r_ring * sin(a1), -13.78), 0.012, 0.012, "cfa25f", 5)
    # Warm wall sconce lantern on left & right of window
    for sx in (-4.15, 4.15):
        brass.rod_t((sx, 11.4, -13.82), (sx, 11.4, -13.42), 0.035, 0.03, "c49658", 8)
        brass.lathe_t((sx, 10.95, -13.42), [(0, 0.06), (0.06, 0.16), (0.42, 0.16), (0.52, 0.08)], 12, "b3854c")
        glow.lathe_t((sx, 11.02, -13.42), [(0, 0.12), (0.34, 0.12)], 12, "ffcf86")


# =============================================================================
# 2. ANIMATED CARVED LATTICE WINDOW SASHES (Window_Sash_L / Window_Sash_R)
# =============================================================================
def build_window_sashes():
    for side, name in ((-1, "Window_Sash_L"), (1, "Window_Sash_R")):
        pivot_t = (side * 3.38, 10.0, -14.0)
        sash = Part(name, None, mat_wood_pig, origin=w(*pivot_t))
        # Sash spans horizontally from pivot inward by 3.34m, vertically from y=8.28 to y=12.92
        inward = -side
        x0 = pivot_t[0]
        x1 = pivot_t[0] + inward * 3.34
        xm = 0.5 * (x0 + x1)
        # Outer frame rails
        sash.box_t((xm, 8.36, -14.0), (1.67, 0.09, 0.07), "573827", 0.02)
        sash.box_t((xm, 12.84, -14.0), (1.67, 0.09, 0.07), "573827", 0.02)
        sash.box_t((x0 + inward * 0.08, 10.60, -14.0), (0.08, 2.32, 0.07), "573827", 0.02)
        sash.box_t((x1 - inward * 0.08, 10.60, -14.0), (0.08, 2.32, 0.07), "573827", 0.02)
        # Delicate Jiangnan ice-crackle / traditional square lattice mullions (冰裂纹/步步锦格栅)
        for j in range(1, 5):
            lx = x0 + inward * (j * 3.34 / 5.0)
            sash.box_t((lx, 10.60, -14.0), (0.028, 2.22, 0.042), "6a4630", 0.02)
        for k in range(1, 6):
            ly = 8.36 + k * (4.48 / 6.0)
            sash.box_t((xm, ly, -14.0), (1.62, 0.028, 0.042), "6a4630", 0.02)


# =============================================================================
# 3. SCHOLAR'S LONG WALNUT DESK (Long_Desk_Table)
# =============================================================================
def build_desk():
    root = make_empty("Long_Desk_Table", (0, 8.40, -5.85))
    top = Part("Desk_Top_Slab", root, mat_desk_top)
    frame = Part("Desk_Walnut_Frame", root, mat_wood_pig)
    brass = Part("Desk_Brass_Pulls", root, mat_brass)

    # Top slab (y top = 8.40) with clean top UVs for walnut woodgrain CanvasTexture
    top.box_t((0.1, 8.28, -5.80), (7.5, 0.12, 1.95), "6b4832", 0.01, uv_top=True)
    # Beveled lower lip molding & carved apron
    frame.box_t((0.1, 8.11, -5.80), (7.38, 0.06, 1.84), "442b1d", 0.02)
    frame.box_t((0.1, 7.82, -5.80), (7.10, 0.25, 1.66), "3b2519", 0.03)
    # Front drawer panels + antique brass ring pulls
    for dx in (-4.8, -1.6, 1.8, 5.0):
        frame.box_t((dx, 7.82, -4.11), (1.35, 0.19, 0.04), "4d3121", 0.02)
        brass.box_t((dx, 7.82, -4.06), (0.24, 0.06, 0.025), "cfa15e", 0.02)
        brass.lathe_t((dx, 7.79, -4.02), [(0, 0.05), (0.04, 0.05)], 12, "dfb26e")
    # 4 sturdy carved legs + lower stretcher rail
    for lx in (-6.75, 6.95):
        for lz in (-7.25, -4.35):
            frame.box_t((lx, 6.55, lz), (0.20, 1.25, 0.20), "362116", 0.02)
            brass.box_t((lx, 5.48, lz), (0.215, 0.12, 0.215), "b3884c", 0.02)
        frame.box_t((lx, 6.05, -5.80), (0.12, 0.10, 1.45), "3c261a", 0.02)
    frame.box_t((0.1, 6.05, -6.95), (6.8, 0.10, 0.10), "3c261a", 0.02)


# =============================================================================
# 4. ZONE 02 STUDY PROPS (Curved Book_Moyan, Inkstone, Seal, Tea, Lamp, Censer)
# =============================================================================
def build_study_props():
    # --- Book_Moyan (Curved open pages with exact BookSpreadMat UVs!) ---
    bx, by, bz = -3.65, 8.41, -5.85
    book_root = make_empty("Book_Moyan", (bx, by, bz))
    make_empty("Anchor_Book_Moyan", (bx, by + 0.56, bz))
    cover = Part("Book_Moyan_Cover", book_root, mat_clay, origin=w(bx, by, bz))
    pages = Part("Book_Moyan_Spread", book_root, mat_book_spread, origin=w(bx, by, bz))

    # Indigo brocade hard cover + stitched spine + stacked cream page block
    cover.box_t((bx, by + 0.02, bz), (1.36, 0.022, 0.96), "273b54", 0.02)
    cover.box_t((bx, by + 0.055, bz), (1.31, 0.032, 0.90), "dfd2b8", 0.02)
    # Stitched gold binding ribbon dangling from bottom of spine
    cover.box_t((bx + 0.04, by + 0.025, bz + 1.06), (0.035, 0.008, 0.18), "a83329", 0.02)

    # Gently arched open double-page surface (16 columns across X, 2 rows along Z)
    bw, bd = 2.52, 1.74
    cols = 18
    pts = []
    for iz in (0, 1):
        tz = bz + (0.5 - iz) * bd  # iz=0: front (+bd/2, v=0); iz=1: back (-bd/2, v=1)
        for ix in range(cols + 1):
            u = ix / cols
            tx = bx + (u - 0.5) * bw
            # Arch rises on left half [0..0.5] and right half [0.5..1.0], dips cleanly into spine at u=0.5
            half_u = (u * 2.0) if u <= 0.5 else ((u - 0.5) * 2.0)
            arch = 0.088 * sin(half_u * pi) * (0.45 + 0.55 * (1.0 - abs(half_u - 0.5) * 0.4))
            dip = 0.028 * (1.0 - min(1.0, abs(u - 0.5) * 14.0))
            ty = by + 0.095 + arch - dip
            pts.append(w(tx, ty, tz))
    faces = []
    fuvs = []
    for ix in range(cols):
        u0 = ix / cols
        u1 = (ix + 1) / cols
        a = ix
        b = ix + 1
        c = (cols + 1) + ix + 1
        d = (cols + 1) + ix
        faces.append((a, b, c, d))
        fuvs.append([(u0, 0.0), (u1, 0.0), (u1, 1.0), (u0, 1.0)])
    pages.mesh(pts, faces, "ffffff", 0.0, face_uvs=fuvs, smooth=True)

    # --- Study_Inkstone + Bamboo Calligraphy Brush & Mountain Brush Rest ---
    ix, iy, iz = -5.65, 8.41, -6.28
    ink_root = make_empty("Study_Inkstone", (ix, iy, iz))
    stone = Part("Inkstone_Body", ink_root, mat_ink_stone, origin=w(ix, iy, iz))
    pool = Part("Inkstone_Pool", ink_root, mat_ink_pool, origin=w(ix, iy, iz))
    brush = Part("Calligraphy_Brush", ink_root, mat_clay, origin=w(ix, iy, iz))

    stone.box_t((ix, iy + 0.055, iz), (0.44, 0.055, 0.31), "242b34", 0.02)
    # Raised carved rim around inkstone
    stone.box_t((ix, iy + 0.125, iz - 0.27), (0.44, 0.025, 0.045), "2d3540", 0.02)
    stone.box_t((ix, iy + 0.125, iz + 0.27), (0.44, 0.025, 0.045), "2d3540", 0.02)
    stone.box_t((ix - 0.39, iy + 0.125, iz), (0.05, 0.025, 0.23), "2d3540", 0.02)
    stone.box_t((ix + 0.39, iy + 0.125, iz), (0.05, 0.025, 0.23), "2d3540", 0.02)
    pool.lathe_t((ix - 0.06, iy + 0.105, iz), [(0, 0.22), (0.012, 0.22)], 24, "0c1015")

    # Carved wooden mountain brush rest (笔山) + bamboo calligraphy brush (cleanly clear of Book_Moyan!)
    rx, rz = -5.36, -5.52
    brush.box_t((rx, iy + 0.04, rz), (0.08, 0.04, 0.32), "523525", 0.02)
    for k, (dz, h) in enumerate(((-0.18, 0.12), (0.0, 0.18), (0.18, 0.12))):
        brush.lathe_t((rx, iy + 0.05, rz + dz), [(0, 0.075), (h, 0.012)], 8, "5e3e2c", smooth=False)
    brush.rod_t((-6.28, iy + 0.13, -5.50), (-5.26, iy + 0.15, -5.54), 0.026, 0.022, "c2a06c", 10)
    brush.rod_t((-5.26, iy + 0.15, -5.54), (-5.04, iy + 0.155, -5.55), 0.024, 0.004, "1c1c20", 10)  # inked tip

    # --- ZhuSha_Seal_Block (Sculpted Cinnabar Seal + Lion/Cloud Finial + Porcelain Seal-Paste Box) ---
    sx, sy, sz = -2.05, 8.40, -5.25
    seal_root = make_empty("ZhuSha_Seal_Block", (sx, sy, sz))
    make_empty("Anchor_ZhuSha_Seal_Block", (sx, sy + 0.56, sz))
    seal = Part("Seal_Carved_Stone", seal_root, mat_clay, origin=w(sx, sy, sz))
    seal_brass = Part("Seal_Cinnabar_Trim", seal_root, mat_brass, origin=w(sx, sy, sz))

    seal.box_t((sx, sy + 0.16, sz), (0.13, 0.16, 0.13), "8f2920", 0.03)
    seal_brass.box_t((sx, sy + 0.33, sz), (0.138, 0.02, 0.138), "c89c5d", 0.02)
    # Sculpted finial knot on top
    seal.lathe_t((sx, sy + 0.35, sz), [(0, 0.09), (0.06, 0.10), (0.13, 0.06), (0.17, 0.02)], 12, "a83328")
    # Round porcelain seal-paste box (印泥盒) nearby at (-1.53, 8.40, -5.47)
    px, pz = -1.53, -5.47
    seal.lathe_t((px, sy, pz), [(0, 0.19), (0.04, 0.21), (0.12, 0.21), (0.13, 0.17)], 24, "e5dfd2")
    seal.lathe_t((px, sy + 0.11, pz), [(0, 0.16), (0.015, 0.16)], 20, "b82b1e")  # crimson ink paste

    # --- Celadon Teacup on Lotus Saucer (-2.37, 8.40, -6.50) ---
    tx, tz = -2.37, -6.50
    cup_root = make_empty("Study_Teacup", (tx, sy, tz))
    cup = Part("Celadon_Cup_Mesh", cup_root, mat_celadon, origin=w(tx, sy, tz))
    tea = Part("Tea_Liquid_Mesh", cup_root, mat_tea, origin=w(tx, sy, tz))
    cup.lathe_t((tx, sy, tz), [(0, 0.22), (0.03, 0.30), (0.055, 0.32), (0.06, 0.24)], 28, "90b5a8")
    cup.lathe_t((tx, sy + 0.04, tz), [(0, 0.13), (0.08, 0.19), (0.20, 0.25), (0.27, 0.275), (0.275, 0.255)], 28, "a4c6ba")
    tea.lathe_t((tx, sy + 0.225, tz), [(0, 0.225), (0.008, 0.225)], 24, "8f6c2e")

    # --- Warm Brass & Silk Scholar's Reading Lamp on far-left desk (-6.25, 8.40, -6.85) ---
    lx, lz = -6.25, -6.85
    lamp_root = make_empty("Study_Reading_Lamp", (lx, sy, lz))
    lb = Part("Study_Lamp_Brass", lamp_root, mat_brass, origin=w(lx, sy, lz))
    ls = Part("Study_Lamp_SilkShade", lamp_root, mat_lamp_glow, origin=w(lx, sy, lz))
    lb.lathe_t((lx, sy, lz), [(0, 0.32), (0.05, 0.30), (0.12, 0.12), (0.18, 0.06), (1.05, 0.045)], 20, "b88c4f")
    # Pleated silk lantern drum shade
    ls.lathe_t((lx, sy + 0.96, lz), [(0, 0.42), (0.48, 0.30)], 20, "ffe0a6")
    lb.lathe_t((lx, sy + 0.95, lz), [(0, 0.43), (0.025, 0.43)], 20, "a67c44")
    lb.lathe_t((lx, sy + 1.43, lz), [(0, 0.31), (0.025, 0.31)], 20, "a67c44")

    # --- Antique Bronze Tripod Incense Censer (-1.45, 8.40, -6.75) + Spare Book Stack (-5.75, 8.40, -4.85) ---
    cx, cz = -1.45, -6.75
    censer = Part("Study_Incense_Censer", None, mat_brass, origin=w(cx, sy, cz))
    ember = Part("Study_Incense_Ember", None, mat_ember, origin=w(cx, sy, cz))
    for i in range(3):
        a = TAU * i / 3 + 0.3
        censer.rod_t((cx + 0.14 * cos(a), sy, cz + 0.14 * sin(a)), (cx + 0.11 * cos(a), sy + 0.14, cz + 0.11 * sin(a)), 0.026, 0.022, "7c6042", 8)
    censer.lathe_t((cx, sy + 0.10, cz), [(0, 0.14), (0.09, 0.21), (0.20, 0.18), (0.25, 0.21), (0.27, 0.18)], 20, "8d6e4a")
    ember.lathe_t((cx, sy + 0.24, cz), [(0, 0.12), (0.018, 0.08)], 14, "ff6e30")

    # --- Center Bridge: Loft_Compass_Tray (0.15, 8.40, -5.90) ---
    tx0, tz0 = 0.15, -5.90
    tray_root = make_empty("Loft_Compass_Tray", (tx0, sy, tz0))
    tray_w = Part("Compass_Tray_Wood", tray_root, mat_wood_pig, origin=w(tx0, sy, tz0))
    tray_b = Part("Compass_Tray_Brass", tray_root, mat_brass, origin=w(tx0, sy, tz0))
    tray_w.lathe_t((tx0, sy, tz0), [(0, 0.56), (0.055, 0.58), (0.08, 0.54)], 28, "4a2e1f")
    tray_b.lathe_t((tx0, sy + 0.06, tz0), [(0, 0.47), (0.025, 0.47)], 32, "cfa25f")
    # Compass needle & raised bezel
    tray_b.rod_t((tx0 - 0.34, sy + 0.11, tz0 + 0.12), (tx0 + 0.34, sy + 0.11, tz0 - 0.12), 0.018, 0.008, "e8c47a", 6)
    tray_b.lathe_t((tx0, sy + 0.085, tz0), [(0, 0.045), (0.06, 0.02)], 12, "dfb26e")


# =============================================================================
# 5. ZONE 03 LAB PROPS (Herbarium Vitrine, Articulated Banker's Lamp, 3 Blueprints)
# =============================================================================
def build_lab_props():
    sy = 8.40

    # --- Herbarium_Specimen_Box at (4.05, 8.41, -6.20) ---
    hx, hy, hz = 4.05, 8.41, -6.20
    herb_root = make_empty("Herbarium_Specimen_Box", (hx, hy, hz))
    make_empty("Anchor_Herbarium_Specimen_Box", (hx, hy + 0.65, hz))
    hbox = Part("Herbarium_Walnut_Case", herb_root, mat_wood_pig, origin=w(hx, hy, hz))
    hbr = Part("Herbarium_Brass_Clasps", herb_root, mat_brass, origin=w(hx, hy, hz))
    hgl = Part("Herbarium_Glass_Lid", herb_root, mat_glass, origin=w(hx, hy, hz))

    # Walnut base tray & brass corner brackets + front pull
    hbox.box_t((hx, hy + 0.075, hz), (1.06, 0.075, 0.68), "4c3020", 0.02)
    hbox.box_t((hx, hy + 0.155, hz), (0.98, 0.015, 0.60), "182624", 0.02)  # dark velvet bed
    hbr.box_t((hx, hy + 0.075, hz + 0.69), (0.14, 0.03, 0.025), "d6a964", 0.02)
    for sx in (-1.04, 1.04):
        for sz in (-0.66, 0.66):
            hbr.box_t((hx + sx, hy + 0.08, hz + sz), (0.06, 0.085, 0.06), "c89b59", 0.02)
            # Slender brass glass-case corner posts
            hbr.rod_t((hx + sx * 0.96, hy + 0.15, hz + sz * 0.94),
                      (hx + sx * 0.96, hy + 0.50, hz + sz * 0.94), 0.018, 0.018, "d3a662", 8)
    # Top brass glass-frame rails
    hbr.box_t((hx, hy + 0.50, hz + 0.62), (1.02, 0.018, 0.018), "d3a662", 0.02)
    hbr.box_t((hx, hy + 0.50, hz - 0.62), (1.02, 0.018, 0.018), "d3a662", 0.02)
    hbr.box_t((hx - 1.00, hy + 0.50, hz), (0.018, 0.018, 0.62), "d3a662", 0.02)
    hbr.box_t((hx + 1.00, hy + 0.50, hz), (0.018, 0.018, 0.62), "d3a662", 0.02)
    # Physical glass vitrine enclosure (top + 4 sides)
    hgl.box_t((hx, hy + 0.33, hz), (0.99, 0.165, 0.61), "cff6ef", 0.0)

    # 4 recessed botanical specimen plates with exact upright UVs (HerbariumSlideMat_0..3)
    for i in range(4):
        sx = hx - 0.70 + i * 0.466
        slide = Part(f"Herbarium_Slide_{i}", herb_root, mat_slide[i], origin=w(hx, hy, hz))
        slide.quad_top_t((sx, hy + 0.175, hz), 0.20, 0.46, "ffffff", 0.0)

    # --- Articulated Antique Brass Banker's Lamp (Lab_Desk_Lamp at 5.85, 8.40, -6.65) ---
    lx, lz = 5.85, -6.65
    lamp_root = make_empty("Lab_Desk_Lamp", (lx, sy, lz))
    lb = Part("Lab_Lamp_Brass", lamp_root, mat_brass, origin=w(lx, sy, lz))
    lsh = Part("Lab_Lamp_EmeraldShade", lamp_root, mat_emerald, origin=w(lx, sy, lz))
    lbu = Part("Lab_Lamp_Filament", lamp_root, mat_lamp_glow, origin=w(lx, sy, lz))

    # Weighted tiered brass base
    lb.lathe_t((lx, sy, lz), [(0, 0.42), (0.05, 0.40), (0.10, 0.34), (0.16, 0.18), (0.24, 0.08)], 28, "c89c5c")
    # Articulated twin-joint curved brass stem leaning gently over the specimen desk
    lb.rod_t((lx, sy + 0.20, lz), (lx + 0.10, sy + 1.05, lz - 0.10), 0.048, 0.036, "cfa25f", 12)
    lb.lathe_t((lx + 0.10, sy + 1.03, lz - 0.10), [(0, 0.065), (0.09, 0.065)], 14, "dfb26e")  # brass knuckle joint
    lb.rod_t((lx + 0.10, sy + 1.08, lz - 0.10), (lx - 0.18, sy + 1.56, lz + 0.14), 0.036, 0.028, "cfa25f", 12)
    # Emerald-jade domed banker's shade + brass crown finial
    sh_c = (lx - 0.24, sy + 1.32, lz + 0.20)
    lsh.lathe_t(sh_c, [(0.0, 0.62), (0.08, 0.59), (0.20, 0.46), (0.30, 0.25), (0.34, 0.08)], 32, "32a282")
    lb.lathe_t((sh_c[0], sh_c[1] + 0.33, sh_c[2]), [(0, 0.11), (0.05, 0.08), (0.12, 0.03)], 16, "dfb26e")
    lbu.lathe_t((sh_c[0], sh_c[1] + 0.06, sh_c[2]), [(0, 0.09), (0.07, 0.12), (0.14, 0.07)], 14, "fff0c4")

    # --- 3 Framed Cyanotype Blueprint Plates (Lab_Plate_0..2) ---
    plate_specs = [
        (0, 2.25, -5.05, "rongrong"),
        (1, 4.05, -4.90, "machine-herbarium"),
        (2, 5.80, -5.12, "memory-map"),
    ]
    for idx, px, pz, slug in plate_specs:
        pr = make_empty(f"Lab_Plate_{idx}", (px, sy + 0.01, pz), props={"labProjectId": slug})
        make_empty(f"Anchor_Lab_Plate_{idx}", (px, sy + 0.46, pz))
        pf = Part(f"Lab_Plate_Frame_{idx}", pr, mat_wood_pig, origin=w(px, sy + 0.01, pz))
        pbr = Part(f"Lab_Plate_Pins_{idx}", pr, mat_brass, origin=w(px, sy + 0.01, pz))
        pc = Part(f"Lab_Plate_Card_{idx}", pr, mat_bp[idx], origin=w(px, sy + 0.01, pz))
        pf.box_t((px, sy + 0.035, pz), (0.58, 0.035, 0.42), "4e3222", 0.02)
        for sx in (-0.54, 0.54):
            for sz in (-0.38, 0.38):
                pbr.box_t((px + sx, sy + 0.072, pz + sz), (0.035, 0.008, 0.035), "cfa25f", 0.02)
        pc.quad_top_t((px, sy + 0.074, pz), 0.51, 0.35, "ffffff", 0.0)

    # --- Extra Curiosity Props: Brass Magnifying Loupe + 3 Glowing Apothecary Vials ---
    loupe = Part("Lab_Brass_Loupe", None, mat_brass, origin=w(2.25, sy, -6.20))
    loupe.lathe_t((2.25, sy + 0.02, -6.20), [(0, 0.16), (0.04, 0.17)], 24, "d6a862")
    loupe.rod_t((2.38, sy + 0.04, -6.08), (2.72, sy + 0.05, -5.80), 0.026, 0.020, "5a3824", 10)
    vials_g = Part("Lab_Vials_Glass", None, mat_glass, origin=w(6.55, sy, -5.85))
    vials_c = Part("Lab_Vials_Content", None, mat_jade_glow, origin=w(6.55, sy, -5.85))
    vials_k = Part("Lab_Vials_Cork", None, mat_clay, origin=w(6.55, sy, -5.85))
    for k, (vx, vz, vh) in enumerate(((6.45, -5.95, 0.34), (6.68, -5.82, 0.28), (6.52, -5.66, 0.23))):
        vials_g.lathe_t((vx, sy, vz), [(0, 0.065), (vh, 0.065), (vh + 0.05, 0.042)], 16, "cff6ef", 0.0)
        vials_c.lathe_t((vx, sy + 0.02, vz), [(0, 0.052), (vh * 0.55, 0.052)], 14, "5ee8cb")
        vials_k.lathe_t((vx, sy + vh + 0.04, vz), [(0, 0.036), (0.06, 0.044)], 12, "8f6c4a")


build_architecture()
build_window_sashes()
build_desk()
build_study_props()
build_lab_props()
for p in parts:
    p.finish()

bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / "loft-sanctuary.blend"), compress=True)

with TemporaryDirectory(dir=ROOT) as tmp:
    out_glb = Path(tmp) / "loft-sanctuary.glb"
    res = bpy.ops.export_scene.gltf(
        filepath=str(out_glb),
        export_format="GLB",
        export_yup=True,
        export_extras=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
    )
    if res != {"FINISHED"} or out_glb.read_bytes()[:4] != b"glTF":
        raise RuntimeError("Failed to export loft-sanctuary.glb")
    for folder in (REPO / "assets", REPO / "dist/assets"):
        pending = Path(tmp) / (folder.parent.name + "-loft.glb")
        copyfile(out_glb, pending)
        os.replace(pending, folder / "loft-sanctuary.glb")
print("EXPORTED loft-sanctuary.glb OK")
