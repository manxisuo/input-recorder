var IMPORT_TIP_ERR_FORMAT = chrome.i18n.getMessage('importTipErrFormat');
var exportObjectUrl = null;
var importMode = 'merge';
var pendingImportContent = null;
var pendingImportMode = 'merge';

document.addEventListener('DOMContentLoaded', function() {
	DbUtil.ensure(function() {
		initUIText();
		refreshItemCount();

		byId('files').addEventListener('change', handleFileSelect);

		byId('import').addEventListener('click', function() {
			importMode = 'merge';
			byId('files').click();
		});

		byId('importReplace').addEventListener('click', function() {
			setReplaceConfirming(true);
		});

		byId('importReplaceCancel').addEventListener('click', function() {
			setReplaceConfirming(false);
		});

		byId('importReplaceConfirm').addEventListener('click', function() {
			importMode = 'replace';
			setReplaceConfirming(false);
			byId('files').click();
		});

		byId('importPreviewCancel').addEventListener('click', cancelImportPreview);
		byId('importPreviewConfirm').addEventListener('click', confirmPendingImport);

		byId('clearAll').addEventListener('click', function() {
			setClearConfirming(true);
		});

		byId('clearCancel').addEventListener('click', function() {
			setClearConfirming(false);
		});

		byId('clearConfirm').addEventListener('click', function() {
			DbUtil.clearItems(function() {
				setClearConfirming(false);
				refreshItemCount();
				showTip(chrome.i18n.getMessage('clearAllSuccess'));
			});
		});

		byId('export').addEventListener('click', function() {
			if (exportObjectUrl) {
				URL.revokeObjectURL(exportObjectUrl);
				exportObjectUrl = null;
			}

			DbUtil.getItemsString(function(content) {
				var blob = new Blob([content], {type: 'application/json'});
				exportObjectUrl = URL.createObjectURL(blob);

				var exportLink = byId('exportLink');
				var filename = 'input-recorder-backup-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';

				exportLink.href = exportObjectUrl;
				exportLink.download = filename;
				exportLink.style.display = 'inline-flex';
			});
		});

		byId('exportLink').addEventListener('click', function(){
			// Important: don't revoke the blob URL synchronously on click.
			// Some browsers may start the download slightly after the click handler returns.
			var hrefToRevoke = exportObjectUrl;

			// Hide after the click has a chance to trigger the download.
			var self = this;
			setTimeout(function() {
				self.style.display = 'none';
			}, 0);

			setTimeout(function() {
				if (hrefToRevoke && exportObjectUrl === hrefToRevoke) {
					URL.revokeObjectURL(hrefToRevoke);
					exportObjectUrl = null;
				}
			}, 1500);
		});
	});
});

function initUIText() {
	document.title = chrome.i18n.getMessage('optionsTitle');
	byId('title').textContent = document.title;
	byId('importLabel').textContent = chrome.i18n.getMessage('importLabel');
	byId('importAttention').textContent = chrome.i18n.getMessage('importAttention');
	byId('exportLabel').textContent = chrome.i18n.getMessage('exportLabel');
	byId('exportLink').textContent = chrome.i18n.getMessage('exportLink');
	byId('import').textContent = chrome.i18n.getMessage('importBtn');
	byId('importReplace').textContent = chrome.i18n.getMessage('importReplaceBtn');
	byId('importReplaceCancel').textContent = chrome.i18n.getMessage('actionCancel');
	byId('importReplaceConfirm').textContent = chrome.i18n.getMessage('importReplaceConfirmBtn');
	byId('importPreviewCancel').textContent = chrome.i18n.getMessage('actionCancel');
	byId('export').textContent = chrome.i18n.getMessage('exportBtn');
	byId('clearLabel').textContent = chrome.i18n.getMessage('clearAllLabel');
	byId('clearHint').textContent = chrome.i18n.getMessage('clearAllHint');
	byId('clearAll').textContent = chrome.i18n.getMessage('clearAllBtn');
	byId('clearCancel').textContent = chrome.i18n.getMessage('actionCancel');
	byId('clearConfirm').textContent = chrome.i18n.getMessage('clearAllConfirmBtn');
	setReplaceConfirming(false);
	setImportPreviewing(false);
	setClearConfirming(false);
}

function showTip(msg) {
	var tip = byId('tip');
	tip.textContent = msg;
	tip.style.display = 'block';
	clearTimeout(showTip._t);
	showTip._t = setTimeout(function() {
		tip.style.display = 'none';
	}, 2200);
}

function showPersistentTip(msg) {
	var tip = byId('tip');
	tip.textContent = msg;
	tip.style.display = 'block';
	clearTimeout(showTip._t);
}

function handleFileSelect(e) {
	var files = e.target.files;

	for (var i =0, f; f = files[i]; i++) {
	
		var reader = new FileReader();
		
		reader.onload = (function() {
			return function (e2) {
				var content = (e2.target.result);

				if (!DbUtil.isJSON(content)) {
					showTip(IMPORT_TIP_ERR_FORMAT);
					resetFileInput();
					return;
				}

				previewImport(content, importMode);
			}
		})();
		
		reader.readAsText(f);
	}
}

function byId(id) {
	return document.getElementById(id);
}

function resetFileInput() {
	importMode = 'merge';
	setReplaceConfirming(false);
	try { byId('files').value = ''; } catch (e3) {}
}

function refreshItemCount() {
	DbUtil.getItemCount(function(count) {
		byId('itemCount').textContent = chrome.i18n.getMessage('itemCountSummary', [String(count)]);
	});
}

function previewImport(content, mode) {
	var count = getImportItemCount(content);
	if (count < 0) {
		showTip(IMPORT_TIP_ERR_FORMAT);
		resetFileInput();
		return;
	}

	pendingImportContent = content;
	pendingImportMode = mode;
	byId('importPreviewConfirm').textContent = chrome.i18n.getMessage(
		mode === 'replace' ? 'importPreviewReplaceBtn' : 'importPreviewMergeBtn'
	);
	showPersistentTip(chrome.i18n.getMessage(
		mode === 'replace' ? 'importPreviewReplace' : 'importPreviewMerge',
		[String(count)]
	));
	setImportPreviewing(true);
}

function confirmPendingImport() {
	if (!pendingImportContent) return;

	var mode = pendingImportMode;
	var content = pendingImportContent;
	var done = function(summary) {
		if (summary && summary.invalid) showTip(IMPORT_TIP_ERR_FORMAT);
		else showTip(mode === 'replace' ? formatReplaceSummary(summary) : formatImportSummary(summary));
		pendingImportContent = null;
		refreshItemCount();
		resetFileInput();
		setImportPreviewing(false);
	};

	if (mode === 'replace') DbUtil.replaceItemsString(content, done);
	else DbUtil.setItemsString(content, done);
}

function cancelImportPreview() {
	pendingImportContent = null;
	byId('tip').style.display = 'none';
	setImportPreviewing(false);
	resetFileInput();
}

function getImportItemCount(content) {
	try {
		var parsed = JSON.parse(content);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return -1;
		return Object.keys(parsed).length;
	} catch (e) {
		return -1;
	}
}

function setReplaceConfirming(isConfirming) {
	byId('import').style.display = isConfirming ? 'none' : 'inline-flex';
	byId('importReplace').style.display = isConfirming ? 'none' : 'inline-flex';
	byId('importReplaceCancel').style.display = isConfirming ? 'inline-flex' : 'none';
	byId('importReplaceConfirm').style.display = isConfirming ? 'inline-flex' : 'none';

	var tip = byId('tip');
	if (tip && isConfirming) {
		showPersistentTip(chrome.i18n.getMessage('importReplaceConfirm'));
	} else if (tip && !isConfirming && tip.textContent === chrome.i18n.getMessage('importReplaceConfirm')) {
		tip.style.display = 'none';
	}
}

function setImportPreviewing(isPreviewing) {
	byId('import').style.display = isPreviewing ? 'none' : byId('import').style.display || 'inline-flex';
	byId('importReplace').style.display = isPreviewing ? 'none' : byId('importReplace').style.display || 'inline-flex';
	byId('importPreviewCancel').style.display = isPreviewing ? 'inline-flex' : 'none';
	byId('importPreviewConfirm').style.display = isPreviewing ? 'inline-flex' : 'none';
	if (!isPreviewing && byId('importReplaceCancel').style.display !== 'inline-flex') {
		byId('import').style.display = 'inline-flex';
		byId('importReplace').style.display = 'inline-flex';
	}
}

function setClearConfirming(isConfirming) {
	byId('clearAll').style.display = isConfirming ? 'none' : 'inline-flex';
	byId('clearCancel').style.display = isConfirming ? 'inline-flex' : 'none';
	byId('clearConfirm').style.display = isConfirming ? 'inline-flex' : 'none';

	var tip = byId('tip');
	if (tip && isConfirming) {
		showPersistentTip(chrome.i18n.getMessage('clearAllConfirm'));
	} else if (tip && !isConfirming && tip.textContent === chrome.i18n.getMessage('clearAllConfirm')) {
		tip.style.display = 'none';
	}
}

function formatImportSummary(summary) {
	summary = summary || {};
	return chrome.i18n.getMessage('importTipSuccess', [
		String(summary.added || 0),
		String(summary.conflicts || 0),
		String(summary.skipped || 0)
	]);
}

function formatReplaceSummary(summary) {
	summary = summary || {};
	return chrome.i18n.getMessage('importReplaceSuccess', [
		String(summary.replaced || 0)
	]);
}
