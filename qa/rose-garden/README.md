# 玫瑰星浏览器验收

在仓库根目录运行。正常站点使用本分支的 `dist/`，监听 `127.0.0.1:8765`。限速对照还需把基线提交 `9f8328f` 的 `dist/` 以同样方式放在端口 8764。两个服务都可使用 `python -m http.server 端口 --bind 127.0.0.1 --directory dist`。

测试使用 Chrome 和 Playwright Core。可通过 `CHROME_BIN` 指定 Chrome 路径，通过 `PLAYWRIGHT_CORE` 指定已安装的库目录。未指定时从 Node 模块路径加载 `playwright-core`，浏览器使用 Windows 上 Chrome 的默认安装位置。

```powershell
node qa/rose-garden/audit.cjs http://127.0.0.1:8765 final desktop
node qa/rose-garden/audit.cjs http://127.0.0.1:8765 final mobile
node qa/rose-garden/stations.cjs
node qa/rose-garden/conditions.cjs
```

输出在运行目录的 `outputs/`。测试按顺序运行。主路径使用站内已有的定位入口将相机移至第一张摄影底片前，随后通过实际鼠标或触控打开暗房、前往星球、降落、命中玫瑰与木屋、返回星海。输入图像坐标通过镜头投影计算。两种尺寸最后均检查四个原站站点的状态及渲染组。独立的 `stations.cjs` 通过可见界面操作书房、实验室、地图与河灯。

帧间隔使用独立的五秒 requestAnimationFrame 样本；支持计时查询时，再对实际动画回调采集 30 次 WebGL GPU 耗时。限速对照使用 390 × 844、DPR 2、触控、四倍 CPU 降速、10 Mbps 下行、2 Mbps 上行和 80 ms 延迟，关闭缓存。它另行模拟一次新增 GLB 返回 404，检查错误界面和真实重试，并检查减少动态效果时的键盘路径。移动模拟使用主机显卡。
