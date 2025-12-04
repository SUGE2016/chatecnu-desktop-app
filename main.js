const { app, BrowserWindow, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const { version } = require('./package.json');

// 应用标题
const APP_TITLE = `ChatECNU Desktop v${version}`;

// 判断是否为打包后的应用
const isPackaged = app.isPackaged;

// 获取图标路径（打包后和开发时路径不同）
function getIconPath(filename) {
  if (isPackaged) {
    // 打包后：图标在 resources 目录
    return path.join(process.resourcesPath, filename);
  } else {
    // 开发时：图标在 build 目录
    return path.join(__dirname, 'build', filename);
  }
}

let mainWindow;
let tray = null;
let isQuitting = false;

function createWindow() {
  // 图标路径
  const iconPath = getIconPath('favicon.ico');
  
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: true,
    autoHideMenuBar: true,
    icon: iconPath,
    title: APP_TITLE,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 阻止网页修改窗口标题
  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
  });

  // 禁止打开新窗口，改为在当前窗口导航或用系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // 如果是同域名链接，在当前窗口打开
    if (url.startsWith('https://chat.ecnu.edu.cn')) {
      mainWindow.loadURL(url);
    } else {
      // 外部链接用系统浏览器打开
      shell.openExternal(url);
    }
    // 阻止创建新窗口
    return { action: 'deny' };
  });

  // 加载目标网站
  mainWindow.loadURL('https://chat.ecnu.edu.cn');

  // 拦截窗口关闭事件
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // 窗口关闭时
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electron 初始化完成并准备创建浏览器窗口时调用
app.whenReady().then(() => {
  createWindow();

  // 创建系统托盘（Windows 会根据 DPI 自动选择合适的图标尺寸）
  const trayIconPath = getIconPath('favicon.ico');
  const trayIcon = nativeImage.createFromPath(trayIconPath);
  
  tray = new Tray(trayIcon);
  tray.setToolTip(APP_TITLE);
  
  // 创建右键菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  
  // 双击托盘图标显示窗口
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on('activate', () => {
    // 在 macOS 上，当单击 dock 图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当所有窗口关闭时不退出，保持应用在后台运行（通过系统托盘）
app.on('window-all-closed', () => {
  // 不自动退出，让应用在后台运行以保持会话
  // 用户可以通过托盘菜单的"退出"选项来真正退出应用
});

