const path = require('path')
const os = require('os')
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron')
const imagemin = require('imagemin')
const imageminMozjpeg = require('imagemin-mozjpeg')
const slash = require('slash')
const log = require('electron-log')

process.env.NODE_ENV = 'production'

const isDev = process.env.NODE_ENV !== 'production'
const isMac = process.platform === 'darwin'

let mainWindow
let aboutWindow

function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Image Shrink',
        width: isDev ? 1200 : 500,
        height: 650,
        icon: `${__dirname}/assets/Icon_256x256.png`,
        resizable: !!isDev,
        backgroundColor: 'white',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    if (isDev) {
        mainWindow.webContents.openDevTools()
    }

    mainWindow.loadFile('./app/index.html')
}

function createAboutWindow() {
    aboutWindow = new BrowserWindow({
        title: 'About Image Shrink',
        width: 300,
        height: 300,
        icon: `${__dirname}/assets/Icon_256x256.png`,
        resizable: false,
        backgroundColor: 'white'
    })

    aboutWindow.loadFile('./app/about.html')
}


const menu = [
    ...(isMac ? [{
        label: app.name, submenu: [{
            label: 'About',
            click: () => createAboutWindow()
        }]
    }] : []),
    {
        role: 'fileMenu'
    },
    // add the about page for windows
    ...(!isMac
        ? [{
            label: 'Help',
            submlabel: 'About',
            click: () => createAboutWindow()
        }]
        : []),
    ...(isDev ? [{
        label: 'Developer',
        submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { type: 'separator' },
            { role: 'toggledevtools' }
        ]
    }] : [])
]

ipcMain.on('image:shrink', (event, options) => {
    options.dest = path.join(os.homedir(), 'imageshrink')
    shrinkImage(options)
})


async function shrinkImage({ imgPath, quality, dest }) {
    try {
        await imagemin([slash(imgPath)], {
            destination: dest,
            plugins: [imageminMozjpeg({ quality })]
        })

        shell.openPath(dest)

        mainWindow.webContents.send('image:done')
    } catch (error) {
        console.log(error)
        log.error(err)
    }
}

app.whenReady().then(() => {
    createMainWindow()

    // this is how to setup a custom menu
    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)


    mainWindow.on('ready', () => mainWindow = null)

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow()
        }
    })
})


// only in mac, if the winows are closed that doesn't mean that the
// user has quit the app
app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit()
    }
})
