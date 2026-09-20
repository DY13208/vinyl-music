# 横屏浏览与竖屏的关系

首页与收藏页共用 `AlbumBrowser`。横屏且宽度至少 640 CSS px 时显示布局切换入口；旋转设备只改变同一页面内的布局，不创建新路由，不锁定设备方向。首页竖屏保留 `VerticalRecordBrowser`，收藏页竖屏使用所选收藏主题的陈列。

## 两种模式

| 模式 | 布局 | 操作与用途 |
| --- | --- | --- |
| 封面矩阵墙 / Gallery Grid | 自适应高密度网格，可滚动、封面懒加载 | 点击选中；通过详情入口打开档案，适合筛选和快速浏览 |
| 唱片长廊 / Spine Carousel | 中央唱片突出，两侧横向展开，最多挂载 7 张不同唱片 | 左右滑动、拖动、方向键、Home/End、前后按钮；点击当前唱片打开档案 |

共享深色底色、少量绿色、轻量控件、底部 icon-only 导航和原有浮动播放器。收藏主题通过 token 和 artwork 插槽提供材质，不决定浏览模式。

## 页面结构草图

```text
页面标题                         搜索 / 更多 / 新增
分类筛选
主题陈列* | 封面矩阵墙 | 唱片长廊
┌───────────────────────────────────────────┐
│ Grid:  □ □ □ □ □     或  Spine:  ▱ ▱ ■ ▱ ▱ │
│        □ □ □ □ □                          │
└───────────────────────────────────────────┘
选中专辑信息 / 详情入口（主题陈列由卡片提供）
底部图标导航                        浮动播放器
```

`*` 收藏页额外提供「主题陈列」，使用主题的默认布局。

## 组件和状态

- `AlbumBrowser` 只挂载当前布局；`BrowseModeSwitch` 提供明确切换入口。
- `GalleryGrid`、`SpineCarousel` 和 `AlbumSelectionBar` 共享 albums、selectedAlbumId、onSelectAlbum、onOpenAlbumDetail。
- `useAlbumBrowserState` 在 App 中持有选中专辑 ID，旋转和切换后定位同一唱片。首页模式保存到 `vinyl_landscape_browse_v1`，兼容旧模式值。
- `useCollectionBrowseState` 在 App 中持有收藏搜索、筛选、排序，详情返回与模式切换不丢失这些状态。
- 收藏主题与收藏模式由 `useCollectionTheme` 分别保存，见 [收藏页主题系统](./COLLECTION_THEMES.md)。
- 响应式方向订阅通过 `platformService.viewport`，不在业务页面散落全局窗口监听。

## 响应式与验证

短横屏压缩工具栏并保留可滚动内容区；预留 safe-area、底部导航和播放器空间。触摸、键盘和 prefers-reduced-motion 均受支持。播放状态不属于布局组件。

Web 验证覆盖 375/390/393/430px 竖屏及 667×375、740×320、844×390、1024×768、1440×900 横屏，包含旋转、空收藏、单张收藏、搜索、返回定位和本地音频持续播放。浏览器结果不代表 Capacitor iOS/Android 真机验证。
