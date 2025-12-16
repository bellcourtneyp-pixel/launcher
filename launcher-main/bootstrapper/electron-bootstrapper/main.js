/**
 * RobBob Bootstrapper - Clean & Simple
 * 
 * Flow:
 * 1. Show installation path selection
 * 2. User confirms installation path
 * 3. Download launcher from server
 * 4. Extract launcher files
 * 5. Create desktop shortcut
 * 6. Launch main launcher with admin prompt
 * 7. Close bootstrapper
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { spawn, exec } = require('child_process');
const os = require('os');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  // Server URLs - UPDATE THESE TO YOUR SERVER
  versionUrl: 'http://185.185.142.190/robbob/version.json',
  appDownloadUrl: 'http://185.185.142.190/robbob/RobBob-App.zip',
  
  // Local paths
  appFolder: 'RobBob',
  appExecutable: 'RobBob-Portable.exe',  // FIXED: Match the actual executable name
  versionFile: 'version.txt'
};

let mainWindow = null;
let installPath = null;
let hasStartedInstall = false;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get default installation path
 */
function getDefaultInstallPath() {
  const appData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  return path.join(appData, CONFIG.appFolder);
}

/**
 * Create main window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    transparent: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('src/index.html');
  mainWindow.center();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Send status update to renderer
 */
function sendStatus(type, message, data = {}) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('status-update', {
      type,
      message,
      ...data
    });
  }
}

/**
 * Download file with progress tracking
 */
function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    // Ensure destination directory exists
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const request = protocol.get(url, {
      headers: { 'User-Agent': 'RobBob-Bootstrapper' }
    }, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location, destPath, onProgress)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      const file = fs.createWriteStream(destPath);
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        file.write(chunk);
        
        if (totalSize && onProgress) {
          const percent = Math.round((downloadedSize / totalSize) * 100);
          onProgress(percent, downloadedSize, totalSize);
        }
      });
      
      response.on('end', () => {
        file.end();
        resolve();
      });
      
      response.on('error', (err) => {
        file.destroy();
        try {
          fs.unlinkSync(destPath);
        } catch (e) {}
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      reject(err);
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

/**
 * Extract ZIP archive using PowerShell
 */
function extractZip(zipPath, destPath) {
  return new Promise((resolve, reject) => {
    // Create destination folder
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    const cmd = `powershell.exe -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destPath}' -Force"`;
    
    exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
      // Clean up zip file
      try {
        fs.unlinkSync(zipPath);
      } catch (e) {}
      
      if (error) {
        console.error('Extract error:', error);
        console.error('stderr:', stderr);
        reject(new Error('Не удалось распаковать архив'));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Create desktop shortcut to MAIN LAUNCHER (not bootstrapper)
 */
function createDesktopShortcut(launcherPath) {
  return new Promise((resolve) => {
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const shortcutPath = path.join(desktopPath, 'RobBob Launcher.lnk');
    const launcherDir = path.dirname(launcherPath);
    
    // PowerShell script to create shortcut
    const psScript = `
      $WshShell = New-Object -ComObject WScript.Shell;
      $Shortcut = $WshShell.CreateShortcut('${shortcutPath}');
      $Shortcut.TargetPath = '${launcherPath}';
      $Shortcut.WorkingDirectory = '${launcherDir}';
      $Shortcut.Description = 'RobBob Launcher';
      $Shortcut.Save()
    `.replace(/\n/g, ' ').trim();
    
    exec(`powershell.exe -NoProfile -Command "${psScript}"`, { windowsHide: true }, (err) => {
      if (err) {
        console.error('Failed to create shortcut:', err);
      } else {
        console.log('Desktop shortcut created successfully');
      }
      // Don't fail the whole process if shortcut creation fails
      resolve();
    });
  });
}

/**
 * Launch the main launcher with admin rights prompt
 */
function launchMainLauncher(launcherPath) {
  if (!fs.existsSync(launcherPath)) {
    sendStatus('error', 'Файл лаунчера не найден');
    return;
  }
  
  sendStatus('status', 'Запуск лаунчера...');
  
  // Use PowerShell Start-Process with -Verb RunAs to trigger UAC prompt
  const launcherDir = path.dirname(launcherPath);
  
  const psCommand = `Start-Process -FilePath '${launcherPath}' -WorkingDirectory '${launcherDir}' -Verb RunAs`;
  
  spawn('powershell.exe', ['-NoProfile', '-Command', psCommand], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  }).unref();
  
  // Close bootstrapper after a short delay
  setTimeout(() => {
    app.quit();
  }, 1500);
}

/**
 * Check if launcher is already installed
 */
function checkExistingInstallation(targetPath) {
  const launcherPath = path.join(targetPath, CONFIG.appExecutable);
  const versionPath = path.join(targetPath, CONFIG.versionFile);
  
  const exists = fs.existsSync(launcherPath);
  let version = null;
  
  if (exists && fs.existsSync(versionPath)) {
    try {
      version = fs.readFileSync(versionPath, 'utf-8').trim();
    } catch (e) {}
  }
  
  return { exists, version };
}

/**
 * Fetch server version info
 */
function fetchVersionInfo() {
  return new Promise((resolve, reject) => {
    const protocol = CONFIG.versionUrl.startsWith('https') ? https : http;
    
    const request = protocol.get(CONFIG.versionUrl, {
      headers: { 'User-Agent': 'RobBob-Bootstrapper' }
    }, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        CONFIG.versionUrl = response.headers.location;
        fetchVersionInfo().then(resolve).catch(reject);
        return;
      }
      
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    request.on('error', reject);
    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error('Connection timeout'));
    });
  });
}

/**
 * Save version file
 */
function saveVersion(targetPath, version) {
  const versionPath = path.join(targetPath, CONFIG.versionFile);
  try {
    fs.writeFileSync(versionPath, version);
  } catch (e) {
    console.error('Failed to save version:', e);
  }
}

/**
 * Main installation process
 */
async function performInstallation() {
  if (hasStartedInstall) return;
  hasStartedInstall = true;
  
  if (!installPath) {
    sendStatus('error', 'Не выбран путь установки');
    return;
  }
  
  try {
    // Step 1: Check server version
    sendStatus('status', 'Проверка версии на сервере...', { progress: 0 });
    
    let serverVersion = null;
    let downloadUrl = CONFIG.appDownloadUrl;
    
    try {
      const versionInfo = await fetchVersionInfo();
      serverVersion = versionInfo.version;
      if (versionInfo.downloadUrl) {
        downloadUrl = versionInfo.downloadUrl;
      }
    } catch (e) {
      console.log('Could not fetch version info, using default URL');
    }
    
    // Step 2: Check existing installation
    const existing = checkExistingInstallation(installPath);
    
    if (existing.exists && existing.version === serverVersion) {
      // Already installed and up to date - just launch
      sendStatus('status', 'Лаунчер уже установлен', { progress: 100 });
      await createDesktopShortcut(path.join(installPath, CONFIG.appExecutable));
      launchMainLauncher(path.join(installPath, CONFIG.appExecutable));
      return;
    }
    
    // Step 3: Download launcher
    sendStatus('status', 'Загрузка лаунчера...', { progress: 5 });
    
    const tempZip = path.join(app.getPath('temp'), 'robbob-launcher.zip');
    
    await downloadFile(downloadUrl, tempZip, (percent) => {
      const downloadProgress = 5 + Math.round(percent * 0.7); // 5% to 75%
      sendStatus('status', `Загрузка: ${percent}%`, { progress: downloadProgress });
    });
    
    // Step 4: Extract files
    sendStatus('status', 'Распаковка файлов...', { progress: 80 });
    
    await extractZip(tempZip, installPath);
    
    // Step 5: Save version
    if (serverVersion) {
      saveVersion(installPath, serverVersion);
    }
    
    sendStatus('status', 'Установка завершена', { progress: 90 });
    
    // Step 6: Create desktop shortcut
    sendStatus('status', 'Создание ярлыка...', { progress: 95 });
    
    const launcherPath = path.join(installPath, CONFIG.appExecutable);
    await createDesktopShortcut(launcherPath);
    
    sendStatus('status', 'Готово!', { progress: 100 });
    
    // Step 7: Launch main launcher with admin prompt
    setTimeout(() => {
      launchMainLauncher(launcherPath);
    }, 500);
    
  } catch (error) {
    console.error('Installation error:', error);
    hasStartedInstall = false;
    sendStatus('error', `Ошибка: ${error.message}`);
  }
}

// ============================================
// IPC HANDLERS
// ============================================

/**
 * Get default installation path
 */
ipcMain.handle('get-default-path', () => {
  return getDefaultInstallPath();
});

/**
 * Select custom installation path
 */
ipcMain.handle('select-install-path', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Выберите папку для установки RobBob',
    defaultPath: installPath || getDefaultInstallPath(),
    properties: ['openDirectory', 'createDirectory'],
    buttonLabel: 'Выбрать эту папку'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    installPath = path.join(result.filePaths[0], CONFIG.appFolder);
    return { success: true, path: installPath };
  }
  
  return { success: false };
});

/**
 * Start installation
 */
ipcMain.handle('start-install', async (event, selectedPath) => {
  if (selectedPath) {
    installPath = selectedPath;
  } else if (!installPath) {
    installPath = getDefaultInstallPath();
  }
  
  performInstallation();
  return { success: true };
});

/**
 * Retry installation
 */
ipcMain.handle('retry', () => {
  hasStartedInstall = false;
  performInstallation();
  return { success: true };
});

/**
 * Close window
 */
ipcMain.on('window-close', () => {
  app.quit();
});

// ============================================
// APP LIFECYCLE
// ============================================

app.whenReady().then(() => {
  createWindow();
  
  // Set default install path
  installPath = getDefaultInstallPath();
  
  // Send initial data to renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('init', {
      defaultPath: installPath
    });
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
