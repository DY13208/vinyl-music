# Vinyl Search Service

查询接口保持不变：

- `GET /api/releases/search?q=歌手 - 专辑`
- `GET /api/releases/search?artist=歌手&album=专辑&year=年份`
- `GET /api/releases/barcode/:barcode`

服务会合并多个来源，而不是命中一个来源后立即停止。华语查询由 `ChineseMusicProvider` 统一调用 `@meting/core`，在单次查询内并发访问 `netease`、`tencent`、`kugou` 和 `kuwo`，并按 `artist + album` 去重。Meting 只负责专辑身份、封面和曲目元数据；Discogs、MusicBrainz、Cover Art Archive 和 Deezer 仍分别负责实体发行版、封面补全和兜底资料。

每个平台的真实命中数、封面数、耗时和错误会放在 `providers[].details` 中。`401`、`403`、`404`、`429`、timeout 和平台返回的业务错误会分别记录，单个平台失败不会阻断其他来源。

## 当前来源

| 来源 | 作用 | 配置 |
|---|---|---|
| Meting / netease | 华语专辑识别 | 无项目内 Token |
| Meting / tencent | 华语专辑识别 | 无项目内 Token |
| Meting / kugou | 华语专辑识别 | 无项目内 Token |
| Meting / kuwo | 华语专辑识别 | 由平台响应决定可用性 |
| Apple Music CN | 官方专辑元数据 | `APPLE_MUSIC_DEVELOPER_TOKEN` |
| Discogs | Vinyl release、条码、版本和压片信息 | 后端 `DISCOGS_TOKEN`（可选） |
| MusicBrainz | release 实体和版本匹配 | 无 Key；遵守 1 req/s |
| Cover Art Archive | MusicBrainz 发行版封面 | 无 Key |
| Deezer | 专辑元数据兜底 | 无 Key |

Meting 仅用于元数据搜索，不用于播放 URL，也不替代 Discogs / MusicBrainz。项目没有直接调用 `u.y.qq.com`、`musicu.fcg`、NeteaseCloudMusicApi 或其他私有逆向接口。
