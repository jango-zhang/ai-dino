# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome 恐龙游戏的 AI 自动闯关项目。使用纯 JavaScript 实现三层人工神经网络（无 ML 库），通过强化学习让恐龙自动游戏。神经网络实时可视化使用 @antv/g6。

## Commands

```sh
npm install          # 安装依赖
npm start            # 启动开发服务器 (localhost:3000)
npm run build        # 生产构建 (输出 ai-dino.js)
```

无测试和 lint 脚本（虽有 eslint 相关依赖但未配置 lint 命令）。

## Architecture

**TS/JS 混合代码库**：入口点和神经网络模块为 TypeScript (`src/ai-dino.ts`, `src/jnn/`)，游戏引擎为 ES6 JavaScript (`src/game/`)。Webpack 通过 resolve extensions 统一处理模块导入。

### 核心模块

- `src/ai-dino.ts` — 主入口，编排游戏与 AI 的交互循环。定义四个生命周期回调：`onFirstTime`（初始化 NN + G6 图）、`onReset`（重训练 NN）、`onCrash`（收集训练数据）、`onRunning`（查询 NN 获取动作）
- `src/game/Runner.js` — 游戏主循环（requestAnimationFrame），单例模式，管理画布、碰撞检测、游戏状态
- `src/jnn/fm.ts` — `JNN` 类：三层前馈网络（输入→隐藏层→输出），sigmoid 激活，反向传播训练。3 输入（障碍物 X/宽度/速度，归一化）、4 隐藏神经元、2 输出（跑/跳）
- `src/jnn/legend.ts` — G6 图可视化，每帧更新显示神经元权重/偏差/输出

### 强化学习流程

1. 每帧 `onRunning` → 将当前状态归一化为输入向量 → `nn.predict()` → 输出 [跑, 跳] 概率 → 决定是否跳跃
2. 碰撞时 `onCrash` → 反向标记训练数据（跳了撞了→不该跳，没跳撞了→该跳）
3. 重置时 `onReset` → 用累积数据 `nn.fit()` 重训练网络

### 游戏引擎 (`src/game/`)

`Runner` → 协调 `Horizon`（云/障碍物/地面）、`TrexGroup`（多恐龙管理）、`DistanceMeter`（分数显示）。碰撞检测基于 AABB。精灵图来自 `offline-sprite.png`。

## Build Configuration

- Webpack 5，入口 `src/ai-dino.ts` → `ai-dino.js`
- Loaders: `ts-loader` (TS), `less-loader` + `css-loader` + `style-loader` (LESS), `url-loader` (PNG)
- TypeScript 目标 ES2017 / CommonJS，`allowJs: false`（JS 文件靠 webpack resolve 而非 tsc）
- `@antv/g6` 在 devDependencies 中（仅构建时使用，运行时为 dev 服务器提供）
