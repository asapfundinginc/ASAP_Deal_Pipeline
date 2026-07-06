/***** ASAP PIPELINE — LOAN TRACKER REMINDERS (server) *************************
 * Paste as a NEW file "Pipeline_LoanTrackerReminders.gs" alongside M1–M4 and
 * Pipeline_LoanTracker.gs. Depends on:
 *   • M1: ss_(), ASAP_CFG
 *   • M4: _pl_tz_()
 *   • Pipeline_LoanTracker.gs: pipeline_ltEnsureCols_()
 *
 * WHAT IT DOES
 *   A single time-driven sweep (every 5 minutes) that:
 *     1) fires a TIMED follow-up reminder by its set time (with a 5-min lead so
 *        it lands BY the set time, never after),
 *     2) sends a DAILY ~7am digest of due/overdue date-only follow-ups,
 *   each to the deal's OWNER only (DK vs SP), repeating until the follow-up is
 *   resolved (status changed / date pushed / cleared — handled in
 *   pipeline_saveTrackerField).
 *
 * SETUP (once, in the editor):
 *   • Optional dry run first:  pipeline_ltReminderPreview   (logs, sends nothing)
 *   • Then run:                pipeline_ltInstallReminders   (authorize once)
 ******************************************************************************/

var LT_OWNER_EMAIL   = { 'DK': 'Daniel@ASAP-Funding.com', 'SP': 'Support@ASAP-Funding.com' };
var LT_DEFAULT_OWNER = 'DK';
var LT_ARCH          = { 'Dead': 1, 'Funded': 1 };

function _lt_ownerEmail_(owner) {
  var o = String(owner || '').trim() || LT_DEFAULT_OWNER;
  return LT_OWNER_EMAIL[o] || LT_OWNER_EMAIL[LT_DEFAULT_OWNER];
}
function _lt_iso2_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, _pl_tz_(), 'yyyy-MM-dd');
  var s = String(v == null ? '' : v).trim();
  var m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? (m[1] + '-' + m[2] + '-' + m[3]) : '';
}
function _lt_minus5_(hhmm) {                // 'HH:MM' minus 5 minutes (clamped at 00:00)
  var m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return '00:00';
  var mins = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) - 5;
  if (mins < 0) mins = 0;
  return String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
}
function _lt_fmtT_(hhmm) {
  var m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})/); if (!m) return '';
  var h = parseInt(m[1], 10), ap = h >= 12 ? 'PM' : 'AM', hh = h % 12; if (hh === 0) hh = 12;
  return hh + ':' + m[2] + ' ' + ap;
}

/* Read the tracker rows we need for reminders (one direct sheet read). */
function _lt_reminderCtx_() {
  if (typeof pipeline_ltEnsureCols_ === 'function') pipeline_ltEnsureCols_();
  var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
  if (!sh) return null;
  var lastCol = sh.getLastColumn();
  var H0 = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  if (H0.indexOf('FollowUpFired') < 0) { lastCol++; sh.getRange(1, lastCol).setValue('FollowUpFired').setFontWeight('bold'); }  // internal fire-marker
  var vals = sh.getDataRange().getValues(), H = vals[0];
  function c(n) { return H.indexOf(n); }
  return { sh: sh, vals: vals, H: H,
    cId: c('DealID'), cAdded: c('TrackerAdded'), cBorr: c('BorrowerName'), cAddr: c('AssembledAddress'),
    cDS: c('DealStatus'), cOwn: c('TrackerOwner'), cFU: c('FollowUpDate'), cFT: c('FollowUpTime'),
    cFR: c('FollowUpResolved'), cFired: c('FollowUpFired') };
}
function _lt_dueRows_(ctx) {
  var out = [];
  for (var r = 1; r < ctx.vals.length; r++) {
    var row = ctx.vals[r];
    if (ctx.cAdded < 0 || String(row[ctx.cAdded]).trim() === '') continue;   // tracker deals only
    if (LT_ARCH[String(row[ctx.cDS] || '').trim()]) continue;                // Funded/Dead never nag
    if (String(row[ctx.cFR] || '').trim() !== '') continue;                  // resolved
    var fu = _lt_iso2_(row[ctx.cFU]); if (!fu) continue;                      // must have a follow-up date
    out.push({ rowIdx: r, id: String(row[ctx.cId]),
      borrower: String(row[ctx.cBorr] || '').trim() || '(no name)',
      address: String(row[ctx.cAddr] || '').trim(),
      owner: String(row[ctx.cOwn] || '').trim() || LT_DEFAULT_OWNER,
      followISO: fu, followTime: String(row[ctx.cFT] || '').trim(),
      fired: String(row[ctx.cFired] || '').trim() });
  }
  return out;
}

/* THE SWEEP — runs every 5 minutes via the installed trigger. */
function pipeline_ltReminderSweep() {
  try {
    var ctx = _lt_reminderCtx_(); if (!ctx) return;
    var tz = _pl_tz_(), now = new Date();
    var today = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
    var nowHM = Utilities.formatDate(now, tz, 'HH:mm');
    var due = _lt_dueRows_(ctx);

    // 1) TIMED reminders — fire by (time − 5 min), once per exact date+time.
    due.forEach(function (d) {
      if (d.followISO === today && d.followTime && nowHM >= _lt_minus5_(d.followTime)) {
        var key = d.followISO + ' ' + d.followTime;
        if (d.fired !== key) {
          _lt_sendTimed_(d);
          ctx.sh.getRange(d.rowIdx + 1, ctx.cFired + 1).setValue(key);
        }
      }
    });

    // 2) DAILY ~7am digest — once/day: date-only-today + everything overdue.
    if (nowHM >= '07:00') {
      var props = PropertiesService.getScriptProperties();
      if (props.getProperty('LT_DAILY_SENT') !== today) {
        var digest = due.filter(function (d) { return d.followISO < today || (d.followISO === today && !d.followTime); });
        _lt_sendDigest_(digest, today);
        props.setProperty('LT_DAILY_SENT', today);
      }
    }
  } catch (err) { Logger.log('LT reminder sweep error: ' + err); }
}

function _lt_sendTimed_(d) {
  var subj = '\u23F0 Follow-up now: ' + d.borrower + (d.address ? ' (' + d.address + ')' : '');
  var body = 'Reminder set for ' + _lt_fmtT_(d.followTime) + ' today.\n\n' +
    'Borrower: ' + d.borrower + '\n' + (d.address ? ('Property: ' + d.address + '\n') : '') +
    'Owner: ' + d.owner + '\n\nOpen your ASAP Loan Tracker to update it.';
  try { GmailApp.sendEmail(_lt_ownerEmail_(d.owner), subj, body, { name: 'ASAP Loan Tracker' }); } catch (e) {}
}
function _lt_sendDigest_(deals, today) {
  if (!deals || !deals.length) return;
  var byOwner = {};
  deals.forEach(function (d) { (byOwner[d.owner] = byOwner[d.owner] || []).push(d); });
  Object.keys(byOwner).forEach(function (owner) {
    var list = byOwner[owner];
    var lines = list.map(function (d) {
      var od = Math.round((Date.parse(today + 'T00:00:00') - Date.parse(d.followISO + 'T00:00:00')) / 86400000);
      var tag = od > 0 ? (od + ' day' + (od > 1 ? 's' : '') + ' overdue') : 'due today';
      return '\u2022 ' + d.borrower + (d.address ? (' \u2014 ' + d.address) : '') + '  (' + tag + ')';
    });
    var subj = '\uD83D\uDD14 ' + list.length + ' follow-up' + (list.length > 1 ? 's' : '') + ' due \u2014 ASAP Loan Tracker';
    var body = 'Good morning ' + owner + ',\n\nFollow-ups that need attention:\n\n' + lines.join('\n') +
      '\n\nThese repeat daily until you change the status, push the date, or clear the follow-up. Open your ASAP Loan Tracker to update.';
    try { GmailApp.sendEmail(_lt_ownerEmail_(owner), subj, body, { name: 'ASAP Loan Tracker' }); } catch (e) {}
  });
}

/* Install / re-install the 5-minute sweep. Run ONCE in the editor (authorize). */
function pipeline_ltInstallReminders() {
  var fn = 'pipeline_ltReminderSweep';
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === fn) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger(fn).timeBased().everyMinutes(5).create();
  Logger.log('Installed "' + fn + '" every 5 minutes.  DK -> ' + LT_OWNER_EMAIL.DK + '  |  SP -> ' + LT_OWNER_EMAIL.SP);
}

/* Dry run — logs who would be reminded right now. Sends NOTHING. */
function pipeline_ltReminderPreview() {
  var ctx = _lt_reminderCtx_(); if (!ctx) { Logger.log('No Pipeline_Deals tab.'); return; }
  var tz = _pl_tz_(), now = new Date();
  var today = Utilities.formatDate(now, tz, 'yyyy-MM-dd'), nowHM = Utilities.formatDate(now, tz, 'HH:mm');
  var due = _lt_dueRows_(ctx);
  Logger.log('Now (PT): ' + today + ' ' + nowHM + '  |  unresolved follow-ups: ' + due.length);
  due.forEach(function (d) {
    var status = (d.followISO < today) ? 'OVERDUE (7am digest)'
      : (d.followISO === today ? (d.followTime ? ('timed ' + _lt_fmtT_(d.followTime) + ' — fires at ' + _lt_minus5_(d.followTime)) : 'due today (7am digest)')
      : ('upcoming ' + d.followISO));
    Logger.log('  ' + d.owner + ' -> ' + _lt_ownerEmail_(d.owner) + '  |  ' + d.borrower + '  |  ' + status);
  });
}