const { app, BrowserWindow, shell, session, Menu, nativeImage } = require("electron");
const path = require("path");

const APP_URL = "https://tabibee.com/ar";
const APP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 TabibeeApp/1.2.0";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    title: "طبيبي",
    backgroundColor: "#060912",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    // شريط عنوان مخصص بالألوان
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#060912",
      symbolColor: "#ffffff",
      height: 36,
    },
    icon: path.join(__dirname, "icon.ico"),
  });

  // ضبط User-Agent لكل الطلبات
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["User-Agent"] = APP_UA;
    callback({ requestHeaders: details.requestHeaders });
  });

  // فتح الروابط الخارجية في المتصفح الافتراضي
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    // ابقَ داخل tabibee.com فقط
    if (!url.startsWith("https://tabibee.com") && !url.startsWith("http://tabibee.com")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // إزالة شريط القوائم الافتراضي
  Menu.setApplicationMenu(null);

  // شاشة تحميل HTML قبل الموقع
  mainWindow.loadFile(path.join(__dirname, "loading.html"));

  // بعد الانتهاء من التحميل انتقل للموقع
  mainWindow.webContents.once("did-finish-load", () => {
    setTimeout(() => {
      mainWindow.loadURL(APP_URL);
    }, 1200);
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
