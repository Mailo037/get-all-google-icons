const fs = require('fs');
const puppeteer = require('puppeteer');
const { exiftool } = require('exiftool-vendored');

// Configuration
const CONFIG = {
    fontFamily: 'Material Symbols Rounded',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0..1,200',
    color: '#FFFFFF',
    fontSize: '200px',
    outputDir: './exported_icons',
    metadataUrl: 'https://fonts.google.com/metadata/icons',
    maxIcons: null // Set to e.g. 10 for testing, otherwise it will load all!
};

const dirs = {
    0: `${CONFIG.outputDir}/outlined`,
    1: `${CONFIG.outputDir}/filled`
};

if (!fs.existsSync(CONFIG.outputDir)) fs.mkdirSync(CONFIG.outputDir);
if (!fs.existsSync(dirs[0])) fs.mkdirSync(dirs[0], { recursive: true });
if (!fs.existsSync(dirs[1])) fs.mkdirSync(dirs[1], { recursive: true });

async function fetchIconNames() {
    process.stdout.write('Fetching icon list from Google Fonts...');
    const response = await fetch(CONFIG.metadataUrl);
    let text = await response.text();

    if (text.startsWith(")]}'")) {
        text = text.substring(4);
    }

    const data = JSON.parse(text);
    const icons = Array.from(new Set(data.icons.map(icon => icon.name)));
    return CONFIG.maxIcons ? icons.slice(0, CONFIG.maxIcons) : icons;
}

async function runExport() {
    // 1. Fetch data
    const iconNames = await fetchIconNames();
    const totalIcons = iconNames.length;
    const totalFiles = totalIcons * 2;

    // Output summary
    console.log(`\rSuccessfully fetched: ${totalIcons} icons.`);
    console.log(`This results in a total of ${totalFiles} images (Filled & Outlined).`);
    console.log('Starting browser and metadata tool... Please wait.\n');

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 400, height: 400 });

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <link href="${CONFIG.cssUrl}" rel="stylesheet" />
            <style>
                body { margin: 0; padding: 0; background-color: transparent; display: flex; justify-content: center; align-items: center; width: 400px; height: 400px; }
                .icon { font-family: '${CONFIG.fontFamily}'; font-size: ${CONFIG.fontSize}; color: ${CONFIG.color}; line-height: 1; user-select: none; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 200, 'opsz' 24; }
            </style>
        </head>
        <body>
            <span class="icon" id="icon-target">home</span>
        </body>
        </html>
    `;

    await page.setContent(htmlContent);
    await page.evaluateHandle('document.fonts.ready');

    // 2. Start processing
    for (let i = 0; i < totalIcons; i++) {
        const iconName = iconNames[i];

        await page.evaluate((name) => {
            document.getElementById('icon-target').innerText = name;
        }, iconName);

        for (const fill of [0, 1]) {
            await page.evaluate((fillValue) => {
                document.getElementById('icon-target').style.fontVariationSettings = `'FILL' ${fillValue}, 'wght' 400, 'GRAD' 200, 'opsz' 24`;
            }, fill);

            const fileName = `${iconName} icon.png`;
            const filePath = `${dirs[fill]}/${fileName}`;
            const iconElement = await page.$('#icon-target');

            await iconElement.screenshot({ path: filePath, omitBackground: true });

            const fillText = fill === 1 ? 'Filled (1)' : 'Outlined (0)';
            const descriptionString = `Weight: 400, Grade: 200, Optical Size: 24, Color: #FFFFFF, Size: 200px, Style: Rounded, Type: Material Symbols (new), Fill: ${fillText}`;

            await exiftool.write(filePath, {
                Title: `${iconName} icon`,
                Description: descriptionString,
                ImageDescription: descriptionString,
                Comment: descriptionString
            }, ['-overwrite_original']);
        }

        // Live status update (overwrites the current console line)
        // .padEnd(100) ensures that longer previous words are cleanly overwritten
        const processedFiles = (i + 1) * 2;
        const percent = (((i + 1) / totalIcons) * 100).toFixed(1);
        process.stdout.write(`\rProcessed: ${i + 1} / ${totalIcons} icons [${percent}%] (${processedFiles}/${totalFiles} images) | Current: ${iconName}`.padEnd(100));
    }

    console.log('\n\n🎉 Export & metadata successfully completed!');
    await browser.close();
    await exiftool.end();
}

runExport().catch(err => {
    console.error('\nAn error occurred:', err);
    exiftool.end();
});