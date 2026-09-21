# 组件与设计变量

状态：**Pen可复用组件已设计，React组件迁移/接入待实现**。公用入口固定 `frontend/src/components/common/`；黑胶展示只进入 `components/vinyl/`，业务用例在feature层。

## 视觉变量

| token | 值 | 用途 |
| --- | --- | --- |
| bg / surface / raised | `#000000 / #0F0F0F / #1B1B1D` | 页面、容器、输入/禁用面 |
| border | `#26272D` | 轻分隔与输入框 |
| text / secondary / muted | `#FFFFFF / #BBCBB2 / #A5A0A0` | 主、次、辅助文字 |
| primary / orange / danger | `#2FE92B / #FF9821 / #FF8585` | 主操作、目标价、错误 |
| body | Noto Sans SC，系统无衬线回退 | 中文正文与表单 |
| display | Noto Serif SC，中文衬线回退 | 标语/编辑内容标题 |
| utility | IBM Plex Mono，monospace | 计数、时间、刊号 |
| 间距 | 4 / 8 / 12 / 16 / 24 / 32 | 对齐与节奏 |
| 圆角 | 控件6，容器8，标签/图标圆形 | 保持当前克制的深色界面 |

以Pen的SetVariables和[组件板](./exports/d8ZuRd.png)为视觉依据。字体子集只覆盖当前设计用字，正式站点使用完整授权字体/系统回退；不能把子集用于任意用户名称显示。

## Pen组件到React契约

props为设计中的最小公共接口，具体类型引用生成DTO或UI专用类型；不把网络请求藏进基础组件。

| ID / 名称 | React位置与主要props | 调用者 | 状态与无障碍 |
| --- | --- | --- | --- |
| C01 Button | `common/Button.tsx`；variant、pending、disabled、type、onClick、children | 所有表单/操作 | primary/secondary/disabled/pending；原生button，pending阻止重复提交，保持宽度 |
| C02 IconButton | `common/IconButton.tsx`；icon、label、pressed、disabled、onClick | Header、唱机、收藏操作 | 44×44；必填label；toggle用aria-pressed；明确焦点边框 |
| C03 FormField | `common/FormField.tsx`；id、label、hint、error、required、children | auth、records、wishlist | label关联input；错误aria-describedby/aria-invalid；不以内联placeholder代替label |
| C04 FilterChip | `common/FilterChip.tsx`；value、selected、onSelect、children | collection/search | 选中/未选中/禁用；单选组有radiogroup语义 |
| C05 SourceBadge | `common/SourceBadge.tsx`；sourceKind、reviewStatus、label | catalog/private/editorial | fixture/provider/user；未审核始终有文字；颜色不承载唯一信息 |
| C06 AlbumRow | `features/catalog/components/AlbumRow.tsx`；item、trailing、onOpen | 搜索、艺人、愿望、导入 | loading/封面失败/无cover；整行一个主链接，附加操作独立按钮 |
| C07 AsyncState | `common/AsyncState.tsx`；kind、title、description、action、busy | 所有远程页面 | loading/empty/error/unavailable；只在恰当状态aria-live，不循环抢焦点 |
| C08 ProviderStatus | `features/player/components/ProviderStatus.tsx`；provider、onOpen | settings/player | not_configured/ready/unavailable；未接入无假连接按钮 |
| C09 BottomNav | `app/BottomNav.tsx`；activeRoute、items | AppShell | 首页/收藏/发现/我的；NavLink/aria-current；留safe area |
| C10 MiniPlayer | `features/player/components/MiniPlayer.tsx`；track、playbackState、onOpen、onToggle | AppShell | 无音源/加载/播放/暂停；不维护第二套进度或音频实例 |

C06/C08/C09/C10因依赖业务语义或路由不强行纳入common。Pen里可复用与React公用目录是两种边界，不据此制造一个万能组件。

## 现有展示组件复用

| 现有实现 | 目标处理 | 数据边界 |
| --- | --- | --- |
| AlbumSleeve、VinylDisc、VinylCarouselItem | 保留构型/材质，迁入vinyl目录并按新VM适配props | 只收封面、标题、唱片材质；不读localStorage |
| VinylShelfHero、ThreeUIVinylShelf | 保留暗室/木柜/手势，增加列表回退与外部选中ID | feature给items、onSelect、onLoadMore；不持有收藏事实 |
| PlayerView、唱机部件 | 拆为Turntable、Transport、TrackInfo、PlayerScreen | controller统一音频状态，转动由实际playing派生 |
| ImportVinylModal | 拆ImportEntry、RecordForm、ImportReview、ImportJobStatus | 原926行结构不继续堆叠；条码/录入/导入各自用例 |
| FilterModal、SettingsView | 复用可用结构，补受控表单和真实动作 | 筛选保留URL；设置区分可丢失偏好和服务端动作 |

## 组合组件与事件归属

- `PageHeader`组合C02与标题，管理返回入口，不推断“上一页”固定是首页。
- `ConfirmDialog/Sheet`采用成熟可访问的dialog实现（优先评估Radix Dialog）；焦点、Escape、滚动锁共用一套实现。用于退出、移除和脏表单离开，不重复手写三个modal。
- `RecordForm`由C03组合；`MoneyField`统一十进制金额转换；`ConditionSelect`统一品相枚举显示；私人记录与导入预览共用schema错误映射。
- `MutationFeedback`统一pending/保存失败/结果未知提示；success只来自后端确认。aria-live用polite，严重表单错误才alert。
- 导入任务、愿望价编辑和收藏编辑属于各自feature；基础按钮不能自行清缓存、调用API或显示成功Toast。

## 组件验收

画板已有默认、选中、禁用、pending、空、错误与未接入的视觉样本。实现阶段在组件开发页验证键盘顺序、焦点、长标题、空封面、窄屏、中文/英文、慢请求和减少动态效果。仅视觉导出不能证明这些运行行为已通过。
