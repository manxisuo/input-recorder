
$(function(){
	$('#add').on('click', function() {
		addNewItem();
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
	
	loadItems();
});

function addNewItem() {
	var name = $('#newItemName').val();
	if (!$.trim(name))return;
	
	var id = new Date().getTime();
	
	queryData(function(data) {
	
		var item = {id:id, name: name, data : data};
		
		// 保存到localStorage
		localStorage[id] = JSON.stringify(item);
		
		// 保存到UI
		var li = makeItemUI(item);
		var itemsUl = $('#items');
		itemsUl.prepend(li);
		
		$('#newItemName').val('');
	});
}

function delItem(id) {
	var sure = window.confirm('确定删除吗?');
	
	if (!sure) return;

	// 从localStorage删除
	delete localStorage[id];
	
	// 从UI删除
	$('#' + id).remove();
}

function editItemName(item) {
	var desc = window.prompt('请输入新的描述',item.name);
	
	if (!$.trim(desc))return;
	
	$('#' + item.id).children('.item-name').text(desc);
	
	item.name = desc;
	localStorage[item.id] = JSON.stringify(item);
}

function updateItem(item) {
	queryData(function(data) {
	
		item.data = data;
		
		// 保存到localStorage
		localStorage[item.id] = JSON.stringify(item);
	});
}

function handle(id) {
	var item = readItem(id);
	restoreData(item.data);
}

function readItem(id) {
	var item = JSON.parse(localStorage[id]);
	return item;
}

function makeItemUI(item) {
	var li = $('<li />').attr('id', item.id).addClass('item-li');
	$('<span class="item-name" />').text(item.name).attr('title', item.name).appendTo(li);

	// 填充链接
	var doLink = $('<img src="img/insert.png" class="insert hand" title="填充" />');
	doLink.on('click', function() {
		handle($(this).parent().attr('id'));
	});
	li.append(doLink);
	
	// 编辑链接
	var editLink = $('<img src="img/edit.png" class="edit hand" title="修改名称" />');
	editLink.on('click', function() {
		editItemName(item);
	});
	li.append(editLink);
	
	// 更新链接
	var updateLink = $('<img src="img/update.png" class="update hand" title="更新" />');
	updateLink.on('click', function() {
		updateItem(item);
	});
	li.append(updateLink);
	
	// 删除链接
	var delLink = $('<img src="img/delete.png" class="del hand" title="删除" />');
	delLink.on('click', function() {
		delItem(item.id);
	});
	li.append(delLink);
	
	return li;
}

function loadItems() {
	var itemsUl = $('#items');
	
	itemsUl.html('');

	var item;
	for (id in localStorage) {
		item = JSON.parse(localStorage[id]);

		var li = makeItemUI(item);
		itemsUl.prepend(li);
	}
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