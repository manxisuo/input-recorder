// 用于完成存储操作的工具
var DbUtil = {
	// 保证存储的有效性
	ensure: function() {
		if (!localStorage['items']) {
			localStorage['items'] = "{}";
		}
	},

	// 新增或更新项目到存储
	setItem: function(item) {
		var items = JSON.parse(localStorage['items']);
		items[item.id] = item;
		localStorage['items'] = JSON.stringify(items);
	},

	// 从存储中获取项目
	getItem: function(id) {
		var items = JSON.parse(localStorage['items']);
		return items[id];
	},
	
	getAllItems: function(callback) {
		var items = JSON.parse(localStorage['items']);
		for (i in items) {
			callback(items[i]);
		}
	},

	// 从存储中删除项目
	deleteItem: function(id) {
		var items = JSON.parse(localStorage['items']);
		delete items[id];
		localStorage['items'] = JSON.stringify(items);
	},
	
	getItemsString: function(escape) {
		if (escape) {
			return window.escape(localStorage.items);
		}
		else {
			return localStorage.items;
		}
	},
	
	setItemsString: function(content) {
		localStorage.items = content;
	},
	
	isJSON: function(str) {
		var isJSON = true;
		try {
			JSON.parse(str);
		}
		catch(e) {
			isJSON = false;
		}
		
		return isJSON;
	}
}
