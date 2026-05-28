
document.addEventListener('DOMContentLoaded', function() {
	DbUtil.ensure(function() {
		initUIText();

		byId('add').addEventListener('click', addNewItem);
		byId('options').addEventListener('click', function() {
			var url = chrome.runtime.getURL('options.html');
			chrome.tabs.create({url: url});
		});

		byId('newItemName').addEventListener('keydown', function(e) {
			if (e.key === 'Enter') addNewItem();
		});

		byId('toggleOther').addEventListener('click', toggleOtherItems);

		loadItems();
	});
});

function initUIText() {
	byId('add').setAttribute('title', chrome.i18n.getMessage('tipAdd'));
	byId('options').setAttribute('title', chrome.i18n.getMessage('tipOptions'));
	byId('newItemName').setAttribute('placeholder', chrome.i18n.getMessage('hintAdd'));
	byId('empty').textContent = chrome.i18n.getMessage('emptyState');
	byId('emptyCurrent').textContent = chrome.i18n.getMessage('emptyCurrentSite');
}

function loadItems() {
	getActiveTabSource(function(currentSource) {
		var currentItems = [];
		var otherItems = [];
		var total = 0;

		DbUtil.getAllItems(function(item) {
			if (isCurrentSiteItem(item, currentSource)) currentItems.push(item);
			else otherItems.push(item);
			total++;
		}, function() {
			currentItems.sort(compareUpdatedDesc);
			otherItems.sort(compareUpdatedDesc);
			renderItemList(byId('currentItems'), currentItems);
			renderItemList(byId('otherItems'), otherItems);
			updateListState(currentSource, currentItems.length, otherItems.length, total);
		});
	});
}

function addNewItem() {
	var input = byId('newItemName');
	var name = (input.value || '').trim();
	if (!name) return;
	
	var id = new Date().getTime();	
	
	queryData(function(data, tab) {
		if (!ensureCapturedFields(data)) return;

		var item = makeSnapshotItem(id, name, data, tab);
		
		DbUtil.setItem(item, function() {
			showTip(chrome.i18n.getMessage('tipSaveSummary', [String(item.fieldCount)]));
			loadItems();
		});
		
		input.value = '';
	});
}

function delItem(id) {
	DbUtil.deleteItem(id, loadItems);
}

function editItemName(item) {
	var row = document.getElementById(String(item.id));
	if (!row) return;

	row.classList.add('editing');
	var textWrap = row.querySelector('.item-text');
	var iconWrap = row.querySelector('.icon-wrapper');
	if (!textWrap || !iconWrap) return;

	textWrap.innerHTML = '';
	iconWrap.innerHTML = '';

	var input = document.createElement('input');
	input.className = 'inline-input';
	input.type = 'text';
	input.value = item.name || '';
	input.setAttribute('aria-label', chrome.i18n.getMessage('tip_enter_name'));
	textWrap.appendChild(input);

	iconWrap.appendChild(makeTextButton(chrome.i18n.getMessage('actionSave'), 'primary', function() {
		saveItemName(item, input.value);
	}));
	iconWrap.appendChild(makeTextButton(chrome.i18n.getMessage('actionCancel'), '', loadItems));

	input.addEventListener('keydown', function(e) {
		if (e.key === 'Enter') saveItemName(item, input.value);
		if (e.key === 'Escape') loadItems();
	});

	input.focus();
	input.select();
}

function saveItemName(item, value) {
	var name = (value || '').trim();
	if (!name) return;

	item.name = name;
	DbUtil.setItem(item, loadItems);
}

function updateItem(item) {
	queryData(function(data, tab) {
		if (!ensureCapturedFields(data)) return;
	
		// Mem
		item = makeSnapshotItem(item.id, item.name, data, tab, item);
		DbUtil.setItem(item, function() {
			showTip(chrome.i18n.getMessage('tipUpdateSummary', [String(item.fieldCount)]));
			loadItems();
		});
	});
}

function renderItemList(listEl, items) {
	listEl.innerHTML = '';
	for (var i = 0; i < items.length; i++) {
		listEl.appendChild(makeItemUI(items[i]));
	}
}

function updateListState(currentSource, currentCount, otherCount, total) {
	var currentOrigin = currentSource && currentSource.origin ? currentSource.origin.replace(/^https?:\/\//, '') : chrome.i18n.getMessage('unknownSource');
	byId('currentSiteLabel').textContent = chrome.i18n.getMessage('currentSiteSnapshots', [currentOrigin, String(currentCount)]);
	byId('empty').style.display = total ? 'none' : 'block';
	byId('emptyCurrent').style.display = total && currentCount ? 'none' : (total ? 'block' : 'none');
	updateOtherToggle(otherCount);
}

function updateOtherToggle(otherCount) {
	var toggle = byId('toggleOther');
	var list = byId('otherItems');
	var expanded = !list.classList.contains('collapsed');

	toggle.textContent = chrome.i18n.getMessage('otherSiteSnapshots', [String(otherCount)]);
	toggle.disabled = otherCount === 0;
	toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

function toggleOtherItems() {
	var list = byId('otherItems');
	list.classList.toggle('collapsed');
	updateOtherToggle(list.children.length);
}

function getActiveTabSource(callback) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		callback(getTabSource(tabs && tabs.length ? tabs[0] : null));
	});
}

function isCurrentSiteItem(item, currentSource) {
	return !!(item && item.origin && currentSource && currentSource.origin && item.origin === currentSource.origin);
}

function compareUpdatedDesc(a, b) {
	var aTime = Date.parse((a && (a.updatedAt || a.createdAt)) || 0) || 0;
	var bTime = Date.parse((b && (b.updatedAt || b.createdAt)) || 0) || 0;
	return bTime - aTime;
}

function fill(id) {
	DbUtil.getItem(id, function(item) {
		if (!item) return;
		restoreItem(item);
	});
}

function makeItemUI(item) {
	var li = document.createElement('li');
	li.id = String(item.id);
	li.className = 'item-li';

	var textWrap = document.createElement('span');
	textWrap.className = 'item-text';

	var nameSpan = document.createElement('span');
	nameSpan.className = 'item-name';
	nameSpan.textContent = item.name;
	nameSpan.title = item.name;
	textWrap.appendChild(nameSpan);

	var metaText = formatItemMeta(item);
	if (metaText) {
		var metaSpan = document.createElement('span');
		metaSpan.className = 'item-meta';
		metaSpan.textContent = metaText;
		metaSpan.title = metaText;
		textWrap.appendChild(metaSpan);
	}

	li.appendChild(textWrap);

	var iconSpan = document.createElement('span');
	iconSpan.className = 'icon-wrapper';

	iconSpan.appendChild(makeIconButton('img/fill.svg', chrome.i18n.getMessage('tipRestore'), function() {
		fill(item.id);
	}));
	iconSpan.appendChild(makeIconButton('img/edit.svg', chrome.i18n.getMessage('tipRename'), function() {
		editItemName(item);
	}));
	iconSpan.appendChild(makeIconButton('img/refresh.svg', chrome.i18n.getMessage('tipUpdate'), function() {
		updateItem(item);
	}));
	iconSpan.appendChild(makeIconButton('img/trash.svg', chrome.i18n.getMessage('tipDel'), function() {
		showDeleteConfirm(li, item);
	}));

	li.appendChild(iconSpan);
	return li;
}

function showDeleteConfirm(row, item) {
	if (!row) return;

	row.classList.add('confirming-delete');
	var textWrap = row.querySelector('.item-text');
	var iconWrap = row.querySelector('.icon-wrapper');
	if (!textWrap || !iconWrap) return;

	textWrap.innerHTML = '';
	iconWrap.innerHTML = '';

	var message = document.createElement('span');
	message.className = 'confirm-text';
	message.textContent = chrome.i18n.getMessage('deleteInlineConfirm');
	textWrap.appendChild(message);

	iconWrap.appendChild(makeTextButton(chrome.i18n.getMessage('actionCancel'), '', loadItems));
	iconWrap.appendChild(makeTextButton(chrome.i18n.getMessage('actionDelete'), 'danger', function() {
		delItem(item.id);
	}));
}

function queryData(callback) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		if (!tabs || !tabs.length) return;
		var tab = tabs[0];
		var tabId = tab.id;

		ensureInjected(tabId, function(ok) {
			if (!ok) {
				showTip(chrome.i18n.getMessage('tipPageNotSupported'), true);
				return;
			}

			chrome.tabs.sendMessage(tabId, {action: "query"}, function(response) {
				if (chrome.runtime.lastError || !response) {
					showTip(chrome.i18n.getMessage('tipPageNotSupported'), true);
					return;
				}
				callback(response.data || [], tab);
			});
		});
	});
}

function restoreItem(item) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		if (!tabs || !tabs.length) return;
		var currentSource = getTabSource(tabs[0]);
		if (!confirmRestoreForSource(item, currentSource)) return;

		restoreData(item.data || [], tabs[0]);
	});
}

function confirmRestoreForSource(item, currentSource) {
	var savedOrigin = item && item.origin ? item.origin : '';
	var currentOrigin = currentSource && currentSource.origin ? currentSource.origin : '';

	if (savedOrigin && currentOrigin && savedOrigin === currentOrigin) return true;

	var messageKey = savedOrigin ? 'confirmRestoreDifferentSite' : 'confirmRestoreUnknownSite';
	var savedLabel = savedOrigin || chrome.i18n.getMessage('unknownSource');
	var currentLabel = currentOrigin || chrome.i18n.getMessage('unknownSource');

	var args = savedOrigin ? [savedLabel, currentLabel] : [currentLabel];
	return window.confirm(chrome.i18n.getMessage(messageKey, args));
}

function restoreData(data, tab) {
	var run = function(tabs) {
		tab = tab || (tabs && tabs.length ? tabs[0] : null);
		if (!tab) return;
		var tabId = tab.id;

		ensureInjected(tabId, function(ok) {
			if (!ok) {
				showTip(chrome.i18n.getMessage('tipPageNotSupported'), true);
				return;
			}

			chrome.tabs.sendMessage(tabId, {action: "restore", data: data}, function(resp) {
				if (chrome.runtime.lastError || !resp) {
					showTip(chrome.i18n.getMessage('tipPageNotSupported'), true);
					return;
				}

				if (resp.report) {
					var r = resp.report;
					var applied = r.applied || 0;
					var total = r.total || 0;
					var skipped = r.skipped || 0;

					var msg = chrome.i18n.getMessage('tipRestoreSummary', [String(applied), String(total), String(skipped)]);
					showTip(msg, skipped > 0);
				}
			});
		});
	};

	if (tab) run([tab]);
	else chrome.tabs.query({active: true, currentWindow: true}, run);
}

function showTip(msg, isError) {
	var tip = byId('tip');
	if (!tip) return;

	if (isError) tip.classList.add('error');
	else tip.classList.remove('error');

	tip.textContent = msg;
	tip.style.display = 'block';

	clearTimeout(showTip._t);
	showTip._t = setTimeout(function() {
		tip.style.display = 'none';
	}, 2500);
}

function byId(id) {
	return document.getElementById(id);
}

function ensureCapturedFields(data) {
	if (data && data.length) return true;

	showTip(chrome.i18n.getMessage('tipNoFieldsCaptured'), true);
	return false;
}

function makeSnapshotItem(id, name, data, tab, existing) {
	var now = new Date().toISOString();
	var source = getTabSource(tab);

	return {
		id: id,
		name: name,
		data: data || [],
		origin: source.origin,
		url: source.url,
		title: source.title,
		createdAt: existing && existing.createdAt ? existing.createdAt : now,
		updatedAt: now,
		fieldCount: data && data.length ? data.length : 0
	};
}

function getTabSource(tab) {
	var url = tab && tab.url ? tab.url : '';
	var origin = '';

	try {
		origin = url ? new URL(url).origin : '';
	} catch (e) {
		origin = '';
	}

	return {
		origin: origin,
		url: url,
		title: tab && tab.title ? tab.title : ''
	};
}

function formatItemMeta(item) {
	var parts = [];
	var origin = item && item.origin ? item.origin : '';
	var fieldCount = typeof item.fieldCount === 'number' ? item.fieldCount : (item && item.data && item.data.length ? item.data.length : 0);

	if (origin) parts.push(origin.replace(/^https?:\/\//, ''));
	parts.push(chrome.i18n.getMessage('itemFieldCount', [String(fieldCount)]));

	return parts.join(' · ');
}

function makeIconButton(iconSrc, title, onClick) {
	var btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'icon-btn small';
	btn.title = title;
	btn.setAttribute('aria-label', title);
	btn.addEventListener('click', onClick);

	var img = document.createElement('img');
	img.className = 'icon';
	img.src = iconSrc;
	img.alt = '';
	btn.appendChild(img);
	return btn;
}

function makeTextButton(label, variant, onClick) {
	var btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'text-btn' + (variant ? ' ' + variant : '');
	btn.textContent = label;
	btn.addEventListener('click', onClick);
	return btn;
}

function ensureInjected(tabId, callback) {
	// Try a lightweight ping first to avoid repeatedly injecting CSS/script.
	chrome.tabs.sendMessage(tabId, {action: "ping"}, function(resp) {
		if (!chrome.runtime.lastError && resp && resp.ok) {
			callback(true);
			return;
		}

		// Insert CSS then content script.
		chrome.scripting.insertCSS(
			{target: {tabId: tabId}, files: ['style/injected.css']},
			function() {
				if (chrome.runtime.lastError) {
					callback(false);
					return;
				}

				chrome.scripting.executeScript(
					{target: {tabId: tabId}, files: ['script/injected.js']},
					function() {
						if (chrome.runtime.lastError) callback(false);
						else callback(true);
					}
				);
			}
		);
	});
}
