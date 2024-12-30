window.addEventListener('view-ready', event => {
    const { util, view } = event.detail;

    function loadImage(imgPath, imgName) {
        view.updateNextPrevMenuItems(false, false);
        util.updateTitle("Loading.");
        util.loadImage(imgPath, {
            orientation: true,
            meta: true,
            canvas: useCanvas
        }).then(data => {
            view.displayedImage = data.image;
            currentImageHeight = data.originalHeight;
            currentImageWidth = data.originalWidth;
            scaleCanvas();
            util.updateTitle(imgName);
            updateNextPrevMenuItems();
            
            console.log('Exif data: ', data.exif) // requires exif extension
            console.log('IPTC data: ', data.iptc) // requires iptc extension
        }).catch(r => {
            view.displayedImage = null;
            util.updateTitle("Error loading the image.");
            updateNextPrevMenuItems();
        });
    }

    function loadCurrentImage() {
        if (fileIndexInRange(currentImageIndex)) {
            loadImage(
                images[currentImageIndex][imageType].urlEncoded, 
                images[currentImageIndex][imageType].baseName, 
            );
        } else {
            util.updateTitle("Nothing to view.");
            updateNextPrevMenuItems();
        }
    }

    function scaleCanvas() {
        if (view.displayedImage == null) {
            return; // No calculation if no image is displayed currently
        } else if (autoFitSize) {
            scaleCanvasToContain();
        }

        view.autoFitSize = autoFitSize;
        applyCanvasScaling();
    }

    function scaleCanvasToContain() {
        const containerRect = view.imageContainerBoundingRect;
        const availableWidth  = containerRect.width;
        const availableHeight = containerRect.height;
    
        let scalingRatio = availableWidth / currentImageWidth;
        let scaledHeight = currentImageHeight * scalingRatio;
    
        if (scaledHeight > availableHeight) {
            scalingRatio = availableHeight / currentImageHeight;
        }

        currentCanvasScale = scalingRatio;
    }

    function applyCanvasScaling() {
        view.displayedImage.style.width  = (currentImageWidth  * currentCanvasScale) + "px";
        view.displayedImage.style.height = (currentImageHeight * currentCanvasScale) + "px";
    }

    function zoomCanvas(event) {
        const scrollAmount = event.deltaY / 90;
        const inverse = -1;
        applyZoom(inverse * scrollAmount * zoomDelta);
    }

    function applyZoom(amount) {
        autoFitSize = false;
        currentCanvasScale += amount;

        if (currentCanvasScale < 0) {
            currentCanvasScale = 0
        }

        scaleCanvas();
    }

    function mouseWheel(event) {
        if (ctrlKeyDown) {
            zoomCanvas(event);
            event.preventDefault();
        }
    }

    function keyDown(event) {
        if (event.keyCode === 17) {
            ctrlKeyDown = true;
        }
    }
    
    function keyUp(event) {
        if (event.keyCode === 17) {
            ctrlKeyDown = false;
        }
    }

    function filename2obj(filename) {
        const abs = util.getAbsolutePath(filename);
        const enc = util.encodeChars(util.handleSlashes(abs));
        const ext = util.getExtension(filename);
        const base = util.getFileName(filename);
        const name = base.substring(0, base.length - ext.length - 1);

        return {
            name: filename,
            urlEncoded: enc,
            urlNotEncoded: abs,

            extension: ext,
            baseName: name
        };
    }

    function scanFiles(files) {
        let supportedFiles = files.filter(util.isImage);

        // If only one file is given, add everything else in the same dir as well.
        if (supportedFiles.length === 1) {
            const otherFiles = util.getAllFilesInSameDir(supportedFiles[0]);
            supportedFiles = supportedFiles.concat(otherFiles.filter(util.isImage));
        }

        const jpgs = supportedFiles.filter(util.isJpg).map(filename2obj);
        const raws = supportedFiles.filter(util.isRaw).map(filename2obj);
        const combined = raws.map(raw => {
            const jpg = jpgs.find(j => j.baseName === raw.baseName);
            return {raw, jpg};
        });

        return combined;
    }
    
    function switchImage(newIndex) {
        if (fileIndexInRange(newIndex)) {
            currentImageIndex = newIndex;
            loadCurrentImage();
        }
    }

    function updateNextPrevMenuItems() {
        const prevInRange = fileIndexInRange(currentImageIndex - 1);
        const nextInRange = fileIndexInRange(currentImageIndex + 1);
        view.updateNextPrevMenuItems(prevInRange, nextInRange);
    }
    
    function fileIndexInRange(index) {
        return (index >= 0) && (index < images.length);
    }


    let images = scanFiles(util.arguments),
        imageType = 'jpg',
        useCanvas = false, 
        ctrlKeyDown = false,
        autoFitSize = true,
        zoomDelta = .01,
        currentCanvasScale = 1,
        currentImageIndex  = 0,
        currentImageWidth  = 0,
        currentImageHeight = 0;

    updateNextPrevMenuItems();
    loadCurrentImage();

    window.addEventListener('resize', scaleCanvas);
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    view.addWheelHandler(mouseWheel);

    const channelListeners = {
        switchToNextImage() {
            switchImage(currentImageIndex + 1);
        },

        switchToPrevImage() {
            switchImage(currentImageIndex - 1);
        },

        copyImgToClipboard() {
            util.writeImgToClipboard(images[currentImageIndex].jpg.urlNotEncoded);
        },
        
        toggleCanvasMode() {
            useCanvas = !useCanvas;

            // Manually toggle the visual checkmark in the menu:
            view.useCanvas = useCanvas;

            loadCurrentImage();
        },

        setSizeToSource() {
            autoFitSize = false;
            currentCanvasScale = 1;
            scaleCanvas();
        },

        setSizeToFitWin() {
            autoFitSize = true;
            scaleCanvas();
        },

        zoomIn() {
            applyZoom(zoomDelta);
        },
        
        zoomOut() {
            applyZoom(-zoomDelta);
        },

        toggleRawJpg() {
            imageType = imageType === 'raw' ? 'jpg' : 'raw';
            loadCurrentImage();
        }
    };

    Object.keys(channelListeners).forEach(key => {
        util.ipcRenderer.on(key, channelListeners[key]);
    });
});