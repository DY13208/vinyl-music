# Pen文件、导出与视觉检查

状态：**真实Pen文件已保存、页面已导出并检查**。这是一份可编辑设计稿，不是React运行页面。

## 打开与预览

- [vinyl-ui-ux.pen](./vinyl-ui-ux.pen)：唯一画布源。
- [主要页面预览](./exports/preview.png)、[18页总览](./exports/overview.png)。
- [组件板](./exports/d8ZuRd.png)：10个reusable组件、按钮变体与设计变量。
- 逐页大图检查：[P01–06](./exports/review-1.png)、[P07–12](./exports/review-2.png)、[P13–18](./exports/review-3.png)。
- [布局检查结果](./exports/pen-layout-check.json)：Pen Get遍历返回的节点、尺寸、问题数与引用数。

## 画板ID与独立导出

| 页面 | Pen节点ID | 图片 |
| --- | --- | --- |
| C00 组件与状态 | d8ZuRd | [PNG](./exports/d8ZuRd.png) |
| P01 首页 | xXszA | [PNG](./exports/xXszA.png) |
| P02 收藏柜 | mTK64 | [PNG](./exports/mTK64.png) |
| P03 发行版详情 | o2lyD | [PNG](./exports/o2lyD.png) |
| P04 播放器 | o1Yy2d | [PNG](./exports/o1Yy2d.png) |
| P05 搜索 | fa51S | [PNG](./exports/fa51S.png) |
| P06 发现 | A5dVf6 | [PNG](./exports/A5dVf6.png) |
| P07 愿望单 | C0ha9G | [PNG](./exports/C0ha9G.png) |
| P08 我的 | GQKTG | [PNG](./exports/GQKTG.png) |
| P09 登录 | DGcUw | [PNG](./exports/DGcUw.png) |
| P10 注册 | b7ApMh | [PNG](./exports/b7ApMh.png) |
| P11 设置与平台 | NtTVY | [PNG](./exports/NtTVY.png) |
| P12 导入确认 | vd2J7 | [PNG](./exports/vd2J7.png) |
| P13 艺术家 | DaUTu | [PNG](./exports/DaUTu.png) |
| P14 歌词不可用 | XiLyX | [PNG](./exports/XiLyX.png) |
| P15 状态板 | FgHNt | [PNG](./exports/FgHNt.png) |
| P16 手工录入 | GZQnA | [PNG](./exports/GZQnA.png) |
| P17 横屏 | DPl8s | [PNG](./exports/DPl8s.png) |
| P18 启动 | JPbmy | [PNG](./exports/JPbmy.png) |

17张竖屏390×844，横屏828×440，组件板1700×850。当前导出scale=1，单页可直接查看原始尺寸；Pen文件保留可再导出的矢量布局。

## 本次如何重试Pen

本机 `pen 0.3.7`，Pen账号Active。自动设计命令因缺少Claude登录无法启动；改用CLI提供的 `pen interactive` 直接编辑画布，成功创建reusable组件及ref实例。没有要求用户再次登录Claude，也没有把普通PNG冒充.pen文件。

初次导出中文字为方框，原因是中文完整字体下载超时。使用Google Fonts官方Noto SC字体的当前设计用字子集，配[font-bridge.mjs](./pen/font-bridge.mjs)仅在本次Pen进程中拦截对应字体下载并返回本地字节；没有修改Pen安装、系统字体或系统代理。子集与OFL许可在[assets/fonts](./assets/fonts/)。新增画板文字若包含子集中没有的字，需补充字体子集或换完整字体，不可以方框作为最终图。

```sh
cd /Users/jianhua/meProject/vinyl-music/docs/design/frontend
NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--import $PWD/pen/font-bridge.mjs" \
  pen interactive --in ./vinyl-ui-ux.pen --out ./vinyl-ui-ux.pen
```

进入交互终端后先查看文档与画布：

```javascript
read_skill({ path: "execute.md" })
get_app_state()
execute({ input: 'Get((n,c)=>{c.skipChildren();Print(n.id,n.name)})' })
execute({ input: 'Export(["xXszA"],"png","./exports",{scale:1})' })
save()
exit()
```

只用Pen CLI/MCP读写.pen，不把它当JSON用文件工具直接改写。`pen/01-components.js`是已执行的组件创建脚本；02–05是页面创建脚本，调用时拼接helpers.js到同一个execute.input。已有文件上不要重跑这些Insert脚本，否则会生成重复画板；迭代应Get已有节点后Update。execute报错有editId时按CLI edits机制修复，不重发整段Insert。

`make-overview.py`只拼接Pen已导出的PNG；有Pillow的Python运行即可。它不代替Pen创建UI。

## 本次视觉检查结果

- 19个顶层画板，10个reusable组件，85个ref实例；无placeholder待完成节点。
- 修正唱片框宽度、首页木板1px裁切、我的页菜单溢出后，Pen Get的布局问题为0。
- 组件板与18个页面均导出成功；逐页尺寸检查通过，并已目视检查三张大图拼图。
- 中文正常；首页木质/暗室氛围、收藏木柜、唱机形态延续真实参考图；登录/表单保持同一绿色和深色视觉系统。
- 画面里的统计、价格、档案及待处理任务是示例状态。P09特意展示凭据错误变体；P15为多种状态的组件展示，不是实际产品页面。
- 无真实音源时P04/P14明确不可用；当前没有对真实播放、手势、键盘、读屏或窄屏动态布局作运行时验收，这些在BC07/BC08实施。

字体子集SHA-256：Sans `d2d2ec908a8cb55947aa87d7d9b9936d3367efb5a6c2dceef5490b59230aa4b0`；Serif `43369d729a523a6f383431419d72c7c4f57b26a0ceae2a7ef7dfc03e59eb7157`。
