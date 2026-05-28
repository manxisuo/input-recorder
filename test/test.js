'use strict';

var dynamicCount = 0;

document.addEventListener('DOMContentLoaded', function() {
	byId('fillDemo').addEventListener('click', fillDemoData);
	byId('clearForm').addEventListener('click', clearVisibleForm);
	byId('addDynamic').addEventListener('click', addDynamicField);
	byId('shuffleDynamic').addEventListener('click', shuffleDynamicFields);
	byId('logValues').addEventListener('click', renderSnapshot);

	byId('testForm').addEventListener('submit', function(event) {
		event.preventDefault();
		renderSnapshot();
	});

	byId('testForm').addEventListener('input', renderSnapshot);
	byId('testForm').addEventListener('change', renderSnapshot);

	addDynamicField();
	renderSnapshot();
});

function fillDemoData() {
	setValue('fullName', '张三');
	setValue('email', 'zhangsan@example.com');
	setValue('phone', '+86 138 0000 0000');
	setValue('website', 'https://example.com/profile');
	setValue('search', '输入域记录器测试');
	setValue('quantity', '7');
	setValue('date', '2026-05-28');
	setValue('time', '09:30');
	setValue('month', '2026-05');
	setValue('week', '2026-W22');
	setValue('datetime', '2026-05-28T09:30');
	setValue('favoriteColor', '#2f80ed');
	setValue('notes', '这是一段用于测试 textarea 保存和恢复的多行内容。\n第二行内容。');
	setValue('city', 'shanghai');
	setValue('range', '65');
	setValue('password', 'should-not-be-saved');
	setValue('otp', '123456');
	setValue('creditCard', '4111111111111111');
	setValue('cvv', '123');
	setValue('apiToken', 'secret-token-value');
	setValue('readonlyField', 'readonly demo value');

	setChecked('notifyEmail', true);
	setChecked('notifySms', false);
	setChecked('notifyPush', true);
	setRadio('priority', 'high');
	setMultiSelect('tags', ['product', 'qa']);
	setDuplicateValues(['duplicate A', 'duplicate B']);

	byId('editableBio').textContent = '这是 contenteditable 区域，用于观察当前版本是否支持。';

	var dynamicInputs = document.querySelectorAll('#dynamicFields input');
	for (var i = 0; i < dynamicInputs.length; i++) {
		dynamicInputs[i].value = 'dynamic value ' + (i + 1);
	}

	renderSnapshot();
}

function clearVisibleForm() {
	var fields = document.querySelectorAll('input, textarea, select');
	for (var i = 0; i < fields.length; i++) {
		var el = fields[i];
		if (el.disabled) continue;
		if (el.type === 'hidden' || el.type === 'submit' || el.type === 'reset' || el.type === 'button' || el.type === 'file') continue;

		if (el.type === 'checkbox' || el.type === 'radio') {
			el.checked = false;
		} else if (el.tagName.toLowerCase() === 'select' && el.multiple) {
			for (var j = 0; j < el.options.length; j++) el.options[j].selected = false;
		} else {
			el.value = '';
		}
	}

	byId('editableBio').textContent = '';
	renderSnapshot();
}

function addDynamicField() {
	dynamicCount++;

	var label = document.createElement('label');
	label.textContent = '动态字段 ' + dynamicCount;

	var input = document.createElement('input');
	input.type = 'text';
	input.name = 'dynamicField' + dynamicCount;
	input.placeholder = '动态字段 ' + dynamicCount;
	input.setAttribute('data-testid', 'dynamic-field-' + dynamicCount);
	input.addEventListener('input', renderSnapshot);

	label.appendChild(input);
	byId('dynamicFields').appendChild(label);
	renderSnapshot();
}

function shuffleDynamicFields() {
	var container = byId('dynamicFields');
	var children = Array.prototype.slice.call(container.children);
	children.reverse();
	for (var i = 0; i < children.length; i++) {
		container.appendChild(children[i]);
	}
	renderSnapshot();
}

function renderSnapshot() {
	var result = {};
	var fields = document.querySelectorAll('input, textarea, select');

	for (var i = 0; i < fields.length; i++) {
		var el = fields[i];
		var key = el.id || el.name || 'field-' + i;

		if (el.type === 'checkbox') {
			result[key] = el.checked;
		} else if (el.type === 'radio') {
			if (el.checked) result[el.name] = el.value;
			else if (!Object.prototype.hasOwnProperty.call(result, el.name)) result[el.name] = null;
		} else if (el.tagName.toLowerCase() === 'select' && el.multiple) {
			result[key] = Array.prototype.filter.call(el.options, function(option) {
				return option.selected;
			}).map(function(option) {
				return option.value;
			});
		} else if (el.type !== 'submit' && el.type !== 'reset' && el.type !== 'button') {
			result[key] = el.value;
		}
	}

	result.editableBio = byId('editableBio').textContent;
	byId('output').textContent = JSON.stringify(result, null, 2);
}

function setValue(id, value) {
	var el = byId(id);
	if (el) el.value = value;
}

function setChecked(name, value) {
	var el = document.querySelector('input[name="' + name + '"]');
	if (el) el.checked = value;
}

function setRadio(name, value) {
	var el = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
	if (el) el.checked = true;
}

function setMultiSelect(id, values) {
	var el = byId(id);
	if (!el) return;

	for (var i = 0; i < el.options.length; i++) {
		el.options[i].selected = values.indexOf(el.options[i].value) !== -1;
	}
}

function setDuplicateValues(values) {
	var fields = document.querySelectorAll('input[name="duplicateName"]');
	for (var i = 0; i < fields.length; i++) {
		fields[i].value = values[i] || '';
	}
}

function byId(id) {
	return document.getElementById(id);
}
