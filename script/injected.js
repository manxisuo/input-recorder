
getOnMsgEvent().addListener(function(request, sender, sendResponse) {
	if (request.action == "query") {
		queryData(sendResponse);
	}
	else if (request.action == "restore") {
		restoreData(request.data);
	}
});

function queryData(sendResponse) {
	var data = [];
	
	data = data.concat(queryDataByTag('input'));
	data = data.concat(queryDataByTag('textarea'));
	data = data.concat(queryDataByTag('select'));
	
	// 返回数据
	sendResponse({data: data});
}

// 根据Tag名称，查询data
function queryDataByTag(tag) {
	var data = [];
	var ctx = getContext();
	
	ctx.find(tag).each(function(n) {
		var id = $(this).attr('id');
		var sel;
		var value;
		
		// 获取selector
		if (id) {
			sel = '#' + id;
		}
		else {
			sel = tag + ':eq(' + n + ')';
		}
		
		// 获取value
		if (isCheckboxOrRadio(tag, $(this).attr('type')))
		
		{
			value = $(this)[0].checked;
		}
		else {
			value = $(this).val();
		}
		
		data.push({
			sel: sel,
			value: value
		});
	});
	
	return data;
}

// 判断是否是checkbox或radio
function isCheckboxOrRadio(tagName, type) {
	if ('input' == toLowerCase(tagName) && 'checkbox' == toLowerCase(type)
		|| 'input' == toLowerCase(tagName) && 'radio' == toLowerCase(type)) 
	{
		return true;
	}
	else {
		return false;
	}
}

function restoreData(data) {
	var sel;
	var value;
	var selector;
	
	var ctx = getContext();
	
	for (i in data) {
		sel = data[i].sel;
		value = data[i].value;
		selector = ctx.find(sel);
		
		// 如果值为boolean类型，则说明元素为checkbox或radio
		if (typeof value == "boolean")
		{
			selector.each(function() {
				this.checked = value;
			});
		}
		else {
			selector.each(function() {
				$(this).val(value);
			});
		}
		
		// 增加强调效果
		selector.addClass('light-border');

		(function(ele) {
			setTimeout(function() {
				ele.removeClass('light-border');
			}, 1000);
		})(selector); 
	}
}

function toLowerCase(str) {
	if (str) return str.toLowerCase();
	else return str;
}

function getContext() {
	var ctx = $(document);
	return ctx;
}

// 兼容低版本
function getOnMsgEvent() {
	var event;
	if (isHighVersion()) {
		event = chrome.runtime.onMessage;
	}
	else {
		event = chrome.extension.onRequest;
	}
	
	return event;
}

function isHighVersion() {
	// return (chrome.runtime && chrome.runtime.onMessage && chrome.tabs.sendMessage);
	return false;
}