
$(function(){
	DbUtil.ensure();
	
	initUIText();

	$('#add').on('click', function() {
		addNewItem();
	});
	
	$('#options').on('click', function() {
		var url = chrome.extension.getURL('options.html');
		chrome.tabs.create({url: url});	
	});
	
	$('#refresh').on('click', function() {
		loadItems();
	});
	
	$('#help').on('click', function() {
		var url = chrome.extension.getURL('about.html');
		chrome.tabs.create({url: url});	
	});
	
	$('#newItemName').on('keypress', function(e) {
		if(e.keyCode == 13) {
			$('#add').click();
		}
	});
	
	// 加载项目到UI
	loadItems();
});

function initUIText() {
	$('#lblSavedItems').text(chrome.i18n.getMessage('labelSavedItems'));
	$('#add').attr('title', chrome.i18n.getMessage('tipAdd'));
	$('#options').attr('title', chrome.i18n.getMessage('tipOptions'));
	$('#newItemName').attr('placeholder', chrome.i18n.getMessage('hintAdd'));
}

function loadItems() {
	var itemsUl = $('#items');
	
	itemsUl.html('');

	DbUtil.getAllItems(function(item) {
		var li = makeItemUI(item);
		itemsUl.prepend(li);
	});
}

function addNewItem() {
	var name = $('#newItemName').val();
	if (!$.trim(name))return;
	
	var id = new Date().getTime();	
	
	queryData(function(data) {
	
		var item = {id:id, name: name, data : data};
		
		DbUtil.setItem(item);
		
		// 保存到UI
		var li = makeItemUI(item);
		var itemsUl = $('#items');
		itemsUl.prepend(li);
		
		$('#newItemName').val('');
	});
}

function delItem(id) {
	var sure = window.confirm(chrome.i18n.getMessage('tip_confirm_delete'));
	
	if (!sure) return;

	// UI
	$('#' + id).remove();
	
	// Mem
	DbUtil.deleteItem(id);
}

function editItemName(item) {
	var desc = window.prompt(chrome.i18n.getMessage('tip_enter_name'), item.name);
	
	if (!$.trim(desc))return;
	
	// UI
	$('#' + item.id).children('.item-name').text(desc);
	
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
	var item = DbUtil.getItem(id);
	restoreData(item.data);
}

function makeItemUI(item) {
	var li = $('<li />').attr('id', item.id).addClass('item-li');
	$('<span class="item-name" />').text(item.name).attr('title', item.name).appendTo(li);

	var iconSpan = $('<span class="icon-wrapper" />');

	// 填充链接
	var doLink = $('<img src="img/insert.png" class="insert hand" />');
	doLink.attr('title', chrome.i18n.getMessage("tipRestore"));
	doLink.on('click', function() {
		fill($(this).parent().parent().attr('id'));
	});
	iconSpan.append(doLink);
	
	// 编辑链接
	var editLink = $('<img src="img/edit.png" class="edit hand" />');
	editLink.attr('title', chrome.i18n.getMessage("tipRename"));
	editLink.on('click', function() {
		editItemName(item);
	});
	iconSpan.append(editLink);
	
	// 更新链接
	var updateLink = $('<img src="img/update.png" class="update hand" />');
	updateLink.attr('title', chrome.i18n.getMessage("tipUpdate"));
	updateLink.on('click', function() {
		updateItem(item);
	});
	iconSpan.append(updateLink);
	
	// 删除链接
	var delLink = $('<img src="img/delete.png" class="del hand" />');
	delLink.attr('title', chrome.i18n.getMessage("tipDel"));
	delLink.on('click', function() {
		delItem(item.id);
	});
	iconSpan.append(delLink);
	
	li.append(iconSpan);
	
	return li;
}

function queryData(callback) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		getSendMsgFunc()(tabs[0].id, {action: "query"}, function(response) {
			if (response) {
				callback(response.data);
			}
		});
	});
}

function restoreData(data) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		getSendMsgFunc()(tabs[0].id, {action: "restore", data: data}, function(response) {});
	});
}

// 兼容低版本
function getSendMsgFunc() {
	var sendMsg;
	if (isHighVersion()) {
		sendMsg = chrome.tabs.sendMessage;
	}
	else {
		sendMsg = chrome.tabs.sendRequest;
	}
	
	return sendMsg;
}

function isHighVersion() {
	// return (chrome.runtime && chrome.runtime.onMessage && chrome.tabs.sendMessage);
	return false;
}
