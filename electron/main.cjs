const { app, BrowserWindow } = require("electron");

const createWindow = () => {
  const window = new BrowserWindow({
    title: "Призма",
    width: 1600,
    height: 900,
    autoHideMenuBar: true,
  });

  window.loadURL("http://localhost:3000");
};

app.whenReady().then(createWindow);
