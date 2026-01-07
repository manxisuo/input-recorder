var IMPORT_TIP_SUCCESS = chrome.i18n.getMessage('importTipSuccess');
var IMPORT_TIP_ERR_FORMAT = chrome.i18n.getMessage('importTipErrFormat');
var exportObjectUrl = null;

document.addEventListener('DOMContentLoaded', function() {
	DbUtil.ensure(function() {
		initUIText();

		byId('files').addEventListener('change', handleFileSelect);

		byId('import').addEventListener('click', function() {
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
	byId('export').textContent = chrome.i18n.getMessage('exportBtn');
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
					return;
				}

				DbUtil.setItemsString(content, function() {
					showTip(IMPORT_TIP_SUCCESS);
					// allow importing the same file again
					try { byId('files').value = ''; } catch (e3) {}
				});
			}
		})();
		
		reader.readAsText(f);
	}
}

function byId(id) {
	return document.getElementById(id);
}
