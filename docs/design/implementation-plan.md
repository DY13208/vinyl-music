# 实施顺序与联调验收

状态：**全部待实现**。本轮已完成方案与设计产物，不把现有demo的build通过记为任一业务步骤完成。稳定步骤ID供后续逐项推进。

## 依赖与范围

`BC00 → BC01 → BC02 → BC03 → BC04 → BC05 → BC06 → BC07 → BC08`。可以先制作视觉组件，但账号数据接入须等待鉴权和契约。当前不创建分支、不移动源码、不提交或推送。

| 步骤 | 依赖 | 具体产物与目标路径 | 必须达到的结果 | 当前状态 |
| --- | --- | --- | --- | --- |
| BC00 工程与版本探针 | 无 | frontend/backend/package、TS6配置、Node固定版本、独立契约生成工具 | 保留原页面构建；后端TS6.0.3编译；Express5/pg/argon2/redis/amqplib最小兼容探针；生成DTO可被TS6消费 | TODO / NOT_RUN / NOT_MET |
| BC01 容器与开发连通 | BC00 | infra/compose、环境schema、Vite代理、backend健康端点 | PG18/Redis7/Rabbit健康，记录实际补丁/digest；Vite同源GET API，ready检查依赖 | TODO / NOT_RUN / NOT_MET |
| BC02 PG模型与契约 | BC01 | backend/migrations/001–005、DTO mapper、packages/contracts | 空库前滚成功；目标唯一/FK/CHECK约束确实拒绝坏数据；OpenAPI类型和运行时schema生成一致 | TODO / NOT_RUN / NOT_MET |
| BC03 正式账号 | BC02 | auth use cases、Argon2 adapter、Redis session/CSRF、frontend/auth | 注册→登录→刷新会话→改密→旧会话失效→退出；密码不明文、无MD5；A/B账号隔离 | TODO / NOT_RUN / NOT_MET |
| BC04 公共目录与视觉迁移 | BC03 | catalog/search/editorial、页面router、vinyl/common组件 | 首页/搜索/详情/艺人/发现都从API取数据；真实路由刷新恢复；fixture始终带来源标识 | TODO / NOT_RUN / NOT_MET |
| BC05 用户收藏闭环 | BC04 | collection/favorites/wishlist/records feature与用例 | 入藏/私人录入/编辑/喜欢/愿望/移除，刷新和重登后回读一致；ETag/幂等/权限并发验证 | TODO / NOT_RUN / NOT_MET |
| BC06 导入与MQ恢复 | BC05 | imports、OutboxRelay、Worker、任务页面、旧localStorage预览 | prepare不入藏；确认后异步写；重投/崩溃/过期租约/响应丢失不重复；统计和逐行结果一致 | TODO / NOT_RUN / NOT_MET |
| BC07 平台端口与播放器 | BC04 | provider registry、UnavailableProvider、PlayerController | 五个平台预留统一端口；capabilities=false；无音源真实禁用且不推进时间；音效与音乐状态分开 | TODO / NOT_RUN / NOT_MET |
| BC08 整体联调交付 | BC06、BC07 | HTTP/DB/worker证据、浏览器操作记录、接口覆盖报告 | 页面→HTTP→事务→独立GET回读→重登一致；账号隔离；所有首版入口可达；下列验收矩阵全过 | TODO / NOT_RUN / NOT_MET |

总数9，TODO=9，已达标=0。每步实施后记录文件、命令、退出码、实际输出、通过标准、遗留限制与更新时间；证据不通过就保留NOT_MET。下一步只开始BC00。

## 每步应建立的运行命令

以下命令是实施阶段需要创建的脚本接口，**当前仓库尚不存在这些workspace与脚本，不能直接宣称已运行**。本轮已可运行的设计检查在[验证记录](./verification.md)。

| 建立于 | 目标命令（仓库根执行） | 验证层 |
| --- | --- | --- |
| BC00 | `npm run typecheck --workspaces --if-present`、`npm run build --workspace backend` | TS6与应用构建 |
| BC01 | `npm run infra:up`、`npm run infra:check` | 容器版本/健康/连接 |
| BC02 | `npm run db:migrate --workspace backend`、`npm run test:db --workspace backend` | 实际PG约束、迁移版本 |
| BC02 | `npm run contracts:check`、`npm run contracts:generate` | OpenAPI、类型生成无diff、Ajv样例 |
| BC03 | `npm run test:auth --workspace backend` | 注册/会话/改密/CSRF/限流 |
| BC04–05 | `npm run test:contract --workspace backend`、`npm run test:library --workspace backend` | 挂载路由与契约一一对应、HTTP和PG |
| BC06 | `npm run test:imports --workspace backend` | MQ、Outbox、租约和恢复 |
| BC07 | `npm run test:providers --workspace backend` | 预留能力与不可用判别联合 |
| BC08 | `npm run dev` 后Chrome逐项验收 | 真正同源Cookie与页面状态闭环 |

契约生成器当前 `openapi-typescript 7.13.0` 的peer约束是TS5。将其与TS5.9.3置于独立 `tools/contracts` 工具工程并锁版本，输出纯声明文件给TS6应用；不使用 `--force` / `--legacy-peer-deps` 掩盖冲突。后续升级生成器时重新跑本次正反样例和TS6消费检查。

## 必须覆盖的真实验收矩阵

| ID | 操作/故障 | 通过标准 | 当前证据 |
| --- | --- | --- | --- |
| E01 连通 | Chrome经Vite登录并查session | 同源Cookie生效；携CSRF写成功；错误Origin/CSRF拒绝；无CORS绕过 | NOT_RUN |
| E02 账户 | 注册、错误密码、改密、旧会话访问、退出 | Argon2id存储；统一错误；改密撤销旧sessionVersion；密码不进DTO/日志 | NOT_RUN |
| E03 私有隔离 | A拥有收藏/记录/任务，B猜测各ID | B读写404；所有PG查询受owner约束；B缓存不出现A数据 | NOT_RUN |
| E04 用户数据 | 入藏、改备注/品相、喜欢、愿望、移除后刷新和重登 | UI与独立GET及PG行一致；数量真实；移除不删除目录/愿望 | NOT_RUN |
| E05 并发 | 相同key相同body、不同body、两个不同key同时入藏、旧ETag更新 | 一条收藏；同key重放；不同body409；过期412不覆盖 | NOT_RUN |
| E06 私人档案 | 创建带收藏；伪造owner/reviewStatus；另账号recordId入藏 | 同事务创建；非法字段拒绝；复合FK/权限阻止越权 | NOT_RUN |
| E07 导入 | 无效行、重复行、未确认、确认、重复消息、commit后ACK前崩溃 | 预览无写入；终态计数正确；重投无重复；未选行无写入 | NOT_RUN |
| E08 依赖故障 | MQ断开、Redis断开、PG断开、租约超时 | Outbox可恢复；认证写503；PG写全回滚；旧worker不能迟到提交 | NOT_RUN |
| E09 音乐来源 | 五个平台默认状态；选曲/歌词入口 | 全部未配置；无假URL/歌词/音乐进度；统一状态与可用性DTO匹配 | NOT_RUN |
| E10 UI与可达性 | 所有首版按钮、后退/刷新、窄屏、键盘、长内容、减少动画 | 入口真实；输入不丢；焦点可见；长列表可继续分页；WebGL可回退 | NOT_RUN |

E07/E08需用本地隔离容器和测试库，不操作用户已有业务库。只跑特定步骤相关测试；没有新变更/失败不反复全量构建。

## 实施完成口径

“前后端接口正常”必须有实际挂载路由、运行时schema、同源浏览器请求、数据库事务、独立回读与账号隔离证据。OpenAPI lint、图片导出和现有demo build分别只覆盖设计文件、视觉产物和旧工程，不能代替BC08。

真实平台接入不属于首版达标条件；它需要另建有授权音源的后续步骤。首版以“平台接口已预留且未接入状态真实”为条件，不以播放假音频或复制第三方未授权接口补齐验收。
