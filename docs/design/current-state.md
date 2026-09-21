# 当前实现与差距

基线：分支 `jianhua`，提交 `9d11492`；本次设计开始时工作区干净。以下以当前源码和本次实际命令为依据。

## 前端

实际入口是根目录 [src/main.tsx](../../src/main.tsx) → [src/App.tsx](../../src/App.tsx)，不是 `frontend/src`。后者目前只有公用组件 README。

| 能力 | 已实现事实 | 差距与设计动作 |
| --- | --- | --- |
| 页面导航 | `App.tsx` 用 `currentScreen` 和 `activeTab` 切换 13 个 ScreenId | 没有 URL 路由、刷新恢复、深链；迁移到 React Router |
| 首页 | `HomeView → VinylShelfHero → VinylCarouselItem → AlbumSleeve + VinylDisc` | 数据来自本地 albums；对接目录投影，补加载/空/失败 |
| 收藏柜 | `CollectionView → ThreeUIVinylShelf`，分类、搜索、排序和每页 6 张 | 客户端过滤全量数组；增加服务端分页和 DOM 无障碍/低性能替代视图 |
| 发现 | `DiscoverView` 与 `EDITORIAL_STORIES` 静态策展 | 选刊只改 state，文章卡片无详情入口；内容有错配风险 |
| 搜索 | `SearchView` 对 albums、ARTISTS、tracks 进行 includes 查询 | 搜索只覆盖本地数据；新增后端分组搜索、取消旧请求 |
| 收藏、喜欢、愿望单 | `albums` 存 localStorage；favorites/wishlist 存 React state | 三个概念混杂且后两者刷新丢失；拆成独立用户关系 |
| 导入 | `ImportVinylModal.tsx` 含手工、预设、条码、JSON 与 FileReader 逻辑 | **当前 App 未导入或渲染此组件**；CRUD handler 也未接入口。不能称用户已能导入 |
| 播放 | `App.tsx` 计时器推进进度；`audioEngine.ts` 合成噪声、和弦、落针与反馈音 | 没有真实歌曲 URL、媒体授权、HTMLAudioElement 播放闭环 |
| 歌词 | `lyricsData.ts` 静态数据与 `LyricsView` | 不证明歌词来源或授权；需要可用性和来源状态 |
| 我的 | 固定身份、收藏数、缓存数等文案 | 最近播放跳收藏；播放列表、下载、统计存在空 action |
| 设置 | 页面局部开关；清缓存只把字符串改成 `0 KB` | 未控制真实缓存与播放器设置；只开放真正生效的设置 |
| 设计总览 | `DesignBoardView` 为页面介绍/预览，文案称 14 张 | `ScreenId` 实际为 13 个，不等同于 14 个完整业务页面或 Pen 文件 |

## 后端与基础设施

- `backend/src/components/common/README.md` 仅是规则说明。不存在 HTTP server、业务用例、Repository、Worker 或迁移。
- 根 `package.json` 有 Express 4、`@google/genai` 和 `dotenv` 依赖；依赖存在不能证明后端或 AI 已接通。
- 无项目 API client、真实业务请求、PostgreSQL/Redis/RabbitMQ 配置和服务端身份校验。
- 根 TypeScript 为 `~5.8.2`；TS6 是用户指定目标，升级待实施。
- `docs/design` 与 `docs/design/frontend` 在任务开始时均为空目录。

## 保留的视觉事实

- 主背景 `#000000`；卡片 `#0F0F0F`；边框 `#26272D`；主操作绿 `#2FE92B`；次级文字 `#BBCBB2`；愿望单橙 `#FF9821`。
- 首页是暗室、木质台面、唱片封套与抽出黑胶的实体关系；收藏柜使用暗木纹层架与封面。
- 收藏标题使用宋体，正文使用系统无衬线，转速与时间偏向等宽；底部是首页/收藏/发现/我的四项导航。
- 现有本地背景素材位于 [public/assets/vinyl](../../public/assets/vinyl)；远程封面为 demo 图片，不升级为已授权唱片目录封面。
- 本次 Chrome 截图保存在 [前端参考目录](./frontend/references/)。截图证明布局和可见状态，不能证明持久化或真实音乐播放。

## 当前验证

| 命令/观察 | 实际结果 | 覆盖范围 |
| --- | --- | --- |
| `npm run lint` | 退出 0，实际执行 `tsc --noEmit` | 当前 TS5.8 前端类型；不是完整 ESLint |
| `npm run build` | 退出 0；Vite 6.4.3；2104 modules | 当前 demo 打包 |
| Chrome：主页→收藏→发现→播放器 | 页面可见，截图已保存 | 页面渲染与上述入口；不是业务 E2E |
| `npm view typescript@6 version` | 6.0.2、6.0.3 可用 | 注册表版本可用性，未证明新工程编译 |

本次未把现有代码问题顺手修复。`ImportVinylModal.tsx` 926 行、`PlayerView.tsx` 623 行，均超过项目 550 行限制：未来修改它们时先按 feature 职责拆分，计划不得继续向文件堆积逻辑。
