"""Rebuild the editable rose garden. Run with Blender --background --factory-startup."""
from pathlib import Path
from math import sin, cos, pi, sqrt
from random import Random
import bpy
from mathutils import Vector, noise

ROOT = Path(__file__).resolve().parent
TAU = 2*pi
rng = Random(612)
if not bpy.app.background:
    raise RuntimeError("Generate the planet in a separate background Blender process")
bpy.ops.wm.read_factory_settings(use_empty=True)


def linear(hexcolor, shade=1):
    def channel(i):
        s = int(hexcolor[i:i+2], 16)/255
        return min(1, shade*((s+0.055)/1.055)**2.4) if s > .04045 else shade*s/12.92
    return (*[channel(i) for i in (0, 2, 4)], 1)


def paint(name, metallic=0, roughness=.78, glow=0, opacity=1):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    color = mat.node_tree.nodes.new('ShaderNodeVertexColor')
    color.layer_name = 'Pigment'
    mat.node_tree.links.new(color.outputs['Color'], shader.inputs['Base Color'])
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    if glow:
        shader.inputs['Emission Color'].default_value = (1, .40, .095, 1)
        shader.inputs['Emission Strength'].default_value = glow
    if opacity < 1:
        shader.inputs['Alpha'].default_value = opacity
        mat.surface_render_method = 'BLENDED'
    return mat


clay = paint('Gouache on stone')
metal = paint('Hammered copper', .55, .42)
lamp = paint('Honey lamplight', roughness=.32, glow=.78)
glass = paint('Blown glass', metallic=.14, roughness=.2, opacity=.14)
parts = {}


class Part:
    """Batch small forms into an editable mesh per sculptural component."""
    def __init__(self, name, parent=None, mat=clay):
        self.name, self.parent, self.mat = name, parent, mat
        self.verts, self.faces, self.pigment = [], [], []
        self.smooth_ranges = []
        parts[name] = self

    def mesh(self, points, faces, color, jitter=0):
        start = len(self.verts)
        self.verts.extend(points)
        for face in faces:
            self.faces.append(tuple(start+i for i in face))
            self.pigment.append(linear(color, 1+rng.uniform(-jitter,jitter)))

    def solid(self, center, axes, profile, sides, color, jitter=.045):
        c=Vector(center)
        a,b,d = map(Vector,axes)
        points = [c + a*(rx*cos(TAU*i/sides)) + b*(ry*sin(TAU*i/sides)) + d*z
                  for z,rx,ry in profile for i in range(sides)]
        faces = [tuple(reversed(range(sides)))]
        for j in range(len(profile)-1):
            for i in range(sides):
                lo = j*sides
                k=(i+1)%sides
                faces.append((lo+i,lo+k,lo+k+sides,lo+i+sides))
        faces.append(tuple(range(len(points)-sides,len(points))))
        self.mesh(points,faces,color,jitter)

    def rod(self,p,q,r1,r2,color,n=8):
        p,q = Vector(p),Vector(q)
        axis=q-p
        u=axis.normalized().orthogonal().normalized()
        v=axis.normalized().cross(u)
        self.solid(p,(u,v,axis),[(0,r1,r1),(1,r2,r2)],n,color)

    def box(self,c,half,color,axes=None):
        u,v,w = map(Vector, axes or ((1,0,0),(0,1,0),(0,0,1)))
        x,y,z=half
        pts=[Vector(c)+u*i*x+v*j*y+w*k*z for k in (-1,1) for i,j in ((-1,-1),(1,-1),(1,1),(-1,1))]
        self.mesh(pts,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],color,.04)

    def bulb(self,c,r,color,n=9,axes=None):
        x,y,z=r
        u,v,w=map(Vector,axes or ((1,0,0),(0,1,0),(0,0,1)))
        c=Vector(c)
        # Share pole vertices and normals. Tiny pollen grains need one equator.
        latitudes=(0,) if max(r)<.04 else (-.78,-.22,.36,.91)
        pts=[c-w*z]
        for t in latitudes:
            for i in range(n):
                a=TAU*i/n
                pts.append(c+w*(sin(t)*z)+(u*(x*cos(a))+v*(y*sin(a)))*cos(t))
        pts.append(c+w*z)
        faces=[(0,1+(i+1)%n,1+i) for i in range(n)]
        for j in range(len(latitudes)-1):
            for i in range(n):
                a=1+j*n+i; b=1+j*n+(i+1)%n
                faces.append((a,b,b+n,a+n))
        last=1+(len(latitudes)-1)*n
        faces.extend((last+i,last+(i+1)%n,len(pts)-1) for i in range(n))
        first=len(self.faces)
        self.mesh(pts,faces,color)
        self.smooth_ranges.append(range(first,len(self.faces)))

    def finish(self):
        mesh=bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.verts,[],self.faces)
        mesh.materials.append(self.mat)
        pigment=mesh.color_attributes.new(name='Pigment',type='BYTE_COLOR',domain='CORNER')
        for face,rgba in zip(mesh.polygons,self.pigment):
            for i in face.loop_indices:
                pigment.data[i].color=rgba
        for indices in self.smooth_ranges:
            for i in indices:
                mesh.polygons[i].use_smooth=True
        mesh.update()
        obj=bpy.data.objects.new(self.name,mesh)
        bpy.context.collection.objects.link(obj)
        obj.parent=self.parent
        return obj


def group(name):
    obj=bpy.data.objects.new(name,None)
    bpy.context.collection.objects.link(obj)
    obj.empty_display_size=.12
    return obj


def radius(n):
    rough=noise.fractal(n*2.7,1.1,2.05,3,noise_basis='PERLIN_ORIGINAL')
    return 2.26+.084*rough+.055*sin(n.x*4+n.y*3)*cos(n.z*4)


def surface(x,y):
    # Solve a point on the upper hemisphere, including its actual relief.
    r=2.26
    for _ in range(4):
        n=Vector((x,y,sqrt(max(.018,r*r-x*x-y*y)))).normalized()
        r=radius(n)
    return n*r


def terrain():
    part=Part('B612_Asteroid_Body')
    # Irregular courses of rock wrap the sphere like the strata of a cut geode.
    rings=[]; count=84
    for j in range(49):
        ring=[]
        for i in range(count):
            a=TAU*(i+.24*(j%2))/count
            t=-pi/2+.002+(pi-.004)*j/48
            t+=sin(pi*j/48)*(.13*sin(2*a+.3)+.074*cos(3*a-j*.09)+.035*sin(6*a+j*.10))
            n=Vector((cos(a)*cos(t),sin(a)*cos(t),sin(t)))
            ring.append(n*radius(n))
        rings.append(ring)
    bands=['30394e','41475b','4b4a5d','706174','626376','786b78','a28a89','7f7783','565d70',
           '546278','627184','77858d','48656d','477271','6a8c83','96a295']
    part.verts.extend(p for ring in rings for p in ring)
    for j in range(48):
        for i in range(count):
            k=(i+1)%count
            pts=[rings[j][i],rings[j][k],rings[j+1][k],rings[j+1][i]]
            if j<31:
                idx=min(15,int(j*.45)+int(j in (9,17,24)))
                col=bands[idx]
                if j in (13,22): col='968077'
            else:
                a=pts[0]
                tint=noise.noise(a*2)+.3*sin(a.x*4)
                col=('507d73' if tint<-.18 else '789680' if tint<.14 else '9da384' if tint<.45 else 'b4ad88')
            a,b=j*count+i,j*count+k
            part.faces.extend([(a,b,b+count),(a,b+count,a+count)])
            part.pigment.extend(linear(col,1+rng.uniform(-.075,.075)) for _ in range(2))
    part.faces.extend([tuple(reversed(range(count))),tuple(range(48*count,49*count))])
    part.pigment.extend([linear('30394e'),linear('8eaa83')])


def cottage():
    house=group('B612_Cottage')
    walls=Part('Limewash and timber',house)
    tiles=Part('Fishscale roof tiles',house)
    brass=Part('Gutters and observatory',house,metal)
    glow=Part('LanternGlow',house,lamp)
    # Front gable faces the arrival path.
    floor_z,eave,ridge=2.19,3.21,3.94
    outline=[(-.65,floor_z),(.65,floor_z),(.65,eave),(0,ridge),(-.65,eave)]
    pts=[(x,y,z) for y in (-.53,.53) for x,z in outline]
    walls.mesh(pts,[(0,1,2,3,4),(9,8,7,6,5)]+[(i,(i+1)%5,(i+1)%5+5,i+5) for i in range(5)],'c7aa89')
    walls.box((0,0,2.11),(.74,.60,.176),'777167')
    for row in range(3):
        for col in range(9):
            x=-.665+col*.157+.052*(row%2)
            walls.box((x,-.608,2.026+row*.086),(.074,.014,.039),rng.choice(['95877a','ab9985','908478','a2927e']))
    # A plank jamb, hammered hinges and a scalloped stone doorstep.
    for x in (-.445,-.035):
        walls.box((x,-.594,2.65),(.021,.029,.326),'6e5040')
    walls.box((-.24,-.594,2.986),(.224,.029,.022),'83644e')
    for z in (2.47,2.82):
        brass.box((-.354,-.61,z),(.047,.009,.014),'a68b63')
    for k in range(3):
        walls.box((-.24,-.67-k*.083,2.29-k*.044),(.23,.061,.027),'b3a186')
    for x in (-.62,.62):
        for y in (-.53,.53): walls.box((x,y,2.72),(.043,.045,.53),'5b3e37')
    for z in (2.34,3.18):
        walls.box((0,-.55,z),(.66,.035,.033),'77513e')
    walls.box((-.24,-.565,2.64),(.193,.022,.32),'42635d')
    for x in (-.39,-.30,-.21,-.12):
        walls.box((x,-.594,2.63),(.007,.008,.29),'7b9180')
    brass.bulb((-.109,-.615,2.63),(.024,.018,.024),'f4cb77')
    for x in (.28,):
        walls.box((x,-.567,2.84),(.206,.025,.234),'5a3b32')
        glow.box((x,-.598,2.84),(.163,.012,.192),'ffd18b')
        walls.box((x,-.616,2.84),(.016,.009,.198),'684a37')
        walls.box((x,-.616,2.84),(.164,.009,.013),'684a37')
        walls.box((x,-.62,2.60),(.225,.08,.025),'956747')
    # Round rose window and radial leadwork.
    c=Vector((0,-.564,3.42))
    brass.rod(c,c+Vector((0,-.03,0)),.144,.144,'ba9263',24)
    glow.rod(c+Vector((0,-.032,0)),c+Vector((0,-.041,0)),.112,.112,'ffd889',24)
    for i in range(6):
        a=TAU*i/6
        brass.rod((0,-.614,3.42),(.108*cos(a),-.614,3.42+.108*sin(a)),.009,.009,'815b44')
    # Hinged shutters and a star cut from brass above the door.
    for x in (.023,.535):
        walls.box((x,-.573,2.86),(.045,.026,.193),'4c7776')
        for z in (2.73,2.79,2.85,2.91,2.97):
            walls.box((x,-.603,z),(.043,.008,.009),'71928c')
    brass.rod((-.52,-.56,3.10),(-.52,-.85,3.10),.016,.016,'c69661')
    brass.rod((-.52,-.83,3.10),(-.52,-.83,3.01),.009,.009,'a67d52')
    walls.rod((-.52,-.85,2.92),(-.52,-.81,2.92),.102,.102,'345a61',24)
    center=Vector((-.52,-.853,2.92))
    for i in range(8):
        a=TAU*i/8
        r=.081 if i%2==0 else .042
        u=Vector((cos(a),0,sin(a))); v=Vector((-u.z,0,u.x))
        brass.mesh([center+v*.013,center+u*r,center-v*.013],[(0,1,2)],'e3be7d')
    for side in (-1,1):
        # A backed roof with seven overlapping courses of individually rounded shingles.
        down=Vector((side*.76,0,-.81)).normalized()
        along=Vector((0,1,0))
        normal=Vector((side*.81,0,.76)).normalized()
        tiles.box(Vector((0,0,3.99))+down*.55,(.55,.69,.035),'374b53',(down,along,normal))
        colors=['526f75','64837e','73918a','487075','759994','829d90','577d80']
        for row in range(7):
            for k in range(9):
                y=-.64+k*.16+.075*(row%2)
                if y>.67: continue
                c=Vector((0,y,4.014))+down*(row*.147)+normal*(.044-.004*row)
                poly=[(-.025,-.076),(.126,-.076),(.165,-.055),(.182,0),(.165,.055),(.126,.076),(-.025,.076)]
                top=[c+down*d+along*v for d,v in poly]
                low=[p-normal*.023 for p in top]
                tiles.mesh(top+low,[tuple(range(7)),tuple(reversed(range(7,14)))]+[(i,(i+1)%7,(i+1)%7+7,i+7) for i in range(7)],rng.choice(colors))
        walls.rod((0,-.72,4.02),(.79*side,-.72,3.17),.037,.04,'956447')
        brass.rod((.775*side,-.72,3.18),(.775*side,.72,3.18),.023,.023,'c89160')
    brass.rod((0,-.74,4.055),(0,.74,4.055),.037,.037,'bc8758')
    # A woodcut trim below each eave, its pegs and exposed rafter ends.
    for side in (-1,1):
        for i in range(7):
            y=-.61+i*.195
            walls.box((side*.685,y,3.155),(.095,.025,.032),'71513f')
        for i in range(6):
            x=side*(.09+i*.113)
            z=4.02-abs(x)*1.076
            brass.bulb((x,-.751,z),(.014,.01,.014),'c9a474',6)
    # Riveted side observatory with a patinated copper cupola.
    tx,ty=.65,.23
    walls.solid((tx,ty,1.94),((1,0,0),(0,1,0),(0,0,1)),[(0,.36,.36),(.20,.36,.36),(.24,.34,.34),(1.11,.34,.34)],16,'bfaa90')
    for i in range(12):
        a=TAU*i/12
        glow.rod((tx+.34*cos(a),ty+.34*sin(a),2.75),(tx+.34*cos(a),ty+.34*sin(a),2.96),.038,.033,'ffc884')
    for z in (2.68,3.03): brass.rod((tx,ty,z),(tx,ty,z+.045),.355,.355,'ca9564',24)
    rings=[(0,.38,.38),(.10,.36,.36),(.22,.29,.29),(.32,.15,.15),(.36,.027,.027)]
    brass.solid((tx,ty,3.08),((1,0,0),(0,1,0),(0,0,1)),rings,24,'6c9690')
    for i in range(8):
        a=TAU*i/8
        curve=[(tx+r*cos(a),ty+r*sin(a),3.08+z) for z,r,_ in rings]
        for p,q in zip(curve,curve[1:]): brass.rod(p,q,.01,.01,'bba471',5)
    brass.rod((tx,ty,3.44),(tx,ty,3.63),.022,.009,'d9ab6e')
    # Brick chimney, lip, and sleeping roof cat.
    walls.box((-.32,.30,3.80),(.108,.115,.30),'a06c57')
    for z in (3.65,3.75,3.85,3.95,4.08): walls.box((-.32,.30,z),(.12,.13,.014),'d19b79')
    cat=Part('B612_Cat')
    cat.bulb((.01,-.12,4.18),(.105,.15,.14),'282d38')
    cat.bulb((.01,-.225,4.31),(.09,.085,.083),'303444')
    for x in (-.055,.074): cat.rod((x,-.22,4.35),(x+.01,-.21,4.44),.04,.001,'303444',5)
    cat.rod((.07,.00,4.16),(.18,.07,4.23),.032,.023,'303444')
    cat.rod((.18,.07,4.23),(.16,.09,4.32),.023,.012,'303444')


def landscape():
    flora=Part('Wild thyme, poppies and grass')
    rock=Part('Shale, cairns and garden steps')
    creek=Part('B612_Creek',mat=metal)
    # Winding, stone-lined spring from the house down the front hemisphere.
    def course(t,offset=0):
        t=.24+1.42*t
        a=-pi/2-.29+.27*sin(t*4.3)+offset
        n=Vector((sin(t)*cos(a),sin(t)*sin(a),cos(t)))
        return n*(radius(n)+.021)
    for i in range(56):
        a,b=i/56,(i+1)/56
        w=.035+.018*sin(pi*a)
        creek.mesh([course(a,-w),course(b,-w),course(b,w),course(a,w)],[(0,1,2,3)],rng.choice(['5ca8aa','6eb6af','68aeaa']))
        if i%3==0:
            p=course(a,w+.025)
            rock.bulb(p,(.06,.045,.048),'95a99b',7)
    for i in range(14):
        y=-.62-i*.105
        x=-.22+.65*sin(i*.15)
        p=surface(x,y)
        n=p.normalized()
        u=Vector((1,0,0)); v=n.cross(u).normalized(); u=v.cross(n)
        rock.bulb(p,(.18-i*.004,.061,.034),rng.choice(['cbb691','aa9883','d9bd99']),8,(u,v,n))
    # Angular outcrops on the flanks, with tiny copper inclusions.
    for _ in range(95):
        z=rng.uniform(-.89,.82); a=rng.uniform(0,TAU)
        n=Vector((sqrt(1-z*z)*cos(a),sqrt(1-z*z)*sin(a),z))
        u=n.orthogonal().normalized(); v=n.cross(u)
        s=rng.uniform(.03,.12)
        rock.bulb(n*(radius(n)-.018),(s*1.5,s*.81,s*.54),rng.choice(['68757a','8f9692','91877c','697486']),7,(u,v,n))
    for _ in range(1550):
        a=rng.uniform(0,TAU); z=rng.uniform(.17,1)
        n=Vector((sqrt(1-z*z)*cos(a),sqrt(1-z*z)*sin(a),z))
        p=n*radius(n)
        if abs(p.x)<.82 and abs(p.y)<.66: continue
        if p.y<-.58 and abs(p.x-(-.22+.65*sin((-p.y-.62)/.105*.15)))<.20: continue
        theta=rng.random()*TAU
        u=n.orthogonal().normalized(); v=n.cross(u)
        u=u*cos(theta)+v*sin(theta)
        h=rng.uniform(.045,.14)
        flora.mesh([p-u*.017,p+u*.017,p+n*h+u*.031],[(0,1,2)],rng.choice(['869b65','b0ae75','5a8469','789777']))
        if rng.random()<.18 and z>.44:
            tip=p+n*h
            flower=rng.choice(['d99b83','eee0ab','c86c59','caa9bc'])
            # Four distinct petals round a gold pollen centre.
            for i in range(4):
                d=u*cos(i*pi/2)+n.cross(u)*sin(i*pi/2)
                e=n.cross(d)
                flora.mesh([tip,tip+d*.034+e*.016,tip+d*.049+n*.014,tip+d*.034-e*.016],[(0,1,2,3)],flower)
            flora.bulb(tip,(.014,.014,.015),'e1b665',5)


def orchard():
    tree=Part('B612_Tree')
    p=surface(-1.57,.13)
    # A wind-trained orchard tree leaning away from the cottage.
    joints=[p,p+Vector((-.13,.03,.38)),p+Vector((-.36,.02,.72)),p+Vector((-.49,.07,1.03))]
    for i in range(3): tree.rod(joints[i],joints[i+1],.13-.027*i,.105-.027*i,'785849',9)
    for i in range(15):
        a=i*2.4
        start=joints[1+i%3]
        end=joints[-1]+Vector((cos(a)*rng.uniform(.25,.75)-.15,sin(a)*.49,rng.uniform(-.12,.45)))
        mid=start.lerp(end,.62)+Vector((0,0,.094))
        tree.rod(start,mid,.06,.034,'745747')
        tree.rod(mid,end,.035,.015,'95755c')
        for _ in range(5):
            pos=end+Vector((rng.uniform(-.16,.16),rng.uniform(-.14,.14),rng.uniform(-.09,.13)))
            tree.bulb(pos,(rng.uniform(.15,.24),.16,.145),rng.choice(['658d7e','8aab89','aab48b','769b86','b5ae84']),9)
            for k in range(5):
                angle=k*TAU/5+rng.uniform(-.2,.2)
                u=Vector((cos(angle),sin(angle),.18))
                v=Vector((-u.y,u.x,0))
                base=pos+u*.095+Vector((0,0,.055))
                tree.mesh([base,base+u*.062+v*.033,base+u*.135+Vector((0,0,-.035)),base+u*.060-v*.031],[(0,1,2,3)],rng.choice(['9db18a','88a685','c1bc8b']))
            if rng.random()<.34: tree.bulb(pos-Vector((0,0,.12)),(.038,.04,.046),'d79a6e',8)


def rose():
    parent=group('B612_Rose_Cloche')
    stand=Part('Turned brass and enamel',parent,metal)
    bloom=Part('Velvet rose petals',parent)
    bell=Part('Handblown bell',parent,glass)
    p=surface(1.45,-.65)
    # The keeper has levelled a small plinth into the slope.
    up=((1,0,0),(0,1,0),(0,0,1))
    stand.solid(p,up,[(-.19,.26,.26),(-.035,.32,.32),(.006,.34,.34),(.054,.34,.34),(.073,.30,.30)],32,'be9566')
    for i in range(32):
        a=i*TAU/32
        start=p+Vector((.337*cos(a),.337*sin(a),.02))
        stand.rod(start,start+Vector((0,0,.021 if i%4 else .033)),.005,.005,'695c4e',5)
    stem=p+Vector((0,0,.08))
    mid=stem+Vector((-.045,0,.18)); tip=stem+Vector((.015,0,.38))
    bloom.rod(stem,mid,.016,.014,'44694f')
    bloom.rod(mid,tip,.015,.01,'527b58')
    for i in range(5):
        z=.06+i*.047; s=(-1)**i
        bloom.mesh([stem+Vector((-.02,0,z)),stem+Vector((s*.084,-.031,z+.018)),stem+Vector((s*.15,0,z+.084)),stem+Vector((s*.075,.028,z+.052))],[(0,1,2,3)],'75956e')
    for row in range(3):
        for i in range(8-row):
            a=TAU*i/(8-row)+row*.64
            d=Vector((cos(a),sin(a),0)); u=Vector((-sin(a),cos(a),0))
            base=tip+d*.018+Vector((0,0,.014*row))
            rad=.124-.031*row
            bloom.mesh([base,base+d*rad*.8-u*.056+Vector((0,0,.055)),base+d*rad-u*.036+Vector((0,0,.096)),base+d*rad+u*.032+Vector((0,0,.10)),base+d*rad*.8+u*.056+Vector((0,0,.055))],[(0,1,2,3,4)],rng.choice(['b94e62','d96573','e58a89','c45767']))
    bell.solid(p,up,[(.078,.282,.282),(.41,.282,.282),(.53,.268,.268),(.62,.218,.218),(.69,.142,.142),(.72,.025,.025)],32,'badcda')
    stand.bulb(p+Vector((0,0,.744)),(.045,.045,.047),'dfb274',12)


def star_chart():
    # Inlaid enamel dots and copper segments follow the curvature of the rock.
    chart=Part('Inlaid southern sky atlas',mat=metal)
    def point(lon,lat):
        n=Vector((cos(lat)*sin(lon),-cos(lat)*cos(lon),sin(lat)))
        return n*(radius(n)+.022)
    groups=[[(-.72,-.31),(-.49,-.16),(-.30,-.34),(-.12,-.23),(.10,-.34)],
            [(.32,-.18),(.49,-.32),(.64,-.18),(.83,-.21),(.74,-.43),(.49,-.32)],
            [(-.06,-.68),(.16,-.62),(.34,-.76),(.55,-.72)]]
    for stars in groups:
        for a,b in zip(stars,stars[1:]):
            pts=[point(a[0]+(b[0]-a[0])*i/6,a[1]+(b[1]-a[1])*i/6) for i in range(7)]
            for p,q in zip(pts,pts[1:]): chart.rod(p,q,.006,.006,'b6a183',5)
        for i,(a,b) in enumerate(stars):
            p=point(a,b)
            chart.bulb(p,(.033,.033,.033) if i==1 else (.020,.020,.020),'ebc890',8)


terrain()
cottage()
landscape()
orchard()
rose()
star_chart()
for part in parts.values():
    part.finish()
bpy.context.scene.world=bpy.data.worlds.new('Midnight workshop')
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            view=area.spaces.active
            view.shading.color_type='VERTEX'
            view.overlay.show_overlays=False
            view.region_3d.view_rotation=Vector((-.3,1,-.42)).to_track_quat('-Z','Y')
            view.region_3d.view_distance=9
            view.region_3d.view_location=(0,0,.8)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'rose-garden.blend'),compress=True)
