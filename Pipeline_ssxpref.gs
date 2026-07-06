/***** ASAP PIPELINE — SANDBOX PREFERRED LAYOUT (server) *********************
 * Paste as a NEW file "Pipeline_SsxPref.gs".
 * The ★ Preferred layout choice saves HERE the instant it is clicked — its own
 * column, its own direct call — completely independent of the calculator's
 * autosave/snapshot pipeline, so it can never be lost to timing or relays.
 * Uses _cn_row_ from Pipeline_CalcNotes.gs (same dealKey matching as notes).
 *****************************************************************************/

function Pipeline_saveSsxPref(dealKey, json) {
  try {
    if (!dealKey) return { ok: false };
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!sh) return { ok: false };
    var lastCol = sh.getLastColumn();
    var H0 = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    if (H0.indexOf('SsxPref') < 0) { lastCol++; sh.getRange(1, lastCol).setValue('SsxPref').setFontWeight('bold'); }
    var hit = _cn_row_(sh, dealKey);
    if (!hit) return { ok: false };
    sh.getRange(hit.rowIdx + 1, hit.H.indexOf('SsxPref') + 1).setValue(String(json || ''));
    return { ok: true };
  } catch (err) { return { ok: false, error: String(err) }; }
}

function Pipeline_getSsxPref(dealKey) {
  try {
    if (!dealKey) return '';
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!sh) return '';
    var hit = _cn_row_(sh, dealKey);
    if (!hit) return '';
    var ci = hit.H.indexOf('SsxPref');
    if (ci < 0) return '';
    return String(sh.getRange(hit.rowIdx + 1, ci + 1).getValue() || '');
  } catch (err) { return ''; }
}