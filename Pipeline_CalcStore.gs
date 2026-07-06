/***** ASAP PIPELINE — CALC INPUTS STORE (server) ****************************
 * Paste as a NEW file "Pipeline_CalcStore.gs" — ONLY IF a project-wide search
 * (magnifying glass in script.google.com) finds NO existing function named
 * Pipeline_getCalcInputs. If one exists, upload that file to Claude instead.
 *
 * WHY: the calculator autosaves every input (asap-calc-save) and the dashboard
 * relays it to Pipeline_saveCalcInputs; on open it restores via
 * Pipeline_getCalcInputs. If those two functions are missing, every save and
 * restore silently no-ops — which looks exactly like "my inputs are not saved."
 *
 * Storage: a CalcInputs column on Pipeline_Deals (self-created), keyed the same
 * way as CalcNotes: SourceURL or 'id:<DealID>'. Reuses _cn_row_ from
 * Pipeline_CalcNotes.gs. Blank payloads never overwrite a saved snapshot.
 *****************************************************************************/

function Pipeline_saveCalcInputs(dealKey, json) {
  try {
    if (!dealKey) return { ok: false, error: 'Missing deal key.' };
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!sh) return { ok: false, error: 'Pipeline_Deals tab not found.' };
    var lastCol = sh.getLastColumn();
    var H0 = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    if (H0.indexOf('CalcInputs') < 0) { lastCol++; sh.getRange(1, lastCol).setValue('CalcInputs').setFontWeight('bold'); }
    var hit = _cn_row_(sh, dealKey);
    if (!hit) return { ok: false, error: 'Deal not found for key.' };
    var s = String(json == null ? '' : json);
    if (s.length > 45000) s = s.slice(0, 45000);   // stay under the 50k cell limit
    // guard: a blank/near-empty snapshot never wipes a real one
    var cell = sh.getRange(hit.rowIdx + 1, hit.H.indexOf('CalcInputs') + 1);
    var existing = String(cell.getValue() || '');
    var incomingEmpty = true;
    try { var o = JSON.parse(s); incomingEmpty = !o || !o.fields || Object.keys(o.fields).length === 0; }
    catch (e) { incomingEmpty = String(s).trim() === ''; }
    if (incomingEmpty && String(existing).trim() !== '') return { ok: true, kept: true };
    cell.setValue(s);
    return { ok: true };
  } catch (err) { return { ok: false, error: String(err) }; }
}

function Pipeline_getCalcInputs(dealKey) {
  try {
    if (!dealKey) return '';
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!sh) return '';
    var hit = _cn_row_(sh, dealKey);
    if (!hit) return '';
    var ci = hit.H.indexOf('CalcInputs');
    if (ci < 0) return '';
    return String(sh.getRange(hit.rowIdx + 1, ci + 1).getValue() || '');
  } catch (err) { return ''; }
}