# Chrome Web Store - Product Details

## Product Description (for Chrome Web Store submission)

---

**Input Recorder** is an essential productivity tool that saves and restores form input values on web pages. Never lose your form data again due to accidental page refreshes, browser crashes, or network interruptions. Perfect for anyone who regularly fills out online forms - from job applications and contact forms to surveys and registrations. With Input Recorder, you can capture the current state of all form fields with a single click and restore them instantly whenever you need them.

### 🎯 Core Functionality

**Save Form Data Instantly**
Input Recorder captures the current values of all input elements on any webpage, including:
- Text input fields
- Textarea elements
- Dropdown/select menus
- Checkboxes
- Radio buttons

Simply fill out a form, click the extension icon, give your snapshot a name, and your data is safely stored locally on your device.

**One-Click Restoration**
Restore saved form data with a single click. Whether you're returning to the same form or a similar one, Input Recorder intelligently matches fields and fills them automatically. The extension uses advanced matching algorithms that work even when page structures change, ensuring reliable data restoration.

**Multiple Snapshots Management**
Create and manage unlimited named snapshots of form data. Perfect for:
- Saving multiple form configurations (e.g., personal info, work info, family info)
- Keeping different versions of the same form
- Saving work-in-progress forms to complete later
- Organizing forms by purpose or website

### ✨ Key Features

**Smart Field Matching Technology**
Our intelligent matching algorithm ensures accurate field restoration even when:
- Page DOM structures change
- Forms are dynamically generated
- Field IDs or names are modified
- Pages are updated or redesigned

The extension uses a multi-tier matching strategy:
1. **Primary matching**: ID and name attributes (most reliable)
2. **Secondary matching**: Label associations, aria-labels, and placeholders
3. **Fallback matching**: CSS path and structural analysis
4. **Confidence scoring**: Prevents incorrect matches by only filling fields with high confidence scores

**Privacy-First Design**
Your data security and privacy are our top priorities:
- **100% Local Storage**: All data is stored exclusively on your device using Chrome's secure storage API
- **No External Transmission**: Zero data is sent to external servers or third parties
- **No Tracking**: No analytics, no telemetry, no user tracking of any kind
- **Sensitive Field Protection**: Automatically skips password fields, file inputs, and other sensitive input types
- **User Control**: All operations require explicit user action - nothing happens automatically

**Modern, Intuitive Interface**
- Clean, minimalist design that doesn't clutter your browser
- Visual feedback when fields are restored (highlighting effect)
- Empty state messages for better user guidance
- Responsive layout that works on all screen sizes
- Support for multiple languages (English, Chinese)

**Data Management Tools**
- **Rename Snapshots**: Easily update snapshot names to stay organized
- **Update Existing Snapshots**: Overwrite old data with current form state
- **Delete Unwanted Snapshots**: Remove snapshots you no longer need
- **Export/Import**: Backup all your data as JSON files for safekeeping or transfer between devices
- **Bulk Operations**: Manage multiple snapshots efficiently

### 🚀 Perfect For Everyone

**Daily Form Users**
- **Job Applications**: Save your resume information, work history, and references to quickly apply to multiple positions
- **Contact Forms**: Store your contact details, address, and personal information for quick form submissions
- **Account Registration**: Save profile information for creating accounts on different websites
- **Surveys & Questionnaires**: Keep your responses safe while completing long surveys
- **Shopping Checkouts**: Save shipping and billing information for faster checkout processes
- **Event Registrations**: Store attendee information for multiple event sign-ups

**Prevent Data Loss**
- Never lose form data due to browser crashes or accidental page refreshes
- Quickly restore forms after network interruptions or connection issues
- Recover work-in-progress forms that were accidentally closed
- Save time by not having to re-enter the same information repeatedly

**Professional Use Cases**
- **Data Entry Workers**: Reduce repetitive typing and minimize data entry errors
- **Administrative Staff**: Maintain consistency across similar forms and speed up workflow
- **Customer Service**: Quickly fill out support forms with pre-saved customer information
- **Sales Professionals**: Store client information for quick form submissions

**Also Great For Developers & Testers**
- Save test data configurations for quick form testing
- Restore form states during development and debugging
- Test different input combinations without manual re-entry
- Speed up QA processes with pre-filled test data

### 🔒 Privacy & Security

**Complete Privacy Protection**
Input Recorder is designed with privacy as a core principle. We believe your data belongs to you and should never leave your device.

**What We DON'T Do:**
- ❌ We don't collect any personal information
- ❌ We don't track your browsing behavior
- ❌ We don't send data to external servers
- ❌ We don't use analytics or telemetry
- ❌ We don't record password fields or sensitive data
- ❌ We don't access tabs without your explicit action

**What We DO:**
- ✅ Store all data locally on your device
- ✅ Only access the active tab when you click the extension
- ✅ Use minimal permissions (activeTab, scripting, storage only)
- ✅ Provide full user control over all operations
- ✅ Allow you to export and delete your data anytime

**Minimal Permissions**
Input Recorder requests only the absolute minimum permissions required for functionality:
- **activeTab**: Access the current page only when you click the extension icon
- **scripting**: Inject scripts to read/write form fields (only when you request it)
- **storage**: Save your form data locally on your device

We don't request broad host permissions, background access, or any unnecessary capabilities.

### 📖 How to Use

**Saving Form Data:**
1. Fill out any form on a webpage
2. Click the Input Recorder extension icon in your toolbar
3. Enter a descriptive name for your snapshot (e.g., "Login Form", "Contact Info", "Application Data")
4. Click the "Add" button or press Enter
5. Your form data is now saved and ready to restore anytime!

**Restoring Form Data:**
1. Navigate to the form page (same page or a similar one)
2. Click the Input Recorder extension icon
3. Find your saved snapshot in the list
4. Click the "Fill" button (insert icon) next to the snapshot name
5. Watch as all form fields are automatically filled with your saved data

**Managing Snapshots:**
- **Rename**: Click the edit icon to change a snapshot's name
- **Update**: Click the update icon to save the current form state to an existing snapshot
- **Delete**: Click the delete icon to remove a snapshot you no longer need
- **Export**: Go to Options → Export to download all snapshots as a JSON backup file
- **Import**: Go to Options → Import to restore snapshots from a previously exported JSON file

**Tips for Best Results:**
- Use descriptive names for your snapshots (e.g., "Job Application - Company Name", "Contact Form - Website") to easily identify them later
- Update snapshots when form structures change significantly
- Export your data regularly as a backup - especially before browser updates or computer changes
- Works great with most forms - the smart matching handles most websites automatically

### 🛠️ Built for Reliability

**Fast & Lightweight**
- Minimal memory usage - won't slow down your browser
- Instant data retrieval and storage
- No background processes running
- Works seamlessly without interfering with your browsing

**Smart & Reliable**
- Advanced field matching works even when websites update their forms
- Handles dynamic forms and modern web applications
- Intelligent algorithms prevent incorrect data entry
- Works with most websites and form types

**Browser Compatibility**
- ✅ Chrome 88+ (full support)
- ✅ Edge 88+ (Chromium-based, full support)
- Built with modern web standards for optimal performance and security

### 🎨 User Experience

**Visual Feedback**
When you restore form data, filled fields are briefly highlighted with a blue border and shadow effect, providing clear visual confirmation that the operation was successful.

**Error Handling**
The extension provides helpful feedback when:
- A page doesn't support form recording (e.g., chrome:// pages)
- Field matching fails or has low confidence
- Storage operations encounter issues

**Empty States**
Clear messaging when you have no saved snapshots, guiding you to create your first one.

**Accessibility**
- Keyboard navigation support
- Screen reader friendly
- Clear visual indicators
- Intuitive icon-based interface

### 📝 Version History

**Version 1.1.0 (Current)**
- Migrated to Manifest V3 for enhanced security
- Removed jQuery dependency for better performance
- Implemented smart field matching algorithm
- Enhanced privacy protection (skips sensitive fields)
- Improved UI/UX with modern design
- Added import/export functionality
- Better error handling and user feedback
- Support for multiple languages

### 💡 Frequently Asked Questions

**Q: Is my data safe?**
A: Absolutely. All data is stored locally on your device using Chrome's secure storage API. Nothing is transmitted to external servers.

**Q: Does it work with password fields?**
A: No, for security reasons, the extension automatically skips password fields and other sensitive input types.

**Q: Can I use it on multiple devices?**
A: Yes! Use the Export feature to create a backup file, then Import it on another device.

**Q: What happens if a form structure changes?**
A: The smart matching algorithm will attempt to match fields using multiple strategies. If matching fails or confidence is low, the field will be skipped to prevent incorrect data entry.

**Q: Does it slow down my browser?**
A: No. The extension only activates when you click it, and uses minimal resources.

**Q: Can I delete my data?**
A: Yes, you can delete individual snapshots or use the Export feature to backup and then clear all data.

### 🤝 Support & Feedback

We value your feedback and are committed to continuously improving Input Recorder. If you encounter any issues, have feature requests, or want to share your experience, please reach out through the extension's support channels.

### ⚖️ Terms & Privacy

By using Input Recorder, you acknowledge that:
- All data is stored locally on your device
- You have full control over your data
- The extension does not collect, transmit, or share any personal information
- You can export and delete your data at any time

---

**Download Input Recorder today and experience the convenience of never losing your form data again!**

*Input Recorder - Your form data, your control, your privacy.*

