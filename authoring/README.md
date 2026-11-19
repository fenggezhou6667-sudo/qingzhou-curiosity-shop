# B‑612 玫瑰花园

`rose-garden.blend` 是可编辑母版。Blender 内使用 Z 向上，行星中心在原点。材质颜色来自网格的 `Pigment` 颜色属性。木屋、屋瓦、窗灯、山体、花草、南天星图和钟罩各自保留可编辑的网格。暗房中的镜头、交互和灯光由网站控制。

## 编辑后导出

在仓库根目录运行下列 PowerShell 命令。把第一行换成本机的 Blender 可执行文件。此流程用 Blender 4.2.9 LTS 实测。

```powershell
$blender = 'D:\Blender\blender-4.2.9-windows-x64\blender.exe'
& $blender --background authoring/rose-garden.blend --python-exit-code 1 --python authoring/export_planet.py
```

导出脚本重新打开工作流中指定的源文件后，通过 Blender 内置 glTF 导出器生成一份 GLB，并将相同的文件写到 `assets/rose-garden.glb` 和 `dist/assets/rose-garden.glb`。日常调整可在 Blender 中直接编辑并保存母版，然后执行上述导出。

## 从参数重新建模

以下步骤会用建模脚本重新生成并覆盖 `authoring/rose-garden.blend`。需要保留的手工编辑应先保存成独立版本。

```powershell
& $blender --background --factory-startup --python-exit-code 1 --python authoring/build_planet.py
if ($LASTEXITCODE -ne 0) { throw '星球建模失败' }
& $blender --background authoring/rose-garden.blend --python-exit-code 1 --python authoring/export_planet.py
if ($LASTEXITCODE -ne 0) { throw '星球导出失败' }
```

## 网站接入

部署目录是 `dist/`。从仓库根目录运行 `python -m http.server 8765 --bind 127.0.0.1 --directory dist`，在浏览器打开 `http://127.0.0.1:8765/`。

- 点击星海中的「寻星」到达轨道视角。摄影观片台另有「飞往玫瑰星」入口。
- 点击「降落花径」。点击钟罩可触发玫瑰原有的提示与钟声，点击木屋可沿原有穿窗转场进入《墨盐》书房。花径上也有可用键盘操作的等效按钮。
- `unified.js` 复用原加载器加载世界与星球，将新模型定位到 `B612_CENTER`。原世界文件继续承载五境内容。接入时跳过旧星球的六个可见节点与两个旧拾取代理。
- `B612_Cottage` 和 `B612_Rose_Cloche` 是三维拾取根节点，`B612_Asteroid_Body` 提供遮挡。修改模型比例、窗户或玫瑰的位置时，应同时复核 `cosmos-slice.js` 的轨道取景、窗户坐标及 `unified.js` 的花径机位。
- 仓库根目录与 `dist/` 延续已有双份入口。发布前应核对两处脚本及模型内容一致。网页运行时使用项目自带的 Three.js、GLTFLoader 和后处理。
