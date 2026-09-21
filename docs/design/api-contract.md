# 前后端接口契约

状态：**仅设计**。机器可读契约入口为 [contracts/openapi.yaml](./contracts/openapi.yaml)。本次做契约结构、样例与类型生成验证；真实HTTP、账号隔离和依赖故障联调在实施阶段完成。

## 统一协议

- 基址 `/api/v1`；JSON UTF-8；单资源直接返回具名 DTO，列表返回 `{items,nextCursor}`。204无body，前端不得无条件 `.json()`。
- 所有请求/响应携带 `X-Request-Id`；客户端可生成UUID，服务端校验长度/字符或重建。错误body包含相同requestId。
- `Idempotency-Key`：UUID，收藏创建、私人档案创建、愿望新增、导入受理/提交必填；作用域为认证用户+route+key，保存24小时。超时重试使用原key、原body。
- 同key不同规范化body返回409 `IDEMPOTENCY_KEY_REUSED`；PG唯一约束串行化并发同key，返回第一次已提交状态/body。写入和幂等记录同一事务；失败回滚不占用成功结果。
- 注册由规范化账号唯一约束防重复，不缓存密码请求或登录结果。响应丢失可尝试登录；账号已存在时明确409，不用新账号规避不确定结果。
- 具version的资源GET/PATCH/POST返回 `ETag: "v{version}"`。PATCH和存在资源的DELETE须 `If-Match`；缺失428、过期412；当前值回读后再编辑。DELETE已不存在时204。
- PATCH严格白名单：缺失=保持；nullable字段null=清空；空串不是null；至少提供一个字段。禁止任何body指定userId、owner、reviewStatus、passwordHash。
- 时间UTC ISO8601；价格整数分+currency；时长毫秒；ID UUID。UI显示的“180g”“33⅓RPM”“4:20”都由数值/枚举格式化。
- `additionalProperties:false` 拒绝未知写字段。OpenAPI可表达的限制均由schema执行；跨字段/所有权/数据库约束由用例执行。不能靠 TS `as` 代替校验。

## Cookie 与跨端连通

开发：浏览器访问 `http://127.0.0.1:3000`；Vite `/api` → `http://127.0.0.1:4000`，不 rewrite 掉 `/api/v1`。`fetch` 使用 `credentials:'include'`，base URL只设 `/api/v1`。统一使用127.0.0.1，避免localhost与IP混用导致Cookie差异。

生产：浏览器与API同源HTTPS，Cookie配置见总体方案。若后续必须跨域，单独列 allowlist、credentials和预检headers，禁止 `* + credentials`。

注册/登录也校验Origin。已认证写请求额外发送 `X-CSRF-Token`，来自session查询并仅保存在内存。前端遇401只跳登录一次并保留安全的本地returnTo路径；503不当作退出。returnTo只允许本站路由，不接受外部跳转URL。

## 端点与页面映射

路径均相对 `/api/v1`。更精确的schema、query、状态码、必填headers以OpenAPI为准。

| 页面/行为 | 方法与路径 | 成功返回/持久化 |
| --- | --- | --- |
| 注册 | POST `/auth/register` | 201 User，不自动创建会话 |
| 登录 | POST `/auth/login` | 200 Session + Set-Cookie |
| 恢复身份 | GET `/auth/session` | 200 Session；未登录401 |
| 退出 | POST `/auth/logout` | 204 + Cookie过期 |
| 改密码 | PUT `/auth/password` | 204；撤销所有旧sessionVersion |
| 我的 | GET `/me` | Profile：用户+实际收藏/喜欢/愿望数量 |
| 首页/目录 | GET `/releases`、`/genres` | ReleasePage与分类名列表，已审核公共目录或明确开发fixture；支持albumId/artistId筛选 |
| 作品/发行版 | GET `/albums/{albumId}`、`/releases/{releaseId}` | AlbumDetail、ReleaseDetail，明确版次和曲目 |
| 艺术家 | GET `/artists/{artistId}` | ArtistDetail，只含已知事实 |
| 搜索 | GET `/search?q=&type=releases\|artists\|tracks` | 按类型独立游标；页面顺序Album First |
| 策展 | GET `/editorial/issues`、`/editorial/issues/{issueId}` | IssuePage/IssueDetail；内容明确关联releaseId |
| 条码 | GET `/catalog/barcodes/{barcode}` | 候选Release数组；条码不是唯一键 |
| 收藏列表 | GET `/me/collection` | 私有CollectionPage，筛选/排序在服务端 |
| 目录/私人档案入藏 | POST `/me/collection` `{releaseId,...}`或`{recordId,...}` | 两种目标恰好一个；201 Entry；已存在返回200规范Entry，UI不重复加数量 |
| 读取/修改/移除收藏 | GET/PATCH/DELETE `/me/collection/{entryId}` | 200 Entry / 204；仅改变关系，不删除目录 |
| 手工录入 | POST `/me/records` | 201 `{record,collectionEntry}`，同事务私人档案+入藏 |
| 私人档案 | GET/PATCH `/me/records/{recordId}` | PrivateRecord；仅owner可访问 |
| 喜欢 | GET `/me/favorites`；PUT/DELETE `/me/favorites/{releaseId}` | list /204；PUT/DELETE设定状态，不用toggle接口 |
| 愿望单 | GET/POST `/me/wishlist` | list /201或已存在200 |
| 读取/修改/移除愿望 | GET/PATCH/DELETE `/me/wishlist/{entryId}` | 200/204；目标价与币种成对 |
| 导入受理/列表 | POST/GET `/me/imports` | 202 ImportJob / ImportPage |
| 导入预览/状态 | GET `/me/imports/{jobId}` | ImportJob + items，最多200行 |
| 确认导入 | POST `/me/imports/{jobId}/commit` | 202；If-Match保护预览版本 |
| 音乐来源 | GET `/music/providers` | ProviderList；首版全部not_configured |
| 播放解析 | GET `/tracks/{trackId}/playback?providerId=` | 判别联合PlaybackAvailability |
| 歌词可用性 | GET `/tracks/{trackId}/lyrics?providerId=` | LyricsAvailability；首版unavailable |
| 健康 | GET `/health/live`、`/health/ready` | Health；ready依赖失败503 |

现有静态长文只有标题摘要，没有真实正文；首版策展接口提供有来源的issue/唱片关联，未准备好的长文不显示可点击文章入口。后续正式文章需要独立内容契约，不能点标题跳到无关唱片。

## 列表/搜索

默认limit20、最大50；导入详情因明确200条上限可一次返回。收藏sort为recent/artist/year；筛选q、genre、sort都进入queryKey与游标摘要。服务端排序allowlist拒绝未知字段。

游标是不透明base64url编码的 `{v,resource,scope,sort,lastSortValue,lastId,filterHash}` 加HMAC签名；包含用户范围（私有列表），错误或跨筛选复用返回400 `INVALID_CURSOR`。不可把游标作为授权；查询仍以会话userId约束。收藏筛选变化时清空cursor链，手机柜每层4张/宽柜6张只是已载入结果的视图切片。

公共目录默认createdAt/id倒序，favorites/wishlist/imports按创建时间/id倒序；作品和艺人详情内首批发行版的后续cursor发往 `/releases?albumId=` 或 `?artistId=`，保持同一过滤条件。收藏可按releaseId或recordId精确过滤；喜欢/愿望可按releaseId过滤，用于详情按钮状态。两个目标筛选同时出现返回400，不能省略用户范围。

搜索不采用一个混合排序数组：同一个q分别请求release/artist/track结果，独立“更多”。每次query变更取消旧请求，只有当前queryKey的数据能呈现。空query显示本地静态分类，不能假称热门统计。

## DTO 的最小示例

```json
{
  "id": "019f0000-0000-7000-8000-000000000001",
  "releaseId": "019f0000-0000-7000-8000-000000000101",
  "recordId": null,
  "title": "Abbey Road",
  "artistName": "The Beatles",
  "coverUrl": null,
  "condition": "NM",
  "purchasePrice": {"amountMinor": 32000, "currency": "CNY"},
  "notes": "",
  "acquiredOn": null,
  "version": 1,
  "createdAt": "2026-09-10T06:00:00Z",
  "updatedAt": "2026-09-10T06:00:00Z"
}
```

收藏列表返回显示所需字段，详情再取档案；喜欢状态和收藏状态从独立用户关系获取，不继续使用目录中的 `isCollected/isWishlist`。

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请检查输入内容",
    "requestId": "019f0000-0000-7000-8000-000000000201",
    "fields": [{"path": "purchasePrice.amountMinor", "message": "必须是非负整数"}]
  }
}
```

400=格式/schema，401=登录失效，403=CSRF/Origin，404=不存在或不可见，409=唯一性/幂等冲突，412=版本过期，413=体积超限，422=业务字段组合错误，428=缺少If-Match，429=限流，503=依赖不可用。5xx不显示原始供应商错误、SQL或堆栈。

## 保证契约不漂移的实施链

1. 当前契约迁入 `packages/contracts`，原设计路径改为链接；不维护两套源。
2. 由同一OpenAPI生成 `frontend/src/lib/api/generated.d.ts`，并生成Ajv request/response validators供API与前端共享（不共享数据库Entity）。
   生成器指定 `--default-non-nullable false`，避免schema里可省略但有默认值的rpm/vinylVariant被误生成为必填。Ajv不启用隐式coerce/default填充，默认值由用例显式规范化。
3. Express route manifest逐条关联operationId与handler；CI比较实际已挂载方法/路径与契约，缺失/多余均失败。
4. 所有HTTP边界验证body/path/query/header；query先按schema做明确转换，拒绝重复标量query，避免string/number真假不一致。
5. API响应在测试环境全部过schema验证；生产可按风险保留响应断言，禁止自动静默删除字段掩盖错误。
6. 生成结果差异检查+前后端TS6 typecheck；HTTP契约用Supertest；状态持久化用PG18；最终浏览器操作后独立GET回读及不同账号隔离。

浏览器可点击、类型生成通过与OpenAPI结构有效，各自只能证明对应层。只有上述HTTP→用例→PG→回读链路通过，才能宣布“前后端接口正常”。
