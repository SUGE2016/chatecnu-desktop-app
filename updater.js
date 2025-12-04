const { autoUpdater } = require('electron-updater');
const { dialog, Notification } = require('electron');

// 更新服务器配置 (TODO: 替换为实际的更新服务器 URL)
const UPDATE_SERVER_URL = process.env.UPDATE_SERVER_URL || 'https://your-update-server.com/updates';

let mainWindow = null;
let isCheckingManually = false;

/**
 * 初始化更新器
 * @param {BrowserWindow} win - 主窗口实例
 */
function initUpdater(win) {
  mainWindow = win;

  // 配置更新服务器
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: UPDATE_SERVER_URL
  });

  // 禁用自动下载，先提示用户
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // 检查更新时
  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] 正在检查更新...');
  });

  // 发现新版本
  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] 发现新版本:', info.version);
    
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 v${info.version}`,
      detail: info.releaseNotes || '是否立即下载更新？',
      buttons: ['立即下载', '稍后提醒'],
      defaultId: 0,
      cancelId: 1
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  // 没有新版本
  autoUpdater.on('update-not-available', (info) => {
    console.log('[Updater] 当前已是最新版本');
    
    if (isCheckingManually) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: '检查更新',
        message: '当前已是最新版本',
        buttons: ['确定']
      });
      isCheckingManually = false;
    }
  });

  // 下载进度
  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent);
    console.log(`[Updater] 下载进度: ${percent}%`);
    
    if (mainWindow) {
      mainWindow.setProgressBar(progress.percent / 100);
    }
  });

  // 下载完成
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] 更新下载完成');
    
    if (mainWindow) {
      mainWindow.setProgressBar(-1); // 清除进度条
    }

    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '更新就绪',
      message: `新版本 v${info.version} 已下载完成`,
      detail: '点击"立即安装"将关闭应用并安装更新',
      buttons: ['立即安装', '下次启动时安装'],
      defaultId: 0,
      cancelId: 1
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  // 更新错误
  autoUpdater.on('error', (err) => {
    console.error('[Updater] 更新错误:', err);
    
    if (mainWindow) {
      mainWindow.setProgressBar(-1);
    }

    if (isCheckingManually) {
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: '检查更新失败',
        message: '无法检查更新',
        detail: err.message || '请检查网络连接后重试',
        buttons: ['确定']
      });
      isCheckingManually = false;
    }
  });
}

/**
 * 检查更新
 * @param {boolean} manual - 是否手动触发
 */
function checkForUpdates(manual = false) {
  isCheckingManually = manual;
  autoUpdater.checkForUpdates().catch(err => {
    console.error('[Updater] 检查更新失败:', err);
  });
}

/**
 * 启动时自动检查更新（延迟执行）
 * @param {number} delay - 延迟时间（毫秒），默认 3 秒
 */
function autoCheckOnStartup(delay = 3000) {
  setTimeout(() => {
    checkForUpdates(false);
  }, delay);
}

module.exports = {
  initUpdater,
  checkForUpdates,
  autoCheckOnStartup
};

