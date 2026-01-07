
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
	var nodes = document.querySelectorAll('input, textarea, select');
	var out = [];

	for (var i = 0; i < nodes.length; i++) {
		var el = nodes[i];
		if (!el) continue;
		if (el.disabled) continue;

		var tag = (el.tagName || '').toLowerCase();
		var type = (el.getAttribute('type') || '').toLowerCase();

		// Skip sensitive/irrelevant inputs
		if (tag === 'input') {
			if (type === 'password') continue;
			if (type === 'file') continue;
			if (type === 'hidden') continue;
			if (type === 'submit' || type === 'button' || type === 'reset' || type === 'image') continue;
		}

		var value;
		if (tag === 'input' && (type === 'checkbox' || type === 'radio')) {
			value = !!el.checked;
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

	if (tag === 'input' && (type === 'checkbox' || type === 'radio') && typeof value === 'boolean') {
		el.checked = value;
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
			if (els && els.length === 1) return {el: els[0], score: 100, reason: null};
			if (els && els.length > 1) {
				// Disambiguate with meta if available
				var bestFromSel = scoreCandidates(els, rec);
				if (bestFromSel && bestFromSel.el) return bestFromSel;
				return {el: null, reason: bestFromSel && bestFromSel.reason ? bestFromSel.reason : 'ambiguous'};
			}
			return {el: null, reason: 'no_match'};
		} catch (e) {
			return {el: null, reason: 'invalid_selector'};
		}
	}

	// 2) Heuristic match using meta (works across DOM shifts / rerenders)
	if (!rec.meta) return null;

	// ID is the strongest key.
	if (rec.meta.id) {
		var byId = document.getElementById(rec.meta.id);
		if (byId) return {el: byId, score: 100, reason: null};
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
	var wantPh = normalizeStr(meta.placeholder);
	var wantName = meta.name || '';
	var wantType = meta.type || '';
	var wantDataTest = meta.dataTest || '';

	var best = null;
	var bestScore = -1;

	for (var i = 0; i < nodeList.length; i++) {
		var el = nodeList[i];
		if (!el || el.disabled) continue;

		var tag = (el.tagName || '').toLowerCase();
		if (meta.tag && tag !== meta.tag) continue;

		var type = (el.getAttribute('type') || '').toLowerCase();
		if (meta.tag === 'input' && wantType && type && wantType !== type) {
			// If record has a type, prefer the same type. (Don't hard reject if missing.)
			// continue;
		}

		var score = 0;

		if (meta.id && el.id === meta.id) score += 100;

		var name = el.getAttribute('name') || '';
		if (wantName && name === wantName) score += 60;

		if (wantType && type === wantType) score += 10;

		var aria = normalizeStr(el.getAttribute('aria-label'));
		if (wantAria && aria && aria === wantAria) score += 30;

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
	return {el: null, score: -1, reason: 'no_match'};
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
		role: el.getAttribute('role') || undefined,
		autocomplete: el.getAttribute('autocomplete') || undefined,
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