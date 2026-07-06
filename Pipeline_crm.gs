/***** ASAP PIPELINE — BASIC CRM (server) ************************************
 * Paste as a NEW file "Pipeline_CRM.gs". Depends on M1 (ss_).
 * Stores people (not deals) in a self-created "CRM_Contacts" tab:
 * scenario calls, realtors, future borrowers — with a running, timestamped
 * conversation log that follows the PERSON (deal notes stay on deals).
 * Campaign = assignment tag for now (Phase 2 wires actual drip sending).
 *****************************************************************************/

var CRM_TAB = 'CRM_Contacts';
var CRM_COLS = ['ContactID', 'Name', 'Phone', 'Email', 'ContactType', 'Campaign', 'CreatedOn', 'LastTouch', 'NotesLog'];
var CRM_TYPES = ['Prospect', 'Investor', 'Borrower', 'Realtor', 'Closing Attorney', 'Title / Escrow Agent', 'Referral Partner', 'Other'];
var CRM_CAMPAIGNS = ['None', 'DSCR', 'Fix & Flip', 'Fix & Flip + DSCR', 'Commercial', 'Commercial — Multifamily', 'Commercial — Retail / Mixed-Use', 'Land & Dev', 'Conventional / Agency', 'FHA', 'VA', 'Non-QM', 'Realtor Partners'];

function crm_sheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName(CRM_TAB);
  if (!sh) {
    sh = ss.insertSheet(CRM_TAB);
    sh.getRange(1, 1, 1, CRM_COLS.length).setValues([CRM_COLS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}
function crm_iso_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, _pl_tz_(), 'yyyy-MM-dd');
  return String(v || '').slice(0, 10);
}

function pipeline_crmList() {
  try {
    var sh = crm_sheet_();
    var vals = sh.getDataRange().getValues(), H = vals[0];
    function c(n) { return H.indexOf(n); }
    var out = [];
    for (var r = 1; r < vals.length; r++) {
      var row = vals[r];
      if (String(row[c('ContactID')]).trim() === '') continue;
      var notes = [];
      try { notes = JSON.parse(String(row[c('NotesLog')] || '[]')); } catch (e) { notes = []; }
      out.push({
        id: String(row[c('ContactID')]), name: String(row[c('Name')] || ''), phone: String(row[c('Phone')] || ''),
        email: String(row[c('Email')] || ''), type: String(row[c('ContactType')] || 'Investor'),
        campaign: String(row[c('Campaign')] || 'None'), created: crm_iso_(row[c('CreatedOn')]),
        lastTouch: crm_iso_(row[c('LastTouch')]), notes: notes,
        dripStep: (c('DripStep') >= 0 ? (parseInt(row[c('DripStep')], 10) || 0) : 0),
        dripLast: (c('DripLastSent') >= 0 ? crm_iso_(row[c('DripLastSent')]) : '')
      });
    }
    var camps = CRM_CAMPAIGNS;
    try { if (typeof pipeline_dripCampaignNames_ === 'function') camps = ['None'].concat(pipeline_dripCampaignNames_()); } catch (e) {}
    return { ok: true, contacts: out, campaigns: camps, types: CRM_TYPES };
  } catch (err) { return { ok: false, error: String(err) }; }
}

function pipeline_crmAdd(name, phone, email, type) {
  try {
    var sh = crm_sheet_();
    var id = 'c_' + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
    sh.appendRow([id, String(name || '').trim(), String(phone || '').trim(), String(email || '').trim(),
                  CRM_TYPES.indexOf(String(type)) >= 0 ? type : 'Investor', 'None', new Date(), new Date(), '[]']);
    return { ok: true, id: id };
  } catch (err) { return { ok: false, error: String(err) }; }
}

function crm_row_(sh, id) {
  var vals = sh.getDataRange().getValues(), H = vals[0], ci = H.indexOf('ContactID');
  for (var r = 1; r < vals.length; r++) { if (String(vals[r][ci]) === String(id)) return { rowIdx: r, H: H, row: vals[r] }; }
  return null;
}

function pipeline_crmSave(id, field, value) {
  try {
    var MAP = { name: 'Name', phone: 'Phone', email: 'Email', type: 'ContactType', campaign: 'Campaign' };
    var col = MAP[field];
    if (!col) return { ok: false, error: 'Field not editable.' };
    if (field === 'campaign') {
      var okCamps = CRM_CAMPAIGNS;
      try { if (typeof pipeline_dripCampaignNames_ === 'function') okCamps = ['None'].concat(pipeline_dripCampaignNames_()); } catch (e) {}
      if (okCamps.indexOf(String(value)) < 0) return { ok: false, error: 'Bad campaign.' };
    }
    if (field === 'type' && CRM_TYPES.indexOf(String(value)) < 0) return { ok: false, error: 'Bad type.' };
    var sh = crm_sheet_(), hit = crm_row_(sh, id);
    if (!hit) return { ok: false, error: 'Contact not found.' };
    sh.getRange(hit.rowIdx + 1, hit.H.indexOf(col) + 1).setValue(String(value == null ? '' : value));
    sh.getRange(hit.rowIdx + 1, hit.H.indexOf('LastTouch') + 1).setValue(new Date());
    if (field === 'campaign') {                       // new campaign starts fresh from email #1
      var cSt = hit.H.indexOf('DripStep'), cLs = hit.H.indexOf('DripLastSent');
      if (cSt >= 0) sh.getRange(hit.rowIdx + 1, cSt + 1).setValue(0);
      if (cLs >= 0) sh.getRange(hit.rowIdx + 1, cLs + 1).setValue('');
    }
    return { ok: true };
  } catch (err) { return { ok: false, error: String(err) }; }
}

/* Append one timestamped conversation note; the log follows the person. */
function pipeline_crmAddNote(id, text) {
  try {
    var t = String(text || '').trim();
    if (!t) return { ok: false, error: 'Empty note.' };
    var sh = crm_sheet_(), hit = crm_row_(sh, id);
    if (!hit) return { ok: false, error: 'Contact not found.' };
    var ci = hit.H.indexOf('NotesLog');
    var log = [];
    try { log = JSON.parse(String(hit.row[ci] || '[]')); } catch (e) { log = []; }
    log.unshift({ ts: Utilities.formatDate(new Date(), _pl_tz_(), 'yyyy-MM-dd HH:mm'), text: t.slice(0, 4000) });
    if (log.length > 200) log = log.slice(0, 200);
    var js = JSON.stringify(log);
    if (js.length > 45000) { log = log.slice(0, Math.floor(log.length / 2)); js = JSON.stringify(log); }
    sh.getRange(hit.rowIdx + 1, ci + 1).setValue(js);
    sh.getRange(hit.rowIdx + 1, hit.H.indexOf('LastTouch') + 1).setValue(new Date());
    return { ok: true, notes: log };
  } catch (err) { return { ok: false, error: String(err) }; }
}

function pipeline_crmDelete(id) {
  try {
    var sh = crm_sheet_(), hit = crm_row_(sh, id);
    if (!hit) return { ok: false, error: 'Contact not found.' };
    sh.deleteRow(hit.rowIdx + 1);
    return { ok: true };
  } catch (err) { return { ok: false, error: String(err) }; }
}


/* Public wrapper: the Pipeline board calls this when a deal hits the outreach
   limit (2 calls + 2 emails) — the borrower is auto-added to Contacts so DK
   can assign a drip campaign there. Safe to call repeatedly (dedupes). */
/* One-time backfill: sweep every existing deal already at 3+ logged touches
   (any mix of calls + emails) into Contacts. Idempotent — the upsert dedupes,
   and a script property makes sure the sweep itself only runs once. */
function pipeline_crmBackfillMaxedOutreach() {
  var out = { ok: true, scanned: 0, added: 0 };
  try {
    var dsh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!dsh) return { ok: false, error: 'Pipeline_Deals tab not found.' };
    var vals = dsh.getDataRange().getValues(), H = vals[0];
    var cId = H.indexOf('DealID'), cOl = H.indexOf('OutreachLog');
    if (cId < 0 || cOl < 0) return out;
    for (var r = 1; r < vals.length; r++) {
      var raw = String(vals[r][cOl] || '').trim();
      if (!raw) continue;
      var ol; try { ol = JSON.parse(raw); } catch (eJ) { continue; }
      var touches = (Number(ol && ol.calls) || 0) + (Number(ol && ol.emails) || 0);
      if (touches < 3) continue;
      out.scanned++;
      try { pipeline_crmUpsertFromDeal_(String(vals[r][cId])); out.added++; } catch (eU) {}
    }
  } catch (err) { return { ok: false, error: String(err) }; }
  return out;
}
/* Auto-run the backfill exactly once (guarded by a script property). Called
   from the board loader so no manual step is needed after deploying. */
function pipeline_crmBackfillOnce_() {
  try {
    var props = PropertiesService.getScriptProperties();
    if (props.getProperty('CRM_BACKFILL_OUTREACH3_DONE') === '1') return;
    props.setProperty('CRM_BACKFILL_OUTREACH3_DONE', '1');
    pipeline_crmBackfillMaxedOutreach();
  } catch (e) {}
}

function pipeline_crmAutoAddFromDeal(dealId) {
  try { pipeline_crmUpsertFromDeal_(dealId); return { ok: true }; }
  catch (err) { return { ok: false, error: String(err) }; }
}

/* Auto-create a Contact from a deal's borrower when it's added to the Loan
   Tracker. Dedupes by email (then exact name) so re-adding never duplicates. */
function pipeline_crmUpsertFromDeal_(dealId) {
  try {
    var dsh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!dsh) return;
    var vals = dsh.getDataRange().getValues(), H = vals[0];
    var cId = H.indexOf('DealID'), cNm = H.indexOf('BorrowerName'), cEm = H.indexOf('BorrowerEmail'), cPh = H.indexOf('BorrowerPhone');
    var name = '', email = '', phone = '';
    for (var r = 1; r < vals.length; r++) {
      if (String(vals[r][cId]) === String(dealId)) {
        name = cNm >= 0 ? String(vals[r][cNm] || '').trim() : '';
        email = cEm >= 0 ? String(vals[r][cEm] || '').trim() : '';
        phone = cPh >= 0 ? String(vals[r][cPh] || '').trim() : '';
        break;
      }
    }
    if (!name && !email) return;                     // nothing to add
    var sh = crm_sheet_();
    var cv = sh.getDataRange().getValues(), CH = cv[0];
    var xNm = CH.indexOf('Name'), xEm = CH.indexOf('Email');
    var emL = email.toLowerCase(), nmL = name.toLowerCase();
    for (var r2 = 1; r2 < cv.length; r2++) {
      var hasEm = emL && String(cv[r2][xEm] || '').toLowerCase().trim() === emL;
      var hasNm = nmL && String(cv[r2][xNm] || '').toLowerCase().trim() === nmL;
      if (hasEm || hasNm) return;                    // already a contact
    }
    var id = 'c_' + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
    sh.appendRow([id, name, phone, email, 'Investor', 'None', new Date(), new Date(),
      JSON.stringify([{ ts: Utilities.formatDate(new Date(), _pl_tz_(), 'yyyy-MM-dd HH:mm'), text: 'Auto-added from Loan Tracker (deal ' + dealId + ').' }])]);
  } catch (err) {}
}