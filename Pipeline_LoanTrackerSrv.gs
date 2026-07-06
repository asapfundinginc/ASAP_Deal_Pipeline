/***** ASAP PIPELINE — LOAN TRACKER (server) · Option A: Pipeline_Deals = source ****
 * Paste as a NEW script file ("Pipeline_LoanTracker.gs") in the SAME project as
 * M1–M4. Depends on:
 *   • M1: ASAP_CFG, ss_()
 *   • M4: _pl_tz_(), Pipeline_numStr_(), Pipeline_mapLoanPurpose_()
 *
 * WHAT IT DOES
 *   The hub Loan Tracker shows deals flagged "Add to Loan Tracker" (TrackerAdded)
 *   and stores its OWN workflow fields as NEW append-only columns on
 *   Pipeline_Deals — one source of truth. Grading fields (LoanType / LoanAmount /
 *   AssembledAddress) stay card-owned and are read-only here, so grading and
 *   Matched Lenders never go stale.
 *
 *   pipeline_getTracker()                     -> { ok, deals:[...] }   (dashboard read)
 *   pipeline_saveTrackerField(id, field, val) -> { ok, field, value }  (inline edit)
 *
 * Your existing separate "Loan Tracker" Google Sheet is now OPTIONAL — the card's
 * Add-to-Tracker still copies to it (harmless); retire that copy later if you like.
 ***********************************************************************************/

/* Workflow columns the Loan Tracker owns (added by HEADER NAME, append-only). */
var LT_COLS = ['DealStatus', 'CurrentStatus', 'TrackerOwner', 'ExpectedComp', 'TrackerPoints',
               'TrackerLender', 'EstCloseDate', 'FollowUpDate', 'FollowUpTime', 'FollowUpResolved', 'TrackerNotes', 'DriveFolder', 'CompManual'];

/* Allowed values — keep in sync with the hub UI. */
var LT_DEAL_STATUSES = ['Shopping', 'Planning', 'Secured', 'On Hold', 'Credit Repair', 'Nurture/Future', 'Dead', 'Funded'];
var LT_CURR_STATUSES = ['', 'Application Sent', 'Application Received', 'Pre-Approved', 'Waiting on Docs', 'Processing', 'Underwriting', 'Clear to Close'];
var LT_ARCHIVED_DS   = { 'Dead': 1, 'Funded': 1 };
var LT_OWNERS        = ['DK', 'SP'];

/* Ensure the Loan Tracker columns exist on Pipeline_Deals (append-only, by name). */
function pipeline_ltEnsureCols_() {
  var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
  if (!sh) return null;
  var lastCol = sh.getLastColumn();
  var H = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  LT_COLS.forEach(function (name) {
    if (H.indexOf(name) < 0) { lastCol++; sh.getRange(1, lastCol).setValue(name).setFontWeight('bold'); H.push(name); }
  });
  return sh;
}

/* A stored date cell (Date or 'YYYY-MM-DD' text) -> ISO 'YYYY-MM-DD' ('' if blank). */
function _lt_iso_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, _pl_tz_(), 'yyyy-MM-dd');
  var s = String(v == null ? '' : v).trim();
  var m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? (m[1] + '-' + m[2] + '-' + m[3]) : '';
}
function _lt_num_(v) { var s = Pipeline_numStr_(v); return s === '' ? null : Number(s); }

/* READ — every deal flagged into the Loan Tracker, with its workflow fields. */
function pipeline_getTracker() {
  try {
    try { var hit = CacheService.getScriptCache().get('PL_TRACKER_V1'); if (hit) return JSON.parse(hit); } catch (e) {}
    var sh = pipeline_ltEnsureCols_();
    if (!sh) return { ok: false, error: 'Pipeline_Deals tab not found.' };
    var vals = sh.getDataRange().getValues(), H = vals[0];
    function c(name) { return H.indexOf(name); }
    var cId = c('DealID'), cAdded = c('TrackerAdded'),
        cBorr = c('BorrowerName'), cAddr = c('AssembledAddress'),
        cLType = c('LoanType'), cAmt = c('LoanAmount'), cBEm = c('BorrowerEmail'),
        cDS = c('DealStatus'), cCS = c('CurrentStatus'), cOwn = c('TrackerOwner'),
        cComp = c('ExpectedComp'), cPts = c('TrackerPoints'), cLen = c('TrackerLender'),
        cClose = c('EstCloseDate'), cFU = c('FollowUpDate'), cFT = c('FollowUpTime'),
        cFR = c('FollowUpResolved'), cNotes = c('TrackerNotes'), cDrive = c('DriveFolder');
    if (cId < 0 || cAdded < 0) return { ok: true, deals: [] };
    var out = [];
    for (var r = 1; r < vals.length; r++) {
      if (String(vals[r][cAdded]).trim() === '') continue;   // tracker = flagged deals only
      var row = vals[r];
      var d = {}; for (var i = 0; i < H.length; i++) d[H[i]] = row[i];
      var ds = String(row[cDS] || '').trim() || 'Shopping';
      out.push({
        id:            String(row[cId]),
        borrower:      String(row[cBorr] || '').trim(),
        borrowerEmail: String(cBEm >= 0 ? (row[cBEm] || '') : '').trim(),
        address:       String(row[cAddr] || '').trim(),
        loanType:      String(row[cLType] || '').trim(),
        propertyType:  String(d.PropertyType || '').trim(),
        purpose:       Pipeline_mapLoanPurpose_(d).purpose,   // card-derived (read-only here)
        loanAmount:    _lt_num_(row[cAmt]),
        dealStatus:    ds,
        currentStatus: String(row[cCS] || '').trim(),
        owner:         String(row[cOwn] || '').trim() || 'DK',
        comp:          _lt_num_(row[cComp]),
        points:        String(row[cPts] || '').trim(),
        lender:        String(row[cLen] || '').trim(),
        closeISO:      _lt_iso_(row[cClose]),
        followISO:     _lt_iso_(row[cFU]),
        followTime:    String(row[cFT] || '').trim(),
        followResolved: String(row[cFR] || '').trim() !== '',
        notes:         String(row[cNotes] || '').trim(),
        driveFolder:   String(cDrive >= 0 ? (row[cDrive] || '') : '').trim(),
        archived:      !!LT_ARCHIVED_DS[ds]
      });
    }
    var res = { ok: true, deals: out };
    try { var js = JSON.stringify(res); if (js.length < 95000) CacheService.getScriptCache().put('PL_TRACKER_V1', js, 30); } catch (e) {}
    return res;
  } catch (err) { return { ok: false, error: String(err) }; }
}

/* SAVE — one workflow field for one deal. Card-owned fields are refused here. */
function pipeline_saveTrackerField(dealId, field, value) {
  try { PL_cacheBust_(); } catch (e) {}
  try {
    var MAP = {
      dealStatus: 'DealStatus', currentStatus: 'CurrentStatus', owner: 'TrackerOwner',
      comp: 'ExpectedComp', points: 'TrackerPoints', lender: 'TrackerLender',
      close: 'EstCloseDate', follow: 'FollowUpDate', followTime: 'FollowUpTime',
      notes: 'TrackerNotes', driveFolder: 'DriveFolder',
      loanAmount: 'LoanAmount'          // editable here too — grading re-runs off the new figure automatically
    };
    var col = MAP[field];
    if (!col) return { ok: false, error: 'Field "' + field + '" is not editable in the Loan Tracker.' };

    if (field === 'dealStatus'   && LT_DEAL_STATUSES.indexOf(String(value)) < 0) return { ok: false, error: 'Bad Deal Status.' };
    if (field === 'currentStatus' && LT_CURR_STATUSES.indexOf(String(value)) < 0) return { ok: false, error: 'Bad Current Status.' };
    if (field === 'owner'        && LT_OWNERS.indexOf(String(value)) < 0)        return { ok: false, error: 'Bad owner.' };
    if (field === 'loanAmount') {
      var laNum = parseFloat(String(value).replace(/[^0-9.]/g, ''));
      if (isNaN(laNum) || laNum < 0) return { ok: false, error: 'Enter a valid loan amount.' };
      value = laNum;
    }

    var sh = pipeline_ltEnsureCols_();
    if (!sh) return { ok: false, error: 'Pipeline_Deals tab not found.' };
    var vals = sh.getDataRange().getValues(), H = vals[0], cId = H.indexOf('DealID');
    var rowIdx = -1;
    for (var r = 1; r < vals.length; r++) { if (String(vals[r][cId]) === String(dealId)) { rowIdx = r; break; } }
    if (rowIdx < 0) return { ok: false, error: 'Deal ' + dealId + ' not found.' };

    function setCol(name, v) {
      var ci = H.indexOf(name); if (ci < 0) return;
      var cell = sh.getRange(rowIdx + 1, ci + 1);
      if (name === 'EstCloseDate' || name === 'FollowUpDate' || name === 'FollowUpTime') cell.setNumberFormat('@'); // keep as plain text
      cell.setValue(v);
    }

    var writeVal = value;
    if (field === 'comp')                        writeVal = (_lt_num_(value) == null ? '' : _lt_num_(value));
    if (field === 'close' || field === 'follow') writeVal = _lt_iso_(value);            // store as ISO text
    if (field === 'followTime')                  writeVal = (writeVal ? String(writeVal).trim() : '');

    setCol(col, writeVal == null ? '' : writeVal);

    // Manual comp override wins over the calculator until the field is cleared.
    if (field === 'comp') setCol('CompManual', (String(writeVal).trim() === '' ? '' : '1'));

    // nag-resolve rules (mirror the hub): a status change stops the nag; a new/pushed
    // follow date restarts it; clearing the date clears the time too.
    if (field === 'dealStatus' || field === 'currentStatus') setCol('FollowUpResolved', new Date());
    if (field === 'follow') { setCol('FollowUpResolved', ''); if (writeVal === '') setCol('FollowUpTime', ''); }

    return { ok: true, field: field, value: (writeVal == null ? '' : writeVal) };
  } catch (err) { return { ok: false, error: String(err) }; }
}

/* One-click diagnostic — run in the editor, then View > Execution log. */
function pipeline_ltTest() {
  var res = pipeline_getTracker();
  Logger.log('LOAN TRACKER -> ' + (res.ok ? (res.deals.length + ' flagged deal(s)') : ('ERROR: ' + res.error)));
  Logger.log(JSON.stringify(res, null, 2).slice(0, 3000));
}

/* ---- Serve the Loan Tracker page + hand the client the web-app base URL ----
 * ONE edit to Code.gs doGet(e): add near the top, next to the dashboard line:
 *     if (e && e.parameter && e.parameter.loantracker) return Pipeline_serveLoanTracker();
 * Then Deploy > Manage deployments > (edit) > New version. Open: <your /exec>?loantracker
 */
function Pipeline_serveLoanTracker() {
  return HtmlService.createHtmlOutputFromFile('Pipeline_LoanTracker')
    .setTitle('ASAP Loan Tracker')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
function pipeline_hubUrl() {
  try { return ScriptApp.getService().getUrl(); } catch (e) { return ''; }
}

/* Nav badge counts for the hub header (Board = non-archived deals on the board). */
function pipeline_ltNavCounts() {
  try {
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!sh) return { board: 0 };
    var vals = sh.getDataRange().getValues(), H = vals[0];
    var cId = H.indexOf('DealID'), cArch = H.indexOf('Archived');
    var n = 0;
    for (var r = 1; r < vals.length; r++) {
      if (cId >= 0 && String(vals[r][cId]).trim() === '') continue;
      if (cArch >= 0 && String(vals[r][cArch]).trim() !== '') continue;
      n++;
    }
    return { board: n };
  } catch (err) { return { board: 0 }; }
}

/* Remove a deal from the Loan Tracker (clears the TrackerAdded flag).
   The deal itself stays on the Pipeline board — nothing is deleted. */
function pipeline_ltRemove(dealId) {
  try { PL_cacheBust_(); } catch (e) {}
  try {
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!sh) return { ok: false, error: 'Pipeline_Deals tab not found.' };
    var vals = sh.getDataRange().getValues(), H = vals[0];
    var cId = H.indexOf('DealID'), cAdded = H.indexOf('TrackerAdded');
    if (cId < 0 || cAdded < 0) return { ok: false, error: 'Columns not found.' };
    for (var r = 1; r < vals.length; r++) {
      if (String(vals[r][cId]) === String(dealId)) { sh.getRange(r + 1, cAdded + 1).setValue(''); return { ok: true }; }
    }
    return { ok: false, error: 'Deal not found.' };
  } catch (err) { return { ok: false, error: String(err) }; }
}