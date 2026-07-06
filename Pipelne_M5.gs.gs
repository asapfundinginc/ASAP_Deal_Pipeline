/* =========================================================================
 * Pipeline_M5.gs  —  LENDER PITCH
 *   Multi-select matched lenders  →  edit ONE exec-summary  →  send a
 *   SEPARATE copy to each selected lender's AE (they never see each other).
 *
 *   • pipeline_buildPitch(names)                       -> AE contacts for the modal
 *   • pipeline_commitPitch(names, subject, body, sender, mode)
 *                                                      -> draft / send per lender
 *
 *   Reuses M4:     Pipeline_senderSig_()
 *   Reuses Code.gs: applyOnlineHtml(), applyOnlineImages(), LOGO_EMAIL_B64,
 *                   NOTIFY_CC, ss_(), normHeader_()  (+ DK_PHOTO_B64 from M4)
 *   Reads AE name + email from your "Deal Matching Matrix" tab
 *   (ASAP_CFG.RAW_LENDERS_TAB) — the same tab importLenders() reads.
 *   No third-party services: uses the Gmail you already send invites from.
 * ========================================================================= */

/* Look up a lender's AE first-name + email from the Deal Matching Matrix. */
function Pipeline_lenderContact_(name) {
  try {
    var sh = ss_().getSheetByName(ASAP_CFG.RAW_LENDERS_TAB);   // 'Deal Matching Matrix'
    if (!sh) return { ae: '', email: '' };
    var vals = sh.getDataRange().getValues();
    if (!vals.length) return { ae: '', email: '' };
    var H = vals[0].map(normHeader_);
    function col(test) { for (var i = 0; i < H.length; i++) { if (test(H[i])) return i; } return -1; }
    var cL = col(function (h) { return h === 'lender'; });
    var cC = col(function (h) { return h.indexOf('contact') >= 0; });
    var cE = col(function (h) { return h.indexOf('email') >= 0 || h.indexOf('phone') >= 0; });
    if (cL < 0) return { ae: '', email: '' };
    var target = String(name || '').trim().toLowerCase();
    for (var r = 1; r < vals.length; r++) {
      if (String(vals[r][cL] || '').trim().toLowerCase() !== target) continue;
      var pe = cE >= 0 ? String(vals[r][cE] || '') : '';
      var em = (pe.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [''])[0];
      var contact = cC >= 0 ? String(vals[r][cC] || '') : '';
      var ae = contact.split(/[,(]/)[0].trim().split(/\s+/)[0];   // first name only
      return { ae: ae, email: em };
    }
    return { ae: '', email: '' };
  } catch (e) { return { ae: '', email: '' }; }
}

/* Modal payload: AE contact (name + email + whether we can email them) for each matched lender. */
function pipeline_buildPitch(names) {
  try {
    names = names || [];
    var lenders = names.map(function (n) {
      var c = Pipeline_lenderContact_(n);
      return { name: n, ae: c.ae, email: c.email, hasEmail: !!c.email };
    });
    return { ok: true, lenders: lenders };
  } catch (err) { return { ok: false, error: String(err) }; }
}

/* Plain-text body -> tidy HTML.
 *   • Section headers (a non-bullet line immediately followed by a bullet line) -> BOLD, larger.
 *   • Bullet lines (start with the bullet char) -> plain.
 *   • "Label: value" lines (no bullet) -> bold the label (covers "Next Steps:" and the simple format).
 *   • Everything else (intro line, etc.) -> plain.
 */
function Pipeline_pitchBodyToHtml_(text) {
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  var lines = String(text || '').split(/\r?\n/);
  function nextNonBlankIsBullet(i) {
    for (var j = i + 1; j < lines.length; j++) { var t = lines[j].trim(); if (t === '') continue; return t.charAt(0) === '\u2022'; }
    return false;
  }
  return lines.map(function (ln, i) {
    var t = ln.trim();
    if (t === '') return '<p style="margin:0 0 10px;">&nbsp;</p>';
    if (t.charAt(0) === '\u2022') return '<p style="margin:0 0 6px;">' + esc(t) + '</p>';
    if (nextNonBlankIsBullet(i)) return '<p style="margin:16px 0 8px;font-size:15px;"><strong>' + esc(t) + '</strong></p>';
    var m = t.match(/^([^:]{1,30}):\s*(.*)$/);
    if (m) return '<p style="margin:0 0 8px;"><strong>' + esc(m[1]) + ':</strong> ' + esc(m[2]) + '</p>';
    return '<p style="margin:0 0 8px;">' + esc(t) + '</p>';
  }).join('');
}

/* Assemble the full pitch email (greeting + body + signature + logo + apply cards + disclaimer). */
function Pipeline_buildPitchEmail_(greeting, bodyHtml, sigHtml) {
  var disc = ASAP_disclaimer_();
  var html =
    '<div style="font-family:Arial,Helvetica,sans-serif;color:#1a2230;font-size:14px;line-height:1.5;max-width:680px;">' +
      '<p style="margin:0 0 12px;">' + greeting + '</p>' +
      bodyHtml +
      '<p style="margin:16px 0 14px;">Thanks,</p>' +
      sigHtml +
      '<p style="margin:18px 0;"><img src="cid:asaplogo" alt="ASAP Funding - Simply Better Lending" width="270" style="width:270px;height:auto;display:block;border:0;"></p>' +
      applyOnlineHtml() +
      '<p style="font-family:Georgia,\'Times New Roman\',serif;font-size:11px;color:#444;line-height:1.45;text-align:justify;margin:0;"><strong>DISCLAIMER:</strong> ' + disc + '</p>' +
    '</div>';
  return { html: html };
}

/* Draft or send a SEPARATE copy of the pitch to each selected lender's AE.
 * attachments (optional): [{ name, mime, data(base64) }] from the pitch modal —
 * built into blobs ONCE and attached to every lender's copy. 20 MB total cap. */
/* Files already in this deal's Drive folder (DriveFolder column) — shown in the
 * pitch modal so DK can attach uploaded borrower docs without re-uploading. */
function pipeline_listDealFiles(dealId) {
  try {
    var sh = ss_().getSheetByName(ASAP_CFG.DEALS_TAB);
    if (!sh) return { ok: true, files: [] };
    var vals = sh.getDataRange().getValues(), H = vals[0];
    var cId = H.indexOf('DealID'), cF = H.indexOf('DriveFolder');
    if (cId < 0 || cF < 0) return { ok: true, files: [] };
    var url = '';
    for (var r = 1; r < vals.length; r++) {
      if (String(vals[r][cId]) === String(dealId)) { url = String(vals[r][cF] || '').trim(); break; }
    }
    if (!url) return { ok: true, files: [] };
    var m = url.match(/[-\w]{25,}/);
    if (!m) return { ok: true, files: [] };
    var it = DriveApp.getFolderById(m[0]).getFiles(), files = [];
    while (it.hasNext() && files.length < 50) {
      var f = it.next();
      files.push({ id: f.getId(), name: f.getName(), size: f.getSize(), date: f.getLastUpdated().getTime() });
    }
    files.sort(function (a, b) { return b.date - a.date; });
    return { ok: true, files: files, folderUrl: url };
  } catch (err) { return { ok: false, error: String(err) }; }
}

function pipeline_commitPitch(names, subject, bodyText, sender, mode, dealId, attachments) {
  try {
    names = names || [];
    if (!names.length) return { ok: false, error: 'No lenders selected.' };
    subject = String(subject || 'Deal for your review');
    var sig = Pipeline_senderSig_(sender || 'daniel');
    var bodyHtml = Pipeline_pitchBodyToHtml_(bodyText);
    var logo = Utilities.newBlob(Utilities.base64Decode(LOGO_EMAIL_B64), 'image/png', 'asap-logo.png');
    var attBlobs = [], attBytes = 0;
    (attachments || []).forEach(function (a) {
      if (!a) return;
      try {
        if (a.driveId) {                       // existing file in the loan's Drive folder
          var fb = DriveApp.getFileById(a.driveId).getBlob();
          attBytes += fb.getBytes().length;
          attBlobs.push(fb);
          return;
        }
        if (!a.data) return;                    // freshly uploaded from the modal
        var b = Utilities.base64Decode(a.data);
        attBytes += b.length;
        attBlobs.push(Utilities.newBlob(b, a.mime || 'application/octet-stream', a.name || 'attachment'));
      } catch (eA) {}
    });
    if (attBytes > 20 * 1024 * 1024) return { ok: false, error: 'Attachments exceed the 20 MB total limit — remove a file and try again.' };
    var results = [];
    for (var i = 0; i < names.length; i++) {
      var c = Pipeline_lenderContact_(names[i]);
      if (!c.email) { results.push({ name: names[i], ok: false, error: 'no email on file' }); continue; }
      var greeting = 'Hi ' + (c.ae || 'there') + ',';
      var em = Pipeline_buildPitchEmail_(greeting, bodyHtml, sig.html);
      var images = applyOnlineImages(); images.asaplogo = logo;   // cardhm + cardhome + asaplogo
      if ((sender || 'daniel') === 'daniel' && typeof DK_PHOTO_B64 !== 'undefined') {
        images.danielphoto = Utilities.newBlob(Utilities.base64Decode(DK_PHOTO_B64), 'image/jpeg', 'dk.jpg');
      }
      var plain = greeting + '\n\n' + String(bodyText || '') + '\n\nThanks,\n' + sig.plain;
      var opts = { cc: NOTIFY_CC, htmlBody: em.html, inlineImages: images, replyTo: sig.replyTo, name: sig.fromName };
      if (attBlobs.length) opts.attachments = attBlobs;
      try {
        if (mode === 'send') GmailApp.sendEmail(c.email, subject, plain, opts);
        else GmailApp.createDraft(c.email, subject, plain, opts);
        results.push({ name: names[i], ok: true, email: c.email });
      } catch (e2) { results.push({ name: names[i], ok: false, error: String(e2) }); }
    }
    var sent = results.filter(function (r) { return r.ok; }).length;
    var pitchedOn = '';
    if (mode === 'send' && sent > 0) { try { pitchedOn = Pipeline_stampDealDate_(dealId, 'PitchedOn'); } catch (e) {} }
    return { ok: sent > 0, mode: mode, results: results, sent: sent, sender: sig.fromName, pitchedOn: pitchedOn };
  } catch (err) { return { ok: false, error: String(err) }; }
}