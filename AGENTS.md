# AGENTS.md

本文件只记录代码看不出来的工程约束。使用与发布见 [`README.md`](./README.md)，领域术语见 [`GLOSSARY.md`](./GLOSSARY.md)；脚本与检查规则以 [`package.json`](./package.json) 和 [`vite.config.ts`](./vite.config.ts) 为准。

## 架构基线

- 先原地实现；出现第二个真实消费者、运行环境隔离或可复现缺陷时，才新增抽象、目录或依赖。
- 每个能力保留一个权威实现，状态转换、失败处理与资源清理归它所有。
- Promise 必须明确等待、返回或作为后台任务执行；后台任务处理拒绝，长期任务明确取消与清理归属，不使用 async Promise executor。
- 不提交临时调试输出或 `debugger`；保留必要诊断日志与冒烟验证输出。
- 跨进程共享只有 `src/shared`（类型、常量、纯函数）；单进程内的复用留在本进程。
- renderer 的全局 UI 状态只允许一个 Zustand store；不引入事件总线、依赖注入容器、第二套主题系统或额外包管理工具。

## 边界

### 进程与 IPC

- 原生能力只经现有 oRPC router 扩展；不新增 Electron 原始 IPC channel，不向页面暴露 `ipcRenderer`。
- renderer 只允许 `import type` 引用 main router；preload 只转发校验过的端口，不承载业务。
- 输入在 `src/main/ipc/<domain>/schemas.ts` 用 Zod 校验；handler 保持薄且无跨调用状态，出现业务规则或共享状态时抽到 `src/main/` 模块。
- 新增 domain 走 `schemas → handlers → index → router → action → UI`；只加一个方法时扩展所属 domain。
- 边界的执行者是 lint 规则：新增目录时补规则，不放宽旧规则来容纳越层引用。

### Renderer 与状态

- routes 负责页面组装；layouts 只提供空间与 slots；actions 是 renderer 调用原生能力的唯一入口。
- 交互优先使用语义化 HTML，提供可访问名称、键盘操作和可见焦点；自定义交互同时验证鼠标与键盘路径。
- 异步查询结果由 React Query 缓存，不复制到 Zustand；全局 QueryClient 只在 `src/renderer/lib/query-client.ts` 创建，通过 Provider 与 Router context 共享。
- `src/renderer/lib/ipc-client.ts` 惰性创建唯一的 oRPC client 与 `createTanstackQueryUtils`，统一使用 `ipc` key prefix。actions 导出官方 utilities 生成的 query / mutation options，组件和 loader 不直接访问 IPC；不手写对应的 queryFn、mutationFn 或缓存键，取消信号由官方集成转发。
- QueryClient 对 `ipc` prefix 的查询与 mutation 设置 `networkMode: "always"`，HTTP 保留在线语义；缓存键哈希使用 `createQueryKeyHashFn` 支持 oRPC 序列化类型。
- Router loader 负责预取，Query 负责缓存与有效期；非关键数据用不阻塞页面的 `prefetchQuery`，关键数据用 `ensureQueryData`。mutation 成功后使用官方 `.key()` / `.queryKey()` 失效相关查询；原生事件流仍由现有订阅持有，不为接入 Query 另建状态源。
- 主题是唯一例外：[`theme.ts`](./src/renderer/actions/theme.ts) 拥有 DOM 与偏好持久化。首屏脚本与运行时必须共用同一套 normalize 规则，其余细节见 [README 的主题初始化](./README.md#theme-initialization)。
- 窗口状态由 main 事件流持有，renderer 只订阅；平台读取独立于状态流，晚到的结果不覆盖已收到的窗口快照。
- 面板折叠是会话状态；宽度在用户拖动结束时写入布局 store，跨重启恢复。
- store 只做同步转换，不调用 IPC、不碰 DOM 与 Storage；`persist` 必须配 `partialize` 与 `version`，key 走 `LOCAL_STORAGE_KEYS`。
- 组件用 selector 订阅 store；高频交互留在组件或库内，只在结束回调提交一次。

### 安全

- 不放宽窗口的沙箱、上下文隔离、Node 关闭、webview 关闭与 Fuses；CSP 保持严格，开发期 nonce 与 WebSocket 只由 renderer 配置注入。
- IPC 握手校验已登记的 WebContents、当前主 frame 与预期页面 URL；被拒绝的端口立即关闭。
- 外链只允许 `http:`/`https:` 且不含凭据；导航、新窗口与 webview 一律拒绝。
- `file:` 页面消息的 origin 与 `location.origin` 不同，按 preload 现有处理验证真实握手。
- 安全策略变更同时覆盖允许与拒绝路径。

### TypeScript 与依赖

- 不确定 API 或兼容性时，先确认 `package.json` 中的依赖版本，再查对应版本的官方文档；Web API 以 Electron 内置 Chromium 的能力为准。文档与实现不一致时先核对版本和工程约束，涉及架构或用户行为取舍时向用户确认。
- 优先保留类型推导并通过收窄表达约束；未知输入使用 `unknown`，不以 `any`、非空断言或强制类型转换掩盖未处理的边界。
- 统一使用 TypeScript 7，版本以 `package.json` 为准；新增源码、测试、工具脚本和配置使用 `.ts` / `.tsx`，需要显式 ESM 时使用 `.mts`，不新增手写 `.js` / `.mjs` / `.cjs` 文件。现有 `public/theme-init.js` 因需在应用模块加载前由浏览器直接执行而保留；构建生成的 JavaScript 产物不受此限制。
- 三份 tsconfig、`noEmit`、不恢复声明文件构建链；renderer 需要 main 类型时用 `import type`。
- 新增顶层源码目录时同步 tsconfig 的 `include` 与 lint 规则；preload 产物名必须与窗口加载路径一致。
- 应用名、appId 与仓库身份只在 [`src/shared/app-config.ts`](./src/shared/app-config.ts) 定义。
- Bun 只用于依赖管理与脚本，不固定版本；运行时包进 `dependencies`，构建、测试与 CLI 进 `devDependencies`。
- 用 `bun install --frozen-lockfile` 安装，不手改 `bun.lock`。

### 测试

- 默认用任务级 E2E 黑盒验证：用户操作 → 可见结果 → 必要时重启确认持久化。
- 单元测试只保留三类：纯策略或纯状态转换、并发与取消语义、E2E 难以稳定触发的失败路径。
- 不写镜像实现的测试（内部函数、mock 调用顺序、私有状态）；同一行为只留一份代表用例；删除被 E2E 覆盖的测试是正常维护。
- 覆盖率只用于发现未执行路径，不作为目标。
- E2E 必须通过 [`launchTestApp`](./tests/e2e/fixtures.ts) 启动（隔离 profile、清理、关闭主题模拟、启用沙箱），并针对本次构建的产物（`bun run test:e2e` 先打包）。
- 不提交测试 `.only`；平台相关分支用 `test.skip` 并写明原因，不无理由跳过测试。

## 流程

### 新增原生能力

```text
src/main/ipc/<domain>/schemas.ts
  → handlers.ts → index.ts → src/main/ipc/router.ts
  → src/renderer/actions/<domain>.ts → hook / 组件
  → E2E（允许路径 + 拒绝路径）
```

先写能失败的 E2E 场景，再实现。

### 移动或重命名入口

1. `forge.config.ts` 的 build entry。
2. 三份 Vite 配置；preload 输出名必须与窗口加载路径一致。
3. `src/main/window.ts` 的 renderer 与 preload 路径。
4. `scripts/packaged-app.ts` 的产物目录推导。
5. 两份 tsconfig 的 `include` 与 lint 规则。

完成条件是 `bun run package` 后 `bun run test:smoke` 通过，而不只是类型检查通过。

## 目录归属

| 位置            | 只放                                                              |
| --------------- | ----------------------------------------------------------------- |
| `src/main/`     | Main 生命周期、窗口、安全策略、IPC server                         |
| `src/preload/`  | 端口转发                                                          |
| `src/renderer/` | actions、routes、layouts、stores、components、hooks、localization |
| `src/shared/`   | 跨进程类型、常量、纯函数                                          |
| `tests/`        | `unit/{main,renderer}` 与 `e2e`                                   |
| `scripts/`      | 构建与验证脚本                                                    |

新建目录前先在本文件补充职责定义，再创建。

## 验证与完成条件

`bun run check` 只读，`bun run fix` 才写回文件；提交前用 `check` 验证，不用 `fix` 掩盖问题。

| 变更                                  | 至少执行                              | 完成条件                                     |
| ------------------------------------- | ------------------------------------- | -------------------------------------------- |
| 文档                                  | `bun run check`                       | 链接可达，描述与当前实现一致                 |
| 源码、依赖、配置                      | `bun run check` + `bun run test:unit` | 类型检查覆盖全部源码                         |
| 任务行为、IPC、安全、主题、窗口、布局 | 上一行 + `bun run test:e2e`           | 新产物上完成任务级黑盒场景，含允许与拒绝路径 |
| 入口、沙箱、打包、依赖树              | 上一行 + `bun run test:smoke`         | 成品可执行文件启动并完成 IPC 握手            |
| 交付                                  | `bun run test:all`                    | 检查、单元、E2E、冒烟全部通过                |

汇报时列出实际执行的命令与结果，并区分本机已验证、CI 将验证、目标平台未验证（含签名与公证）。
