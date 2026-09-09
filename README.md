# VINYL - 黑胶收藏与播放

> 高质感 iOS / Android 黑胶唱片收藏、展示与播放应用，以实体黑胶文化与触觉交互为核心。

## 🎵 项目简介

VINYL 是一款专注于黑胶唱片文化的现代化应用，提供收藏管理、视觉展示和音乐播放功能。通过逼真的 3D 视觉效果和直观的触觉交互，让用户能够以全新的方式体验黑胶文化。

### ✨ 核心特性

- 📚 **唱片收藏管理** - 轻松组织和管理您的黑胶收藏
- 🎨 **3D 视觉展示** - 逼真的黑胶唱片 3D 模型展示
- ▶️ **音乐播放** - 集成音乐播放功能
- 📱 **跨平台支持** - iOS 和 Android 原生应用支持
- ✋ **触觉交互** - 实体化触觉反馈，提升用户体验
- 🤖 **AI 智能** - 集成 Google Gemini API 支持

## 🛠️ 技术栈

### 前端框架
- **React 19** - UI 框架
- **TypeScript** - 类型安全的开发
- **Vite 6** - 现代化构建工具
- **Tailwind CSS 4** - 效率型样式框架

### 3D & 交互
- **Three.js** - 3D 图形库
- **ThreeUI** - Three.js UI 组件库
- **Motion** - 动画库

### UI 组件 & 工具
- **Lucide React** - 图标库
- **Express** - 后端服务器

### AI 集成
- **Google Generative AI** - AI 功能支持

## 📦 项目结构

```
vinyl-music/
├── src/              # 源代码
│   └── main.tsx      # 应用入口
├── public/           # 公共资源
├── index.html        # HTML 入口
├── package.json      # 依赖管理
├── vite.config.ts    # Vite 配置
├── tsconfig.json     # TypeScript 配置
├── .env.example      # 环境变量示例
└── metadata.json     # 项目元数据
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境配置

复制 `.env.example` 文件并填入必要的配置：

```bash
cp .env.example .env
```

### 开发模式

启动本地开发服务器（端口 3000）：

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

### 清理构建文件

```bash
npm run clean
```

### 类型检查

```bash
npm run lint
```

## 📋 可用脚本

| 命令 | 描述 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run clean` | 删除构建输出 |
| `npm run lint` | 运行 TypeScript 类型检查 |

## 🔑 环境变量

根据 `.env.example` 配置必要的环境变量。关键变量包括：

- Google Gemini API 密钥
- 其他服务配置

详见 `.env.example` 文件。

## 📚 主要依赖版本

- React: ^19.0.1
- TypeScript: ~5.8.2
- Vite: ^6.2.3
- Three.js: ^0.165.0
- Tailwind CSS: ^4.1.14
- Express: ^4.21.2

完整依赖列表请查看 `package.json`。

## 🎯 功能规划

- [ ] 完整的唱片收藏数据库管理
- [ ] 高保真音乐播放功能
- [ ] 社区分享与推荐
- [ ] AI 辅助的收藏推荐
- [ ] 深度链接和分享功能

## 💡 开发指南

### 项目特点
- 采用模块化架构
- TypeScript 类型安全保证
- Vite 快速热更新
- Tailwind CSS 快速样式开发
- Three.js 提供丰富的 3D 展示可能性

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESM 模块规范
- 运行 `npm run lint` 进行类型验证

## 🔗 相关资源

- [React 文档](https://react.dev)
- [TypeScript 文档](https://www.typescriptlang.org)
- [Vite 文档](https://vitejs.dev)
- [Three.js 文档](https://threejs.org)
- [Tailwind CSS 文档](https://tailwindcss.com)
- [Google Gemini API](https://ai.google.dev)

## 📝 许可证

本项目目前未指定许可证。详见 LICENSE 文件或联系项目维护者。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**最后更新**: 2026-09-09  
**项目语言**: TypeScript (94.2%) | CSS (5.6%) | HTML (0.2%)
