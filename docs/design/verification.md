# 本次设计交付验证记录

日期：2026-09-10。源码基线为 `jianhua / 9d11492`；改动限定 `docs/design/`。本轮交付的是前后端实施方案、机器可读契约、Docker配置样例和Pen设计；业务后端、数据库迁移与前端API接入仍待实现。

## 需求到证据

| 要求 | 交付位置 | 实际验证与结果 |
| --- | --- | --- |
| 依据已有demo出方案 | [current-state](./current-state.md)、[architecture](./architecture.md) | 核对App/各View/服务/数据；明确真实入口、模拟播放及未挂载导入 |
| 后端TS6 | [总体技术决策](./architecture.md)、[实施步骤](./implementation-plan.md) | 6.0.3注册表存在；生成DTO及消费样例用TS6.0.3 strict编译退出0。未创建后端工程 |
| PG18、Redis7、RabbitMQ容器 | [Compose](./examples/compose.infra.yaml)、[Docker说明](./infrastructure.md) | `docker compose ... config --quiet`退出0；三个镜像主版本/端口/卷已核对。未启动本方案容器 |
| 前后端契约能对齐 | [OpenAPI](./contracts/openapi.yaml)、[接口说明](./api-contract.md) | 31路径/40操作/55schema；Redocly lint无错误无警告、bundle成功；283边界schema编译；33正反样例全部符合预期 |
| 正式账号密码 | [账号设计](./architecture.md)、auth契约、P09/P10/P11 | Argon2id经用户确认；方案和字段/页面已对齐。密码哈希、会话/CSRF运行尚未验证 |
| 各音乐平台先留接口 | [平台适配](./platform-adapters.md)、media契约、P04/P11/P14 | 5个provider ID；不可用响应判别样例通过；无真实平台调用或播放验收 |
| Pen沿用现有风格并含组件 | [前端入口](./frontend/index.md)、[Pen文件](./frontend/vinyl-ui-ux.pen) | 19顶层画板=18页面/状态+组件板；10reusable、85ref；布局问题0；无placeholder；PNG逐页检查 |
| 可执行开发与验收方案 | [BC00–BC08](./implementation-plan.md) | 9步骤均TODO/NOT_RUN/NOT_MET；每步有文件、依赖、目标命令与标准；明确真实E2E门槛 |

## 本次实际运行结果

| 检查 | 实际结果 | 能证明什么 |
| --- | --- | --- |
| 当前demo `npm run lint` | exit0；脚本实际为tsc --noEmit | 旧TS5.8代码类型检查 |
| 当前demo `npm run build` | exit0；Vite6.4.3 / 2104 modules | 旧前端可打包 |
| Chrome打开首页/收藏/发现/唱机 | 可见，参考图已保存 | 已有页面渲染与上述导航 |
| Redocly2.51.2 lint + bundle | exit0，0 warnings | refs可解析、OpenAPI结构有效 |
| Ajv8.20.0 + formats3.0.1 | exit0，33/33；[结果](./contracts/check-result.json) | 请求/响应结构与正反边界样例；不证明SQL/权限执行 |
| openapi-typescript7.13.0生成 | exit0 | 契约可生成前端声明文件 |
| TypeScript6.0.3消费声明 | exit0，strict/NodeNext/ES2023 | 生成类型可被TS6消费，判别状态/请求字段可用 |
| Compose配置解析 | exit0 | 环境插值、卷、端口和健康检查配置结构有效 |
| Pen save + Export + Get | 成功；[布局记录](./frontend/exports/pen-layout-check.json) | 文件真实保存，画板可导出，未发现布局裁切 |
| 图片尺寸与视觉检查 | 18/18，另含组件板 | 当前静态设计，中文可见，主要状态/控件未被遮挡 |
| 文档链接与行数 | 15个Markdown，失效本地链接0；全部文件在行数限制内 | 文档可导航，Markdown≤700行、代码/配置≤550行 |

本次启动用于参考截图的Vite已以SIGINT停止；Pen已save并正常exit0。Pen退出时出现unwatch-file连接关闭警告，发生在保存成功之后，未影响已保存文件及导出图。

本轮发现并修正：私人档案响应复用输入字段导致混入collection、收藏目标互斥定义、歌词联合分支区分、缺少回读和分页路径、生成器把有default的可选字段变必填、Pen中文字体下载超时及菜单/唱片框裁切。

## 重跑设计检查

从仓库根执行。工具装在临时目录，不修改根package/lockfile；生成器用独立TS5工具链，目标类型检查用TS6。下面使用固定版本重现本次结果。

```sh
design_tools_dir=$(mktemp -d /tmp/vinyl-contract-tools.XXXXXX)
design_ts6_dir=$(mktemp -d /tmp/vinyl-ts6-check.XXXXXX)
npm install --prefix "$design_tools_dir" --no-audit --no-fund --ignore-scripts \
  @redocly/cli@2.51.2 yaml@2.9.0 ajv@8.20.0 ajv-formats@3.0.1 \
  openapi-typescript@7.13.0 typescript@5.9.3
npm install --prefix "$design_ts6_dir" --no-audit --no-fund --ignore-scripts typescript@6.0.3
"$design_tools_dir/node_modules/.bin/redocly" lint docs/design/contracts/openapi.yaml
"$design_tools_dir/node_modules/.bin/redocly" bundle docs/design/contracts/openapi.yaml \
  -o "$design_tools_dir/bundle.json"
NODE_PATH="$design_tools_dir/node_modules" node docs/design/contracts/check-contract.cjs \
  "$design_tools_dir/bundle.json"
"$design_tools_dir/node_modules/.bin/openapi-typescript" docs/design/contracts/openapi.yaml \
  --default-non-nullable false -o "$design_ts6_dir/generated.d.ts"
cp docs/design/contracts/type-consumer.ts.example "$design_ts6_dir/contract-consumer.ts"
"$design_ts6_dir/node_modules/.bin/tsc" --ignoreConfig --noEmit --strict \
  --module NodeNext --target ES2023 "$design_ts6_dir/contract-consumer.ts"
docker compose --env-file docs/design/examples/infra.env.example \
  -f docs/design/examples/compose.infra.yaml config --quiet
```

TS6对“当前目录有tsconfig但命令直接指定文件”会报TS5112；独立消费探针显式使用 `--ignoreConfig`，实际后端项目仍使用自己的tsconfig。生成器必须用 `--default-non-nullable false`，与API中rpm/vinylVariant可省略的输入语义一致。

契约正反样例覆盖：短密码/越权额外字段、两类入藏目标互斥、金额整数/币种/日期、空PATCH、私人字段/输入分离、搜索类型错配、音源/歌词不可用、导入选择重复/越界。owner真实校验、数据库唯一约束、CSRF、幂等事务和MQ故障需BC阶段补运行测试。

Pen继续编辑与导出命令见[Pen说明](./frontend/pen-workflow.md)。PNG总览可用有Pillow的Python运行 `docs/design/frontend/pen/make-overview.py` 重建，不读取.pen内容。

## 尚未运行的业务验收

没有本项目API服务、业务表、Migration或Worker，因此当前不能宣布“前后端接口已联调正常”。没有验证真实登录、收藏持久化、并发冲突、账号隔离、Outbox重投、故障恢复或真实歌曲播放；这些都在BC03–BC08和E01–E10标为NOT_RUN。

交付不包含部署、Git提交或推送。现有业务源码与依赖保持基线，本次没有清理用户数据、删除文件或删除Docker卷。
