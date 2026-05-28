# ROADMAP

This roadmap prioritizes improvements that make Input Recorder safer, more reliable, and easier to use in daily form-filling workflows.

## Phase 1: Data Safety and User Trust

### 1. ✅ Import without destructive overwrite by default

Current behavior replaces all existing saved items during import. This is risky because a user can lose local snapshots with one file selection.

Planned improvements:

- Change the default import mode to merge imported items into existing items.
- Preserve existing local items when imported IDs conflict.
- Generate new IDs for conflicting imported items, or provide an explicit conflict resolution prompt.
- Keep a separate explicit "replace all data" action for users who intentionally want a full restore.
- Show an import summary with imported, skipped, merged, and conflict counts.
- Completed: default import now merges, conflicts receive new IDs, JSON export is pretty-printed, and replace-all requires an inline confirmation flow.

Acceptance criteria:

- Importing a backup does not delete existing items unless the user explicitly chooses a replace-all action.
- Importing the same file multiple times does not corrupt the saved item list.
- The UI clearly communicates what happened after import.

### 2. ✅ Store snapshot source and metadata

Saved items currently contain only an ID, name, and field data. Adding metadata will make saved snapshots easier to recognize and safer to restore.

Planned improvements:

- Add `origin`, `url`, and `title` when saving a snapshot.
- Add `createdAt` and `updatedAt` timestamps.
- Add `fieldCount` so users can quickly understand what was captured.
- Preserve backward compatibility with older saved items that do not include metadata.
- Completed: new snapshots store source and timestamps, and popup rows show source plus field count.

Acceptance criteria:

- New snapshots include source page and timestamp metadata.
- Existing snapshots continue to load and restore.
- Popup UI can display source and update information without breaking older data.

### 3. ✅ Warn before restoring across different sites

Restoring a snapshot on the wrong website can leak personal information into unrelated forms.

Planned improvements:

- Compare the current page origin with the snapshot's saved origin before restore.
- Restore directly when the origins match.
- Show a confirmation warning when origins differ.
- Make the warning clear, short, and localized.
- Completed: same-origin restores proceed directly, cross-origin and unknown-source restores require confirmation.

Acceptance criteria:

- Same-site restore remains one click.
- Cross-site restore requires explicit confirmation.
- Older snapshots without origin metadata still restore, but the UI communicates that the source is unknown.

### 4. ✅ Improve save and update feedback

Save and update actions should confirm what happened, especially when no fields were captured.

Planned improvements:

- Show a toast after saving a new snapshot.
- Show a toast after updating an existing snapshot.
- Include the number of captured fields in success messages.
- Warn when a page has no supported fields.
- Keep error messages actionable for unsupported pages.
- Completed: save/update actions show captured field counts, and zero-field captures are blocked with a localized message.

Acceptance criteria:

- Users receive visible feedback for add, update, restore, import, and export actions.
- Saving a snapshot with zero fields is clearly indicated or prevented.
- Feedback messages are localized.

## Phase 2: Restore Reliability

### 5. ✅ Tighten selector and metadata matching

The current restore path trusts a unique selector match too strongly. Dynamic pages can reuse the same structural position for a different field.

Planned improvements:

- Validate unique selector matches against stored metadata before applying values.
- Compare tag, input type category, name, label, placeholder, ARIA label, and stable data attributes.
- Treat type mismatches as lower confidence or hard failures for incompatible field categories.
- Keep conservative behavior when confidence is low to avoid wrong fills.
- Completed: unique selectors and ID matches are validated against metadata, incompatible field categories are skipped, and selector misses fall back to metadata matching.

Acceptance criteria:

- A unique selector alone is not enough to restore into a semantically different field.
- Checkbox, radio, select, and text-like inputs are not cross-filled incorrectly.
- Restore summaries still report applied and skipped counts.

### 6. ✅ Broaden supported field types carefully

The extension currently supports native `input`, `textarea`, and `select` elements. Modern sites often use richer editable surfaces.

Planned improvements:

- Add support for `contenteditable` fields where safe and predictable.
- Evaluate common rich text editor patterns separately before broad support.
- Document limitations for custom components that do not expose normal form fields.
- Completed: `contenteditable` fields are captured as text and restored through text insertion with metadata matching for editor-like fields.

Acceptance criteria:

- Basic `contenteditable` capture and restore works on a test page.
- Unsupported custom widgets fail safely without wrong fills.
- README documents supported and unsupported field types.

### 7. ✅ Expand sensitive-field protection

The extension already skips password, file, hidden, and button-like inputs. It should also avoid likely secrets and payment data.

Planned improvements:

- Detect sensitive fields using `autocomplete`, `name`, `id`, `placeholder`, and labels.
- Skip or warn for fields such as one-time codes, credit card numbers, CVV/CVC, SSN, API keys, tokens, and secrets.
- Consider a setting for "skip suspected sensitive fields" with a privacy-first default.
- Completed: suspected sensitive fields are skipped during capture and restore using autocomplete plus attribute/label heuristics. README and store copy updates are tracked in Phase 4.

Acceptance criteria:

- Known sensitive test fields are not saved by default.
- The behavior is documented in README and store copy.
- Users are not surprised by missing sensitive fields during restore.

## Phase 3: Popup and Options UX

### 8. ✅ Improve saved item discovery

The saved-item list will become harder to use as users accumulate snapshots.

Planned improvements:

- Show current-site snapshots first.
- Add search by snapshot name and source page.
- Sort snapshots by `updatedAt` descending.
- Provide an "all snapshots" view.
- Display concise metadata such as field count and source origin.
- Completed: popup now shows current-site snapshots first, folds other/unknown snapshots by default, sorts by update time, and shows source plus field count.

Acceptance criteria:

- Users can quickly find relevant snapshots for the current page.
- Long names remain readable without breaking the popup layout.
- Empty and filtered-empty states are clear.

### 9. ✅ Replace native prompt and confirm dialogs

Browser-native `prompt` and `confirm` dialogs feel dated and are hard to style or localize well.

Planned improvements:

- Replace rename prompt with inline editing or a small popup-local dialog.
- Replace delete confirmation with an in-popup confirmation state.
- Keep keyboard support for confirm, cancel, and escape.
- Completed: popup rename and delete now use inline controls, and options replace-all uses an inline confirmation state. Cross-site restore still uses a native confirmation for now.

Acceptance criteria:

- Rename and delete flows stay inside the extension UI.
- Dialog copy is localized.
- The flows remain accessible by keyboard.

### 10. Add stronger options-page data management

The options page should make backup and restore behavior more transparent.

Planned improvements:

- Show the current number of saved snapshots.
- Add import preview before applying changes.
- Add an explicit clear-all action with confirmation.
- Keep export filename timestamped and predictable.

Acceptance criteria:

- Users can see how much local data exists.
- Import previews show the number of items in the file.
- Clear-all cannot be triggered accidentally.

## Phase 4: Quality, Documentation, and Release Readiness

### 11. ✅ Add a manual regression test page

This extension depends heavily on browser and form behavior. A local test page will make changes safer.

Planned improvements:

- Add a test form covering text, textarea, select, checkbox, radio, disabled fields, repeated names, sensitive fields, and dynamic DOM changes.
- Include contenteditable once supported.
- Add a manual QA checklist for save, update, restore, import, export, delete, and cross-site warning behavior.
- Completed: `test/test.html`, `test/test.css`, and `test/test.js` provide a local static form test page covering common, sensitive, dynamic, and contenteditable fields.

Acceptance criteria:

- Core flows can be verified locally without relying on third-party websites.
- The checklist covers privacy-sensitive cases.
- Regression testing is documented for release preparation.

### 12. Align README and store listing with shipped behavior

Documentation and store text should describe what the extension actually does.

Planned improvements:

- Replace placeholder repository and license text.
- Keep English and Chinese README files aligned.
- Remove or revise claims that are not implemented in the UI.
- Add clear privacy, supported field, and limitation sections.
- Keep version history accurate for each release.

Acceptance criteria:

- README files no longer contain placeholders.
- Store listing matches the actual shipped feature set.
- Privacy claims are specific and verifiable from the code.
