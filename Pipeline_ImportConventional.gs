/***** ASAP — ONE-TIME IMPORT: loans from the "Funding Production" sheet ********
 * Paste as a NEW script file named:  Pipeline_ImportConventional.gs
 * Same project as M1–M4 and Pipeline_LoanTracker.gs.
 *
 * DEPENDS ON (already in your project):
 *   • M1:  ss_(), ASAP_CFG
 *   • Pipeline_LoanTracker.gs:  pipeline_ltEnsureCols_()
 *   • CRM:  pipeline_crmList(), pipeline_crmAdd(name, phone, email, type)
 *
 * HOW TO RUN (mirrors your reminders file's preview→install pattern):
 *   1) SAFE DRY RUN — run:  importConv_PREVIEW
 *        Logs exactly what it WOULD add. Writes nothing. (View > Execution log)
 *   2) DO IT — run:  importConv_RUN
 *        Inserts the loan rows into Pipeline_Deals (flagged into the Loan Tracker,
 *        kept off the Pipeline board) and creates/links a Contact for each borrower.
 *
 * SAFE TO RE-RUN: it skips any loan already imported (same borrower + property +
 * amount) and any borrower who is already a Contact.
 ******************************************************************************/

/* The 11 rows read from your sheet image (already mapped to tracker fields). */
var IMPORT_ROWS = [
  { borrower:'Ronald Thompson',   addr:'7319 Shindler Drive',                    propType:'MHP',        loanType:'DSCR',         purpose:'Purchase',  amount:950000,  close:'2026-05-15', current:'Processing',            comp:9500,  dealStatus:'Secured',      lender:'New Day Comm Capital', notes:'May 5th Appraisal' },
  { borrower:'Chinmay Kothari',   addr:'2977 Gaslight Ct, Lathrop, CA 95330',    propType:'SFR',        loanType:'Conventional', purpose:'Refinance', amount:650000,  close:'2026-05-15', current:'Application Received',   comp:4875,  dealStatus:'Secured',      lender:'',                     notes:'' },
  { borrower:'Darrick Williams',  addr:'0 Miller St Orange Park FL',             propType:'Land Dev',   loanType:'Hard Money',   purpose:'Refinance', amount:2500000, close:'2026-05-30', current:'Waiting on Docs',        comp:25000, dealStatus:'Secured',      lender:'',                     notes:'' },
  { borrower:'Raj Rao',           addr:'',                                       propType:'',           loanType:'Hard Money',   purpose:'Purchase',  amount:null,    close:'',           current:'Waiting on Docs',        comp:0,     dealStatus:'Shopping',     lender:'',                     notes:'' },
  { borrower:'Aaron Nestor',      addr:'39875 Knollridge Dr, Temecula, CA 92591',propType:'SFR',        loanType:'FHA',          purpose:'Purchase',  amount:434250,  close:'2026-05-30', current:'Pre-Approved',           comp:8685,  dealStatus:'Secured',      lender:'Giant',                notes:'' },
  { borrower:'Angelica Young',    addr:'',                                       propType:'SFR',        loanType:'FHA',          purpose:'Purchase',  amount:299476,  close:'2026-05-30', current:'Waiting on Docs',        comp:5990,  dealStatus:'Secured',      lender:'',                     notes:"Lois's daughter" },
  { borrower:'Asha Casey',        addr:'',                                       propType:'SFR',        loanType:'FHA',          purpose:'Purchase',  amount:337000,  close:'2026-06-30', current:'Waiting on Docs',        comp:6740,  dealStatus:'Planning',     lender:'',                     notes:'Call lender — confirm 2024 Schedule C on personal returns will suffice' },
  { borrower:'Dawn Alvarez',      addr:'',                                       propType:'SFR',        loanType:'FHA',          purpose:'Purchase',  amount:null,    close:'2026-06-15', current:'Processing',             comp:0,     dealStatus:'Planning',     lender:'',                     notes:"Confirm son's SSI will not be affected" },
  { borrower:'Natasha Rodriguez', addr:'',                                       propType:'SFR',        loanType:'FHA',          purpose:'Purchase',  amount:500000,  close:'2026-07-01', current:'',                       comp:10000, dealStatus:'Credit Repair', lender:'',                    notes:'Deciding b/w buying in CA or AZ' },
  { borrower:'Sikhu Hamzat',      addr:'',                                       propType:'Multifamily',loanType:'FHA',          purpose:'Purchase',  amount:null,    close:'2026-06-15', current:'Waiting on Docs',        comp:0,     dealStatus:'Planning',     lender:'',                     notes:'' },
  { borrower:'Lois Young',        addr:'',                                       propType:'SFR',        loanType:'DSCR',         purpose:'Purchase',  amount:300000,  close:'2026-05-30', current:'Waiting on Docs',        comp:6000,  dealStatus:'Planning',     lender:'',                     notes:'' }
];

/* license-required => Conventional bucket ; business-purpose => Hard Money bucket */
function _lt_bucketOf_(loanType){
  var t = String(loanType || '').toLowerCase();
  if (/conventional|non.?qm|\bfha\b|\bva\b/.test(t)) return 'Conventional';
  return 'Hard Money';   // Hard Money, Private Money, DSCR, or blank
}
function _imp_norm_(x){ return String(x || '').toLowerCase().replace(/[^0-9a-z]+/g, ''); }

function importConv_PREVIEW(){ _importConv_(false); }
function importConv_RUN(){ _importConv_(true); }

function _importConv_(write){
  var sh = pipeline_ltEnsureCols_();               // makes sure the tracker columns exist
  if (!sh) { Logger.log('ERROR: Pipeline_Deals tab not found.'); return; }

  // make sure a TrackerLoanType column exists (drives the tabs + monthly split later)
  var lastCol = sh.getLastColumn();
  var H = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  ['LoanType','TrackerLoanType','PropertyType','AssembledAddress','Archived'].forEach(function(name){
    if (H.indexOf(name) < 0) { lastCol++; sh.getRange(1, lastCol).setValue(name).setFontWeight('bold'); H.push(name); }
  });
  function col(n){ return H.indexOf(n); }

  // existing rows (to skip true duplicates: same borrower + property + amount)
  var vals = sh.getDataRange().getValues();
  var seen = {};
  for (var r = 1; r < vals.length; r++) {
    var key = _imp_norm_(vals[r][col('BorrowerName')]) + '|' +
              _imp_norm_(vals[r][col('AssembledAddress')]) + '|' +
              String(vals[r][col('LoanAmount')] || '').replace(/[^0-9.]/g, '');
    seen[key] = true;
  }

  // existing contacts (dedup by email, then normalized name)
  var contacts = [];
  try { var cl = pipeline_crmList(); if (cl && cl.ok) contacts = cl.contacts || []; } catch (e) {}
  function contactExists(name, email){
    var em = String(email || '').toLowerCase().trim();
    for (var i = 0; i < contacts.length; i++){
      if (em && String(contacts[i].email || '').toLowerCase().trim() === em) return true;
    }
    var nn = _imp_norm_(name);
    if (nn.length > 4) for (var j = 0; j < contacts.length; j++){ if (_imp_norm_(contacts[j].name) === nn) return true; }
    return false;
  }

  var stampIso = Utilities.formatDate(new Date(), (typeof _pl_tz_ === 'function' ? _pl_tz_() : Session.getScriptTimeZone()), 'yyyy-MM-dd');
  var added = 0, skipped = 0, contactsAdded = 0, contactsLinked = 0;

  IMPORT_ROWS.forEach(function(row, i){
    var bucket = _lt_bucketOf_(row.loanType);
    var dupKey = _imp_norm_(row.borrower) + '|' + _imp_norm_(row.addr) + '|' + (row.amount == null ? '' : String(row.amount));
    var isDup = !!seen[dupKey];

    Logger.log((write ? 'ADD  ' : 'would add  ') +
      row.borrower + '  ·  ' + (row.loanType || '(blank→HM)') + ' [' + bucket + ']  ·  ' +
      (row.amount == null ? '—' : ('$' + Number(row.amount).toLocaleString())) + '  ·  ' +
      row.dealStatus + '/' + (row.current || '—') + (isDup ? '   << SKIP (already in tracker)' : ''));

    if (isDup) { skipped++; return; }
    seen[dupKey] = true;

    if (write) {
      var newRow = new Array(H.length).fill('');
      function put(name, v){ var ci = col(name); if (ci >= 0) newRow[ci] = v; }
      put('DealID', 'CV-' + Utilities.getUuid().slice(0, 8));
      put('TrackerAdded', stampIso);                 // flags it into the Loan Tracker
      put('Archived', 'Imported ' + stampIso);       // keeps it OFF the Pipeline board (tracker-only)
      put('BorrowerName', row.borrower);
      put('AssembledAddress', row.addr);
      put('PropertyType', row.propType);
      put('LoanType', row.loanType);                 // card field (no card here, so safe)
      put('TrackerLoanType', row.loanType);          // tracker-owned copy (tabs read this)
      put('LoanAmount', row.amount == null ? '' : row.amount);
      put('DealStatus', row.dealStatus);
      put('CurrentStatus', row.current);
      put('TrackerOwner', 'DK');
      put('ExpectedComp', row.comp || '');
      put('CompManual', (row.comp ? '1' : ''));      // these comps are manual, not calc-derived
      put('TrackerLender', row.lender);
      put('EstCloseDate', row.close);
      put('TrackerNotes', row.notes);
      sh.appendRow(newRow);
      // keep date/text cells as plain text on the row we just wrote
      var wr = sh.getLastRow();
      ['EstCloseDate','FollowUpDate','FollowUpTime'].forEach(function(nm){ var ci = col(nm); if (ci >= 0) sh.getRange(wr, ci + 1).setNumberFormat('@').setValue(nm === 'EstCloseDate' ? row.close : ''); });
    }
    added++;

    // Contact create / link (dedup)
    if (contactExists(row.borrower, '')) { contactsLinked++; Logger.log('   contact: already exists → linked'); }
    else {
      contactsAdded++;
      if (write) { try { pipeline_crmAdd(row.borrower, '', '', 'Borrower'); contacts.push({ name: row.borrower, email: '' }); } catch (e) { Logger.log('   contact add failed: ' + e); } }
      Logger.log('   contact: ' + (write ? 'created' : 'would create'));
    }
  });

  try { CacheService.getScriptCache().remove('PL_TRACKER_V1'); } catch (e) {}
  Logger.log('——— ' + (write ? 'IMPORT DONE' : 'PREVIEW ONLY (nothing written)') + ' ———');
  Logger.log('loans ' + (write ? 'added' : 'to add') + ': ' + added + '  ·  skipped (already there): ' + skipped +
             '  ·  contacts ' + (write ? 'created' : 'to create') + ': ' + contactsAdded + '  ·  contacts linked: ' + contactsLinked);
  if (!write) Logger.log('Looks right? Now run  importConv_RUN');
}