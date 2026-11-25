"""Build the Sculpted Storybook Curiosity Cottage with Swinging Wooden Door & Interior Foyer (Act II).
Run with: blender --background --factory-startup --python authoring/build_sunflower_cottage.py
Exports: authoring/sunflower-cottage.blend, assets/sunflower-cottage.glb, dist/assets/sunflower-cottage.glb
"""
from pathlib import Path
from math import sin, cos, pi
from random import Random
from shutil import copyfile
from tempfile import TemporaryDirectory
import os
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
TAU = 2 * pi
rng = Random(6122)

if not bpy.app.background:
    raise RuntimeError("Run build_sunflower_cottage.py in background Blender")
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


def make_named_mat(name, hexcolor, metallic=0.0, roughness=0.45, glow_hex=None, glow=0.0):
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
mat_stone = make_pigment_mat("CottageStone", metallic=0.0, roughness=0.88)
mat_plaster = make_pigment_mat("CottagePlaster", metallic=0.0, roughness=0.86)
mat_timber = make_pigment_mat("CottageTimber", metallic=0.03, roughness=0.64)
mat_roof = make_pigment_mat("CottageSlateRoof", metallic=0.06, roughness=0.58)
mat_foliage = make_pigment_mat("CottageIvyFlower", metallic=0.0, roughness=0.76)
mat_brass = make_pigment_mat("CottageBrass", metallic=0.84, roughness=0.28)
mat_win_glow = make_named_mat("Cottage_Window_Glow", "f7c874", roughness=0.28, glow_hex="eb9438", glow=1.15)
mat_door_glass = make_named_mat("Cottage_Door_Glass", "f7cb7c", roughness=0.28, glow_hex="e8983e", glow=0.95)
mat_interior_glow = make_named_mat("Cottage_Interior_Glow", "d98d3c", roughness=0.55, glow_hex="d97d28", glow=0.92)
mat_lantern_glow = make_named_mat("Cottage_Lantern_Glow", "ffeaad", roughness=0.22, glow_hex="ffc05c", glow=2.25)

parts = []
world_locs = {}


def finish_part_parent(obj, origin, parent):
    world_locs[obj] = origin
    if parent:
        obj.parent = parent
        obj.location = origin - world_locs.get(parent, parent.location)
    else:
        obj.location = origin


class Part:
    def __init__(self, name, parent=None, mat=mat_timber, origin=(0, 0, 0)):
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

    def mesh(self, points, faces, color="ffffff", jitter=0.03, smooth=False):
        start = len(self.verts)
        self.verts.extend(self._loc(p) for p in points)
        f0 = len(self.faces)
        for f in faces:
            self.faces.append(tuple(start + i for i in f))
            self.pigment.append(linear(color, 1.0 + rng.uniform(-jitter, jitter)))
        if smooth:
            self.smooth_ranges.append(range(f0, len(self.faces)))

    def box_t(self, tc, half_t, color="ffffff", jitter=0.03, yaw=0.0):
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
        self.mesh(pts, faces, color, jitter)

    def lathe_t(self, tc, profile, sides=14, color="ffffff", jitter=0.025, smooth=True):
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

    def rod_t(self, p1_t, p2_t, r1, r2, color="ffffff", sides=7, smooth=True):
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
        self.mesh(pts, faces, color, 0.025, smooth=smooth)

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
        bpy.context.collection.objects.link(obj)
        finish_part_parent(obj, self.origin, self.parent)
        return obj


def make_empty(name, tc, parent=None):
    obj = bpy.data.objects.new(name, None)
    loc = w(*tc)
    bpy.context.collection.objects.link(obj)
    finish_part_parent(obj, loc, parent)
    return obj


# =============================================================================
# SCULPTED STORYBOOK CURIOSITY COTTAGE
# =============================================================================
root = make_empty("Sunflower_Cottage_Root", (0, 0, 0))

stone = Part("Cottage_Stone_Base", root, mat_stone)
plaster = Part("Cottage_Plaster_Walls", root, mat_plaster)
timber = Part("Cottage_Timber_Frame", root, mat_timber)
roof = Part("Cottage_Tiled_Roof", root, mat_roof)
foliage = Part("Cottage_Ivy_Flowers", root, mat_foliage)
brass = Part("Cottage_Brass_Trim", root, mat_brass)
win_glow = Part("Cottage_Window_Glow_Mesh", root, mat_win_glow)
interior_glow = Part("Cottage_Interior_Foyer_Mesh", root, mat_interior_glow)

# 1. Fieldstone Plinth, Porch Terrace & Three Stepped Entrance Stairs
stone.box_t((0.0, 0.36, 0.0), (3.42, 0.38, 2.68), "585654", 0.04)
# Front porch landing extending under the porch overhang
stone.box_t((0.0, 0.34, 3.02), (1.72, 0.34, 0.68), "5e5a56", 0.04)
# Staggered relief stone blocks around plinth base & corners for tactile silhouette
for i in range(10):
    sx = -3.1 + i * 0.68
    stone.box_t((sx, 0.35 + (i % 2) * 0.14, 2.66), (0.31, 0.19, 0.06), rng.choice(["6a645d", "53504d", "5e5a53"]), 0.05)
for side in (-1, 1):
    for j in range(7):
        sz = -2.2 + j * 0.72
        stone.box_t((side * 3.41, 0.36 + (j % 2) * 0.13, sz), (0.06, 0.19, 0.32), rng.choice(["666059", "514f4c", "5d5952"]), 0.05)
# 3 Wide Granite Steps leading up to threshold (y = 0.72)
for s in range(3):
    stone.box_t((0.0, 0.56 - s * 0.18, 3.85 + s * 0.36), (1.18 + s * 0.06, 0.11, 0.22), rng.choice(["756e65", "6b655d"]), 0.04)

# 2. Stacked Fieldstone & Brick Chimney on Left Slope (x = -2.15, z = -0.85)
stone.box_t((-2.15, 3.15, -0.85), (0.42, 2.85, 0.42), "5c554f", 0.05)
stone.box_t((-2.15, 5.95, -0.85), (0.50, 0.16, 0.50), "6c635b", 0.04)
stone.lathe_t((-2.15, 6.10, -0.85), [(0, 0.20), (0.36, 0.17), (0.42, 0.22)], 10, "7c4938")

# 3. Main Walls with True Open Front Doorway & Glowing Interior Foyer (y in [0.72, 4.10])
# Back & side walls
plaster.box_t((0.0, 2.41, -2.28), (3.18, 1.69, 0.14), "c9b292", 0.03)
plaster.box_t((-3.08, 2.41, -0.04), (0.14, 1.69, 2.34), "c5ae8e", 0.03)
plaster.box_t((3.08, 2.41, -0.04), (0.14, 1.69, 2.34), "c5ae8e", 0.03)
# Front facade split around central doorway (x in [-0.60, 0.60], y in [0.72, 2.94])
plaster.box_t((-1.90, 2.41, 2.18), (1.30, 1.69, 0.14), "cbb494", 0.03)
plaster.box_t((1.90, 2.41, 2.18), (1.30, 1.69, 0.14), "cbb494", 0.03)
plaster.box_t((0.0, 3.52, 2.18), (0.64, 0.58, 0.14), "c7b090", 0.03)

# Triangular Gable Front & Back Plaster Walls shaped cleanly under swept roof curvature (dip <= 0.32)
gx_half = 3.20
gy_bot, gy_top = 4.06, 6.26
for gz, col in ((2.16, "cbb494"), (-2.26, "bfa888")):
    g_pts = [
        w(-gx_half, gy_bot, gz - 0.10), w(-gx_half * 0.5, 4.92, gz - 0.10), w(0.0, gy_top, gz - 0.10),
        w(+gx_half * 0.5, 4.92, gz - 0.10), w(+gx_half, gy_bot, gz - 0.10),
        w(-gx_half, gy_bot, gz + 0.10), w(-gx_half * 0.5, 4.92, gz + 0.10), w(0.0, gy_top, gz + 0.10),
        w(+gx_half * 0.5, 4.92, gz + 0.10), w(+gx_half, gy_bot, gz + 0.10),
    ]
    g_faces = [
        (5, 6, 7, 8, 9), (4, 3, 2, 1, 0),
        (0, 5, 6, 1), (1, 6, 7, 2), (2, 7, 8, 3), (3, 8, 9, 4),
    ]
    plaster.mesh(g_pts, g_faces, col, 0.025)

# Interior Warm Foyer Alcove visible behind swinging door (x in [-1.18, 1.18], z in [0.58, 2.16])
timber.box_t((-1.18, 2.10, 1.38), (0.08, 1.40, 0.82), "3b2316", 0.03)
timber.box_t((1.18, 2.10, 1.38), (0.08, 1.40, 0.82), "3b2316", 0.03)
timber.box_t((0.0, 3.35, 1.38), (1.22, 0.10, 0.82), "2f1b11", 0.03)
timber.box_t((0.0, 0.71, 1.38), (1.22, 0.04, 0.82), "472b1a", 0.03)  # warm wooden threshold floor
# Warm honey backdrop + deep walnut wainscoting & illuminated shelves inside foyer (clear of open door!)
interior_glow.box_t((0.0, 2.24, 0.62), (1.12, 1.05, 0.05), "e49a48", 0.02)
timber.box_t((0.0, 1.06, 0.65), (1.12, 0.34, 0.06), "3d2315", 0.02)
for sy in (1.55, 2.18, 2.74):
    timber.box_t((0.20, sy, 0.80), (0.82, 0.04, 0.13), "3e2416", 0.02)
# Back wooden counter & tiny glowing lantern/vessels on shelves inside foyer
timber.box_t((0.26, 1.02, 0.94), (0.48, 0.30, 0.16), "4c2e1c", 0.02)
brass.lathe_t((0.52, 1.32, 0.94), [(0, 0.09), (0.06, 0.12), (0.14, 0.07)], 10, "d4a558")
win_glow.lathe_t((0.12, 1.59, 0.80), [(0, 0.05), (0.09, 0.08), (0.18, 0.04)], 8, "ffd078")
brass.lathe_t((-0.15, 2.22, 0.80), [(0, 0.06), (0.10, 0.09), (0.18, 0.05)], 8, "cfa055")
# Hanging warm mini paper lantern centered high inside foyer vestibule
brass.rod_t((0.22, 3.25, 1.10), (0.22, 2.86, 1.10), 0.012, 0.012, "b98b48", 6)
win_glow.lathe_t((0.22, 2.52, 1.10), [(0, 0.06), (0.10, 0.14), (0.22, 0.14), (0.30, 0.06)], 10, "ffd584")

# 4. Exposed Half-Timbering, Door Casing & Carved Porch
# Vertical corner posts & front bays
for tx in (-3.14, -1.24, 1.24, 3.14):
    timber.box_t((tx, 2.41, 2.28), (0.10, 1.72, 0.09), "3b2417", 0.03)
for tx in (-3.14, 3.14):
    timber.box_t((tx, 2.41, -2.30), (0.11, 1.72, 0.10), "362014", 0.03)
# Doorway timber jambs & heavy chamfered lintel
timber.box_t((-0.63, 1.84, 2.26), (0.07, 1.14, 0.16), "3d2518", 0.02)
timber.box_t((0.63, 1.84, 2.26), (0.07, 1.14, 0.16), "3d2518", 0.02)
timber.box_t((0.0, 3.00, 2.28), (0.76, 0.10, 0.17), "3f2618", 0.02)
# Horizontal tie-beams & diagonal attic braces
timber.box_t((0.0, 4.08, 2.28), (3.28, 0.11, 0.10), "3a2316", 0.03)
timber.rod_t((0.0, 4.10, 2.28), (0.0, 6.26, 2.28), 0.075, 0.065, "3a2316", 6, smooth=False)
# Swept diagonal attic braces kept neatly inside swept roof soffit
timber.rod_t((-1.45, 4.10, 2.28), (0.0, 5.10, 2.28), 0.06, 0.06, "42291b", 6, smooth=False)
timber.rod_t((1.45, 4.10, 2.28), (0.0, 5.10, 2.28), 0.06, 0.06, "42291b", 6, smooth=False)

# Front Porch Carved Cedar Posts, Bracket Struts & Hanging Curiosity Shop Sign
for px in (-1.34, 1.34):
    stone.box_t((px, 0.78, 3.45), (0.14, 0.12, 0.14), "6d665f", 0.03)
    timber.lathe_t((px, 0.88, 3.45), [(0, 0.095), (0.55, 0.085), (1.75, 0.075), (2.42, 0.095)], 10, "3d2518", smooth=False)
    # Carved diagonal bracket strut (雀替) supporting porch eave
    timber.rod_t((px, 2.75, 3.45), (px - (0.38 if px > 0 else -0.38), 3.24, 3.45), 0.055, 0.05, "4a2e1f", 6, smooth=False)
# Hanging warm brass-trimmed curiosity shop sign board off left porch post
brass.rod_t((-1.34, 2.86, 3.45), (-1.94, 2.86, 3.45), 0.022, 0.02, "c89c56", 6)
brass.box_t((-1.66, 2.58, 3.45), (0.26, 0.18, 0.018), "cfa25f", 0.02)
timber.box_t((-1.66, 2.58, 3.45), (0.22, 0.14, 0.026), "6b4122", 0.02)
win_glow.box_t((-1.66, 2.58, 3.465), (0.16, 0.09, 0.018), "eec072", 0.02)

# 5. Swept Blue-Slate Tiled Roofs with Barrel-Tile Flute Ribs (举折青瓦坡顶)
def build_swept_roof_part(x_ridge, y_ridge, x_eave, y_eave, z0, z1, dip=0.34, n_segs=10, n_ribs=16):
    is_right = x_eave > x_ridge
    def ry(t):
        return y_ridge + (y_eave - y_ridge) * t - dip * sin(t * pi)
    def rx(t):
        return x_ridge + (x_eave - x_ridge) * t
    for s in range(n_segs):
        t0, t1 = s / n_segs, (s + 1) / n_segs
        x0, x1 = rx(t0), rx(t1)
        y0, y1 = ry(t0), ry(t1)
        pts = [
            w(x0, y0, z0), w(x1, y1, z0), w(x1, y1, z1), w(x0, y0, z1),
            w(x0, y0 - 0.18, z0), w(x1, y1 - 0.18, z0), w(x1, y1 - 0.18, z1), w(x0, y0 - 0.18, z1),
        ]
        # Base winding for is_right (x1 > x0, z1 > z0), reverse every face for left slope (x1 < x0)
        faces_r = [
            (3, 2, 1, 0),  # +Y top slate
            (4, 5, 6, 7),  # -Y soffit underside
            (3, 7, 6, 2),  # +Z front fascia
            (0, 1, 5, 4),  # -Z back fascia
            (0, 4, 7, 3),  # -X ridge
            (1, 2, 6, 5),  # +X eave edge
        ]
        faces = faces_r if is_right else [tuple(reversed(f)) for f in faces_r]
        roof.mesh(pts, faces, "283642", 0.028)
    for r in range(n_ribs):
        rz = z0 + 0.16 + r * ((z1 - z0 - 0.32) / max(1, n_ribs - 1))
        col_r = "344656" if r % 2 == 0 else "2b3b48"
        for s in range(n_segs):
            t0, t1 = s / n_segs, (s + 1) / n_segs
            roof.rod_t((rx(t0), ry(t0) + 0.04, rz), (rx(t1), ry(t1) + 0.04, rz), 0.052, 0.056, col_r, 6, smooth=False)
        roof.lathe_t((x_eave, y_eave - 0.02, rz), [(0, 0.068), (0.055, 0.068)], 8, "3e5263")


build_swept_roof_part(0.0, 6.44, -3.95, 3.84, -2.92, 2.90, dip=0.30, n_segs=10, n_ribs=16)
build_swept_roof_part(0.0, 6.44, +3.95, 3.84, -2.92, 2.90, dip=0.30, n_segs=10, n_ribs=16)
# Main ridge pole + upturned gable corner finials
roof.box_t((0.0, 6.52, -0.01), (0.14, 0.16, 3.05), "1d2832", 0.03)
brass.lathe_t((0.0, 6.56, 2.96), [(0, 0.12), (0.14, 0.06), (0.28, 0.02)], 10, "cfa25f")

# Swept Front Porch Gable Roof over Z in [2.22, 3.82]
porch_y_r, porch_y_e = 4.04, 3.24
build_swept_roof_part(0.0, porch_y_r, -1.78, porch_y_e, 2.22, 3.82, dip=0.11, n_segs=6, n_ribs=6)
build_swept_roof_part(0.0, porch_y_r, +1.78, porch_y_e, 2.22, 3.82, dip=0.11, n_segs=6, n_ribs=6)
roof.box_t((0.0, porch_y_r + 0.06, 3.02), (0.11, 0.12, 0.85), "1e2933", 0.03)

# 6. Twin Ground Lattice Windows, Shutters, Window Flower Boxes & Attic Rose Window
flower_cols = ["f2b638", "e68e28", "f7cc54", "d97428"]
for wx in (-2.04, 2.04):
    # Perimeter timber casing + unoccluded front-facing warm amber pane + crisp dark mullions
    timber.box_t((wx, 2.18, 2.28), (0.64, 0.62, 0.04), "3c2418", 0.02)
    timber.box_t((wx - 0.57, 2.18, 2.33), (0.07, 0.62, 0.05), "3c2418", 0.02)
    timber.box_t((wx + 0.57, 2.18, 2.33), (0.07, 0.62, 0.05), "3c2418", 0.02)
    timber.box_t((wx, 2.73, 2.33), (0.64, 0.07, 0.05), "3c2418", 0.02)
    timber.box_t((wx, 1.63, 2.33), (0.64, 0.07, 0.05), "3c2418", 0.02)
    win_glow.box_t((wx, 2.18, 2.33), (0.50, 0.48, 0.025), "ffdb8e", 0.02)
    timber.box_t((wx, 2.18, 2.365), (0.032, 0.50, 0.025), "44291a", 0.02)
    timber.box_t((wx, 2.18, 2.365), (0.52, 0.032, 0.025), "44291a", 0.02)
    timber.box_t((wx, 2.42, 2.365), (0.52, 0.024, 0.025), "44291a", 0.02)
    # Hinged Teal-Slate Wooden Shutters flanking window
    for sx in (-0.74, 0.74):
        timber.box_t((wx + sx, 2.18, 2.32), (0.13, 0.52, 0.035), "2d4945", 0.03)
    # Window Sill Flower Box with miniature blossoms
    timber.box_t((wx, 1.50, 2.48), (0.66, 0.11, 0.16), "4d3020", 0.03)
    for k in range(5):
        fx = wx - 0.44 + k * 0.22 + rng.uniform(-0.03, 0.03)
        fz = 2.48 + rng.uniform(-0.05, 0.05)
        foliage.lathe_t((fx, 1.58, fz), [(0, 0.04), (0.08, 0.12), (0.14, 0.05)], 7, "2c4c2a")
        foliage.lathe_t((fx, 1.69, fz + 0.04), [(0, 0.02), (0.05, 0.08), (0.07, 0.02)], 8, rng.choice(flower_cols))

# Attic Rose Window with radial mullions
rw_y = 4.92
timber.lathe_t((0.0, rw_y, 2.26), [(0, 0.56), (0.08, 0.56)], 20, "3d2518")
# Rotate rose window to face +Z
win_pts = []
win_faces = []
for i in range(16):
    a = TAU * i / 16
    win_pts.append(w(0.46 * cos(a), rw_y + 0.46 * sin(a), 2.30))
win_pts.append(w(0.0, rw_y, 2.30))
for i in range(16):
    k = (i + 1) % 16
    win_faces.append((16, i, k))
win_glow.mesh(win_pts, win_faces, "ffdf98", 0.02)
for k in range(4):
    a = k * pi / 4
    timber.rod_t((-0.46 * cos(a), rw_y - 0.46 * sin(a), 2.32), (+0.46 * cos(a), rw_y + 0.46 * sin(a), 2.32), 0.026, 0.026, "42291b", 6, smooth=False)

# 7. Climbing Ivy Vines winding along Left Chimney Corner & Right Porch Pillar
vine_paths = [
    [(-3.16, 0.72, 2.26), (-3.05, 1.75, 2.32), (-2.85, 2.85, 2.32), (-3.18, 3.85, 2.32), (-2.55, 4.42, 2.34)],
    [(1.36, 0.85, 3.50), (1.42, 1.85, 3.52), (1.32, 2.75, 3.48), (1.15, 3.30, 3.65), (0.45, 3.72, 3.78)],
]
for vpts in vine_paths:
    for i in range(len(vpts) - 1):
        p0, p1 = vpts[i], vpts[i + 1]
        timber.rod_t(p0, p1, 0.042, 0.032, "3d2a1b", 6)
        for m in range(3):
            frac = (m + 0.4) / 3.0
            lx = p0[0] + (p1[0] - p0[0]) * frac + rng.uniform(-0.14, 0.14)
            ly = p0[1] + (p1[1] - p0[1]) * frac + rng.uniform(-0.10, 0.12)
            lz = p0[2] + (p1[2] - p0[2]) * frac + rng.uniform(-0.08, 0.08)
            r_leaf = rng.uniform(0.11, 0.19)
            foliage.lathe_t((lx, ly - r_leaf, lz),
                            [(0, 0.02), (r_leaf * 0.6, r_leaf * 0.9), (r_leaf * 1.4, r_leaf * 0.65), (r_leaf * 1.7, 0.02)],
                            7, rng.choice(["2c4c34", "3b5b36", "4d6232"]), 0.05, smooth=True)

# 8. TRUE HINGED SWINGING WOODEN DOOR (Cottage_Door_Pivot at left jamb -0.58, 0.72, 2.24)
door_pivot = make_empty("Cottage_Door_Pivot", (-0.58, 0.72, 2.24), root)
door_origin = w(-0.58, 0.72, 2.24)
door_wood = Part("Cottage_Door_Leaf", door_pivot, mat_timber, origin=door_origin)
door_glass = Part("Cottage_Door_Window", door_pivot, mat_door_glass, origin=door_origin)
door_brass = Part("Cottage_Door_Hardware", door_pivot, mat_brass, origin=door_origin)

# Door panel spans local x = 0..1.16 (world x = -0.58..+0.58), y = 0.72..2.92, z = 2.24
door_wood.box_t((0.0, 1.82, 2.24), (0.58, 1.09, 0.045), "2d4843", 0.03)
# Carved recessed border rails
door_wood.box_t((-0.50, 1.82, 2.25), (0.06, 1.09, 0.055), "3c2418", 0.02)
door_wood.box_t((+0.50, 1.82, 2.25), (0.06, 1.09, 0.055), "3c2418", 0.02)
door_wood.box_t((0.0, 0.84, 2.25), (0.56, 0.11, 0.055), "3c2418", 0.02)
door_wood.box_t((0.0, 1.82, 2.25), (0.56, 0.07, 0.055), "3c2418", 0.02)
door_wood.box_t((0.0, 2.82, 2.25), (0.56, 0.09, 0.055), "3c2418", 0.02)
# Upper warm-glowing 4-pane glass window on door leaf
door_glass.box_t((0.0, 2.34, 2.24), (0.36, 0.36, 0.028), "ffe4aa", 0.02)
door_wood.box_t((0.0, 2.34, 2.25), (0.024, 0.38, 0.06), "3c2418", 0.02)
door_wood.box_t((0.0, 2.34, 2.25), (0.38, 0.024, 0.06), "3c2418", 0.02)
# Brass door knob & latch plate
door_brass.box_t((0.42, 1.72, 2.29), (0.032, 0.09, 0.015), "d6a860", 0.02)
door_brass.lathe_t((0.42, 1.70, 2.33), [(0, 0.036), (0.03, 0.042), (0.05, 0.015)], 10, "e6be72")

# 9. SWAYING PORCH HANGING LANTERN (Cottage_Porch_Lantern at 0.96, 3.16, 3.45)
lan_pivot = make_empty("Cottage_Porch_Lantern", (0.96, 3.16, 3.45), root)
lan_origin = w(0.96, 3.16, 3.45)
lan_br = Part("Porch_Lantern_Brass", lan_pivot, mat_brass, origin=lan_origin)
lan_gl = Part("Porch_Lantern_Globe", lan_pivot, mat_lantern_glow, origin=lan_origin)
lan_br.rod_t((0.96, 3.16, 3.45), (0.96, 2.74, 3.45), 0.015, 0.015, "c49652", 6)
lan_br.lathe_t((0.96, 2.66, 3.45), [(0, 0.16), (0.06, 0.18), (0.10, 0.06)], 12, "cfa25f")
lan_gl.lathe_t((0.96, 2.38, 3.45), [(0, 0.09), (0.08, 0.15), (0.20, 0.15), (0.28, 0.09)], 12, "ffe3a2")
lan_br.lathe_t((0.96, 2.32, 3.45), [(0, 0.04), (0.06, 0.11)], 10, "cfa25f")

for p in parts:
    p.finish()

bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / "sunflower-cottage.blend"), compress=True)

with TemporaryDirectory(dir=ROOT) as tmp:
    out_glb = Path(tmp) / "sunflower-cottage.glb"
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
        raise RuntimeError("Failed to export sunflower-cottage.glb")
    for folder in (REPO / "assets", REPO / "dist/assets"):
        pending = Path(tmp) / (folder.parent.name + "-cottage.glb")
        copyfile(out_glb, pending)
        os.replace(pending, folder / "sunflower-cottage.glb")
print("EXPORTED sunflower-cottage.glb OK")
