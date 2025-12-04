# Chat ECNU Desktop

华东师范大学 AI 对话平台 (chat.ecnu.edu.cn) 的桌面客户端。

## 功能特性

- **桌面应用封装**：将网页版封装为独立桌面应用
- **系统托盘**：关闭窗口后最小化到托盘，保持会话
- **表格导出**：鼠标悬停表格时显示导出按钮，可导出为 Excel 文件
- **自动更新**：启动时自动检查更新，支持托盘菜单手动检查

## 开发

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm start
```

### 打包构建

```bash
# Windows
npm run build:win
```

构建产物在 `dist/` 目录。

## 配置

### 更新服务器

修改 `updater.js` 中的 `UPDATE_SERVER_URL`，或设置环境变量：

```bash
set UPDATE_SERVER_URL=https://your-server.com/updates
```

服务器需要托管 electron-builder 生成的 `latest.yml` 和安装包文件。

## 项目结构

```
├── main.js         # 主进程
├── preload.js      # 预加载脚本（表格导出功能）
├── updater.js      # 自动更新模块
├── build/          # 构建资源（图标）
└── dist/           # 打包输出
```

## 许可证

ECNU

