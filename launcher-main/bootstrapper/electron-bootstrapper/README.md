# RobBob Bootstrapper

A lightweight, bug-free bootstrapper for the RobBob Launcher that handles automatic installation and updates.

## ✨ Features

- **Small Download Size** - Minimal bootstrapper (~10-20MB) that downloads the full launcher
- **Clean User Flow** - Simple, intuitive installation process
- **Path Selection** - Choose custom installation location or use default
- **Progress Tracking** - Real-time download and extraction progress
- **Desktop Shortcut** - Automatically creates desktop shortcut
- **Admin Rights** - Launches main launcher with proper UAC prompt
- **Error Recovery** - Retry functionality if something goes wrong
- **Modern UI** - Clean, animated interface with smooth transitions

## 🔄 Installation Flow

1. **Download** - User downloads the small bootstrapper exe
2. **Path Selection** - Bootstrapper shows installation path (customizable)
3. **Confirm** - User clicks "Install" to begin
4. **Download** - Bootstrapper downloads the full launcher from server
5. **Extract** - Files are extracted to selected location
6. **Shortcut** - Desktop shortcut is created automatically
7. **Launch** - Main launcher starts with admin rights prompt (UAC)
8. **Complete** - Bootstrapper closes, launcher is ready to use

## 🛠️ Configuration

Edit the `CONFIG` object in [`main.js`](./main.js:20) to customize URLs and paths:

```javascript
const CONFIG = {
  // Server URLs - UPDATE THESE TO YOUR SERVER
  versionUrl: 'http://185.185.142.190/robbob/version.json',
  appDownloadUrl: 'http://185.185.142.190/robbob/RobBob-App.zip',
  
  // Local paths
  appFolder: 'RobBob',
  appExecutable: 'RobBob-Portable.exe',
  versionFile: 'version.txt'
};
```

### Server Setup

Your server should host two files:

#### 1. `version.json`
```json
{
  "version": "1.0.0",
  "downloadUrl": "http://your-server.com/robbob/RobBob-App.zip"
}
```

#### 2. `RobBob-App.zip`
ZIP archive containing the main launcher:
```
RobBob-App.zip/
├── RobBob-Portable.exe    (main launcher executable)
├── resources/
├── locales/
└── ... (all electron app files)
```

## 🏗️ Building

### Install Dependencies
```bash
npm install
```

### Build Bootstrapper
```bash
npm run build
```

Output: `dist/RobBob-Bootstrapper.exe` (~10-20MB)

### Test Locally
```bash
npm start
```

## 📦 What's New

### Complete Rewrite (v1.0.0)
- ✅ Removed all broken and non-working code
- ✅ Simplified installation flow
- ✅ Fixed all crashes and bugs
- ✅ Fixed executable name mismatch
- ✅ Improved error handling
- ✅ Modern, clean UI
- ✅ Better progress tracking
- ✅ Proper UAC elevation prompt
- ✅ Automatic desktop shortcut creation

## 🔧 Technical Details

### Architecture
- **Electron** - Cross-platform desktop app framework
- **IPC Communication** - Secure communication between main and renderer
- **PowerShell Integration** - For UAC prompts and shortcuts
- **Context Isolation** - Security best practices

### Key Files
- [`main.js`](./main.js) - Main process logic
- [`preload.js`](./preload.js) - IPC bridge (security)
- [`src/index.html`](./src/index.html) - UI and frontend logic
- [`package.json`](./package.json) - Build configuration

### Installation Path
Default: `%LOCALAPPDATA%\RobBob\`
Example: `C:\Users\Username\AppData\Local\RobBob\`

## 🐛 Troubleshooting

### Bootstrapper won't download
- Check that server URLs are correct in `CONFIG`
- Ensure server is accessible and files exist
- Check firewall/antivirus settings

### Installation fails
- Try running bootstrapper as administrator
- Check that you have write permissions to install location
- Ensure antivirus isn't blocking the download

### Launcher doesn't start after install
- Check that `RobBob-Portable.exe` exists in install folder
- Try running launcher manually as administrator
- Check Windows Event Viewer for errors

### Desktop shortcut not created
- PowerShell execution policies may be blocking scripts
- Try creating shortcut manually from install folder

## 📝 Development

### Project Structure
```
electron-bootstrapper/
├── main.js           # Main process (downloads, installs)
├── preload.js        # IPC bridge (security)
├── package.json      # Build config
├── assets/
│   └── icon.ico      # App icon
└── src/
    └── index.html    # UI
```

### IPC Handlers
- `get-default-path` - Get default installation path
- `select-install-path` - Open folder selection dialog
- `start-install` - Begin installation process
- `retry` - Retry failed installation
- `window-close` - Close bootstrapper window

### Status Events
- `init` - Initial data sent to renderer
- `status-update` - Progress updates during installation

## 📄 License

MIT License - See main project LICENSE file

## 🤝 Contributing

1. Make changes to bootstrapper code
2. Test thoroughly with `npm start`
3. Build with `npm run build`
4. Test built executable
5. Submit pull request

---

**Note**: This bootstrapper is specifically designed for Windows. For other platforms, modifications would be needed.
