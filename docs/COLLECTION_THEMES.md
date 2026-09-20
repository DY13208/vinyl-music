# 收藏页主题系统

收藏页使用同一套数据、筛选和动作，主题只提供表现层。设置 → 收藏页主题中提供 2 × 2 缩略预览卡，选择即时生效；存储成功后刷新保留。默认 `shelf`。

## 四种主题

| ID | 视觉与竖屏陈列 | 默认横屏陈列 |
| --- | --- | --- |
| shelf | 木质纹理、暖光格子、层板、封套后露出黑胶；2 列 | 更宽的 3–4 列唱片架 |
| editorial | 纯黑留白、重点专辑、无厚重边框的次级网格 | 左 Featured，右 Gallery |
| cinematic | 唱盘氛围 Hero、收藏网格，最多一个辅助区域 | 左收藏，右精选氛围区 |
| glass | 深青黑、克制绿光、半透明玻璃与露出黑胶；2 列 | 高密度自适应网格 |

参考图链接请求返回 HTTP 403，无法读取图像；本次按照用户提供的材质、层级和布局说明实现，未声称逐图视觉匹配。预览封面为原创占位 SVG，真实收藏封面不被替换。

## 架构

```text
App
 ├─ useCollectionTheme ─ storageService
 ├─ SettingsView → CollectionThemePicker → CollectionThemePreview
 └─ CollectionView
     ├─ 共享标题、搜索、筛选、排序、新增动作
     └─ AlbumBrowser
         ├─ default → registry.Presentation → CollectionAlbumCard
         ├─ gallery-grid → GalleryGrid + 主题 artwork
         └─ spine-carousel → SpineCarousel + 主题 artwork
```

类型与 registry 位于 `src/features/collection/themes/`。每个条目定义 layout、tokens、backgroundTreatment、cardVariant、headerVariant、Header 和 Presentation。新增主题应注册新条目，避免在页面内增加主题条件分支。四个 Presentation 仅安排共享卡片，不读取或写入收藏仓库。

`CollectionAlbumCard` 复用 AlbumArtwork、VinylDisc 与已有收藏/打开详情回调；缩略预览不加载完整收藏页。

## 独立状态与存储

| 状态 | 允许值 | storageService key |
| --- | --- | --- |
| 收藏主题 | shelf / editorial / cinematic / glass | collection_theme |
| 收藏浏览模式 | default / gallery-grid / spine-carousel | collection_view_mode |
| 悬浮播放器可见性 | true / false | vinyl_floating_player_visible_v1 |

主题与模式是两个独立 React 状态，没有绑定关系，支持 4 × 3 组合。竖屏显示主题默认陈列，但保留横屏模式偏好。无效值回落默认值；存储失败时保留本次切换并提示无法保存，不冒充持久化成功。

收藏 token 仅在收藏屏根节点设置，包括 `--collection-bg/surface/card-bg/border/accent/text/muted/shadow/radius/glow`。样式由 `[data-collection-theme]` 限定，离开收藏页移除作用域，首页和全局主题不随之变化。切换使用短暂颜色、透明度、边框与阴影过渡，适配减少动态效果。

浮动播放器仍使用原来的播放和位置状态；隐藏悬浮球不暂停音乐。底部导航保留原图标顺序和逻辑，主题仅影响收藏屏内的外观。点击专辑曲目立即进入已有播放器，音源匹配异步继续。

## 验证

- `collectionThemePreference.test.ts` 覆盖默认值、4 × 3 状态组合、相互隔离、非法存储和存储失败。
- 浏览器覆盖四主题 × 八种尺寸、48 项横屏布局检查、设置预览/即时切换/刷新保持、首页隔离、收藏/搜索/排序/新增/详情返回/空结果与导航空间。
- 本地 WAV 验证主题切换、浏览模式切换、旋转、隐藏与恢复播放器时音频持续前进。
- 曲目点击验证立即导航、标题、上一首/下一首、B 面选择和收起。
- `npm run lint` 为 TypeScript 检查；`npm run build` 生成生产资源。仓库没有 test 脚本，使用 `npx tsx --test` 执行现有 Node 测试。

原创数据预览入口：运行 Vite 后访问 `/tests/browser/browse-preview.html`。该入口使用同一个 App 和内存仓库，不写入用户收藏；支持 `?count=0` 与 `?count=1`。未完成 Capacitor iOS/Android 真机验证。
