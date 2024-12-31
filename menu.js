const { BrowserWindow, Menu } = require('electron');

const isMac = (process.platform === 'darwin');
const channels = {
    next: 'switchToNextImage',
    prev: 'switchToPrevImage',
    copy: 'copyImgToClipboard',
    canv: 'toggleCanvasMode',
    size: {
        src: 'setSizeToSource',
        fit: 'setSizeToFitWin',
        zoomIn: 'zoomIn',
        zoomOut: 'zoomOut'
    },
    edit: {
        fav: 'markAsFavorite',
        del: 'deleteBoth',
        delRaw: 'deleteRaw',
        delJpg: 'deleteJpg',
        usebin: 'toggleUseRecycleBin'
    }
}

module.exports = {

    /**
     * Generates a menu template for the given window.
     * 
     * @param {BrowserWindow} win 
     */
    generateTemplate(win) {
        const template = [
            {
                label: "File",
                submenu: [
                    {
                        label: "Next Image",
                        id: "next",
                        click: () => win.webContents.send(channels.next),
                        accelerator: 'Right'
                    },
                    {
                        label: "Previous Image",
                        id: "prev",
                        click: () => win.webContents.send(channels.prev),
                        accelerator: 'Left'
                    },
                    {
                        type: "separator"
                    },
                    {
                        label: "Copy image to clipboard",
                        id: "copy",
                        click: () => win.webContents.send(channels.copy),
                        accelerator: 'C'
                    },
                    {
                        type: "separator"
                    },
                    {
                        role: (isMac ? "close" : "quit"),
                        accelerator: 'Ctrl+W'
                    }
                ]
            },
            {
                label: "Edit",
                submenu: [
                    {
                        label: "Mark as favorite",
                        id: "fav",
                        click: () => win.webContents.send(channels.edit.fav),
                        accelerator: 'M'
                    },
                    {
                        type: "separator"
                    },
                    {
                        label: "delete RAW and JPG",
                        id: "del",
                        click: () => win.webContents.send(channels.edit.del),
                        accelerator: 'Delete'
                    },
                    {
                        label: "delete RAW",
                        id: "delRaw",
                        click: () => win.webContents.send(channels.edit.delRaw),
                        accelerator: 'Shift+Delete'
                    },
                    {
                        label: "delete JPG",
                        id: "delJpg",
                        click: () => win.webContents.send(channels.edit.delJpg),
                        accelerator: 'Ctrl+Delete'
                    },
                    {
                        label: "Mark for deletion instead of deleting",
                        id: "recyclebin",
                        type: "checkbox",
                        checked: true,
                        click: o => {
                            win.webContents.send(channels.edit.usebin);
                        }
                    }
                ]
            },
            {
                label: "View",
                submenu: [
                    { role: "togglefullscreen", label: "Fullscreen (exit with esc, toggle with F)" },
                    {
                        label: "Zoom",
                        submenu: [
                            {
                                type: "checkbox",
                                label: "Fit in window",
                                id: "fitSize",
                                click: o => {
                                    o.checked = false; // Setting checked to false sets the checkbox to true, idk why
                                    win.webContents.send(channels.size.fit);
                                },
                                accelerator: "0"
                            },
                            {
                                label: "Original size",
                                click: () => win.webContents.send(channels.size.src),
                                accelerator: "O"
                            },
                            {
                                label: "Zoom in",
                                click: () => win.webContents.send(channels.size.zoomIn),
                                accelerator: "+"
                            },
                            {
                                label: "Zoom out",
                                click: () => win.webContents.send(channels.size.zoomOut),
                                accelerator: "-"
                            }
                        ]
                    },
                    {
                        type: "separator"
                    },
                    {
                        type: "checkbox",
                        label: "Use Canvas for more detail and sharpness.",
                        id: "canvas",
                        accelerator: 'D',
                        checked: false,
                        click: () => win.webContents.send(channels.canv)
                    },
                    {
                        type: "separator"
                    },
                    {
                        role: "toggleDevTools"
                    }
                ]
            }
        ];

        return template;
    },

    /**
     * Generates the menu template and builds a menu from it.
     * 
     * @param {BrowserWindow} win 
     */
    generateMenu(win) {
        return Menu.buildFromTemplate(this.generateTemplate(win));
    }
}