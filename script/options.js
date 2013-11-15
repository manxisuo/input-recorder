var IMPORT_TIP_SUCCESS = chrome.i18n.getMessage('importTipSuccess');
var IMPORT_TIP_ERR_FORMAT = chrome.i18n.getMessage('importTipErrFormat');

$(function() {
	DbUtil.ensure();
	
	initUIText();

	$('#files').on('change', handleFileSelect);
	
	$('#import').on('click', function() {
		$('#files').click();
	});
	
	$('#export').on('click', function() {
		window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
		
		window.requestFileSystem(window.TEMPORARY, 500*1024, onInitFs, errorHandler);
		
	});
	
	$('#exportLink').on('click', function(){
		$(this).hide();
	});
});

function initUIText() {
	document.title = chrome.i18n.getMessage('optionsTitle');
	$('h1').text(document.title);
	$('#importLabel').text(chrome.i18n.getMessage('importLabel'));
	$('#importAttention').text(chrome.i18n.getMessage('importAttention'));
	$('#exportLabel').text(chrome.i18n.getMessage('exportLabel'));
	$('#exportLink').text(chrome.i18n.getMessage('exportLink'));
	$('#import').text(chrome.i18n.getMessage('importBtn'));
	$('#export').text(chrome.i18n.getMessage('exportBtn'));
}

function exportFile(fileEntry) {
	var url = fileEntry.toURL();
	var exportLink = $('#exportLink');
	exportLink.attr('href', url).show();
}

function onInitFs(fs) {
	var filename = 'log.txt';
	
	getFile(filename, fs, function(fileEntry) {
		fileEntry.remove(function() {
			createFile(filename, fs, function(fileEntry) {
			
				var content = DbUtil.getItemsString(false);
				writeFile(fileEntry, content, function() {
					exportFile(fileEntry);
				});
			});
		}, errorHandler);
	}, function() {
		createFile(filename, fs, function(fileEntry) {
			
			var content = DbUtil.getItemsString(false);
			writeFile(fileEntry, content, function() {
				exportFile(fileEntry);
			});
		});
	});
}

function getFile(filename, fs, successCallback, errorCallback) {
	fs.root.getFile(filename, {create: false}, function(fileEntry) {
		successCallback(fileEntry);
	}, 
	function(e) {
		errorCallback(e);
	});
}

function createFile(filename, fs, successCallback) {
	fs.root.getFile(filename, {create: true, exclusive: true}, function(fileEntry) {	
		successCallback(fileEntry);		
	}, errorHandler);
}

function writeFile(fileEntry, content, successCallback) {
	fileEntry.createWriter(function(fileWriter) {

		fileWriter.onwriteend = function(e) {
			successCallback();
		};

		fileWriter.onerror = function(e) {
			
		};

		var blob = new Blob([content], {type: 'application/json'});

		fileWriter.write(blob);

	}, errorHandler);
}

function showTip(msg) {
	var tip = $('#tip');
	tip.text(msg).fadeIn(1500);
	setTimeout(function(){
		tip.text(msg).fadeOut(500);
	}, 2000);
}

function handleFileSelect(e) {
	var files = e.target.files;

	for (var i =0, f; f = files[i]; i++) {
	
		var reader = new FileReader();
		
		reader.onload = (function(theFile) {
			return function (e) {
				var content = (e.target.result);

				if (DbUtil.isJSON(content)) {
					DbUtil.setItemsString(content);
					showTip(IMPORT_TIP_SUCCESS);
				}
				else {
					showTip(IMPORT_TIP_ERR_FORMAT);
				}
			}
		})(f);
		
		reader.readAsText(f);
	}
}

function errorHandler(e) {
  var msg = '';

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };

  console.log('Error: ' + msg);
}
