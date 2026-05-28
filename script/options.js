var IMPORT_TIP_ERR_FORMAT = chrome.i18n.getMessage('importTipErrFormat');
var exportObjectUrl = null;
var importMode = 'merge';

document.addEventListener('DOMContentLoaded', function() {
	DbUtil.ensure(function() {
		initUIText();

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
	byId('export').textContent = chrome.i18n.getMessage('exportBtn');
	setReplaceConfirming(false);
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

				var mode = importMode;
				var done = function(summary) {
					if (summary && summary.invalid) showTip(IMPORT_TIP_ERR_FORMAT);
					else showTip(mode === 'replace' ? formatReplaceSummary(summary) : formatImportSummary(summary));
					resetFileInput();
				};

				if (mode === 'replace') DbUtil.replaceItemsString(content, done);
				else DbUtil.setItemsString(content, done);
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

function setReplaceConfirming(isConfirming) {
	byId('import').style.display = isConfirming ? 'none' : 'inline-flex';
	byId('importReplace').style.display = isConfirming ? 'none' : 'inline-flex';
	byId('importReplaceCancel').style.display = isConfirming ? 'inline-flex' : 'none';
	byId('importReplaceConfirm').style.display = isConfirming ? 'inline-flex' : 'none';

	var tip = byId('tip');
	if (tip && isConfirming) {
		tip.textContent = chrome.i18n.getMessage('importReplaceConfirm');
		tip.style.display = 'block';
		clearTimeout(showTip._t);
	} else if (tip && !isConfirming && tip.textContent === chrome.i18n.getMessage('importReplaceConfirm')) {
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
