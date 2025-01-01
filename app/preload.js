const { ipcRenderer, clipboard } = require('electron');
const remote = require('@electron/remote')
const path = require('path');
const fs = require('fs');
const loadImage = require('blueimp-load-image');

window.addEventListener('DOMContentLoaded', () => {
    const baseTitle = document.title;

    const util = {
        get arguments() {
            return remote.process.argv;
        },

        updateTitle(titleMessage) {
            const seperator = " ─ ";
            const newTitle = baseTitle + seperator + titleMessage;
            document.title = newTitle;
        },

        get applicationMenu() {
            return remote.Menu.getApplicationMenu();
        },

        getFileName(filepath) {
            return path.basename(filepath);
        },

        handleSlashes(str) {
            return str.replace(/\\/g, "/");
        },
        
        encodeChars(str) {
            return str.replace(/['()# ]/g, c => ("%" + c.charCodeAt(0).toString(16)));
        },
        
        /* Get the extension of the file, remove the leading dot and force only lowercase characters. */
        getExtension(filepath) {
            return path.extname(filepath).slice(1).toLowerCase();
        },

        isJpg(filepath) {
            return util.getExtension(filepath) === "jpg" || util.getExtension(filepath) === "jpeg";
        },

        isRaw(filepath) {
            return util.getExtension(filepath) === "arw";
        },

        isImage(filepath) {
            return util.isJpg(filepath) || util.isRaw(filepath);
        },

        getAllFilesInSameDir(filepath) {
            const dirpath = util.getAbsolutePath(path.dirname(filepath));
            const filenames = fs.readdirSync(dirpath);
            const absolutPaths = filenames.map(f => path.resolve(dirpath, f));
            return absolutPaths;
        },

        getAllFilesInFavoritesDir(filepath) {
            const dirpath = util.getAbsolutePath(path.dirname(filepath) + "/favorites");
            if (fs.existsSync(dirpath)) {
                const filenames = fs.readdirSync(dirpath);
                const absolutPaths = filenames.map(f => path.resolve(dirpath, f));
                return absolutPaths;
            } else {
                return [];
            }
        },

        getAbsolutePath(filepath) {
            return path.resolve(__dirname, filepath);
        },

        writeImgToClipboard(img) {
            clipboard.writeImage(img);
        },

        deleteFile(filepath) {
            fs.unlink(filepath, err => {
                if (err) {
                    console.error(err);
                }
            });
        },

        moveToFolder(filepath, folder) {
            const fileBasePath = path.dirname(filepath);
            const folderPath = path.resolve(fileBasePath, folder);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }
            const newFilePath = path.resolve(folderPath, util.getFileName(filepath));
            console.log(newFilePath);
            fs.rename(filepath, newFilePath, err => {
                if (err) {
                    console.error(err);
                }
            });
            return newFilePath;
        },

        loadImage: loadImage,
        ipcRenderer: ipcRenderer
    }

    const utilReadyEvent = new CustomEvent('util-ready', {detail: {
        util: util
    }});

    window.dispatchEvent(utilReadyEvent);
});