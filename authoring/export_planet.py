"""Export the open, artist-edited .blend to both existing static site layouts."""
from pathlib import Path
from shutil import copyfile
from tempfile import TemporaryDirectory
import os
import bpy

root = Path(__file__).resolve().parent.parent
required = {'B612_Asteroid_Body', 'B612_Cottage', 'B612_Rose_Cloche'}
if not bpy.data.filepath or not required.issubset(bpy.context.scene.objects.keys()):
    raise ValueError("Open rose-garden.blend with its terrain, cottage and rose before exporting")

with TemporaryDirectory(dir=root/'authoring') as tmp:
    model = Path(tmp)/'rose-garden.glb'
    result = bpy.ops.export_scene.gltf(filepath=str(model), export_format='GLB',
                                      export_yup=True, export_animations=False,
                                      export_cameras=False, export_lights=False)
    if result != {'FINISHED'} or model.read_bytes()[:4] != b'glTF':
        raise RuntimeError("Blender did not write a GLB")
    for folder in (root/'assets', root/'dist/assets'):
        target = folder/model.name
        pending = Path(tmp)/(folder.parent.name+'-ready.glb')
        copyfile(model, pending)
        os.replace(pending, target)
