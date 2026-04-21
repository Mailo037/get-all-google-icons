# get-all-google-icons 🚀

Ein Node.js-Tool, um Google Material Symbols automatisiert als hochauflösende PNG-Dateien zu exportieren – inklusive Fill-Varianten und eingebetteten Metadaten.

## ✨ Features

- **Automatischer Export**: Lädt die aktuelle Icon-Liste direkt von Google Fonts.
- **Zwei Stile**: Exportiert jedes Icon sowohl in **Outlined** (nicht gefüllt) als auch in **Filled** (gefüllt).
- **Metadaten-Injection**: Schreibt detaillierte Informationen (Weight, Grade, Size, Fill-Status) direkt in die PNG-Metadaten via `exiftool`.
- **Anpassbar**: Farben, Größen und Schriftarten können einfach in der `CONFIG` angepasst werden.
- **Headless Browser**: Nutzt Puppeteer für pixelperfekte Renderings.

## 🛠 Installation

1. Klone das Repository.
2. Stelle sicher, dass [Node.js](https://nodejs.org/) installiert ist.
3. Installiere die Abhängigkeiten:
   ```bash
   npm install
   ```
4. **Hinweis**: Das Tool benötigt `exiftool`. Das Paket `exiftool-vendored` sollte dies automatisch handhaben, andernfalls muss Exiftool auf dem System installiert sein.

## 🚀 Nutzung

Starte den Export-Prozess einfach mit:
```bash
npm start
```
Die Icons werden im Ordner `./exported_icons` gespeichert, unterteilt in `filled` und `outlined`.

## ⚙️ Konfiguration

In der `export_icons.js` kannst du das Verhalten anpassen:
```javascript
const CONFIG = {
    fontFamily: 'Material Symbols Rounded',
    color: '#FFFFFF',
    fontSize: '200px',
    outputDir: './exported_icons',
    // ...
};
```

## 📄 Lizenz

MIT
