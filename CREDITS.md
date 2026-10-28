# 第三方依赖与素材说明

## 围棋规则与棋谱

- **@sabaki/go-board 1.4.3** — MIT License。用于棋盘状态、合法落子、提子、禁着与劫争处理。
- **@sabaki/sgf 3.5.0** — MIT License。用于 SGF 棋谱解析与坐标转换。

Sabaki 项目的许可文本随各自 npm 包分发。本应用在其规则能力之上实现了关卡、状态机、简化面积计分、教学与界面。

## 主要开源依赖

| 依赖 | 用途 | 许可 |
| --- | --- | --- |
| React / React DOM | 用户界面 | MIT |
| Three.js | 棋盘与棋子渲染 | MIT |
| Hono | HTTP 服务 | MIT |
| tRPC | 类型安全 API | MIT |
| Drizzle ORM | MySQL 数据访问 | Apache-2.0 |
| Vite | 开发与构建 | MIT |
| AI SDK | 服务端大模型调用 | Apache-2.0 |
| Lucide React | 界面图标 | ISC |

完整及间接依赖的版本和许可请以 `package-lock.json` 与各依赖包内的许可文件为准。

## 原创与程序化素材

- 界面布局、主题变量、木纹、棋盘、棋子、粒子和灵宠造型均由项目代码与 CSS / Three.js 程序化生成。
- 落子、提子、成功、失败、成就及背景音乐由 Web Audio 实时合成。
- 未打包外部照片、商业棋谱、商业字体或在线音乐。
- 界面字体使用操作系统可用的中文无衬线字体栈。
