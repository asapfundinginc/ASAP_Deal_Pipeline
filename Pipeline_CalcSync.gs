/***** ASAP PIPELINE — CALC → DEAL SYNC (server) *****************************
 * Paste as a NEW script file ("Pipeline_CalcSync.gs") in the SAME project.
 *
 * WHY: when you correct a deal in the calculator (e.g. property type 5-10 unit
 * multifamily -> 2-4 unit), that fix saves into the hidden CalcInputs snapshot
 * but never reaches the deal's own PropertyType / LoanPurpose columns. The Loan
 * Tracker and the board read those columns, so they keep showing the stale
 * import. This writes the corrected display fields back on "Refresh deal" so the
 * tracker and board stay in sync with the calculator.
 *
 * Only non-blank values overwrite (setIf), so it can never wipe a field. It does
 * NOT touch provenance/grade/"borrower-confirmed" status — that would be
 * inaccurate here, since this is your review, not a borrower confirmation.
 *
 * Self-contained: depends only on M1 globals ss_() and ASAP_CFG.DEALS_TAB.
 * Called directly by the calculator's Refresh deal button via google.script.run:
 *   pipeline_syncCalcToDeal(dealKey, { propertyType, loanPurpose, occupancy })
 ****************************************************************************/

function pipeline_syncCalcToDeal(dealKey, data) {
  try {
    data = data || {};
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!sh) return { ok: false, error: 'Pipeline_Deals tab not found.' };
    var vals = sh.getDataRange().getValues(), H = vals[0];
    var cId = H.indexOf('DealID'), cUrl = H.indexOf('SourceURL');
    if (cId < 0) return { ok: false, error: 'DealID column not found.' };

    // resolve the calculator's key (SourceURL, or 'id:<DealID>', or a bare DealID)
    var key = String(dealKey || '').trim();
    var idGuess = (key.indexOf('id:') === 0) ? key.slice(3) : '';
    var rowIdx = -1;
    for (var r = 1; r < vals.length; r++) {
      var did = String(vals[r][cId] || '').trim();
      var url = (cUrl >= 0) ? String(vals[r][cUrl] || '').trim() : '';
      if ((idGuess && did === idGuess) ||
          (!idGuess && url && url === key) ||
          (!idGuess && did === key)) { rowIdx = r; break; }
    }
    if (rowIdx < 0) return { ok: false, error: 'Deal not found for key.' };

    function setIf(header, value) {                 // only overwrite with a real value
      var c = H.indexOf(header);
      if (c < 0 || value == null || String(value).trim() === '') return;
      sh.getRange(rowIdx + 1, c + 1).setValue(value);
    }
    setIf('PropertyType',     data.propertyType);    // the tracker reads this column directly
    setIf('LoanPurpose',      data.loanPurpose);
    setIf('Occupancy',        data.occupancy);
    setIf('AssembledAddress', data.address);          // corrected (de-doubled) property address

    // Expected Comp from the calculator (funding points + processing fee + yield-spread comp),
    // UNLESS the tracker comp was manually overridden — manual wins until the field is cleared.
    if (data.expectedComp != null && String(data.expectedComp).trim() !== '') {
      var cMan = H.indexOf('CompManual');
      var isManual = (cMan >= 0) && String(vals[rowIdx][cMan] || '').trim() === '1';
      if (!isManual) {
        var cc = H.indexOf('ExpectedComp');
        if (cc >= 0) sh.getRange(rowIdx + 1, cc + 1).setValue(Number(data.expectedComp));
      }
    }

    try { if (typeof PL_cacheBust_ === 'function') PL_cacheBust_(); } catch (e) {}
    return { ok: true };
  } catch (err) { return { ok: false, error: String(err) }; }
}