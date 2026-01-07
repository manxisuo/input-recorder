// 用于完成存储操作的工具
// MV3 优先使用 chrome.storage.local（异步、容量更大、也更“扩展友好”）
'use strict';

var DbUtil = {
	_key: 'items',

	// 保证存储的有效性（并自动迁移历史 localStorage 数据）
	ensure: function(callback) {
		var self = this;

		// fallback：极少数环境下没有 chrome.storage（理论上 MV3 不会发生）
		if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
			if (typeof localStorage !== 'undefined' && !localStorage[self._key]) {
				localStorage[self._key] = '{}';
			}
			if (callback) callback();
			return;
		}

		chrome.storage.local.get(self._key, function(res) {
			var current = res && res[self._key];
			if (current && typeof current === 'object') {
				if (callback) callback();
				return;
			}

			// 迁移旧版本 localStorage 数据（如果存在）
			var migrated = {};
			try {
				if (typeof localStorage !== 'undefined') {
					var raw = localStorage.getItem(self._key) || localStorage[self._key];
					if (raw) {
						var parsed = JSON.parse(raw);
						if (parsed && typeof parsed === 'object') migrated = parsed;
					}
				}
			} catch (e) {
				migrated = {};
			}

			var payload = {};
			payload[self._key] = migrated;
			chrome.storage.local.set(payload, function() {
				try {
					if (typeof localStorage !== 'undefined') localStorage.removeItem(self._key);
				} catch (e) {}
				if (callback) callback();
			});
		});
	},

	_getAll: function(callback) {
		var self = this;
		chrome.storage.local.get(self._key, function(res) {
			var items = (res && res[self._key]) || {};
			if (!items || typeof items !== 'object') items = {};
			callback(items);
		});
	},

	_setAll: function(items, callback) {
		var self = this;
		var payload = {};
		payload[self._key] = items || {};
		chrome.storage.local.set(payload, function() {
			if (callback) callback();
		});
	},

	// 新增或更新项目到存储
	setItem: function(item, callback) {
		this._getAll(function(items) {
			items[item.id] = item;
			DbUtil._setAll(items, callback);
		});
	},

	// 从存储中获取项目
	getItem: function(id, callback) {
		this._getAll(function(items) {
			callback(items[id]);
		});
	},

	getAllItems: function(eachCallback, doneCallback) {
		this._getAll(function(items) {
			var keys = Object.keys(items);
			for (var i = 0; i < keys.length; i++) {
				eachCallback(items[keys[i]]);
			}
			if (doneCallback) doneCallback();
		});
	},

	// 从存储中删除项目
	deleteItem: function(id, callback) {
		this._getAll(function(items) {
			delete items[id];
			DbUtil._setAll(items, callback);
		});
	},

	// 供 options 导出使用
	getItemsString: function(callback) {
		this._getAll(function(items) {
			callback(JSON.stringify(items));
		});
	},

	// 供 options 导入使用
	setItemsString: function(content, callback) {
		var parsed = JSON.parse(content);
		if (!parsed || typeof parsed !== 'object') parsed = {};
		this._setAll(parsed, callback);
	},

	isJSON: function(str) {
		try {
			JSON.parse(str);
			return true;
		} catch (e) {
			return false;
		}
	}
};
