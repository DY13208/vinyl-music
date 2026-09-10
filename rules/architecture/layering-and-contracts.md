# 分层、依赖与契约

## 目标分层

```text
frontend/src/                 React 19 应用、页面、features、共享 UI 与 API client
frontend/src/components/common/ 跨页面、跨 feature 的稳定公用 UI 组件
backend/src/components/common/ 领域无关的后端公用组件与适配能力
backend/src/interfaces/      HTTP 路由、Handler、中间件和协议映射
backend/src/application/     Use Case、命令/查询编排和事务入口
backend/src/domain/          领域实体、值对象、规则和端口接口
backend/src/infrastructure/  PostgreSQL、模型供应商、对象存储等适配器
backend/migrations/          PostgreSQL 18 迁移
```

目标目录尚未落地时，按上述职责归属组织新增代码；目录落地后同步更新本文件中的实际路径，不因临时目录改变依赖方向。

## 依赖方向

- `interfaces` 只解析协议、调用应用用例并映射响应；业务判断、事务细节和 SQL 不放在 Handler。
- `application` 编排一次用例的权限、事务、领域操作和外部端口，不包含 HTTP 对象或具体 ORM 查询。
- `domain` 只表达音乐目录、收藏、愿望清单、播放记录、生成任务等领域规则，不依赖 React、Web 框架、ORM、PostgreSQL 驱动或模型供应商 SDK。
- `infrastructure` 实现 Repository 和外部端口；领域与应用层只依赖接口，不向上泄漏数据库行、ORM Entity 或供应商响应类型。
- 前端只依赖版本化 API 契约。共享 TypeScript 类型若由 schema 生成，应以契约为源；禁止前后端各维护一份同名但语义不同的手写类型。

## 契约边界

- HTTP DTO、领域对象、数据库记录和模型输出是四种不同类型，必须通过显式 mapper 转换。
- API 版本、字段可选性、空值语义、时间格式、分页和错误码必须在契约中明确；前端不得推断数据库默认值。
- 写接口只接收完成用例所需字段，服务端从认证上下文取得用户身份与权限范围；客户端传入的 `userId`、角色或所有权声明不能替代鉴权事实。
- 外部系统调用经命名 adapter 封装，并统一处理超时、重试、限流、错误映射和可观测字段。
- 公用组件先复用后新增：先查对应公用目录与 feature 实现；无现成实现且需求形成稳定跨模块边界时，才抽取并存入对应公用目录。
