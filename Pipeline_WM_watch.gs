/* =========================================================================
 * Pipeline_WMWatch.gs — WorkingMoni listing watcher (2026-07, v2)
 *
 * What it does now (two jobs):
 *   1) STATUS (unchanged): three times a day (8am, 12pm, 4pm) it re-fetches
 *      every active deal's WorkingMoni listing and stamps any status badge
 *      ("Funded", "On Hold - Investor Selected", "Sold", ...) into the
 *      WMStatus / WMChecked columns on Pipeline_Deals.
 *   2) DEAL FACTS (new): the same fetch now also reads the listing's real
 *      numbers and narrative — loan amount, value, LTV, desired term, lien,
 *      occupancy, income, lot size, zoning, property type, Loan Purpose,
 *      Property Summary, Exit Plan, Borrower Introduction — and refreshes
 *      them into the SAME Pipeline_Deals columns the board and pitches read.
 *      So if WorkingMoni edits a listing, the executive summary follows.
 *
 *   PLUS an on-demand refresh: the dashboard calls pipeline_wmRefreshDeal(id)
 *   the moment you open "Matched Lenders", so the pitch is accurate to the
 *   minute (the 3x/day sweep is the backstop).
 *
 * Merge safety rules (mirrors your re-upload merge in M4):
 *   - A blank scraped value NEVER wipes existing data.
 *   - Narrative fields (LoanPurpose / PropertySummary / ExitPlan /
 *     BorrowerDetails) refresh on change — except LoanPurpose stays locked
 *     once it's borrower-confirmed or hand-set to a canonical type.
 *   - Listing facts (amount, value, LTV, term, occupancy, ...) refresh on
 *     change UNLESS Provenance says 'borrower' — then fill-blanks-only, so
 *     your hand-corrected numbers are never reverted by a scrape.
 *
 * ONE-TIME SETUP after pasting: run  pipeline_wmWatchInstall  once from
 * the editor (Run > pipeline_wmWatchInstall) and grant permissions.
 *
 * Manual runs any time:
 *   pipeline_wmWatchSweep    — full sweep (status + facts, all deals)
 *   pipeline_wmDetailsTest   — logs what the extractor sees on one listing
 * ========================================================================= */

/* Install (or re-install) the three daily triggers. Safe to re-run. */
function pipeline_wmWatchInstall() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'pipeline_wmWatchSweep') ScriptApp.deleteTrigger(t);
  });
  [8, 12, 16].forEach(function (h) {           // morning, lunch, afternoon
    ScriptApp.newTrigger('pipeline_wmWatchSweep').timeBased().everyDays(1).atHour(h).create();
  });
  return 'Installed: WorkingMoni checks (status + deal facts) at 8am, 12pm, and 4pm daily.';
}

/* ======================= STATUS DETECTION (unchanged) ==================== */

/* Which badge texts count as a status worth flagging (checked in order —
 * first hit wins). "Updated" alone is ignored: the listing is still live. */
var PL_WM_STATUSES = [
  { re: /on\s*hold[^a-z0-9]{0,8}investor\s*selected/i, label: 'On Hold - Investor Selected' },
  { re: />\s*funded\s*</i,                             label: 'Funded' },
  { re: /"funded"/i,                                   label: 'Funded' },
  { re: />\s*sold\s*</i,                               label: 'Sold' },
  { re: /no\s*longer\s*available/i,                    label: 'No longer available' },
  { re: />\s*withdrawn\s*</i,                          label: 'Withdrawn' },
  { re: />\s*expired\s*</i,                            label: 'Expired' }
];

function pipeline_wmDetect_(html) {
  var h = String(html || '');
  // 1) a real fundedAt date (null = not funded) is the strongest signal
  if (/\\?"fundedAt\\?":\s*\\?"/.test(h)) return 'Funded';
  // 2) the listing's status enum inside the embedded JSON (escaped or not)
  var m = h.match(/\\?"status\\?":\s*\\?"([A-Z_]{3,})/);
  if (m) {
    var code = m[1];
    var MAP = { INVESTOR_SELECTED: 'On Hold - Investor Selected', ON_HOLD: 'On Hold',
                FUNDED: 'Funded', SOLD: 'Sold', WITHDRAWN: 'Withdrawn',
                EXPIRED: 'Expired', CANCELLED: 'Cancelled', CLOSED: 'Closed' };
    var ACTIVE = { ACTIVE: 1, AVAILABLE: 1, APPROVED: 1, PUBLISHED: 1, LIVE: 1, OPEN: 1, LISTED: 1, NEW: 1, UPDATED: 1, PENDING: 1 };
    if (MAP[code]) return MAP[code];
    if (ACTIVE[code]) return '';
    // unknown code: show it prettified rather than miss it
    return code.replace(/_/g, ' ').toLowerCase().replace(/(^| )[a-z]/g, function (c) { return c.toUpperCase(); });
  }
  // 3) fallback: visible badge text
  for (var i = 0; i < PL_WM_STATUSES.length; i++) {
    if (PL_WM_STATUSES[i].re.test(h)) return PL_WM_STATUSES[i].label;
  }
  return '';
}

/* ======================= DEAL-FACT EXTRACTION (new) ====================== */

/* HTML → readable text. <li>/<br>/</p>/</div>/</h*>/</tr> become newlines so
 * bullet lists keep their separators (this is what fixes the mashed-together
 * exit plan). Entities decoded, script/style dropped. */
function pipeline_wmText_(html) {
  var h = String(html || '');
  h = h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  h = h.replace(/<(?:br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section|\/article)[^>]*>/gi, '\n');
  h = h.replace(/<li[^>]*>/gi, '\n');
  h = h.replace(/<[^>]+>/g, ' ');
  h = h.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
       .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(parseInt(n, 10)); });
  var lines = h.split('\n').map(function (s) { return s.replace(/\s+/g, ' ').trim(); });
  var out = [];
  for (var i = 0; i < lines.length; i++) { if (lines[i]) out.push(lines[i]); }
  return out;   // array of clean lines
}

/* First string value for any of the JSON key candidates ("key":"value",
 * escaped \"key\":\"value\", or "key":123). Returns '' when none found. */
function pipeline_wmJval_(html, keys) {
  var h = String(html || '');
  function clean(v) {
    return String(v).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
                    .replace(/\\u([0-9a-fA-F]{4})/g, function (_, c) { return String.fromCharCode(parseInt(c, 16)); })
                    .trim();
  }
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // plain JSON:      "key":"value"
    var mP = h.match(new RegExp('"' + k + '"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"'));
    if (mP && String(mP[1]).trim() !== '' && !/^null$/i.test(String(mP[1]).trim())) return clean(mP[1]);
    // escaped JSON (Next.js style):  \"key\":\"value\"  — value ends at the next \"
    var mE = h.match(new RegExp('\\\\"' + k + '\\\\"\\s*:\\s*\\\\"((?:[^"\\\\]|\\\\\\\\|\\\\[^"])*)\\\\"'));
    if (mE && String(mE[1]).trim() !== '' && !/^null$/i.test(String(mE[1]).trim())) return clean(mE[1]);
    // numeric (plain or escaped key):  "key":2500000
    var mN = h.match(new RegExp('\\\\?"' + k + '\\\\?"\\s*:\\s*(-?\\d[\\d.]*)'));
    if (mN && parseFloat(mN[1]) !== 0) return String(mN[1]);
  }
  return '';
}

/* Label → value from the rendered text lines: finds the line matching
 * labelRe and returns the value on that line after the label, or the next
 * line when the label sits alone (WorkingMoni renders label above value). */
function pipeline_wmLabel_(lines, labelRe, valueRe) {
  for (var i = 0; i < lines.length; i++) {
    if (!labelRe.test(lines[i])) continue;
    var rest = lines[i].replace(labelRe, '').replace(/^[:\s\u2013\u2014-]+/, '').trim();
    if (rest && (!valueRe || valueRe.test(rest))) return rest;
    for (var j = i + 1; j < lines.length && j <= i + 2; j++) {
      var v = lines[j].trim();
      if (!v) continue;
      if (pipeline_wmIsLabel_(v)) break;              // next label — no value given
      if (!valueRe || valueRe.test(v)) return v;
      break;
    }
  }
  return '';
}

/* Lines that are field labels / section headers on a WorkingMoni listing. */
function pipeline_wmIsLabel_(s) {
  return /^(seeking\b|loan\s*type$|appraiser$|ltv$|annual\s*return$|investment\s*(annual|monthly)\s*income$|desired\s*loan\s*term$|lien\s*position$|lot\s*size|zoning|occupancy$|property\s*type$|loan\s*purpose$|property\s*summary$|exit\s*plan$|borrower\s*introduction$|next\s*steps|request\s*loan\s*package|due\s*diligence|have\s*a\s*deal)/i.test(String(s || '').trim());
}

/* Narrative section between a header line and the next known header.
 * Bullet-ish lines are joined with "; " so downstream single-line use
 * (the pitch's exit bullet) stays readable. */
function pipeline_wmSection_(lines, startRe) {
  var out = [], on = false;
  for (var i = 0; i < lines.length; i++) {
    var t = lines[i].trim();
    if (!on) { if (startRe.test(t) && t.length < 40) on = true; continue; }
    if (pipeline_wmIsLabel_(t) || /^(transaction overview|project economics|sponsor profile)/i.test(t)) break;
    if (t) out.push(t.replace(/^[\u2022\u00b7\-*]\s*/, ''));
    if (out.length > 40) break;                        // sanity cap
  }
  return out.join('; ').replace(/;\s*;+/g, ';').replace(/\s+/g, ' ').trim();
}

function pipeline_wmNum_(s) { var n = parseFloat(String(s || '').replace(/[^0-9.]/g, '')); return (isNaN(n) || n <= 0) ? 0 : n; }
function pipeline_wmAcres_(lot) {
  var s = String(lot || ''); var m = s.match(/([\d,]+(?:\.\d+)?)/);
  if (!m) return '';
  var n = parseFloat(m[1].replace(/,/g, ''));
  if (isNaN(n) || n <= 0) return '';
  return (n > 500) ? String(Math.round((n / 43560) * 100) / 100) : String(n);   // big number = sq ft
}

/* The extractor: embedded JSON first (most reliable), visible labels second.
 * Every field is optional — blanks simply mean "listing didn't say". */
function pipeline_wmExtractDetails_(html) {
  var lines = pipeline_wmText_(html);
  var J = function (keys) { return pipeline_wmJval_(html, keys); };
  var L = function (re, vre) { return pipeline_wmLabel_(lines, re, vre); };
  var MONEY = /\$?\s*[\d,]+/;

  var det = {};
  det.LoanAmount   = J(['loanAmount', 'seekingAmount', 'requestedAmount', 'requestedLoanAmount', 'amountRequested'])
                  || L(/^seeking\b.*loan$/i, MONEY) || L(/^seeking\b/i, MONEY);
  det.LoanType     = J(['loanType', 'dealType']) || L(/^loan\s*type$/i);
  det.MarketValue  = J(['appraisedValue', 'appraisal', 'appraiserValue', 'marketValue', 'estimatedValue', 'propertyValue', 'asIsValue'])
                  || L(/^appraiser$/i, MONEY);
  det.LTV          = J(['ltv', 'loanToValue']) || L(/^ltv$/i, /%|\d/);
  det.AnnualReturn = J(['annualReturn']) || L(/^annual\s*return$/i);
  det.AnnualIncome = J(['investmentAnnualIncome', 'annualIncome']) || L(/^investment\s*annual\s*income$/i);
  det.MonthlyRent  = J(['investmentMonthlyIncome', 'monthlyIncome', 'monthlyRent']) || L(/^investment\s*monthly\s*income$/i);
  det.DesiredTerm  = J(['desiredLoanTerm', 'desiredTerm', 'loanTerm', 'termLength']) || L(/^desired\s*loan\s*term$/i);
  det.LienPosition = J(['lienPosition', 'lien']) || L(/^lien\s*position$/i);
  det.LotSize      = J(['lotSize', 'lotSizeSqFt', 'lotSizeAcres']) || L(/^lot\s*size(\s*ac\s*\/?\s*sq\.?\s*ft\.?)?\s*$/i, /\d/);
  det.ZoningUse    = J(['zoningUse', 'zoning']) || L(/^zoning(\s*\/\s*use)?\s*$/i);
  det.Occupancy    = J(['occupancy']) || L(/^occupancy$/i);
  det.PropertyType = J(['propertyType']) || L(/^property\s*type$/i);
  det.FICO         = J(['ficoScore', 'fico', 'creditScore']) || L(/^fico$/i, /\d{3}/);
  det.BuildingSize = J(['buildingSize', 'buildingSqFt', 'squareFeet']) || '';

  det.LoanPurpose     = J(['loanPurpose'])          || pipeline_wmSection_(lines, /^loan\s*purpose$/i);
  det.PropertySummary = J(['propertySummary'])      || pipeline_wmSection_(lines, /^property\s*summary$/i);
  det.ExitPlan        = J(['exitPlan', 'exitStrategy']) || pipeline_wmSection_(lines, /^exit\s*plan$/i);
  det.BorrowerDetails = J(['borrowerIntroduction', 'borrowerDetails', 'sponsorIntroduction'])
                     || pipeline_wmSection_(lines, /^borrower\s*introduction$/i);

  // Normalize the money-ish fields to plain numbers ("$ 2,500,000" -> 2500000)
  ['LoanAmount', 'MarketValue', 'AnnualReturn', 'AnnualIncome', 'MonthlyRent'].forEach(function (k) {
    if (det[k] !== '' && MONEY.test(String(det[k]))) { var n = pipeline_wmNum_(det[k]); det[k] = n ? n : ''; }
  });
  // "TBD" / "Negotiable" mean "not stated" — never store them over real data
  Object.keys(det).forEach(function (k) {
    if (/^(tbd|n\/?a|negotiable|-+)$/i.test(String(det[k]).trim())) det[k] = '';
  });
  det.LotAcres = det.LotSize ? pipeline_wmAcres_(det.LotSize) : '';
  return det;
}

/* ======================= MERGE INTO Pipeline_Deals ======================= */

/* Same spirit as the re-upload merge in M4:
 *   NARRATIVE (LoanPurpose / PropertySummary / ExitPlan / BorrowerDetails):
 *     refresh on change; LoanPurpose stays locked once borrower-confirmed
 *     or hand-set to a canonical loan type.
 *   FACTS: refresh on change — unless Provenance says 'borrower', in which
 *     case fill-blanks-only so your corrected numbers are never reverted.
 *   Everywhere: a blank scrape value never overwrites existing data. */
function pipeline_wmApplyDetails_(sh, H, r /* 0-based data row */, det) {
  var NARR  = { LoanPurpose: 1, PropertySummary: 1, ExitPlan: 1, BorrowerDetails: 1 };
  var FACTS = ['LoanAmount', 'LoanType', 'MarketValue', 'LTV', 'AnnualReturn', 'AnnualIncome',
               'MonthlyRent', 'DesiredTerm', 'LienPosition', 'LotSize', 'LotAcres', 'ZoningUse',
               'Occupancy', 'PropertyType', 'FICO', 'BuildingSize'];
  var CANON = ['Purchase', 'Refinance', 'Cash-Out Refinance', 'Bridge', 'Fix & Flip',
               'Ground-Up Construction', 'Rental / DSCR', 'Land'];
  function empty_(v) { return v === null || v === undefined || String(v).trim() === ''; }

  var row = sh.getRange(r + 1, 1, 1, H.length).getValues()[0];   // fresh read (sweep may have written earlier rows)
  var cProv = H.indexOf('Provenance'), cLT = H.indexOf('LoanType'), cLP = H.indexOf('LoanPurpose');
  var prov = cProv >= 0 ? String(row[cProv] || '').toLowerCase() : '';
  var borrowerLocked = prov.indexOf('borrower') >= 0;
  var lt = cLT >= 0 ? String(row[cLT] || '').trim() : '';
  var lp = cLP >= 0 ? String(row[cLP] || '').trim() : '';
  var purposeLocked = borrowerLocked || (lt !== '' && lt === lp && CANON.indexOf(lp) >= 0);

  var changed = false, touched = [];
  function put(colName, newv, overwrite) {
    var ci = H.indexOf(colName);
    if (ci < 0 || empty_(newv)) return;
    var cur = row[ci];
    if (overwrite) {
      if (String(cur) !== String(newv)) { row[ci] = newv; changed = true; touched.push(colName); }
    } else if (empty_(cur)) { row[ci] = newv; changed = true; touched.push(colName); }
  }

  Object.keys(NARR).forEach(function (k) {
    if (k === 'LoanPurpose' && purposeLocked) return;
    put(k, det[k], true);
  });
  FACTS.forEach(function (k) {
    if (k === 'LoanType' && purposeLocked) { put(k, det[k], false); return; }
    put(k, det[k], !borrowerLocked);
  });

  if (changed) sh.getRange(r + 1, 1, 1, H.length).setValues([row]);
  return { changed: changed, touched: touched, row: row };
}

/* ============================== THE SWEEP ================================ */

/* Fetch every active WorkingMoni listing (parallel batches); stamp status
 * AND refresh the deal facts. Only writes on change. */
function pipeline_wmWatchSweep() {
  var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
  if (!sh) return { ok: false, error: 'Pipeline_Deals tab not found.' };
  var vals = sh.getDataRange().getValues(), H = vals[0];

  // ensure the two status columns exist
  ['WMStatus', 'WMChecked'].forEach(function (name) {
    if (H.indexOf(name) < 0) {
      sh.getRange(1, sh.getLastColumn() + 1).setValue(name).setFontWeight('bold');
    }
  });
  vals = sh.getDataRange().getValues(); H = vals[0];
  var cUrl = H.indexOf('SourceURL'), cArch = H.indexOf('Archived'),
      cSt = H.indexOf('WMStatus'), cChk = H.indexOf('WMChecked');
  if (cUrl < 0) return { ok: false, error: 'SourceURL column not found.' };

  // collect active rows that point at a WorkingMoni listing
  var jobs = [];
  for (var r = 1; r < vals.length; r++) {
    if (cArch >= 0 && String(vals[r][cArch]).trim() !== '') continue;
    var url = String(vals[r][cUrl] || '').trim();
    if (!/^https?:\/\//i.test(url) || !/workingmoni/i.test(url)) continue;
    jobs.push({ row: r, url: url, prev: cSt >= 0 ? String(vals[r][cSt] || '').trim() : '' });
  }

  var now = new Date(), changed = 0, checked = 0, errors = 0, factsUpdated = 0;
  var BATCH = 20;
  for (var b = 0; b < jobs.length; b += BATCH) {
    var slice = jobs.slice(b, b + BATCH);
    var reqs = slice.map(function (j) {
      return { url: j.url, muteHttpExceptions: true, followRedirects: true,
               headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ASAPFunding-StatusCheck)' } };
    });
    var resps;
    try { resps = UrlFetchApp.fetchAll(reqs); } catch (eF) { errors += slice.length; continue; }
    for (var k = 0; k < slice.length; k++) {
      var j = slice[k], resp = resps[k];
      checked++;
      var code = 0, body = '';
      try { code = resp.getResponseCode(); body = resp.getContentText(); } catch (eR) {}
      if (code >= 400 || !body) { errors++; continue; }
      var status = pipeline_wmDetect_(body);
      sh.getRange(j.row + 1, cChk + 1).setValue(now);
      if (status && status !== j.prev) {
        sh.getRange(j.row + 1, cSt + 1).setValue(status);
        changed++;
      } else if (!status && j.prev) {
        // listing went back to plain-available — clear the old flag
        sh.getRange(j.row + 1, cSt + 1).setValue('');
        changed++;
      }
      // NEW: refresh the listing's deal facts into the row
      try {
        var det = pipeline_wmExtractDetails_(body);
        var res = pipeline_wmApplyDetails_(sh, H, j.row, det);
        if (res.changed) factsUpdated++;
      } catch (eD) {}
    }
  }
  if (changed || factsUpdated) { try { PL_cacheBust_(); } catch (eC) {} }
  var summary = { ok: true, listings: jobs.length, checked: checked, statusChanged: changed,
                  factsUpdated: factsUpdated, errors: errors };
  Logger.log('WM sweep: ' + JSON.stringify(summary));
  return summary;
}

/* ==================== ON-DEMAND REFRESH (pitch-time) ===================== */

/* Called by the dashboard when "Matched Lenders" opens. Re-fetches THIS
 * deal's listing right now, refreshes status + facts on the row, and hands
 * the final merged values back so the pitch regenerates with live data.
 * Fails soft: any problem returns ok:false and the pitch uses stored data. */
function pipeline_wmRefreshDeal(dealId) {
  try {
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!sh) return { ok: false, error: 'Pipeline_Deals tab not found.' };
    var vals = sh.getDataRange().getValues(), H = vals[0];
    var cId = H.indexOf('DealID'), cUrl = H.indexOf('SourceURL'),
        cSt = H.indexOf('WMStatus'), cChk = H.indexOf('WMChecked');
    if (cId < 0 || cUrl < 0) return { ok: false, error: 'DealID / SourceURL column missing.' };
    var r = -1;
    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][cId]).trim() === String(dealId).trim()) { r = i; break; }
    }
    if (r < 0) return { ok: false, error: 'Deal not found.' };
    var url = String(vals[r][cUrl] || '').trim();
    if (!/^https?:\/\//i.test(url) || !/workingmoni/i.test(url)) {
      return { ok: false, error: 'No WorkingMoni link on this deal.' };
    }

    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ASAPFunding-StatusCheck)' } });
    var code = resp.getResponseCode(), body = resp.getContentText() || '';
    if (code >= 400 || !body) return { ok: false, error: 'Listing fetch failed (HTTP ' + code + ').' };

    var status = pipeline_wmDetect_(body);
    if (cChk >= 0) sh.getRange(r + 1, cChk + 1).setValue(new Date());
    var prevSt = cSt >= 0 ? String(vals[r][cSt] || '').trim() : '';
    if (cSt >= 0 && status !== prevSt) sh.getRange(r + 1, cSt + 1).setValue(status);

    var det = pipeline_wmExtractDetails_(body);
    var res = pipeline_wmApplyDetails_(sh, H, r, det);
    var anyChange = res.changed || (status !== prevSt);
    if (anyChange) { try { PL_cacheBust_(); } catch (eC) {} }

    // Hand back the FINAL merged row values (so borrower-confirmed numbers win)
    var row = res.row;
    function g(name) { var ci = H.indexOf(name); return ci >= 0 ? row[ci] : ''; }
    function n(name) { var x = parseFloat(String(g(name)).replace(/[^0-9.]/g, '')); return (isNaN(x) || x <= 0) ? 0 : x; }
    var facts = {
      loan: n('LoanAmount'), value: n('MarketValue'), ltv: String(g('LTV') || '').trim(),
      term: String(g('DesiredTerm') || '').trim(), lien: String(g('LienPosition') || '').trim(),
      occupancy: String(g('Occupancy') || '').trim(), annualIncome: String(g('AnnualIncome') || '').trim(),
      rent: n('MonthlyRent'), propType: String(g('PropertyType') || '').trim(),
      acres: String(g('LotAcres') || '').trim(), lotSize: String(g('LotSize') || '').trim(),
      zoning: String(g('ZoningUse') || '').trim(), fico: String(g('FICO') || '').trim(),
      loanType: String(g('LoanType') || '').trim(), purposeText: String(g('LoanPurpose') || '').trim(),
      summary: String(g('PropertySummary') || '').trim(), exit: String(g('ExitPlan') || '').trim(),
      borrowerDetails: String(g('BorrowerDetails') || '').trim()
    };
    return { ok: true, status: status, changed: anyChange, touched: res.touched, facts: facts };
  } catch (err) { return { ok: false, error: String(err) }; }
}

/* =========================== DEBUG HELPERS =============================== */

/* Logs exactly what the fact extractor sees on one listing — run this once
 * after deploying, then read View > Executions (or the log). Prefers the
 * Lady Lake / Griffin deal if it's on the board, else the first WM row. */
function pipeline_wmDetailsTest() {
  var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
  var vals = sh.getDataRange().getValues(), H = vals[0];
  var cUrl = H.indexOf('SourceURL'), cAddr = H.indexOf('AssembledAddress');
  var url = '', addr = '', fbUrl = '', fbAddr = '';
  for (var r = 1; r < vals.length; r++) {
    var u = String(vals[r][cUrl] || '').trim();
    if (!/^https?:\/\//i.test(u) || !/workingmoni/i.test(u)) continue;
    var a = cAddr >= 0 ? String(vals[r][cAddr] || '') : '';
    if (!fbUrl) { fbUrl = u; fbAddr = a; }
    if (/griffin|lady\s*lake/i.test(a)) { url = u; addr = a; break; }
  }
  if (!url) { url = fbUrl; addr = fbAddr; }
  if (!url) { Logger.log('NO WorkingMoni URLs found in SourceURL.'); return 'no urls'; }
  Logger.log('Testing: ' + addr + ' -> ' + url);
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ASAPFunding-StatusCheck)' } });
  var code = resp.getResponseCode(), body = resp.getContentText() || '';
  Logger.log('HTTP ' + code + ' - ' + body.length + ' chars');
  var det = pipeline_wmExtractDetails_(body);
  Object.keys(det).forEach(function (k) {
    var v = String(det[k] || '');
    Logger.log(k + ': ' + (v ? (v.length > 160 ? v.slice(0, 160) + '...' : v) : '(not found)'));
  });
  Logger.log('Status: ' + (pipeline_wmDetect_(body) || '(active)'));
  return 'HTTP ' + code + ' - extraction logged; see Executions log';
}

/* Original status-format probe (kept). Fetches a listing known to carry a
 * status and logs the raw text around every status-ish word. */
function pipeline_wmWatchTest() {
  var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
  var vals = sh.getDataRange().getValues(), H = vals[0];
  var cUrl = H.indexOf('SourceURL'), cAddr = H.indexOf('AssembledAddress');
  var url = '', addr = '', fallbackUrl = '', fallbackAddr = '';
  for (var r = 1; r < vals.length; r++) {
    var u = String(vals[r][cUrl] || '').trim();
    if (!/^https?:\/\//i.test(u) || !/workingmoni/i.test(u)) continue;
    var a = cAddr >= 0 ? String(vals[r][cAddr] || '') : '';
    if (!fallbackUrl) { fallbackUrl = u; fallbackAddr = a; }
    if (/stope|deveraux/i.test(a)) { url = u; addr = a; break; }
  }
  if (!url) { url = fallbackUrl; addr = fallbackAddr; }
  if (!url) { Logger.log('NO WorkingMoni URLs found in SourceURL.'); return 'no urls'; }
  Logger.log('Testing: ' + addr + ' -> ' + url);
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ASAPFunding-StatusCheck)' } });
  var code = resp.getResponseCode(), body = resp.getContentText() || '';
  Logger.log('HTTP ' + code + ' - ' + body.length + ' chars');
  PL_WM_STATUSES.forEach(function (p) { Logger.log(p.label + ' pattern found: ' + p.re.test(body)); });
  ['funded', 'hold', 'investor selected', 'sold', 'propertyStatus', 'status'].forEach(function (w) {
    var re = new RegExp(w.replace(/ /g, '\\s*'), 'gi'), m, n = 0;
    while ((m = re.exec(body)) && n < 3) {
      n++;
      var lo = Math.max(0, m.index - 90), hi = Math.min(body.length, m.index + 90);
      Logger.log('[' + w + ' #' + n + '] ...' + body.slice(lo, hi).replace(/\s+/g, ' ') + '...');
    }
    if (!n) Logger.log('[' + w + '] not present');
  });
  return 'HTTP ' + code + ' - see log for context snippets';
}