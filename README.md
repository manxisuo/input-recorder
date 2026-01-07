# Input Recorder

A Chrome/Edge browser extension that saves and restores form input values on web pages. Never lose your form data again!

**[中文版 README](README_zh.md)**

## Features

- **Save Form Data**: Record the current state of all input elements (text fields, textareas, dropdowns, checkboxes, radio buttons) on any webpage
- **Restore with One Click**: Restore saved form data instantly to the same or similar forms
- **Multiple Snapshots**: Create and manage multiple named snapshots of form data
- **Smart Matching**: Intelligent field matching algorithm handles dynamic forms and DOM changes, ensuring reliable restoration even when page structures change
- **Privacy-First**: 
  - All data stored locally on your device
  - Never records password fields or sensitive input types
  - No data transmission to external servers
- **Import/Export**: Backup and restore your saved data as JSON files
- **Modern UI**: Clean, intuitive interface with visual feedback

## Installation

### From Chrome Web Store (Coming Soon)
The extension will be available on Chrome Web Store soon.

### Manual Installation (Developer Mode)

1. **Download or Clone** this repository
   ```bash
   git clone https://github.com/yourusername/input-recorder.git
   cd input-recorder
   ```

2. **Open Chrome/Edge Extensions Page**
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the `input-recorder` folder

5. **Pin the Extension** (Optional)
   - Click the puzzle icon in the toolbar
   - Find "Input Recorder" and click the pin icon

## Usage

### Saving Form Data

1. Fill out a form on any webpage
2. Click the Input Recorder extension icon
3. Enter a name for this snapshot (e.g., "Login Form", "Contact Info")
4. Click the "Add" button (or press Enter)
5. Your form data is now saved!

### Restoring Form Data

1. Navigate to the form page (same or similar page)
2. Click the Input Recorder extension icon
3. Find your saved snapshot in the list
4. Click the "Fill" button (insert icon) next to the snapshot name
5. All form fields will be automatically filled

### Managing Snapshots

- **Rename**: Click the edit icon to rename a snapshot
- **Update**: Click the update icon to save the current form state to an existing snapshot
- **Delete**: Click the delete icon to remove a snapshot
- **Export**: Go to Options → Export to download all snapshots as a JSON file
- **Import**: Go to Options → Import to restore snapshots from a JSON file

## Technical Details

### Architecture

- **Manifest V3**: Built with the latest Chrome Extension Manifest V3 specification
- **Minimal Permissions**: Only requests `activeTab`, `scripting`, and `storage` permissions
- **On-Demand Injection**: Content scripts are injected only when needed, not on every page load
- **Vanilla JavaScript**: No external dependencies (jQuery removed)
- **Smart Field Matching**: 
  - Primary: ID and name attributes
  - Fallback: Label associations, aria-labels, placeholders, and CSS path matching
  - Confidence scoring to prevent incorrect field matches

### Browser Compatibility

- ✅ Chrome 88+ (Manifest V3 support)
- ✅ Edge 88+ (Chromium-based)
- ❌ Firefox (not compatible - uses different extension API)

### Privacy & Security

- **Local Storage Only**: All data is stored using `chrome.storage.local` API
- **No Tracking**: No analytics, no telemetry, no external connections
- **Sensitive Field Protection**: Automatically skips password, file, and other sensitive input types
- **User Control**: All operations require explicit user action

## Development

### Project Structure

```
input-recorder/
├── manifest.json          # Extension manifest (MV3)
├── popup.html             # Extension popup UI
├── options.html           # Options page UI
├── script/
│   ├── popup.js          # Popup logic
│   ├── options.js        # Options page logic
│   ├── injected.js       # Content script (injected into web pages)
│   └── util.js           # Storage utility (DbUtil)
├── style/
│   ├── main.css          # Popup styles
│   ├── options.css       # Options page styles
│   └── injected.css      # Content script styles
├── img/                  # Extension icons
└── _locales/             # Internationalization
    ├── en/
    ├── zh/
    └── zh-CN/
```

### Key Improvements from Original Version

- ✅ Migrated from Manifest V2 to Manifest V3
- ✅ Removed jQuery dependency (vanilla JavaScript)
- ✅ Tightened permissions (activeTab instead of broad host permissions)
- ✅ Improved storage (chrome.storage.local instead of localStorage)
- ✅ Enhanced field matching algorithm
- ✅ Modern UI/UX improvements
- ✅ Better error handling and user feedback

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Specify your license here - e.g., MIT, GPL, etc.]

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Note**: This extension respects your privacy. All data stays on your device and is never shared with anyone.

