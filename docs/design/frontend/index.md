# 前端 UI、UX 与接入方案

状态：**Pen设计文件与导出图已交付；React业务接入待实现**。基于根 `src/` 的真实画面与资产继续设计，保留暗室、木架、实体封套、黑胶和绿色主操作。

## 按动作进入

| 现在要做什么 | 入口 |
| --- | --- |
| 看整体设计效果 | [页面总览](./exports/overview.png)、[现有页面参考](./references/current-overview.png) |
| 在Pen继续编辑 | [vinyl-ui-ux.pen](./vinyl-ui-ux.pen)、[Pen运行与验收](./pen-workflow.md) |
| 开发页面、导航和业务流程 | [页面与交互](./pages-and-flows.md) |
| 开发/复用组件和设计变量 | [组件规范](./components.md)、[组件板](./exports/d8ZuRd.png) |
| 把现有state/localStorage改为API投影 | [React数据接入](./react-integration.md) |
| 对齐HTTP字段、错误、幂等和数据库写入 | [统一契约](../api-contract.md)、[OpenAPI](../contracts/openapi.yaml) |

## 设计资产职责

`references/` 保存本次真实运行截图；`assets/` 保存现有背景、材质与截图裁剪；`exports/` 是Pen导出的最终预览。`pen/` 是可复用的画布编辑脚本与字体适配脚本，不是React实现。

所有唱片、封面、数量、价格与艺人内容为设计示例，来源/授权尚未核验，不用于正式目录种子。图中某些唱片名与封面沿用demo的示意组合，不能据此推断真实发行版封面。

交付范围是18个页面/状态画板和一个含10个可复用组件的组件板。画板索引、节点ID、图片与检查结果统一见[Pen交付说明](./pen-workflow.md)。桌面当前仍以手机宽度容器呈现；本方案同时定义响应式与横屏规则，未另起一套桌面视觉风格。
