"""Build the Single-Room Curiosity Shop Gallery ('清舟的杂货铺 · 一屋奇珍阁').
Houses all 5 interactive miniature worlds in one warm, crystal-clear timber room:
  1. Mini_PhotoBox (Left): Vintage Walnut & Brass Slide Lightbox + Pull-out Slide Tray + TLR Camera
  2. Mini_MoyanDesk (Back-Left): Curved-page Book_Moyan + Animated ZhuSha Seal + Inkstone + Silk Lamp
  3. Mini_LabBench (Back-Right): Hinged-Lid Herbarium Vitrine + Articulated Emerald Lamp + 3 Blueprints
  4. Mini_ChinaAtlas (Center Pedestal): Octagonal Rosewood & Brass Showcase Pedestal for china-atlas.glb
  5. Mini_RiverTerrarium (Right): Brass-Framed Glass Diorama Terrarium Case for jiangnan-river.glb

Run with: blender --background --factory-startup --python authoring/build_curiosity_room.py
Exports: authoring/curiosity-room.blend, assets/curiosity-room.glb, dist/assets/curiosity-room.glb
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
rng = Random(719)

if not bpy.app.background:
    raise RuntimeError("Run build_curiosity_room.py in background Blender")
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
mat_wood = make_pigment_mat("RoomTimberPigment", metallic=0.04, roughness=0.52)
mat_clay = make_pigment_mat("RoomCraftPigment", metallic=0.0, roughness=0.76)
mat_plaster = make_pigment_mat("RoomPlasterPigment", metallic=0.0, roughness=0.88)
mat_brass = make_pigment_mat("WarmBrass", metallic=0.86, roughness=0.26)
mat_lamp_glow = make_pigment_mat("RoomLampGlow", metallic=0.0, roughness=0.22, glow_color=(1.0, 0.72, 0.34), glow=2.4)
mat_jade_glow = make_pigment_mat("RoomJadeGlow", metallic=0.0, roughness=0.30, glow_color=(0.38, 0.92, 0.78), glow=1.35)
mat_lightbox = make_pigment_mat("PhotoLightboxGlow", metallic=0.0, roughness=0.28, glow_color=(1.0, 0.80, 0.50), glow=0.48)

mat_desk_top = make_named_mat("DeskTopWood", "583824", metallic=0.02, roughness=0.46)
mat_book_spread = make_named_mat("BookSpreadMat", "efe3cb", metallic=0.0, roughness=0.92)
mat_ink_pool = make_named_mat("InkPoolGloss", "0e1218", metallic=0.14, roughness=0.16)
mat_ink_stone = make_named_mat("InkStone", "252c35", metallic=0.08, roughness=0.40)
mat_celadon = make_named_mat("CeladonCup", "96bbb0", metallic=0.05, roughness=0.16)
mat_tea = make_named_mat("TeaLiquid", "80622d", metallic=0.02, roughness=0.12)
mat_emerald = make_named_mat("EmeraldShade", "2c9274", metallic=0.12, roughness=0.22, glow_hex="40b892", glow=0.62)
mat_glass = make_named_mat("GlassCase", "cff6ef", metallic=0.04, roughness=0.07, opacity=0.18)
mat_bp = [make_named_mat(f"LabBlueprintMat_{i}", "203a48", roughness=0.62) for i in range(3)]
mat_slide = [make_named_mat(f"HerbariumSlideMat_{i}", "1d3430", roughness=0.62) for i in range(4)]
mat_photo_thumb = [make_named_mat(f"PhotoThumbMat_{i}", "d8c09a", roughness=0.35, glow_hex="f5d6a4", glow=0.42) for i in range(3)]

parts = []


class Part:
    def __init__(self, name, parent=None, mat=mat_clay, origin=(0, 0, 0), custom_props=None):
        self.name = name
        self.parent = parent
        self.mat = mat
        self.origin = Vector(origin)
        self.custom_props = custom_props or {}
        self.verts = []
        self.faces = []
        self.pigment = []
        self.uvs = []
        self.has_uv = False
        self.smooth_ranges = []
        parts.append(self)

    def _loc(self, pt):
        return Vector(pt) - self.origin

    def mesh(self, points, faces, color="ffffff", jitter=0.025, face_uvs=None, smooth=False):
        start = len(self.verts)
        self.verts.extend(self._loc(p) for p in points)
        f0 = len(self.faces)
        for idx, f in enumerate(faces):
            self.faces.append(tuple(start + i for i in f))
            self.pigment.append(linear(color, 1.0 + rng.uniform(-jitter, jitter)))
            if face_uvs is not None:
                self.has_uv = True
                self.uvs.append(face_uvs[idx])
            else:
                self.uvs.append([(0.0, 0.0)] * len(f))
        if smooth:
            self.smooth_ranges.append(range(f0, len(self.faces)))

    def box_t(self, tc, half_t, color="ffffff", jitter=0.025, uv_top=False, yaw=0.0):
        cx, cy, cz = tc
        hx, hy, hz = half_t
        ca, sa = cos(yaw), sin(yaw)

        def rot(dx, dy, dz):
            return w(cx + dx * ca - dz * sa, cy + dy, cz + dx * sa + dz * ca)

        pts = [
            rot(-hx, -hy, +hz), rot(+hx, -hy, +hz), rot(+hx, -hy, -hz), rot(-hx, -hy, -hz),
            rot(-hx, +hy, +hz), rot(+hx, +hy, +hz), rot(+hx, +hy, -hz), rot(-hx, +hy, -hz),
        ]
        faces = [
            (3, 2, 1, 0), (4, 5, 6, 7),
            (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7),
        ]
        fuvs = [[(0, 0), (1, 0), (1, 1), (0, 1)]] * 6 if uv_top else None
        self.mesh(pts, faces, color, jitter, face_uvs=fuvs)

    def quad_top_t(self, tc, hw, hd, color="ffffff", yaw=0.0):
        cx, cy, cz = tc
        ca, sa = cos(yaw), sin(yaw)

        def rot(dx, dz):
            return w(cx + dx * ca - dz * sa, cy, cz + dx * sa + dz * ca)

        pts = [rot(-hw, +hd), rot(+hw, +hd), rot(+hw, -hd), rot(-hw, -hd)]
        fuvs = [[(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]]
        self.mesh(pts, [(0, 1, 2, 3)], color, 0.0, face_uvs=fuvs)

    def lathe_t(self, tc, profile, sides=20, color="ffffff", jitter=0.02, smooth=True):
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
        finish_part_parent(obj, self.origin, self.parent)
        return obj


world_locs = {}


def finish_part_parent(obj, origin, parent):
    world_locs[obj] = origin
    if parent:
        obj.parent = parent
        obj.location = origin - world_locs.get(parent, parent.location)
    else:
        obj.location = origin


def make_empty(name, tc, parent=None, props=None):
    obj = bpy.data.objects.new(name, None)
    loc = w(*tc)
    bpy.context.collection.objects.link(obj)
    finish_part_parent(obj, loc, parent)
    for k, v in (props or {}).items():
        obj[k] = v
    return obj


# =============================================================================
# 1. COZY NOCTURNAL CURIOSITY SHOP SHELL (Rich Dark Cedar + Twilight Window)
# =============================================================================
def build_room_shell():
    root = make_empty("Curiosity_Room_Shell", (0, 0, 0))
    wood = Part("Room_Timber_Arch", root, mat_wood)
    wall = Part("Room_Deep_Walls", root, mat_plaster)
    decor = Part("Room_Books_Curios", root, mat_clay)
    brass = Part("Room_Hardware_Brass", root, mat_brass)
    glow = Part("Room_Warm_Sconces", root, mat_lamp_glow)

    # Room footprint: x in [-8.2, 8.2], y in [0.0, 6.8], z in [-5.6, 8.8]
    # Rich dark-walnut hardwood floor planks
    for i in range(26):
        z = -5.4 + i * 0.56
        wood.box_t((0.0, -0.05, z), (8.3, 0.05, 0.27), rng.choice(["251710", "2c1c14", "20140e"]), 0.04)

    # Woven crimson-indigo carpet rug under center atlas pedestal
    decor.box_t((0.0, 0.012, 0.65), (2.85, 0.012, 2.35), "341b22", 0.03)
    decor.box_t((0.0, 0.016, 0.65), (2.62, 0.010, 2.12), "232d3a", 0.02)

    # Deep warm nocturnal charcoal-umber plaster walls (so dark contrast stays rich, NEVER washed-out grey!)
    # Back wall (z = -5.6) with wide tall center-arch sunset/starlight window x in [-2.6, 2.6], y in [1.4, 4.9]
    wall.box_t((-5.4, 3.4, -5.65), (2.8, 3.4, 0.16), "2a221d", 0.02)
    wall.box_t((5.4, 3.4, -5.65), (2.8, 3.4, 0.16), "2a221d", 0.02)
    wall.box_t((0.0, 0.7, -5.65), (2.6, 0.7, 0.16), "2a221d", 0.02)
    wall.box_t((0.0, 5.85, -5.65), (2.6, 0.95, 0.16), "2a221d", 0.02)
    # Left & right walls
    wall.box_t((-8.25, 3.4, 1.5), (0.16, 3.4, 7.3), "261f1a", 0.02)
    wall.box_t((8.25, 3.4, 1.5), (0.16, 3.4, 7.3), "261f1a", 0.02)

    # Wainscoting wood paneling (lower 1.35m) + vertical structural posts & rafters
    wood.box_t((-5.4, 0.68, -5.45), (2.75, 0.68, 0.06), "332016", 0.03)
    wood.box_t((5.4, 0.68, -5.45), (2.75, 0.68, 0.06), "332016", 0.03)
    wood.box_t((0.0, 0.68, -5.45), (2.65, 0.68, 0.06), "332016", 0.03)
    wood.box_t((-8.04, 0.68, 1.5), (0.06, 0.68, 7.2), "2e1d14", 0.03)
    wood.box_t((8.04, 0.68, 1.5), (0.06, 0.68, 7.2), "2e1d14", 0.03)

    for px in (-8.0, -5.2, -2.68, 2.68, 5.2, 8.0):
        wood.box_t((px, 3.4, -5.38), (0.14, 3.4, 0.18), "2c1b12", 0.03)
    for pz in (-5.2, -1.6, 2.0, 5.6):
        wood.box_t((-7.98, 3.4, pz), (0.16, 3.4, 0.16), "2b1a12", 0.03)
        wood.box_t((7.98, 3.4, pz), (0.16, 3.4, 0.16), "2b1a12", 0.03)
        # Overhead cedar beam + ceiling rafters
        wood.box_t((0.0, 6.25, pz), (8.1, 0.16, 0.16), "24160f", 0.03)

    # Carved Lattice Back Window Frame (looking out onto deep clear twilight/starlight sky!)
    wood.box_t((0.0, 1.42, -5.42), (2.75, 0.09, 0.24), "3f271a", 0.02)  # sill
    wood.box_t((0.0, 4.92, -5.42), (2.75, 0.11, 0.24), "372116", 0.02)  # lintel
    for wx in (-1.7, -0.85, 0.0, 0.85, 1.7):
        wood.box_t((wx, 3.17, -5.52), (0.035, 1.72, 0.045), "442b1d", 0.02)
    for wy in (2.25, 3.15, 4.05):
        wood.box_t((0.0, wy, -5.52), (2.62, 0.035, 0.045), "442b1d", 0.02)

    # Built-in Antique Curiosity Shelves on back-left & back-right walls
    book_cols = ["274056", "344d5c", "723d32", "8d6e48", "375248", "4c3b54", "a68452"]
    for side in (-1, 1):
        bx = side * 5.45
        bz = -5.15
        for sx in (-2.1, -0.7, 0.7, 2.1):
            wood.box_t((bx + sx, 3.1, bz), (0.055, 1.75, 0.26), "3d261a", 0.03)
        for sy in (1.42, 2.25, 3.08, 3.92, 4.78):
            wood.box_t((bx, sy, bz), (2.16, 0.05, 0.28), "492f20", 0.03)
        for sy in (1.47, 2.30, 3.13, 3.97):
            for bay in (-1.4, 0.0, 1.4):
                if rng.random() < 0.72:
                    for k in range(rng.randint(4, 7)):
                        bh = rng.uniform(0.38, 0.56)
                        decor.box_t((bx + bay - 0.42 + k * 0.125, sy + bh * 0.5, bz + 0.02),
                                    (0.048, bh * 0.5, 0.16), rng.choice(book_cols), 0.06)
                else:
                    # Antique porcelain vessel or brass astrolabe orb on shelf
                    decor.lathe_t((bx + bay, sy, bz + 0.02),
                                  [(0, 0.10), (0.14, 0.18), (0.34, 0.13), (0.44, 0.07), (0.50, 0.09)],
                                  14, rng.choice(["7ba69a", "c6a46c", "4a6c82"]))

    # Warm Brass Pendant Chandelier Lights hanging gracefully above the room (creating real warm bokeh!)
    pendant_spots = [(-4.4, 4.35, 1.2), (-2.5, 4.55, -2.5), (2.5, 4.55, -2.5), (0.0, 4.65, 0.65), (4.4, 4.35, 1.2)]
    for px, py, pz in pendant_spots:
        brass.rod_t((px, 6.25, pz), (px, py + 0.22, pz), 0.015, 0.015, "b3884e", 6)
        brass.lathe_t((px, py + 0.12, pz), [(0, 0.24), (0.12, 0.14), (0.20, 0.06)], 16, "c99c58")
        glow.lathe_t((px, py - 0.05, pz), [(0, 0.05), (0.08, 0.10), (0.17, 0.07)], 12, "ffd994")

    # Warm Wall Sconces flanking the twilight back window
    for sx in (-3.05, 3.05):
        brass.rod_t((sx, 3.35, -5.48), (sx, 3.35, -5.18), 0.025, 0.02, "c49658", 8)
        glow.lathe_t((sx, 3.12, -5.18), [(0, 0.06), (0.12, 0.11), (0.28, 0.09)], 12, "ffcf86")


# =============================================================================
# 2. EXHIBIT 1 — VINTAGE PHOTO SLIDE LIGHTBOX (Mini_PhotoBox, Left Alcove)
# =============================================================================
def build_photo_exhibit():
    px, py, pz = -4.55, 1.05, 1.35
    yaw = 0.42
    root = make_empty("Mini_PhotoBox", (px, py, pz))
    make_empty("Anchor_Mini_PhotoBox", (px, py + 0.95, pz))

    cab = Part("Photo_Cabinet_Wood", root, mat_wood, origin=w(px, py, pz))
    brass = Part("Photo_Lightbox_Brass", root, mat_brass, origin=w(px, py, pz))
    glass = Part("Photo_Lightbox_Glass", root, mat_lightbox, origin=w(px, py, pz))
    cam = Part("Photo_Retro_Camera", root, mat_clay, origin=w(px, py, pz))

    ca, sa = cos(yaw), sin(yaw)

    def pt(dx, dy, dz):
        return (px + dx * ca - dz * sa, py + dy, pz + dx * sa + dz * ca)

    # Sculpted walnut cabinet pedestal (y = 0 .. 1.05)
    cab.box_t((px, 0.50, pz), (1.12, 0.50, 0.72), "3b2419", 0.02, yaw=yaw)
    cab.box_t((px, 1.02, pz), (1.18, 0.04, 0.78), "4f3121", 0.02, yaw=yaw)
    brass.box_t(pt(0.0, -0.35, 0.73), (0.16, 0.035, 0.02), "cfa15e", yaw=yaw)

    # Sloped Vintage Film Slide Viewer Lightbox sitting on cabinet
    cab.box_t(pt(-0.18, 0.18, -0.05), (0.68, 0.16, 0.48), "482d1e", 0.02, yaw=yaw)
    brass.box_t(pt(-0.18, 0.35, -0.05), (0.69, 0.02, 0.49), "d4a762", 0.02, yaw=yaw)
    glass.quad_top_t(pt(-0.18, 0.375, -0.05), 0.60, 0.40, "ffe4b0", yaw=yaw)

    # Animated Pull-Out Slide Tray (separate node so it glides forward on focus!)
    tray_root = make_empty("Photo_Slide_Tray", pt(-0.18, 0.38, -0.05), root)
    tray_w = Part("Photo_Slide_Tray_Frame", tray_root, mat_wood, origin=w(*pt(-0.18, 0.38, -0.05)))
    tray_w.box_t(pt(-0.18, 0.39, -0.05), (0.58, 0.015, 0.36), "2d1c14", 0.02, yaw=yaw)
    # 3 mounted glowing 35mm photography slide frames with upright UVs (PhotoThumbMat_0..2)
    for i in range(3):
        sx = -0.54 + i * 0.36
        # Dark wooden slide mount frame + vivid upright photographic slide resting proudly on top!
        tray_w.box_t(pt(sx, 0.405, -0.05), (0.165, 0.012, 0.235), "1d1512", 0.01, yaw=yaw)
        sl = Part(f"Photo_Slide_Card_{i}", tray_root, mat_photo_thumb[i], origin=w(*pt(-0.18, 0.38, -0.05)))
        sl.quad_top_t(pt(sx, 0.422, -0.05), 0.145, 0.215, "ffffff", yaw=yaw)

    # Vintage Twin-Lens Reflex (TLR) Camera resting beside lightbox
    cx, cy, cz = pt(0.76, 0.22, 0.12)
    cam.box_t((cx, cy, cz), (0.16, 0.20, 0.16), "1f232b", 0.02, yaw=yaw - 0.3)
    brass.box_t((cx, cy + 0.21, cz), (0.165, 0.025, 0.165), "cfa15e", 0.02, yaw=yaw - 0.3)
    brass.lathe_t((cx + 0.04, cy + 0.04, cz + 0.15), [(0, 0.075), (0.06, 0.075)], 16, "d6a964")
    brass.lathe_t((cx + 0.04, cy - 0.08, cz + 0.15), [(0, 0.075), (0.06, 0.075)], 16, "d6a964")


# =============================================================================
# 3. EXHIBIT 2 — 《墨盐》STUDY DESK & ANIMATED SEAL (Mini_MoyanDesk, Back-Left)
# =============================================================================
def build_moyan_exhibit():
    dx, dy, dz = -2.55, 1.05, -2.55
    root = make_empty("Mini_MoyanDesk", (dx, dy, dz))
    make_empty("Anchor_Mini_MoyanDesk", (dx, dy + 0.85, dz))

    top = Part("Moyan_Desk_Top", root, mat_desk_top, origin=w(dx, dy, dz))
    frame = Part("Moyan_Desk_Frame", root, mat_wood, origin=w(dx, dy, dz))
    brass = Part("Moyan_Desk_Brass", root, mat_brass, origin=w(dx, dy, dz))

    # Walnut desk (width 3.6m, depth 1.85m, top at y = 1.05)
    top.box_t((dx, dy - 0.04, dz), (1.82, 0.045, 0.92), "64422c", 0.01, uv_top=True)
    frame.box_t((dx, dy - 0.16, dz), (1.70, 0.09, 0.82), "3b2419", 0.02)
    for lx in (dx - 1.58, dx + 1.58):
        for lz in (dz - 0.74, dz + 0.74):
            frame.box_t((lx, 0.48, lz), (0.08, 0.48, 0.08), "321e15", 0.02)
            brass.box_t((lx, 0.08, lz), (0.088, 0.08, 0.088), "b3884c", 0.02)

    # Curved-page Open Book_Moyan
    bx, by, bz = dx - 0.05, dy + 0.006, dz + 0.04
    book_root = make_empty("Book_Moyan", (bx, by, bz), root)
    make_empty("Anchor_Book_Moyan", (bx, by + 0.42, bz))
    cover = Part("Book_Moyan_Cover", book_root, mat_clay, origin=w(bx, by, bz))
    pages = Part("Book_Moyan_Spread", book_root, mat_book_spread, origin=w(bx, by, bz))

    cover.box_t((bx, by + 0.014, bz), (0.76, 0.014, 0.54), "273b54", 0.02)
    cover.box_t((bx, by + 0.034, bz), (0.73, 0.020, 0.50), "dfd2b8", 0.02)
    cover.box_t((bx + 0.02, by + 0.018, bz + 0.60), (0.022, 0.005, 0.11), "a83329", 0.02)

    bw, bd = 1.42, 0.98
    cols = 16
    pts = []
    for iz in (0, 1):
        tz = bz + (0.5 - iz) * bd
        for ix in range(cols + 1):
            u = ix / cols
            tx = bx + (u - 0.5) * bw
            half_u = (u * 2.0) if u <= 0.5 else ((u - 0.5) * 2.0)
            arch = 0.052 * sin(half_u * pi)
            dip = 0.018 * (1.0 - min(1.0, abs(u - 0.5) * 14.0))
            pts.append(w(tx, by + 0.058 + arch - dip, tz))
    faces, fuvs = [], []
    for ix in range(cols):
        u0, u1 = ix / cols, (ix + 1) / cols
        a, b, c, d = ix, ix + 1, (cols + 1) + ix + 1, (cols + 1) + ix
        faces.append((a, b, c, d))
        fuvs.append([(u0, 0.0), (u1, 0.0), (u1, 1.0), (u0, 1.0)])
    pages.mesh(pts, faces, "ffffff", 0.0, face_uvs=fuvs, smooth=True)

    # Inkstone & Brush cleanly to left of Book_Moyan
    ix, iz = dx - 1.24, dz - 0.18
    stone = Part("Study_Inkstone_Body", root, mat_ink_stone, origin=w(dx, dy, dz))
    pool = Part("Study_Inkstone_Pool", root, mat_ink_pool, origin=w(dx, dy, dz))
    brush = Part("Study_Brush_Set", root, mat_clay, origin=w(dx, dy, dz))
    stone.box_t((ix, dy + 0.032, iz), (0.26, 0.032, 0.19), "242b34", 0.02)
    pool.lathe_t((ix - 0.03, dy + 0.062, iz), [(0, 0.13), (0.008, 0.13)], 20, "0c1015")
    brush.box_t((dx - 1.14, dy + 0.022, dz + 0.24), (0.045, 0.022, 0.18), "523525", 0.02)
    brush.rod_t((dx - 1.62, dy + 0.072, dz + 0.25), (dx - 0.92, dy + 0.082, dz + 0.22), 0.016, 0.012, "c2a06c", 8)
    brush.rod_t((dx - 0.92, dy + 0.082, dz + 0.22), (dx - 0.78, dy + 0.085, dz + 0.21), 0.013, 0.003, "1a1a1e", 8)

    # Animated Lion-Finial ZhuSha Seal Block (separate node for lift-and-stamp animation!)
    sx, sz = dx + 0.96, dz + 0.34
    seal_root = make_empty("ZhuSha_Seal_Block", (sx, dy, sz), root)
    make_empty("Anchor_ZhuSha_Seal_Block", (sx, dy + 0.38, sz))
    seal = Part("Seal_Carved_Body", seal_root, mat_clay, origin=w(sx, dy, sz))
    seal_b = Part("Seal_Brass_Collar", seal_root, mat_brass, origin=w(sx, dy, sz))
    seal.box_t((sx, dy + 0.10, sz), (0.08, 0.10, 0.08), "8f2920", 0.03)
    seal_b.box_t((sx, dy + 0.205, sz), (0.085, 0.012, 0.085), "cfa15e", 0.02)
    seal.lathe_t((sx, dy + 0.215, sz), [(0, 0.055), (0.04, 0.062), (0.09, 0.035), (0.115, 0.012)], 12, "a83328")
    # Seal paste box & Celadon teacup
    cup = Part("Study_Celadon_Cup", root, mat_celadon, origin=w(dx, dy, dz))
    tea = Part("Study_Tea_Surface", root, mat_tea, origin=w(dx, dy, dz))
    tx, tz = dx + 0.98, dz - 0.34
    cup.lathe_t((tx, dy, tz), [(0, 0.13), (0.02, 0.19), (0.038, 0.20)], 22, "90b5a8")
    cup.lathe_t((tx, dy + 0.025, tz), [(0, 0.085), (0.06, 0.13), (0.16, 0.175)], 22, "a4c6ba")
    tea.lathe_t((tx, dy + 0.145, tz), [(0, 0.145), (0.006, 0.145)], 18, "8f6c2e")

    # Warm Silk Scholar's Desk Lamp on back-left corner
    lx, lz = dx - 1.45, dz - 0.56
    ls = Part("Moyan_Lamp_Shade", root, mat_lamp_glow, origin=w(dx, dy, dz))
    brass.lathe_t((lx, dy, lz), [(0, 0.19), (0.03, 0.18), (0.08, 0.06), (0.64, 0.028)], 18, "c29654")
    ls.lathe_t((lx, dy + 0.58, lz), [(0, 0.26), (0.30, 0.18)], 18, "ffe2aa")


# =============================================================================
# 4. EXHIBIT 3 — HINGED HERBARIUM VITRINE & LAB BENCH (Mini_LabBench, Back-Right)
# =============================================================================
def build_lab_exhibit():
    dx, dy, dz = 2.55, 1.05, -2.55
    root = make_empty("Mini_LabBench", (dx, dy, dz))
    make_empty("Anchor_Mini_LabBench", (dx, dy + 0.85, dz))

    top = Part("Lab_Desk_Top", root, mat_desk_top, origin=w(dx, dy, dz))
    frame = Part("Lab_Desk_Frame", root, mat_wood, origin=w(dx, dy, dz))
    brass = Part("Lab_Desk_Brass", root, mat_brass, origin=w(dx, dy, dz))

    top.box_t((dx, dy - 0.04, dz), (1.82, 0.045, 0.92), "64422c", 0.01, uv_top=True)
    frame.box_t((dx, dy - 0.16, dz), (1.70, 0.09, 0.82), "3b2419", 0.02)
    for lx in (dx - 1.58, dx + 1.58):
        for lz in (dz - 0.74, dz + 0.74):
            frame.box_t((lx, 0.48, lz), (0.08, 0.48, 0.08), "321e15", 0.02)
            brass.box_t((lx, 0.08, lz), (0.088, 0.08, 0.088), "b3884c", 0.02)

    # Herbarium Vitrine Base + Separately Hinged Glass Lid (pivots open 42 deg around back edge!)
    hx, hy, hz = dx - 0.15, dy + 0.005, dz - 0.18
    herb_root = make_empty("Herbarium_Specimen_Box", (hx, hy, hz), root)
    make_empty("Anchor_Herbarium_Specimen_Box", (hx, hy + 0.46, hz))
    hbox = Part("Herbarium_Case_Base", herb_root, mat_wood, origin=w(hx, hy, hz))
    hbr = Part("Herbarium_Case_Brass", herb_root, mat_brass, origin=w(hx, hy, hz))

    hbox.box_t((hx, hy + 0.045, hz), (0.64, 0.045, 0.40), "4c3020", 0.02)
    hbox.box_t((hx, hy + 0.092, hz), (0.58, 0.010, 0.35), "172523", 0.02)
    hbr.box_t((hx, hy + 0.045, hz + 0.41), (0.09, 0.018, 0.016), "d6a964", 0.02)
    for sx in (-0.62, 0.62):
        for sz in (-0.38, 0.38):
            hbr.box_t((hx + sx, hy + 0.05, hz + sz), (0.038, 0.052, 0.038), "c89b59", 0.02)

    # Hinged Glass Lid pivoted cleanly at back top rim (hz - 0.37, hy + 0.095)
    hinge_pos = (hx, hy + 0.095, hz - 0.37)
    lid_root = make_empty("Herbarium_Glass_Lid", hinge_pos, herb_root)
    lid_br = Part("Herbarium_Lid_Brass", lid_root, mat_brass, origin=w(*hinge_pos))
    lid_gl = Part("Herbarium_Lid_Glass", lid_root, mat_glass, origin=w(*hinge_pos))
    # Brass rim framing glass lid (extends forward from hz-0.37 to hz+0.37, height 0.18)
    for sx in (-0.60, 0.60):
        lid_br.rod_t((hx + sx, hy + 0.095, hz - 0.37), (hx + sx, hy + 0.275, hz - 0.37), 0.012, 0.012, "d4a762", 6)
        lid_br.rod_t((hx + sx, hy + 0.095, hz + 0.37), (hx + sx, hy + 0.275, hz + 0.37), 0.012, 0.012, "d4a762", 6)
    lid_br.box_t((hx, hy + 0.275, hz + 0.37), (0.61, 0.012, 0.012), "d4a762", 0.02)
    lid_br.box_t((hx, hy + 0.275, hz - 0.37), (0.61, 0.012, 0.012), "d4a762", 0.02)
    lid_br.box_t((hx - 0.60, hy + 0.275, hz), (0.012, 0.012, 0.37), "d4a762", 0.02)
    lid_br.box_t((hx + 0.60, hy + 0.275, hz), (0.012, 0.012, 0.37), "d4a762", 0.02)
    lid_gl.box_t((hx, hy + 0.185, hz), (0.59, 0.088, 0.36), "cff6ef", 0.0)

    # 4 Botanical Specimen Slides (separate meshes so active slide gently levitates!)
    for i in range(4):
        sx = hx - 0.42 + i * 0.28
        sl = Part(f"Herbarium_Slide_{i}", herb_root, mat_slide[i], origin=w(sx, hy + 0.105, hz))
        sl.quad_top_t((sx, hy + 0.108, hz), 0.12, 0.28, "ffffff")

    # Articulated Antique Emerald Banker's Lamp on back-right corner
    lx, lz = dx + 1.08, dz - 0.48
    lamp_root = make_empty("Lab_Desk_Lamp", (lx, dy, lz), root)
    lb = Part("Lab_Lamp_Brass", lamp_root, mat_brass, origin=w(lx, dy, lz))
    lsh = Part("Lab_Lamp_EmeraldShade", lamp_root, mat_emerald, origin=w(lx, dy, lz))
    lbu = Part("Lab_Lamp_Bulb", lamp_root, mat_lamp_glow, origin=w(lx, dy, lz))
    lb.lathe_t((lx, dy, lz), [(0, 0.24), (0.03, 0.22), (0.08, 0.11), (0.14, 0.05)], 22, "c89c5c")
    lb.rod_t((lx, dy + 0.12, lz), (lx + 0.06, dy + 0.64, lz - 0.06), 0.028, 0.022, "cfa25f", 10)
    lb.rod_t((lx + 0.06, dy + 0.65, lz - 0.06), (lx - 0.12, dy + 0.94, lz + 0.08), 0.022, 0.018, "cfa25f", 10)
    sh_c = (lx - 0.15, dy + 0.80, lz + 0.12)
    lsh.lathe_t(sh_c, [(0.0, 0.36), (0.05, 0.34), (0.13, 0.26), (0.20, 0.12), (0.22, 0.04)], 26, "32a282")
    lbu.lathe_t((sh_c[0], sh_c[1] + 0.04, sh_c[2]), [(0, 0.055), (0.05, 0.075), (0.09, 0.04)], 12, "fff0c4")

    # 3 Framed Cyanotype Blueprint Plates in front of the specimen box
    plate_specs = [
        (0, dx - 1.05, dz + 0.48, "rongrong"),
        (1, dx - 0.08, dz + 0.52, "machine-herbarium"),
        (2, dx + 0.88, dz + 0.46, "memory-map"),
    ]
    for idx, px_p, pz_p, slug in plate_specs:
        pr = make_empty(f"Lab_Plate_{idx}", (px_p, dy + 0.005, pz_p), root, props={"labProjectId": slug})
        pf = Part(f"Lab_Plate_Frame_{idx}", pr, mat_wood, origin=w(px_p, dy + 0.005, pz_p))
        pc = Part(f"Lab_Plate_Card_{idx}", pr, mat_bp[idx], origin=w(px_p, dy + 0.005, pz_p))
        pf.box_t((px_p, dy + 0.022, pz_p), (0.34, 0.022, 0.24), "4e3222", 0.02)
        pc.quad_top_t((px_p, dy + 0.046, pz_p), 0.30, 0.20, "ffffff")

    # Brass loupe & 3 glowing apothecary vials
    vials_g = Part("Lab_Vials_Glass", root, mat_glass, origin=w(dx, dy, dz))
    vials_c = Part("Lab_Vials_Glow", root, mat_jade_glow, origin=w(dx, dy, dz))
    for vx, vz, vh in ((dx + 1.38, dz + 0.02, 0.22), (dx + 1.52, dz + 0.12, 0.18), (dx + 1.42, dz + 0.22, 0.15)):
        vials_g.lathe_t((vx, dy, vz), [(0, 0.04), (vh, 0.04), (vh + 0.03, 0.026)], 14, "cff6ef", 0.0)
        vials_c.lathe_t((vx, dy + 0.015, vz), [(0, 0.032), (vh * 0.56, 0.032)], 12, "5ee8cb")


# =============================================================================
# 5. EXHIBIT 4 — CENTER OCTAGONAL PEDESTAL FOR MINI CHINA ATLAS (Mini_ChinaAtlas)
# =============================================================================
def build_atlas_pedestal():
    ax, ay, az = 0.0, 0.92, 0.65
    root = make_empty("Mini_ChinaAtlas", (ax, ay, az))
    make_empty("Anchor_Mini_ChinaAtlas", (ax, ay + 0.72, az))
    ped = Part("Atlas_Pedestal_Wood", root, mat_wood, origin=w(ax, ay, az))
    brass = Part("Atlas_Pedestal_Brass", root, mat_brass, origin=w(ax, ay, az))

    # Sculpted rosewood octagonal museum display table (top y = 0.92, radius = 1.56m)
    ped.lathe_t((ax, 0.0, az), [
        (0.0, 0.95), (0.08, 0.92), (0.16, 0.58), (0.64, 0.52),
        (0.76, 1.36), (0.86, 1.56), (0.92, 1.54),
    ], 16, "362016", smooth=False)
    # Recessed brass inlay collar & gallery rim around table top
    brass.lathe_t((ax, 0.87, az), [(0.0, 1.575), (0.055, 1.575), (0.06, 1.52)], 32, "cfa25f", smooth=True)
    brass.lathe_t((ax, 0.06, az), [(0.0, 0.96), (0.04, 0.96)], 16, "b3884c", smooth=False)


# =============================================================================
# 6. EXHIBIT 5 — GLASS JIANGNAN RIVER TERRARIUM CASE (Mini_RiverTerrarium, Right)
# =============================================================================
def build_river_terrarium():
    rx, ry, rz = 4.55, 1.05, 1.35
    yaw = -0.42
    root = make_empty("Mini_RiverTerrarium", (rx, ry, rz))
    make_empty("Anchor_Mini_RiverTerrarium", (rx, ry + 1.05, rz))

    cab = Part("Terrarium_Cabinet_Wood", root, mat_wood, origin=w(rx, ry, rz))
    brass = Part("Terrarium_Frame_Brass", root, mat_brass, origin=w(rx, ry, rz))
    glass = Part("Terrarium_Glass_Walls", root, mat_glass, origin=w(rx, ry, rz))

    ca, sa = cos(yaw), sin(yaw)

    def pt(dx, dy, dz):
        return (rx + dx * ca - dz * sa, ry + dy, rz + dx * sa + dz * ca)

    # Walnut display console cabinet (y = 0 .. 1.05)
    cab.box_t((rx, 0.50, rz), (1.18, 0.50, 1.28), "3a2318", 0.02, yaw=yaw)
    cab.box_t((rx, 1.02, rz), (1.24, 0.04, 1.34), "4f3121", 0.02, yaw=yaw)
    # Recessed dark base bed inside the brass-framed diorama box (1.16 x 1.26)
    cab.box_t((rx, 1.07, rz), (1.14, 0.03, 1.24), "121c24", 0.02, yaw=yaw)

    # Slender antique brass corner pillars & top gallery rails framing the miniature Jiangnan canal!
    hw, hd, hh = 1.15, 1.25, 0.88
    for sx in (-hw, hw):
        for sz in (-hd, hd):
            brass.rod_t(pt(sx, 0.02, sz), pt(sx, hh, sz), 0.024, 0.024, "d4a762", 8)
            brass.lathe_t(pt(sx, hh, sz), [(0, 0.038), (0.045, 0.042), (0.09, 0.012)], 10, "e6be72")
    # Top brass gallery rails
    brass.box_t(pt(0, hh, -hd), (hw, 0.018, 0.018), "d4a762", yaw=yaw)
    brass.box_t(pt(0, hh, +hd), (hw, 0.018, 0.018), "d4a762", yaw=yaw)
    brass.box_t(pt(-hw, hh, 0), (0.018, 0.018, hd), "d4a762", yaw=yaw)
    brass.box_t(pt(+hw, hh, 0), (0.018, 0.018, hd), "d4a762", yaw=yaw)
    # Ultra-clear glass side panels (open top for unobstructed angled diorama inspection!)
    glass.box_t(pt(-hw, hh * 0.5, 0), (0.006, hh * 0.48, hd - 0.02), "cff6ef", 0.0, yaw=yaw)
    glass.box_t(pt(+hw, hh * 0.5, 0), (0.006, hh * 0.48, hd - 0.02), "cff6ef", 0.0, yaw=yaw)
    glass.box_t(pt(0, hh * 0.5, -hd), (hw - 0.02, hh * 0.48, 0.006), "cff6ef", 0.0, yaw=yaw)
    glass.box_t(pt(0, hh * 0.5, +hd), (hw - 0.02, hh * 0.48, 0.006), "cff6ef", 0.0, yaw=yaw)


build_room_shell()
build_photo_exhibit()
build_moyan_exhibit()
build_lab_exhibit()
build_atlas_pedestal()
build_river_terrarium()

for p in parts:
    p.finish()

bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / "curiosity-room.blend"), compress=True)

with TemporaryDirectory(dir=ROOT) as tmp:
    out_glb = Path(tmp) / "curiosity-room.glb"
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
        raise RuntimeError("Failed to export curiosity-room.glb")
    for folder in (REPO / "assets", REPO / "dist/assets"):
        pending = Path(tmp) / (folder.parent.name + "-room.glb")
        copyfile(out_glb, pending)
        os.replace(pending, folder / "curiosity-room.glb")
print("EXPORTED curiosity-room.glb OK")
