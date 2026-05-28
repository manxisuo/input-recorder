
// MV3 content script (no jQuery). Handles query/restore via runtime messaging.
'use strict';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	try {
		if (request && request.action === 'ping') {
			sendResponse({ok: true});
		} else if (request && request.action === 'query') {
			sendResponse({data: queryData()});
		} else if (request && request.action === 'restore') {
			var report = restoreData(request.data || []);
			sendResponse({ok: true, report: report});
		}
	} catch (e) {
		sendResponse({ok: false, error: String(e && e.message ? e.message : e)});
	}
	// sync responses only
	return false;
});

function queryData() {
	var nodes = document.querySelectorAll('input, textarea, select, [contenteditable]');
	var out = [];

	for (var i = 0; i < nodes.length; i++) {
		var el = nodes[i];
		if (!el) continue;
		if (el.disabled) continue;

		var tag = (el.tagName || '').toLowerCase();
		var type = (el.getAttribute('type') || '').toLowerCase();
		var isEditable = isContentEditableField(el);

		// Skip sensitive/irrelevant inputs
		if (tag === 'input') {
			if (type === 'password') continue;
			if (type === 'file') continue;
			if (type === 'hidden') continue;
			if (type === 'submit' || type === 'button' || type === 'reset' || type === 'image') continue;
		}
		if (isSensitiveField(el)) continue;

		var value;
		if (tag === 'input' && (type === 'checkbox' || type === 'radio')) {
			value = !!el.checked;
		} else if (tag === 'select' && el.multiple) {
			value = getSelectedValues(el);
		} else if (isEditable) {
			value = el.textContent || '';
		} else {
			value = el.value;
		}

		var meta = getFieldMeta(el);

		out.push({
			ver: 2,
			sel: getBestSelector(el),
			meta: meta,
			value: value
		});
	}

	return out;
}

function restoreData(data) {
	var applied = 0;
	var skipped = 0;
	var reasons = {
		no_match: 0,
		ambiguous: 0,
		low_confidence: 0,
		incompatible_type: 0,
		sensitive_field: 0,
		invalid_selector: 0
	};

	for (var i = 0; i < data.length; i++) {
		var rec = data[i];
		if (!rec || !rec.sel) continue;

		var found = findBestElementForRecord(rec);
		if (!found || !found.el) {
			skipped++;
			if (found && found.reason && reasons.hasOwnProperty(found.reason)) reasons[found.reason]++;
			else reasons.no_match++;
			continue;
		}

		if (isSensitiveField(found.el)) {
			skipped++;
			reasons.sensitive_field++;
			continue;
		}

		applyValue(found.el, rec.value);
		highlight(found.el);
		applied++;
	}

	return {
		total: data.length,
		applied: applied,
		skipped: skipped,
		reasons: reasons
	};
}

function applyValue(el, value) {
	if (!el) return;
	var tag = (el.tagName || '').toLowerCase();
	var type = (el.getAttribute('type') || '').toLowerCase();

	if (isContentEditableField(el)) {
		applyContentEditableValue(el, value);
		dispatch(el, 'input');
		return;
	}

	if (tag === 'input' && (type === 'checkbox' || type === 'radio') && typeof value === 'boolean') {
		el.checked = value;
		dispatch(el, 'change');
		return;
	}

	if (tag === 'select' && el.multiple && Array.isArray(value)) {
		setSelectedValues(el, value);
		dispatch(el, 'change');
		return;
	}

	if (typeof value !== 'undefined') {
		el.value = value;
		dispatch(el, 'input');
		dispatch(el, 'change');
	}
}

function dispatch(el, type) {
	try {
		el.dispatchEvent(new Event(type, {bubbles: true}));
	} catch (e) {}
}

function applyContentEditableValue(el, value) {
	var text = typeof value === 'undefined' ? '' : String(value);
	var inserted = false;

	try {
		el.focus();
		var selection = window.getSelection && window.getSelection();
		var range = document.createRange && document.createRange();

		if (selection && range) {
			range.selectNodeContents(el);
			selection.removeAllRanges();
			selection.addRange(range);
			inserted = document.execCommand && document.execCommand('insertText', false, text);
		}
	} catch (e) {
		inserted = false;
	}

	if (!inserted) el.textContent = text;
}

function getSelectedValues(el) {
	var values = [];
	for (var i = 0; i < el.options.length; i++) {
		if (el.options[i].selected) values.push(el.options[i].value);
	}
	return values;
}

function setSelectedValues(el, values) {
	for (var i = 0; i < el.options.length; i++) {
		el.options[i].selected = values.indexOf(el.options[i].value) !== -1;
	}
}

function highlight(el) {
	el.classList.add('light-border');
	setTimeout(function() {
		el.classList.remove('light-border');
	}, 1000);
}

function getBestSelector(el) {
	// 1) Prefer ID.
	if (el.id) return '#' + cssEscape(el.id);

	// 2) Unique name selector (common for forms).
	var name = el.getAttribute('name');
	if (name) {
		var tag = (el.tagName || '').toLowerCase();
		var sel = tag + '[name="' + cssEscapeAttr(name) + '"]';
		try {
			if (document.querySelectorAll(sel).length === 1) return sel;
		} catch (e) {}
	}

	// 3) Fallback: build a short-ish CSS path with :nth-of-type.
	return buildCssPath(el);
}

function findBestElementForRecord(rec) {
	// 1) Try recorded selector first (fast path)
	if (rec.sel) {
		try {
			var els = document.querySelectorAll(rec.sel);
			if (els && els.length === 1) {
				if (!rec.meta) return {el: els[0], score: 100, reason: null};

				var bestSingle = scoreCandidates(els, rec);
				if (bestSingle && bestSingle.el) return bestSingle;
				return {el: null, reason: bestSingle && bestSingle.reason ? bestSingle.reason : 'low_confidence'};
			}
			if (els && els.length > 1) {
				// Disambiguate with meta if available
				var bestFromSel = scoreCandidates(els, rec);
				if (bestFromSel && bestFromSel.el) return bestFromSel;
				return {el: null, reason: bestFromSel && bestFromSel.reason ? bestFromSel.reason : 'ambiguous'};
			}
		} catch (e) {
			if (!rec.meta) return {el: null, reason: 'invalid_selector'};
		}
	}

	// 2) Heuristic match using meta (works across DOM shifts / rerenders)
	if (!rec.meta) return null;

	// ID is the strongest key.
	if (rec.meta.id) {
		var byId = document.getElementById(rec.meta.id);
		if (byId) {
			var bestById = scoreCandidates([byId], rec);
			if (bestById && bestById.el) return bestById;
			return {el: null, reason: bestById && bestById.reason ? bestById.reason : 'low_confidence'};
		}
	}

	var tag = rec.meta.tag || null;
	if (!tag) return null;

	var candidates = [];
	try {
		candidates = document.querySelectorAll(tag);
	} catch (e2) {
		return null;
	}

	return scoreCandidates(candidates, rec);
}

function scoreCandidates(nodeList, rec) {
	if (!nodeList || !nodeList.length) return null;

	var meta = rec.meta || {};
	var wantLabel = normalizeStr(meta.label);
	var wantAria = normalizeStr(meta.ariaLabel);
	var wantAriaPlaceholder = normalizeStr(meta.ariaPlaceholder);
	var wantPh = normalizeStr(meta.placeholder);
	var wantName = meta.name || '';
	var wantType = meta.type || '';
	var wantDataTest = meta.dataTest || '';

	var best = null;
	var bestScore = -1;
	var incompatibleCount = 0;

	for (var i = 0; i < nodeList.length; i++) {
		var el = nodeList[i];
		if (!el || el.disabled) continue;

		var tag = (el.tagName || '').toLowerCase();
		if (meta.tag && tag !== meta.tag) continue;

		var type = (el.getAttribute('type') || '').toLowerCase();
		if (!isCompatibleField(el, meta)) {
			incompatibleCount++;
			continue;
		}

		var score = 0;

		if (meta.id && el.id === meta.id) score += 100;

		var name = el.getAttribute('name') || '';
		if (wantName && name === wantName) score += 60;

		if (wantType && normalizeInputType(type) === normalizeInputType(wantType)) score += 10;

		if (meta.contentEditable && isContentEditableField(el)) score += 25;

		var aria = normalizeStr(el.getAttribute('aria-label'));
		if (wantAria && aria && aria === wantAria) score += 30;

		var ariaPlaceholder = normalizeStr(el.getAttribute('aria-placeholder'));
		if (wantAriaPlaceholder && ariaPlaceholder && ariaPlaceholder === wantAriaPlaceholder) score += 25;

		var ph = normalizeStr(el.getAttribute('placeholder'));
		if (wantPh && ph && ph === wantPh) score += 25;

		var lbl = normalizeStr(getLabelText(el));
		if (wantLabel && lbl && lbl === wantLabel) score += 35;

		var dt = getDataTestId(el);
		if (wantDataTest && dt && dt === wantDataTest) score += 40;

		// Tie-breakers: stable attributes
		if (meta.autocomplete && (el.getAttribute('autocomplete') || '') === meta.autocomplete) score += 5;
		if (meta.role && (el.getAttribute('role') || '') === meta.role) score += 5;

		if (score > bestScore) {
			bestScore = score;
			best = el;
		}
	}

	// Require evidence to avoid wrong fills.
	if (best && bestScore >= 20) return {el: best, score: bestScore, reason: null};
	if (best) return {el: null, score: bestScore, reason: 'low_confidence'};
	if (incompatibleCount > 0) return {el: null, score: -1, reason: 'incompatible_type'};
	return {el: null, score: -1, reason: 'no_match'};
}

function isCompatibleField(el, meta) {
	if (!meta) return true;

	var actualEditable = isContentEditableField(el);
	var wantedEditable = !!meta.contentEditable;
	if (actualEditable || wantedEditable) return actualEditable === wantedEditable;

	var tag = (el.tagName || '').toLowerCase();
	if (meta.tag && tag !== meta.tag) return false;

	if (tag === 'input') {
		var actualType = normalizeInputType(el.getAttribute('type'));
		var wantedType = normalizeInputType(meta.type);
		if (!wantedType) return true;

		return inputTypeCategory(actualType) === inputTypeCategory(wantedType);
	}

	if (tag === 'select' && typeof meta.multiple !== 'undefined') {
		return !!el.multiple === !!meta.multiple;
	}

	return true;
}

function isContentEditableField(el) {
	return !!(el && el.isContentEditable);
}

function isSensitiveField(el) {
	if (!el) return false;

	var tag = (el.tagName || '').toLowerCase();
	var type = normalizeInputType(el.getAttribute('type'));

	if (tag === 'input' && (type === 'password' || type === 'file' || type === 'hidden')) return true;

	var autocomplete = normalizeStr(el.getAttribute('autocomplete'));
	if (autocomplete) {
		if (autocomplete === 'one-time-code') return true;
		if (autocomplete.indexOf('cc-') === 0) return true;
	}

	var text = normalizeSensitiveText([
		el.id,
		el.getAttribute('name'),
		el.getAttribute('placeholder'),
		el.getAttribute('aria-label'),
		el.getAttribute('aria-placeholder'),
		el.getAttribute('autocomplete'),
		getLabelText(el)
	].join(' '));

	if (!text) return false;

	return (
		hasSensitiveToken(text, ['otp', 'totp', '2fa', 'mfa']) ||
		hasSensitivePhrase(text, ['one time code', 'verification code', 'auth code', 'security code', '验证码']) ||
		hasSensitivePhrase(text, ['credit card', 'card number', 'cc number', '信用卡']) ||
		hasSensitiveToken(text, ['cvv', 'cvc', 'csc', 'cvn']) ||
		hasSensitiveToken(text, ['ssn']) ||
		hasSensitivePhrase(text, ['social security', '身份证']) ||
		hasSensitivePhrase(text, ['api key', 'apikey', 'api token', 'access token', 'refresh token', 'bearer token']) ||
		hasSensitivePhrase(text, ['client secret', 'private key', '密钥']) ||
		hasSensitiveToken(text, ['secret', 'token'])
	);
}

function normalizeSensitiveText(str) {
	return String(str || '')
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.toLowerCase()
		.replace(/[_-]+/g, ' ')
		.replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function hasSensitiveToken(text, tokens) {
	var padded = ' ' + text + ' ';
	for (var i = 0; i < tokens.length; i++) {
		if (padded.indexOf(' ' + tokens[i] + ' ') !== -1) return true;
	}
	return false;
}

function hasSensitivePhrase(text, phrases) {
	for (var i = 0; i < phrases.length; i++) {
		if (text.indexOf(phrases[i]) !== -1) return true;
	}
	return false;
}

function normalizeInputType(type) {
	return String(type || 'text').toLowerCase();
}

function inputTypeCategory(type) {
	type = normalizeInputType(type);

	if (type === 'checkbox') return 'checkbox';
	if (type === 'radio') return 'radio';

	if (
		type === 'button' ||
		type === 'submit' ||
		type === 'reset' ||
		type === 'image' ||
		type === 'file' ||
		type === 'hidden' ||
		type === 'password'
	) {
		return 'unsupported';
	}

	return 'text-like';
}

function buildCssPath(el) {
	var parts = [];
	var curr = el;
	var depth = 0;

	while (curr && curr.nodeType === 1 && curr !== document.body && depth < 8) {
		var tag = curr.tagName.toLowerCase();
		var nth = nthOfType(curr);
		parts.unshift(tag + ':nth-of-type(' + nth + ')');
		curr = curr.parentElement;
		depth++;
	}

	parts.unshift('body');
	return parts.join(' > ');
}

function nthOfType(el) {
	var tag = el.tagName;
	var n = 1;
	var sib = el;
	while ((sib = sib.previousElementSibling)) {
		if (sib.tagName === tag) n++;
	}
	return n;
}

function cssEscape(str) {
	if (window.CSS && window.CSS.escape) return window.CSS.escape(str);
	// minimal fallback
	return String(str).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

function cssEscapeAttr(str) {
	// escape quotes and backslashes for attribute selectors
	return String(str).replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\"');
}

function getFieldMeta(el) {
	var tag = (el.tagName || '').toLowerCase();
	var type = (el.getAttribute('type') || '').toLowerCase();

	var meta = {
		tag: tag,
		type: type || undefined,
		id: el.id || undefined,
		name: el.getAttribute('name') || undefined,
		placeholder: el.getAttribute('placeholder') || undefined,
		ariaLabel: el.getAttribute('aria-label') || undefined,
		ariaPlaceholder: el.getAttribute('aria-placeholder') || undefined,
		role: el.getAttribute('role') || undefined,
		autocomplete: el.getAttribute('autocomplete') || undefined,
		multiple: tag === 'select' ? !!el.multiple : undefined,
		contentEditable: isContentEditableField(el) || undefined,
		label: getLabelText(el) || undefined,
		dataTest: getDataTestId(el) || undefined
	};

	return meta;
}

function getDataTestId(el) {
	// Common testing/stability attributes used by many sites.
	return (
		el.getAttribute('data-testid') ||
		el.getAttribute('data-test') ||
		el.getAttribute('data-qa') ||
		el.getAttribute('data-cy') ||
		''
	);
}

function getLabelText(el) {
	// label[for=id]
	var out = '';
	try {
		if (el.id && window.CSS && window.CSS.escape) {
			var lbl = document.querySelector('label[for="' + cssEscapeAttr(el.id) + '"]');
			if (lbl) out = extractText(lbl);
		}
	} catch (e) {}

	// wrapped label <label> <input ...> Text </label>
	if (!out && el.closest) {
		var parentLabel = el.closest('label');
		if (parentLabel) out = extractText(parentLabel);
	}

	return (out || '').trim();
}

function extractText(node) {
	if (!node) return '';
	// Prefer textContent; remove excessive whitespace.
	return String(node.textContent || '').replace(/\s+/g, ' ').trim();
}

function normalizeStr(str) {
	return String(str || '').replace(/\s+/g, ' ').trim().toLowerCase();
}
