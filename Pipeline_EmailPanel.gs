/***** ASAP PIPELINE — CALC NOTES (server) ***********************************
 * Paste as a NEW file "Pipeline_CalcNotes.gs".
 * FIXES the disappearing-notes bug: the calculator's Notes panel used to save
 * ONLY to the browser's localStorage, which Google's sandbox clears — so notes
 * vanished hours later. Notes now also persist to a CalcNotes column on
 * Pipeline_Deals (self-created) and restore from there on load.
 *
 * Keyed the same way the calculator keys deals: SourceURL, or 'id:<DealID>'.
 * Depends on M1: ss_(), ASAP_CFG.
 *****************************************************************************/

function _cn_row_(sh, dealKey) {
  var vals = sh.getDataRange().getValues(), H = vals[0];
  var cId = H.indexOf('DealID'), cSrc = H.indexOf('SourceURL');
  var k = String(dealKey || '').trim();
  var wantId = (k.indexOf('id:') === 0) ? k.slice(3) : '';
  for (var r = 1; r < vals.length; r++) {
    if (wantId) { if (cId >= 0 && String(vals[r][cId]) === wantId) return { rowIdx: r, H: H }; }
    else if (cSrc >= 0 && String(vals[r][cSrc]).trim() === k) return { rowIdx: r, H: H };
  }
  // fallback: some callers pass a bare DealID
  if (!wantId && cId >= 0) {
    for (var r2 = 1; r2 < vals.length; r2++) { if (String(vals[r2][cId]) === k) return { rowIdx: r2, H: H }; }
  }
  return null;
}

function Pipeline_saveCalcNotes(dealKey, json) {
  try {
    if (!dealKey) return { ok: false, error: 'Missing deal key.' };
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!sh) return { ok: false, error: 'Pipeline_Deals tab not found.' };
    var lastCol = sh.getLastColumn();
    var H0 = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    if (H0.indexOf('CalcNotes') < 0) { lastCol++; sh.getRange(1, lastCol).setValue('CalcNotes').setFontWeight('bold'); }
    var hit = _cn_row_(sh, dealKey);
    if (!hit) return { ok: false, error: 'Deal not found for key.' };
    var s = String(json == null ? '' : json);
    if (s.length > 45000) s = s.slice(0, 45000);   // stay under the 50k cell limit
    sh.getRange(hit.rowIdx + 1, hit.H.indexOf('CalcNotes') + 1).setValue(s);
    return { ok: true };
  } catch (err) { return { ok: false, error: String(err) }; }
}

function Pipeline_getCalcNotes(dealKey) {
  try {
    if (!dealKey) return '';
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!sh) return '';
    var hit = _cn_row_(sh, dealKey);
    if (!hit) return '';
    var ci = hit.H.indexOf('CalcNotes');
    if (ci < 0) return '';
    return String(sh.getRange(hit.rowIdx + 1, ci + 1).getValue() || '');
  } catch (err) { return ''; }
}

/* ---- Per-deal Google Drive folder (auto-created, auto-linked) ----
 * pipeline_ensureDriveFolder(dealKey): returns the deal's Drive folder URL,
 * creating the folder (under 'ASAP Loan Applications') and saving it to the
 * DriveFolder column on first use. Works with a DealID or a calc dealKey.
 * pipeline_saveDocToDrive(...): drops a copy of an uploaded document into
 * that folder (used by the calculator's Documents section). */
function _cn_norm_(s) { return String(s || '').toLowerCase().replace(/[^0-9a-z]+/g, ''); }
/* Find this deal's existing folder under 'ASAP Loan Docs' (where the Documents
   section files docs), matching by address/borrower. Returns folder or null. */
function _cn_findDocsFolder_(addr, name) {
  try {
    var it = DriveApp.getFoldersByName('ASAP Loan Docs');
    if (!it.hasNext()) return null;
    var parent = it.next();
    var nAddr = _cn_norm_(addr), nName = _cn_norm_(name);
    var subs = parent.getFolders(), best = null;
    while (subs.hasNext()) {
      var f = subs.next(), nf = _cn_norm_(f.getName());
      if (!nf) continue;
      if ((nAddr && (nf.indexOf(nAddr) >= 0 || nAddr.indexOf(nf) >= 0)) ||
          (nName && nName.length > 4 && nf.indexOf(nName) >= 0)) { best = f; break; }
    }
    return best;
  } catch (e) { return null; }
}
function pipeline_ensureDriveFolder(dealKey) {
  try {
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!sh) return { ok: false, error: 'Pipeline_Deals tab not found.' };
    var lastCol = sh.getLastColumn();
    var H0 = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    if (H0.indexOf('DriveFolder') < 0) { lastCol++; sh.getRange(1, lastCol).setValue('DriveFolder').setFontWeight('bold'); }
    var hit = _cn_row_(sh, dealKey);
    if (!hit) return { ok: false, error: 'Deal not found.' };
    var ci = hit.H.indexOf('DriveFolder');
    var cur = ci >= 0 ? String(sh.getRange(hit.rowIdx + 1, ci + 1).getValue() || '').trim() : '';
    if (cur) return { ok: true, url: cur };
    var rowVals = sh.getRange(hit.rowIdx + 1, 1, 1, sh.getLastColumn()).getValues()[0];
    function gv(n){ var i = hit.H.indexOf(n); return i >= 0 ? String(rowVals[i] || '').trim() : ''; }
    var nm = gv('BorrowerName'), addr = gv('AssembledAddress'), did = gv('DealID');
    // 1) reuse the folder the Documents section already made for this deal
    var found = _cn_findDocsFolder_(addr, nm);
    var folder = found;
    // 2) otherwise create it in the SAME tree the Documents section uses
    if (!folder) {
      var pit = DriveApp.getFoldersByName('ASAP Loan Docs');
      var parent = pit.hasNext() ? pit.next() : DriveApp.createFolder('ASAP Loan Docs');
      var label = (addr || nm || did || 'deal').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
      folder = parent.createFolder(label);
    }
    var url = folder.getUrl();
    sh.getRange(hit.rowIdx + 1, hit.H.indexOf('DriveFolder') + 1).setValue(url);
    try { PL_cacheBust_(); } catch (e) {}
    return { ok: true, url: url, created: !found, relinked: !!found };
  } catch (err) { return { ok: false, error: String(err) }; }
}

/* ONE-TIME REPAIR — run in the editor: for every tracker deal whose linked folder
   is blank OR empty (like a stray folder created before the unification), find the
   real 'ASAP Loan Docs' folder and relink it. Logs what it did. */
function pipeline_ltRelinkDriveFolders() {
  var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
  if (!sh) { Logger.log('No deals tab'); return; }
  var vals = sh.getDataRange().getValues(), H = vals[0];
  var cId = H.indexOf('DealID'), cAdd = H.indexOf('TrackerAdded'), cDr = H.indexOf('DriveFolder'),
      cNm = H.indexOf('BorrowerName'), cAd = H.indexOf('AssembledAddress');
  if (cDr < 0) { Logger.log('No DriveFolder column yet'); return; }
  var fixed = 0;
  for (var r = 1; r < vals.length; r++) {
    if (cAdd < 0 || String(vals[r][cAdd]).trim() === '') continue;
    var cur = String(vals[r][cDr] || '').trim();
    var isEmptyStray = false;
    if (cur) {
      try {
        var m = cur.match(/folders\/([A-Za-z0-9_-]+)/);
        if (m) { var fo = DriveApp.getFolderById(m[1]); isEmptyStray = !fo.getFiles().hasNext() && !fo.getFolders().hasNext(); }
      } catch (e) { isEmptyStray = true; }
    }
    if (cur && !isEmptyStray) continue;
    var found = _cn_findDocsFolder_(String(vals[r][cAd] || ''), String(vals[r][cNm] || ''));
    if (found) { sh.getRange(r + 1, cDr + 1).setValue(found.getUrl()); fixed++; Logger.log('Relinked ' + vals[r][cId] + ' -> ' + found.getName()); }
  }
  try { PL_cacheBust_(); } catch (e) {}
  Logger.log('Done. Relinked ' + fixed + ' deal(s).');
}

/* Write the folder URL onto the deal ONLY if none is linked yet (never overwrites). */
function pipeline_linkDriveFolderIfEmpty(dealKey, url) {
  try {
    if (!dealKey || !url) return { ok: false };
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!sh) return { ok: false };
    var lastCol = sh.getLastColumn();
    var H0 = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    if (H0.indexOf('DriveFolder') < 0) { lastCol++; sh.getRange(1, lastCol).setValue('DriveFolder').setFontWeight('bold'); }
    var hit = _cn_row_(sh, dealKey);
    if (!hit) return { ok: false };
    var ci = hit.H.indexOf('DriveFolder');
    var cur = ci >= 0 ? String(sh.getRange(hit.rowIdx + 1, ci + 1).getValue() || '').trim() : '';
    if (cur) return { ok: true, url: cur };
    sh.getRange(hit.rowIdx + 1, hit.H.indexOf('DriveFolder') + 1).setValue(String(url));
    try { PL_cacheBust_(); } catch (e) {}
    return { ok: true, url: String(url), created: true };
  } catch (err) { return { ok: false }; }
}
/* Read the linked folder URL for a deal ('' if none). */
function pipeline_getLinkedDriveFolder_(dealKey) {
  try {
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!sh) return '';
    var hit = _cn_row_(sh, dealKey);
    if (!hit) return '';
    var ci = hit.H.indexOf('DriveFolder');
    return ci >= 0 ? String(sh.getRange(hit.rowIdx + 1, ci + 1).getValue() || '').trim() : '';
  } catch (err) { return ''; }
}

function pipeline_saveDocToDrive(dealKey, b64, mime, name) {
  try {
    if (!dealKey || !b64) return { ok: false, error: 'Missing deal or file.' };
    var f = pipeline_ensureDriveFolder(dealKey);
    if (!f.ok) return f;
    var folderId = String(f.url).match(/folders\/([A-Za-z0-9_-]+)/);
    var folder = folderId ? DriveApp.getFolderById(folderId[1]) : null;
    if (!folder) return { ok: false, error: 'Folder not reachable.' };
    var fname = String(name || 'document.pdf');
    var existing = folder.getFilesByName(fname);
    if (existing.hasNext()) return { ok: true, url: f.url, fileUrl: existing.next().getUrl() };
    var blob = Utilities.newBlob(Utilities.base64Decode(b64), mime || 'application/pdf', fname);
    var made = folder.createFile(blob);
    return { ok: true, url: f.url, fileUrl: made.getUrl() };
  } catch (err) { return { ok: false, error: String(err) }; }
}


/* Uncheck "Add to Loan Tracker" (clears TrackerAdded only — the Pipeline deal and
   all its details are never touched). Defined here as well as in the tracker file
   on purpose: identical copies, so the toggle works whichever file is current. */
function pipeline_ltRemove(dealId) {
  try {
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!sh) return { ok: false, error: 'Pipeline_Deals tab not found.' };
    var vals = sh.getDataRange().getValues(), H = vals[0];
    var cId = H.indexOf('DealID'), cAdded = H.indexOf('TrackerAdded');
    if (cId < 0 || cAdded < 0) return { ok: false, error: 'Columns not found.' };
    for (var r = 1; r < vals.length; r++) {
      if (String(vals[r][cId]) === String(dealId)) {
        sh.getRange(r + 1, cAdded + 1).setValue('');
        try { PL_cacheBust_(); } catch (e) {}
        return { ok: true };
      }
    }
    return { ok: false, error: 'Deal not found.' };
  } catch (err) { return { ok: false, error: String(err) }; }
}