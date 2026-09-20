# 移动端 UI 长期规范

## 设计基线

产品默认按手机 App 设计，即使当前在桌面浏览器开发。采用 mobile-first，重点验证 375、390、393、430px 宽度，同时覆盖更窄/更宽窗口与横屏；不得针对单台手机写死尺寸。

架构优化默认保持当前黑胶视觉、布局语言和交互效果，不以跨端为名重新设计。

## 布局与安全区

- 根视图使用动态 viewport，并为不支持 `dvh` 的环境提供回退；避免固定高度导致地址栏或软键盘遮挡。
- 顶部栏、Bottom Sheet、Mini Player、Bottom Navigation、全屏 Modal/Player 统一处理 safe-area。
- iPhone Home Indicator 上方必须留出可操作空间，安全区应与组件自身 padding 相加而不是互相覆盖。
- 弹层在横屏、小高度和软键盘打开时必须可滚动，关闭动作始终可达。

## 交互

- 核心操作使用语义化 button/input/link，支持 touch、Pointer Events 和键盘。
- 最小点击区域建议 44×44 CSS px；相邻高频按钮保留足够间距。
- 不依赖 hover 显示唯一信息或操作；hover 仅在 `(hover: hover)` 设备增强。
- 拖动、滑动必须处理滚动竞争、pointer cancel，并提供非拖动替代方式。
- Bottom Sheet 用于移动端上下文操作；Modal 用于必须聚焦完成的任务。焦点管理、Escape/返回键、背景交互锁定和屏幕阅读器语义必须明确。

## 核心组件

- **Mini Player**：不遮挡内容和 Bottom Navigation；播放状态来自 store；进入全屏播放器的区域与播放按钮事件分离。
- **Bottom Navigation**：固定主要目的地，处理 Home Indicator 与键盘场景，不把临时页面伪装为主 tab。
- **Bottom Sheet**：高度按内容和 viewport 约束，支持安全区、滚动和关闭手势降级。
- **Modal**：移动端优先全屏或底部呈现；桌面可渐进增强，但业务流程保持一致。
- **横竖屏**：不能仅靠隐藏溢出维持布局；播放器和黑胶舞台需定义小高度布局。

## 动效与可访问性

- 尊重 `prefers-reduced-motion`；重要状态变化不能只靠动画表达。
- 动画优先 transform/opacity，避免频繁布局；离屏、后台或不可见时暂停持续动画。
- 保持文本对比度、可见焦点、语义标签和动态状态播报；触摸支持不能以移除键盘支持为代价。

## Three.js / 黑胶视觉

Three.js 和现有黑胶视觉可以继续使用，但必须遵守：

- React/store 是业务状态来源，Three.js 只渲染状态并发出用户意图。
- 页面不可见、App 后台或场景离屏时降低帧率或停止渲染，恢复时按当前状态重建。
- 根据设备性能限制 pixel ratio、阴影、后处理、纹理尺寸和同时存在的场景数量。
- 控制 draw call、geometry/material 数量与纹理/GPU 内存；及时 dispose 不再使用的资源。
- 避免无意义的永久动画；静止画面不应持续占用移动 GPU。
- 视觉降级不得阻断收藏、导航和播放等核心业务操作。

## 验收

UI 变更至少检查 375/390/393/430px、横屏、小高度、触摸模拟、键盘焦点、reduced motion 和 safe-area。进入原生阶段后，以 iPhone 与 Android 真机结果为准，桌面响应式预览不能替代 WebView/真机验收。

