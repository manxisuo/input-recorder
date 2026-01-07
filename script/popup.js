
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

		loadItems();
	});
});

function initUIText() {
	byId('lblSavedItems').textContent = chrome.i18n.getMessage('labelSavedItems');
	byId('add').setAttribute('title', chrome.i18n.getMessage('tipAdd'));
	byId('options').setAttribute('title', chrome.i18n.getMessage('tipOptions'));
	byId('newItemName').setAttribute('placeholder', chrome.i18n.getMessage('hintAdd'));
	byId('empty').textContent = chrome.i18n.getMessage('emptyState');
}

function loadItems() {
	var itemsUl = byId('items');
	itemsUl.innerHTML = '';
	var count = 0;

	DbUtil.getAllItems(function(item) {
		var li = makeItemUI(item);
		itemsUl.insertBefore(li, itemsUl.firstChild);
		count++;
	}, function() {
		byId('empty').style.display = count ? 'none' : 'block';
	});
}

function addNewItem() {
	var input = byId('newItemName');
	var name = (input.value || '').trim();
	if (!name) return;
	
	var id = new Date().getTime();	
	
	queryData(function(data) {
	
		var item = {id:id, name: name, data : data};
		
		DbUtil.setItem(item);
		
		// 保存到UI
		var li = makeItemUI(item);
		var itemsUl = byId('items');
		itemsUl.insertBefore(li, itemsUl.firstChild);
		
		input.value = '';
	});
}

function delItem(id) {
	var sure = window.confirm(chrome.i18n.getMessage('tip_confirm_delete'));
	
	if (!sure) return;

	// UI
	var el = document.getElementById(String(id));
	if (el && el.parentNode) el.parentNode.removeChild(el);
	
	// Mem
	DbUtil.deleteItem(id);
}

function editItemName(item) {
	var desc = window.prompt(chrome.i18n.getMessage('tip_enter_name'), item.name);
	
	desc = (desc || '').trim();
	if (!desc) return;
	
	// UI
	var row = document.getElementById(String(item.id));
	if (row) {
		var nameEl = row.querySelector('.item-name');
		if (nameEl) nameEl.textContent = desc;
	}
	
	// Mem
	item.name = desc;
	DbUtil.setItem(item);
	
}

function updateItem(item) {
	queryData(function(data) {
	
		// Mem
		item.data = data;
		DbUtil.setItem(item);
	});
}

function fill(id) {
	DbUtil.getItem(id, function(item) {
		if (!item) return;
		restoreData(item.data);
	});
}

function makeItemUI(item) {
	var li = document.createElement('li');
	li.id = String(item.id);
	li.className = 'item-li';

	var nameSpan = document.createElement('span');
	nameSpan.className = 'item-name';
	nameSpan.textContent = item.name;
	nameSpan.title = item.name;
	li.appendChild(nameSpan);

	var iconSpan = document.createElement('span');
	iconSpan.className = 'icon-wrapper';

	iconSpan.appendChild(makeIconButton('img/insert.png', chrome.i18n.getMessage('tipRestore'), function() {
		fill(item.id);
	}));
	iconSpan.appendChild(makeIconButton('img/edit.png', chrome.i18n.getMessage('tipRename'), function() {
		editItemName(item);
	}));
	iconSpan.appendChild(makeIconButton('img/update.png', chrome.i18n.getMessage('tipUpdate'), function() {
		updateItem(item);
	}));
	iconSpan.appendChild(makeIconButton('img/delete.png', chrome.i18n.getMessage('tipDel'), function() {
		delItem(item.id);
	}));

	li.appendChild(iconSpan);
	return li;
}

function queryData(callback) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		if (!tabs || !tabs.length) return;
		var tabId = tabs[0].id;

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
				callback(response.data);
			});
		});
	});
}

function restoreData(data) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		if (!tabs || !tabs.length) return;
		var tabId = tabs[0].id;

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
	});
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
