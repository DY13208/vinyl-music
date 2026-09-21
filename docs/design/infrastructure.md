# 本地 Docker 基础设施方案

状态：**仅设计 + 配置结构校验**。本次提供三个依赖容器的 Compose；没有启动新容器、执行迁移或声称业务服务可用。

## 版本、端口与持久化

| 依赖 | 镜像 | 主机 → 容器 | 数据卷 | 用途 |
| --- | --- | --- | --- | --- |
| PostgreSQL18 | `postgres:18` | `127.0.0.1:15432 → 5432` | `pg18_data:/var/lib/postgresql` | 所有业务事实与Outbox |
| Redis7 | `redis:7` | `127.0.0.1:16379 → 6379` | `redis7_data:/data` | 会话、限流、缓存；AOF/noeviction |
| RabbitMQ4 | `rabbitmq:4-management` | `127.0.0.1:15672 → 5672` | `rabbitmq_data:/var/lib/rabbitmq` | AMQP工作通知 |
| Rabbit管理台 | 同上 | `127.0.0.1:15673 → 15672` | 同上 | 本地排查队列 |

使用非默认主机端口减少与现有开发服务冲突；实施前仍需检查占用。MQ只指定RabbitMQ，4系列是方案选型。标签约束主版本，BC00实际拉取后记录补丁版本和digest，团队再固定digest；当前不虚构镜像digest。

PG18 挂载父目录 `/var/lib/postgresql`，与旧版本常见的 `/var/lib/postgresql/data` 区分。默认 PGDATA 为版本目录 `/var/lib/postgresql/18/docker`，不要把PG17旧数据卷直接挂给18；已有业务数据升级必须另走备份与升级流程。

## 文件与本地启动步骤

- [compose.infra.yaml](./examples/compose.infra.yaml)：三个独立服务、loopback端口、命名卷与健康检查。
- [infra.env.example](./examples/infra.env.example)：依赖容器配置，无真实凭据。
- [backend.env.example](./examples/backend.env.example)：目标API/Worker配置；浏览器不读取这些变量。

以下从仓库根目录执行。配置校验已具备条件；`up` 与版本查询是后续实施命令，本次未执行。

```sh
docker compose --env-file docs/design/examples/infra.env.example \
  -f docs/design/examples/compose.infra.yaml config --quiet
```

实施时复制环境样例到不入Git的本地配置位置，逐项填入随机密码；连接URL中的密码按URI规则编码。不要输出完整解析配置到公共日志。

```sh
docker compose --env-file .env.infra.local \
  -f docs/design/examples/compose.infra.yaml up -d --wait
docker compose --env-file .env.infra.local \
  -f docs/design/examples/compose.infra.yaml ps
docker compose --env-file .env.infra.local \
  -f docs/design/examples/compose.infra.yaml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select version();"'
docker compose --env-file .env.infra.local \
  -f docs/design/examples/compose.infra.yaml exec -T redis \
  sh -c 'REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli INFO server'
docker compose --env-file .env.infra.local \
  -f docs/design/examples/compose.infra.yaml exec -T rabbitmq \
  rabbitmq-diagnostics server_version
```

实际开发实现后再创建 `infra/compose.yaml` 和本地脚本，引用此方案并消除配置副本。`POSTGRES_USER` 是本地引导用户；业务实现需通过迁移流程创建独立 `vinyl_app` 与 `vinyl_migrator`，API不使用超级用户。

## 地址与连通规则

API/Worker开发期跑在主机，使用样例中的127.0.0.1和映射端口。未来若API也容器化，连接地址改为服务名 `postgres:5432`、`redis:6379`、`rabbitmq:5672`；容器内部的127.0.0.1指向自己。

Rabbit的vhost为 `/vinyl`，AMQP URL路径必须是 `/%2Fvinyl`；使用专用用户，避免guest的远程访问限制。exchange/queue/binding由幂等bootstrap创建，细节见[异步任务](./async-and-cache.md)。

Vite代理保留完整路径：`/api → http://127.0.0.1:4000`，不rewrite。浏览器只访问 `/api/v1`，不直连容器或暴露连接串。Cookie、CSRF、错误映射见[接口契约](./api-contract.md)。

## 故障与运维边界

- PG健康检查只证明接受连接；API ready还需验证可访问目标schema/迁移版本。
- Redis健康检查认证后PING；Rabbit ping只证明节点活着，业务ready再检查连接、vhost及所需拓扑。
- Rabbit故障时Outbox仍可受理导入；ready如实503，业务请求按模块降级，不把ready结果当所有请求的统一开关。
- 停止本地服务使用 `docker compose ... stop`。命名卷继续保留；不把删除卷命令写进日常重启脚本。
- 单节点Rabbit、单PG与单Redis不提供高可用。生产部署、备份恢复演练、TLS和机密分发属于后续独立部署工作，本配置不得直接作为生产方案使用。
