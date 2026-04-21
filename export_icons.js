const fs = require('fs');
const puppeteer = require('puppeteer');
const { exiftool } = require('exiftool-vendored');

// Konfiguration
const CONFIG = {
    fontFamily: 'Material Symbols Rounded',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0..1,200',
    color: '#FFFFFF',
    fontSize: '200px',
    outputDir: './exported_icons',
    metadataUrl: 'https://fonts.google.com/metadata/icons',
    maxIcons: null // Zum Testen auf z.B. 10 setzen, sonst lädt er alle!
};

const dirs = {
    0: `${CONFIG.outputDir}/umrandet`,
    1: `${CONFIG.outputDir}/ausgefuellt`
};

if (!fs.existsSync(CONFIG.outputDir)) fs.mkdirSync(CONFIG.outputDir);
if (!fs.existsSync(dirs[0])) fs.mkdirSync(dirs[0], { recursive: true });
if (!fs.existsSync(dirs[1])) fs.mkdirSync(dirs[1], { recursive: true });

async function fetchIconNames() {
    process.stdout.write('Ziehe Icon-Liste von Google Fonts...');
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
    // 1. Daten ziehen
    const iconNames = await fetchIconNames();
    const totalIcons = iconNames.length;
    const totalFiles = totalIcons * 2;

    // Ausgabe: Wie viele wurden gezogen?
    console.log(`\rErfolgreich gezogen: ${totalIcons} Icons.`);
    console.log(`Das ergibt insgesamt ${totalFiles} Bilder (Filled & Outlined).`);
    console.log('Starte Browser und Metadaten-Tool... Bitte warten.\n');

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 400, height: 400 });

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="de">
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

    // 2. Verarbeitung starten
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

            const fillText = fill === 1 ? 'Ausgefüllt (1)' : 'Umrandet (0)';
            const descriptionString = `Gewicht: 400, Stärke: 200, Optische Größe: 24, Farbe: #FFFFFF, Größe: 200px, Stil: Abgerundet, Typ: Material Symbols (neu), Füllung: ${fillText}`;

            await exiftool.write(filePath, {
                Title: `${iconName} Icon`,
                Description: descriptionString,
                ImageDescription: descriptionString,
                Comment: descriptionString
            }, ['-overwrite_original']);
        }

        // Live-Status Update (überschreibt die aktuelle Konsolen-Zeile)
        // .padEnd(80) sorgt dafür, dass längere vorherige Wörter sauber überschrieben werden
        const processedFiles = (i + 1) * 2;
        const percent = (((i + 1) / totalIcons) * 100).toFixed(1);
        process.stdout.write(`\rVerarbeitet: ${i + 1} / ${totalIcons} Icons [${percent}%] (${processedFiles}/${totalFiles} Bilder) | Aktuell: ${iconName}`.padEnd(100));
    }

    console.log('\n\n🎉 Export & Metadaten komplett abgeschlossen!');
    await browser.close();
    await exiftool.end();
}

runExport().catch(err => {
    console.error('\nEin Fehler ist aufgetreten:', err);
    exiftool.end();
});