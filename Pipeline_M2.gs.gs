/***** ASAP PIPELINE — MODULE 2: SCREENER + LENDER MATCHER ******************
 * Paste as a NEW script file ("Pipeline_M2.gs") in the SAME project as M1.
 * Depends on M1 (ASAP_CFG, ss_(), the Pipeline_* tabs).
 *
 * APPROVE-EVERYTHING MODE (2026-07, per DK): the screener NEVER returns FAIL.
 * Former knockouts (loan below minimum, unrecognized/missing state, owner-
 * occupied outside CA) are now confirm-flags: the deal grades NEEDS DATA and
 * stays fully visible on the board, matched to lenders like any other deal.
 * A blank city/state now reads "State missing — confirm", never "Outside the
 * U.S." Grading still prioritizes the easy deals; it just can't reject one.
 *
 * WHAT IT DOES
 *   • screenDeal(d)        -> triage: FIT / NEEDS DATA + LTV, est. DSCR,
 *                             priority flag, watch-outs. (No FAIL, ever.)
 *   • matchLenders(d, sr)  -> ranked lender matches (+ reasons) and near-misses,
 *                             read live from Pipeline_Lenders.
 *
 * HOW TO TEST (before the dashboard exists)
 *   1. Run ▸ screenAndMatchOne   — screens row 2 of Pipeline_Deals and prints
 *      the full result to the log. Change TEST_ROW below to inspect any row.
 *   2. Run ▸ runScreenAll        — writes Status + top lenders onto every row
 *      of Pipeline_Deals so you can eyeball all 152 at once.
 *
 *   The caps come from ASAP_CFG (mirrored from your loan-app GUIDE), so this
 *   screener and your app stay in sync. When a borrower later submits the full
 *   app, your gradeDeal() is still the authoritative grade on real data.
 ****************************************************************************/

var TEST_ROW = 2;   // row in Pipeline_Deals to inspect with screenAndMatchOne

/* ---------- test / batch runners ---------------------------------------- */
function screenAndMatchOne() {
  var deals = tableObjects_(ASAP_CFG.DEALS_TAB);
  var d = deals[TEST_ROW - 2];                 // row 2 = first data row = index 0
  if (!d) { Logger.log('No deal at row %s', TEST_ROW); return; }
  var sr = screenDeal(d);
  var mm = matchLenders(d, sr);
  Logger.log('===== DEAL (row %s) =====', TEST_ROW);
  Logger.log('%s  |  %s  |  loan %s  |  value %s',
    d.AssembledAddress || d.City, d.LoanType, d.LoanAmount, d.MarketValue);
  Logger.log('Decision: %s%s', sr.decision, sr.priority ? '  ★PRIORITY' : '');
  Logger.log('LTV: %s (cap %s%)   est. DSCR: %s',
    pct_(sr.ltv), Math.round(sr.cap * 100), sr.dscr ? sr.dscr.toFixed(2) : 'n/a');
  if (sr.knockouts.length) Logger.log('KNOCKOUTS: %s', sr.knockouts.join('; '));
  if (sr.watchouts.length) Logger.log('Watch-outs: %s', sr.watchouts.join('; '));
  Logger.log('--- Lender matches (%s) ---', mm.matches.length);
  mm.matches.slice(0, 6).forEach(function (m) {
    Logger.log('  • %s  [score %s]  %s  — %s', m.lender, m.score, m.contact, m.why);
  });
  Logger.log('--- Near-misses (%s) ---', mm.nearMisses.length);
  mm.nearMisses.slice(0, 6).forEach(function (m) {
    Logger.log('  • %s — %s', m.lender, m.reason);
  });
}

function runScreenAll() {
  var ss = ss_();
  var sh = ss.getSheetByName(ASAP_CFG.DEALS_TAB);
  var deals = tableObjects_(ASAP_CFG.DEALS_TAB);
  var cStatus = DEAL_HEADERS.indexOf('Status') + 1;
  var nFit = 0, nNeed = 0, nFail = 0;
  for (var i = 0; i < deals.length; i++) {
    var d = deals[i];
    var sr = screenDeal(d);
    var summary;
    if (sr.decision === 'FAIL') { nFail++; summary = 'FAIL — ' + (sr.knockouts[0] || 'knockout'); }
    else {
      var mm = matchLenders(d, sr);
      var top = mm.matches.slice(0, 3).map(function (m) { return m.lender; }).join(', ');
      var tag = sr.decision + (sr.priority ? ' ★' : '') + ' (' + mm.matches.length + ')';
      summary = tag + (top ? ' — ' + top : '');
      if (sr.decision === 'FIT') nFit++; else nNeed++;
    }
    sh.getRange(i + 2, cStatus).setValue(summary);
  }
  Logger.log('✅ Screened %s deals.  FIT: %s   NEEDS DATA: %s   FAIL: %s', deals.length, nFit, nNeed, nFail);
}

/* ======================== SCREENER ====================================== */
function screenDeal(d) {
  var loan  = money_(d.LoanAmount);
  var listingValue = money_(d.MarketValue);
  var value = money_(d.AppraisedValue) || listingValue;   // grading basis: appraised value first, listing as fallback
  var rent  = money_(d.MonthlyRent);
  var fico  = fico_(d.FICO);
  var state = usState_(d.State, d.City, d.Zip);
  var cat   = categoryOf_(d);
  var isLandDev = (cat.cat === 'landdev');   // land / A&D / subdivision: sized by the Land & Dev routes, not residential LTV
  var knock = [], watch = [];

  // ---- former knockouts — now confirm-flags (nothing is ever rejected) ----
  if (loan && loan < ASAP_CFG.MIN_LOAN) watch.push('Loan ' + d.LoanAmount + ' below $100K minimum — confirm loan size');
  if (!state.us) {
    var stRaw = String(d.State || '').trim(), ctRaw = String(d.City || '').trim();
    if (!stRaw && !ctRaw) watch.push('State missing — confirm the property state');
    else watch.push('State not recognized (' + (d.State || d.City) + ') — confirm the property state');
  }
  if (/owner/i.test(String(d.Occupancy)) && ASAP_CFG.OWNER_OCC_OK_STATES.indexOf(state.code) < 0)
    watch.push('Owner-occupied outside CA — confirm occupancy and lender fit');

  // ---- LTV vs cap ----
  var ltv = (loan && value) ? loan / value : '';
  var cap = capFor_(cat, d);
  // Land & Dev loans are collateralized by land + completed homes (a multi-million build basis),
  // so loan / land-value is a meaningless ratio here — skip the residential LTV watchout for landdev.
  if (!isLandDev && ltv && ltv > cap + 0.005)
    watch.push('LTV ' + pct_(ltv) + ' over ' + Math.round(cap * 100) + '% cap (resize loan to ~$' + comma_(Math.round(value * cap)) + ')');

  // ---- est. DSCR (rentals / DSCR / cash-out on rentals) ----
  var dscr = '';
  if (rent && loan && value && (cat.cat === 'dscr' || /rent|lease/i.test(String(d.Occupancy)) || cat.cat === 'cashout' || cat.cat === 'refi')) {
    var monthlyPI  = loan * ASAP_CFG.DSCR_QUAL_RATE / 12;
    var monthlyTax = value * ASAP_CFG.TAX_RATE / 12;
    var monthlyIns = value * ASAP_CFG.INS_RATE / 12;
    dscr = rent / (monthlyPI + monthlyTax + monthlyIns + ASAP_CFG.HOA_DEFAULT);
    if (dscr < ASAP_CFG.DSCR_MIN) watch.push('Est. DSCR ' + dscr.toFixed(2) + ' below ' + ASAP_CFG.DSCR_MIN.toFixed(2) + ' (estimate; confirm taxes/rent)');
    else if (dscr < ASAP_CFG.DSCR_MIN + 0.1) watch.push('Est. DSCR ' + dscr.toFixed(2) + ' is thin (estimate)');
  }

  // ---- missing critical data ----
  if (!value) watch.push('No property value in listing');
  if (cat.cat === 'dscr' && !rent) watch.push('No rent figure for DSCR sizing');
  // Land & Dev is sized by its own Routes (senior + land-as-equity), so the generic fix/flip
  // build-budget nag doesn't apply — it only needs land value + a senior loan to grade.
  if (!isLandDev && (cat.cat === 'fixflip' || cat.cat === 'groundup'))
    watch.push('Rehab/ARV (or build budget) needed for true ' + cat.cat + ' sizing');
  if (isLandDev && !loan) watch.push('No senior / Route loan amount for the development');

  // ---- acreage / rural edge ----
  // Large acreage is expected on a land-development deal, so don't flag it there.
  var ac = parseFloat(d.LotAcres);
  if (!isLandDev && ac && ac >= 8) watch.push('Lot ' + ac + ' ac — may read rural/agricultural (verify lender)');

  // ---- priority ----
  var priority = isPriority_(d, cat, ltv);

  // ---- decision: never FAIL — every deal stays on the board ----
  var decision = watch.length ? 'NEEDS DATA' : 'FIT';

  return { decision: decision, priority: priority, cat: cat.cat, lenderFlags: cat.flags,
           ltv: isLandDev ? '' : ltv, cap: cap, dscr: dscr, loan: loan, value: listingValue, fico: fico,
           state: state.code, knockouts: knock, watchouts: watch };
}

/* ======================== MATCHER ======================================= */
function matchLenders(d, sr) {
  if (sr.decision === 'FAIL') return { matches: [], nearMisses: [] };
  var lenders = tableObjects_(ASAP_CFG.LENDERS_TAB);
  var matches = [], near = [];
  var loan = sr.loan, st = sr.state, fico = sr.fico;

  lenders.forEach(function (L) {
    var reasons = [], fails = [];

    // product fit (any acceptable flag = 'Y')
    var prod = sr.lenderFlags.some(function (f) { return String(L[f]).toUpperCase() === 'Y'; });
    var coming = sr.lenderFlags.some(function (f) { return /coming/i.test(String(L[f])); });
    if (!prod) { if (coming) fails.push('product "coming soon"'); else fails.push('does not offer this product'); }
    else reasons.push(sr.cat + ' lender');

    // loan size
    var mn = num_(L.MinLoanNum), mx = num_(L.MaxLoanNum);
    if (loan && mn && loan < mn) fails.push('loan below their $' + comma_(mn) + ' min');
    if (loan && mx && loan > mx) fails.push('loan above their $' + comma_(mx) + ' max');
    if (loan && mn && mx && loan >= mn && loan <= mx) reasons.push('size in range');

    // state footprint
    var sOk = stateOk_(L.States_Notes, st);
    if (sOk.ok === false) fails.push(sOk.note);
    else if (sOk.note) reasons.push(sOk.note);

    // FICO floor
    var mf = num_(L.MinFICONum);
    if (fico && mf && fico < mf) fails.push('FICO ' + fico + ' below their ' + mf + ' floor');
    else if (fico && mf) reasons.push('FICO clears ' + mf);

    var rec = { lender: L.Lender, contact: contact_(L), states: L.States_Notes,
                why: reasons.join(', '), reason: fails.join('; '),
                score: scoreLender_(L, loan, reasons.length) };
    if (fails.length) near.push(rec); else matches.push(rec);
  });

  matches.sort(function (a, b) { return b.score - a.score; });
  near.sort(function (a, b) { return b.score - a.score; });
  return { matches: matches, nearMisses: near };
}

/* ======================== helpers ======================================= */
function categoryOf_(d) {
  // Explicit designation from the calculator's Land & Dev tab — trusted over keyword inference,
  // because a subdivision and a single-home build can carry identical LoanType/PropertyType.
  var dk = String(d.DealKind || '').toLowerCase().trim();
  if (dk === 'landdev')    return { cat: 'landdev',    flags: ['GroundUp', 'Bridge'] };
  if (dk === 'dscr')       return { cat: 'dscr',       flags: ['DSCR'] };
  if (dk === 'commercial') return { cat: 'commercial', flags: ['Commercial', 'Bridge'] };
  if (dk === 'bff')        return { cat: 'bridge',     flags: ['Bridge', 'FixFlip'] };

  /* 2026-07 rebuild (per DK): the Loan Type FIELD decides first; narrative text is the
   * LAST resort, never an equal signal. This stops three real misroutes:
   *   • "Ground-Up Construction" on a Mixed-Use property landed on DSCR (property gate fired first)
   *   • "Foreclosure Bailout" whose narrative said "rental income" landed on DSCR
   *   • "Refinance/Cash-Out" whose narrative said "no major construction required" landed on Ground-Up
   * Commercial-type property (incl. mixed-use / 5+ multifamily) keeps bridge / cash-out /
   * refi / purchase money on the commercial lane instead of residential BFF. */
  var lt = String(d.LoanType || '').toLowerCase();
  var pt = String(d.PropertyType || '').toLowerCase();
  var commLike = /commercial|office|retail|industrial|self.?storage|warehouse/.test(pt);
  var mixed = /mixed/.test(pt);
  var mf = /(5\+|multi.?family|apartment)/.test(pt);
  var commLane = commLike || mixed || mf;

  // --- land / A&D / subdivision first (a "Ground-Up Construction" loan ON LAND is still landdev) ---
  var landDev =
       /subdivision|\ba\s*&\s*d\b|horizontal|build[-\s]*for[-\s]*sale|\bland\b|\btract\b/.test(lt)
    || /\bland\b|\blots?\b|subdivision|\btract\b/.test(pt);
  if (landDev) return { cat: 'landdev', flags: ['GroundUp', 'Bridge'] };

  // --- 1) the Loan Type FIELD is decisive when it speaks ---
  if (/ground.?up|construction|new build/.test(lt)) return { cat: 'groundup', flags: ['GroundUp'] };
  if (/fix|flip|rehab/.test(lt))                    return { cat: 'fixflip',  flags: ['FixFlip'] };
  if (/bailout|foreclosure/.test(lt))               return { cat: 'bridge',   flags: ['Bridge'] };
  if (/bridge/.test(lt))    return commLane ? { cat: 'commercial', flags: ['Commercial', 'Bridge'] } : { cat: 'bridge',  flags: ['Bridge'] };
  if (/cash.?out/.test(lt)) return commLane ? { cat: 'commercial', flags: ['Commercial'] }           : { cat: 'cashout', flags: ['DSCR', 'Bridge'] };
  if (/dscr|rental|buy.?and.?hold/.test(lt))        return { cat: 'dscr',     flags: ['DSCR'] };
  if (/refinance|refi/.test(lt)) return commLane ? { cat: 'commercial', flags: ['Commercial'] }      : { cat: 'refi',    flags: ['DSCR', 'Bridge'] };
  if (/purchase|acquisition|\bbuy\b/.test(lt)) return commLane ? { cat: 'commercial', flags: ['Commercial'] } : { cat: 'purchase', flags: ['Bridge', 'FixFlip', 'DSCR'] };

  // --- 2) property-type gates (loan type field was silent) ---
  if (commLike) return { cat: 'commercial', flags: ['Commercial'] };
  if (mf)       return { cat: 'multifamily', flags: ['Multifamily'] };
  if (mixed)    return { cat: 'mixeduse', flags: ['MixedUse'] };

  // --- 3) narrative LAST resort (Loan Purpose / Property Summary keywords) ---
  // Bailout and cash-out are checked before construction and rental wording, so
  // "no major construction is required" and "rental income prior to sale" can't misroute.
  var t = (String(d.LoanPurpose || '') + ' ' + String(d.PropertySummary || '')).toLowerCase();
  if (/bailout|foreclosure/.test(t))               return { cat: 'bridge',   flags: ['Bridge'] };
  if (/cash.?out/.test(t))                         return { cat: 'cashout',  flags: ['DSCR', 'Bridge'] };
  if (/fix.?(and|&|-)?.?flip|\brehab\b/.test(t)) return { cat: 'fixflip',  flags: ['FixFlip'] };
  if (/ground.?up|new\s*build/.test(t))           return { cat: 'groundup', flags: ['GroundUp'] };
  if (/dscr|\brental\b|buy.?and.?hold/.test(t))  return { cat: 'dscr',     flags: ['DSCR'] };
  if (/refinance|refi/.test(t))                    return { cat: 'refi',     flags: ['DSCR', 'Bridge'] };
  if (/\bland\b|\blots?\b/.test(t))            return { cat: 'land',     flags: ['Bridge'] };
  if (/bridge/.test(t))                            return { cat: 'bridge',   flags: ['Bridge'] };
  if (/purchase|acquisition|\bbuy\b/.test(t))    return { cat: 'purchase', flags: ['Bridge', 'FixFlip', 'DSCR'] };
  return { cat: 'bridge', flags: ['Bridge'] };     // default
}

/* Manual override commit — called by the calculator's Refresh deal button.
 * Writes the active calculator tab into the DealKind column so categoryOf_
 * (and therefore routing, playbook, and grading) honors DK's manual choice
 * on every future open. Accepts the calc's deal key (SourceURL or "id:<DealID>"). */
function pipeline_setDealKind(dealKey, kind) {
  try {
    kind = String(kind || '').toLowerCase().trim();
    if (['landdev', 'dscr', 'commercial', 'bff'].indexOf(kind) < 0) return { ok: false, error: 'bad kind' };
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    var vals = sh.getDataRange().getValues(), H = vals[0];
    var cKind = H.indexOf('DealKind');
    if (cKind < 0) { cKind = H.length; sh.getRange(1, cKind + 1).setValue('DealKind'); }
    var cId = H.indexOf('DealID'), cUrl = H.indexOf('SourceURL');
    var key = String(dealKey || '').trim(), id = /^id:/.test(key) ? key.slice(3) : '';
    for (var r = 1; r < vals.length; r++) {
      var hit = (id && cId >= 0 && String(vals[r][cId]).trim() === id) ||
                (!id && cUrl >= 0 && String(vals[r][cUrl]).trim() === key);
      if (hit) { sh.getRange(r + 1, cKind + 1).setValue(kind); return { ok: true, kind: kind }; }
    }
    return { ok: false, error: 'deal not found' };
  } catch (err) { return { ok: false, error: String(err) }; }
}

/* Narrative text for one deal — the dashboard uses this to (a) print the
 * "Use of Proceeds" line on lender pitches and (b) pull clearly-stated numbers
 * (purchase price, rehab budget, payoff, credit score) into the calculator. */
function pipeline_getDealNarrative(dealId) {
  try {
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    var vals = sh.getDataRange().getValues(), H = vals[0];
    var cId = H.indexOf('DealID');
    if (cId < 0) return { ok: false, error: 'DealID column missing.' };
    for (var r = 1; r < vals.length; r++) {
      if (String(vals[r][cId]).trim() !== String(dealId).trim()) continue;
      function g(n) { var ci = H.indexOf(n); return ci >= 0 ? String(vals[r][ci] || '') : ''; }
      return { ok: true, purpose: g('LoanPurpose'), summary: g('PropertySummary'),
               exit: g('ExitPlan'), borrowerDetails: g('BorrowerDetails') };
    }
    return { ok: false, error: 'Deal not found.' };
  } catch (err) { return { ok: false, error: String(err) }; }
}
function capFor_(cat, d) {
  var C = ASAP_CFG.CAPS;
  switch (cat.cat) {
    case 'purchase':   return C.purchase;
    case 'cashout':    return C.cashout;
    case 'refi':       return C.refi;
    case 'bridge':     return C.bridge;
    case 'land':       return C.land;
    case 'dscr':       return /cash.?out/i.test(String(d.LoanType)) ? C.dscrCashout : C.dscrPurchase;
    case 'commercial': return C.commercial;
    case 'fixflip':    return C.purchase;   // LTV-on-as-is proxy (true sizing = LTC/ARV)
    case 'groundup':   return C.purchase;   // proxy (true sizing = LTC)
    case 'multifamily':return C.commercial;
    case 'mixeduse':   return C.commercial;
    default:           return C.bridge;
  }
}
function isPriority_(d, cat, ltv) {
  var pt = String(d.PropertyType).toLowerCase();
  var sfr14 = /single|sfr|1-4|duplex|triplex|fourplex|townhome|condo/.test(pt);
  if (sfr14) return true;
  if (cat.cat === 'dscr') return true;
  if (cat.cat === 'purchase' && ltv && ltv <= 0.80) return true;   // >=20% down
  return false;
}
function scoreLender_(L, loan, reasonCount) {
  var s = 0;
  var conf = String(L.Confidence).toUpperCase();
  s += conf === 'HIGH' ? 3 : conf === 'MEDIUM' ? 2 : conf === 'LOW' ? 1 : 0;
  var deals = String(L.DealsWithDK).toLowerCase();
  if (/closed|active|in.?process|term sheet|loi|ts /.test(deals)) s += 2;
  else if (deals && !/no interaction|net-new|no relationship/.test(deals)) s += 1;
  // sweet-spot bonus
  var sweet = String(L.SweetSpot);
  var lo = money_((sweet.match(/\$[\d.,]+[kKmM]?/g) || [])[0]);
  var hi = money_((sweet.match(/\$[\d.,]+[kKmM]?/g) || [])[1]);
  if (loan && lo && hi && loan >= lo && loan <= hi) s += 1;
  s += Math.min(reasonCount, 3) * 0.1;          // tiny tie-breaker
  return Math.round(s * 10) / 10;
}
function stateOk_(notes, st) {
  notes = String(notes || ''); st = String(st || '').toUpperCase();
  if (!st) return { ok: null, note: '' };
  var up = notes.toUpperCase();
  var national = /NATIONAL|NATIONWIDE|ALL STATES|MSAS NATIONWIDE/.test(up);
  var exM = up.match(/(EXCEPT|NOT)\s+([A-Z,&\s/.]+)/);
  var excluded = false;
  if (exM && new RegExp('\\b' + st + '\\b').test(exM[2])) excluded = true;
  if (excluded) return { ok: false, note: 'state ' + st + ' excluded' };
  if (national) return { ok: true, note: 'national' };
  if (new RegExp('\\b' + st + '\\b').test(up) || stateNameIn_(up, st)) return { ok: true, note: 'state listed' };
  return { ok: false, note: 'state ' + st + ' not in footprint (verify)' };
}
function contact_(L) {
  var c = String(L.Contact || '').split(',')[0].trim();
  var e = (String(L.Phone_Email).match(/[\w.+-]+@[\w.-]+/) || [''])[0];
  return [c, e].filter(String).join(' · ');
}

/* table reader: returns array of {Header: value} objects (data rows only) */
function tableObjects_(tabName) {
  var sh = ss_().getSheetByName(tabName);
  var vals = sh.getDataRange().getValues();
  var hdr = vals[0];
  var out = [];
  for (var r = 1; r < vals.length; r++) {
    var o = {}; var blank = true;
    for (var c = 0; c < hdr.length; c++) { o[hdr[c]] = vals[r][c]; if (vals[r][c] !== '') blank = false; }
    if (!blank) out.push(o);
  }
  return out;
}

/* small utils */
function num_(v){ var n = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isNaN(n) ? '' : n; }
function pct_(x){ return x ? (Math.round(x * 1000) / 10) + '%' : 'n/a'; }
function comma_(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
var US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];
function usState_(stateCol, dealCity, zip){
  // try the 2-letter code parsed from "City, ST ZIP" first
  var m = String(dealCity || '').match(/,\s*([A-Za-z]{2})\b/);
  var code = m ? m[1].toUpperCase() : '';
  if (US_STATES.indexOf(code) >= 0) return { us: true, code: code };
  // try the State column if it's a clean 2-letter code or a US state name
  var sc = String(stateCol || '').trim().toUpperCase();
  if (US_STATES.indexOf(sc) >= 0) return { us: true, code: sc };
  for (var i = 0; i < US_STATE_NAMES.length; i++)
    if (sc.indexOf(US_STATE_NAMES[i][0]) >= 0) return { us: true, code: US_STATE_NAMES[i][1] };
  return { us: false, code: code };
}
var US_STATE_NAMES = [['CALIFORNIA','CA'],['TEXAS','TX'],['FLORIDA','FL'],['NEW YORK','NY'],['GEORGIA','GA'],['TENNESSEE','TN'],['NORTH CAROLINA','NC'],['SOUTH CAROLINA','SC'],['ARIZONA','AZ'],['COLORADO','CO'],['OHIO','OH'],['PENNSYLVANIA','PA'],['WASHINGTON','WA'],['OREGON','OR'],['NEVADA','NV'],['VIRGINIA','VA'],['ALABAMA','AL'],['LOUISIANA','LA'],['NEW JERSEY','NJ'],['ILLINOIS','IL'],['MASSACHUSETTS','MA'],['MARYLAND','MD'],['MISSOURI','MO'],['INDIANA','IN'],['MICHIGAN','MI'],['HAWAII','HI'],['ARKANSAS','AR']];
function stateNameIn_(up, st){
  for (var i = 0; i < US_STATE_NAMES.length; i++)
    if (US_STATE_NAMES[i][1] === st && up.indexOf(US_STATE_NAMES[i][0]) >= 0) return true;
  return false;
}