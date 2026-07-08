"""
ASAP Pipeline - WorkingMoni Availability Check
Runs twice daily via GitHub Actions (15 min before the new deal scraper).

Logic:
1. Read Pipeline_Deals from Google Sheets
2. Filter: WorkingMoni URL + blank ViewedStatus
3. For deals where WMStatus already shows unavailable -> mark liked_na immediately
4. For remaining deals -> fetch page via plain HTTP, extract JSON status enum
   (same approach as pipeline_wmDetect_ in Pipeline_WM_watch.gs)
5. Batch-update all liked_na changes in one Sheets API call
6. Always send email summary
"""

import json, os, re, requests, smtplib, time
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import gspread
from google.oauth2.service_account import Credentials

# Config
SPREADSHEET_ID = "1bfbptTehrBLjP7fyLYyAXRDfuExAvaBacofJyJfgGeM"
DEALS_TAB      = "Pipeline_Deals"
GMAIL_ADDRESS  = os.environ["GMAIL_ADDRESS"]
GMAIL_PASS     = os.environ["GMAIL_APP_PASSWORD"]
RECIPIENTS     = [e.strip() for e in os.environ["RECIPIENT_EMAIL"].split(",")]
SCOPES         = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]

# HTTP headers that match what Apps Script uses (proven to work on WorkingMoni)
HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ASAPFunding-StatusCheck)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# WMStatus values the Apps Script sweep writes for unavailable deals
# These match the MAP in pipeline_wmDetect_ exactly
UNAVAILABLE_WMSTATUSES = {
    "On Hold - Investor Selected",
    "On Hold",
    "Funded",
    "Sold",
    "Withdrawn",
    "Expired",
    "Cancelled",
    "Canceled",
    "Closed",
    "No longer available",
}

# JSON status codes mapped by pipeline_wmDetect_
UNAVAILABLE_STATUS_CODES = {
    "INVESTOR_SELECTED",
    "ON_HOLD",
    "FUNDED",
    "SOLD",
    "WITHDRAWN",
    "EXPIRED",
    "CANCELLED",
    "CANCELED",
    "CLOSED",
}


# Google Sheets helpers
def get_sheet():
    sa_info = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"])
    creds   = Credentials.from_service_account_info(sa_info, scopes=SCOPES)
    gc      = gspread.authorize(creds)
    return gc.open_by_key(SPREADSHEET_ID).worksheet(DEALS_TAB)


def read_deals(ws) -> tuple:
    """
    Read all deals from the sheet.
    Returns (headers, deals_to_check, vs_col_index)
    deals_to_check: list of dicts for WM deals with blank ViewedStatus
    vs_col_index: 1-based column index of ViewedStatus (for batch update)
    """
    all_vals = ws.get_all_values()
    if not all_vals:
        return [], [], 0

    headers = all_vals[0]

    # Find required column indexes
    try:
        c_url   = headers.index("SourceURL")
        c_vs    = headers.index("ViewedStatus")
        c_wms   = headers.index("WMStatus")     if "WMStatus"          in headers else -1
        c_addr  = headers.index("AssembledAddress")
        c_lt    = headers.index("LoanType")
        c_state = headers.index("State")
        c_id    = headers.index("DealID")
    except ValueError as e:
        raise RuntimeError(f"Required column missing: {e}")

    deals = []
    for i, row in enumerate(all_vals[1:], start=2):  # i = spreadsheet row (1-indexed, header=1)
        def col(idx):
            return row[idx].strip() if 0 <= idx < len(row) else ""

        url   = col(c_url)
        vs    = col(c_vs)
        wms   = col(c_wms) if c_wms >= 0 else ""
        addr  = col(c_addr)
        lt    = col(c_lt)
        state = col(c_state)
        did   = col(c_id)

        # Only check WorkingMoni deals with no ViewedStatus
        if "workingmoni" not in url.lower():
            continue
        if vs:  # already has a value - skip
            continue

        deals.append({
            "row":      i,          # spreadsheet row number (for update)
            "url":      url,
            "address":  addr or did,
            "loan_type": lt,
            "state":    state,
            "deal_id":  did,
            "wm_status": wms,       # existing WMStatus from Apps Script sweep
        })

    return headers, deals, c_vs + 1  # c_vs + 1 = 1-based column index


# Status detection - Python port of pipeline_wmDetect_ from Pipeline_WM_watch.gs
def detect_status(html: str) -> str:
    """
    Extract the deal status from WorkingMoni's Next.js embedded JSON.
    Returns a human-readable status label (e.g. 'Funded', 'On Hold - Investor Selected')
    or empty string if the deal is still active.

    Mirrors pipeline_wmDetect_() exactly:
    1. Check for fundedAt date (strongest signal)
    2. Check status enum in embedded JSON
    3. Fallback: visible badge patterns
    """
    h = str(html or "")

    # 1. fundedAt date present = definitely funded
    if re.search(r'[\\]?"fundedAt[\\]?":\s*[\\]?"[^"n]', h):
        return "Funded"

    # 2. Status enum in Next.js embedded JSON
    # Matches both plain "status":"VALUE" and escaped \"status\":\"VALUE\"
    m = re.search(r'[\\]?"status[\\]?":\s*[\\]?"([A-Z_]{3,})[\\]?"', h)
    if m:
        code = m.group(1).upper()
        status_map = {
            "INVESTOR_SELECTED": "On Hold - Investor Selected",
            "ON_HOLD":           "On Hold",
            "FUNDED":            "Funded",
            "SOLD":              "Sold",
            "WITHDRAWN":         "Withdrawn",
            "EXPIRED":           "Expired",
            "CANCELLED":         "Cancelled",
            "CANCELED":          "Canceled",
            "CLOSED":            "Closed",
        }
        active_codes = {
            "ACTIVE", "AVAILABLE", "APPROVED", "PUBLISHED",
            "LIVE", "OPEN", "LISTED", "NEW", "UPDATED", "PENDING",
        }
        if code in status_map:
            return status_map[code]
        if code in active_codes:
            return ""   # explicitly active
        # Unknown code - show prettified but treat as potentially unavailable
        return code.replace("_", " ").title()

    # 3. Fallback: visible badge text patterns (last resort)
    badges = [
        (r"on\s*hold[^a-z0-9]{0,8}investor\s*selected", "On Hold - Investor Selected"),
        (r'"fundedAt"',                                  "Funded"),
        (r'"funded"',                                    "Funded"),
        (r'>\s*funded\s*<',                              "Funded"),
        (r'>\s*sold\s*<',                                "Sold"),
        (r'no\s*longer\s*available',                     "No longer available"),
        (r'>\s*withdrawn\s*<',                           "Withdrawn"),
        (r'>\s*expired\s*<',                             "Expired"),
    ]
    for pattern, label in badges:
        if re.search(pattern, h, re.IGNORECASE):
            return label

    return ""   # active / status not detected


def check_page(url: str) -> tuple:
    """
    Fetch the deal page and determine availability.
    Returns (is_available, status_label, error_msg)
      is_available: True = still available, False = unavailable, None = could not check
    """
    try:
        resp = requests.get(url, headers=HTTP_HEADERS, timeout=20, allow_redirects=True)

        # 404 = page gone
        if resp.status_code == 404:
            return False, "Page not found (404)", None

        # Other HTTP errors - skip this deal, retry next run
        if resp.status_code >= 400:
            return None, "", f"HTTP {resp.status_code}"

        status = detect_status(resp.text)

        if status in UNAVAILABLE_WMSTATUSES or status.upper() in UNAVAILABLE_STATUS_CODES:
            return False, status, None

        return True, "Available", None

    except requests.exceptions.Timeout:
        return None, "", "Timeout - will retry next run"
    except Exception as e:
        return None, "", str(e)


# Google Sheets batch update
def batch_mark_liked_na(ws, deals: list, vs_col: int):
    """
    Set ViewedStatus = 'liked_na' for all deals in one Sheets API call.
    vs_col: 1-based column index of ViewedStatus
    """
    if not deals:
        return
    updates = []
    for d in deals:
        cell = gspread.utils.rowcol_to_a1(d["row"], vs_col)
        updates.append({"range": cell, "values": [["liked_na"]]})
    ws.batch_update(updates)


# Email
def send_email(subject: str, html: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = GMAIL_ADDRESS
    msg["To"]      = ", ".join(RECIPIENTS)
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
        s.login(GMAIL_ADDRESS, GMAIL_PASS)
        s.sendmail(GMAIL_ADDRESS, RECIPIENTS, msg.as_string())
    print(f"  Email sent: {subject}")


def build_email(
    checked: int, unavailable: list, skipped: list, error: str = ""
) -> tuple:
    count = len(unavailable)
    now   = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    if error:
        subj = "ASAP Pipeline - Availability Check ERROR"
    elif checked == 0:
        subj = "ASAP Pipeline - Availability Check: no deals to check"
    elif count == 0:
        subj = "ASAP Pipeline - All " + str(checked) + " deal(s) still available"
    else:
        subj = "ASAP Pipeline - " + str(count) + " deal(s) no longer available"

    # Summary line
    if error:
        summary = "<p style='color:#c0392b'>Error: " + error + "</p>"
    elif checked == 0:
        summary = ("<p>No deals to check. All WorkingMoni deals already have "
                   "a ViewedStatus set, or no WorkingMoni deals exist in the sheet.</p>")
    else:
        summary = "<p>Checked <b>" + str(checked) + "</b> deal(s) with no ViewedStatus.</p>"

    all_good = ""
    if checked > 0 and count == 0 and not error:
        all_good = ("<p style='color:#1e9e6a;font-weight:600'>"
                    "All " + str(checked) + " deals are still available.</p>")

    # Table of unavailable deals
    rows = ""
    for d in unavailable:
        rows += (
            "<tr style='background:#fdecea'>"
            "<td style='padding:6px 12px'>"
            "<a href='" + d["url"]
            + "' style='color:#c0392b;text-decoration:none'>"
            + d["address"] + "</a>"
            "<br><span style='font-size:10px;color:#aaa'>"
            + d["deal_id"][-8:] + " - " + d.get("reason", "") + "</span>"
            "</td>"
            "<td style='padding:6px 12px'>" + (d["loan_type"] or "-") + "</td>"
            "<td style='padding:6px 12px'>" + (d["state"] or "-") + "</td>"
            "<td style='padding:6px 12px;color:#c0392b;font-weight:600'>"
            "Liked - not available</td>"
            "</tr>"
        )

    table = ""
    if rows:
        table = (
            "<table style='border-collapse:collapse;width:100%;font-size:14px;margin-top:12px'>"
            "<thead><tr style='background:#c0392b;color:#fff'>"
            "<th style='padding:8px 12px;text-align:left'>Address</th>"
            "<th style='padding:8px 12px;text-align:left'>Loan Type</th>"
            "<th style='padding:8px 12px;text-align:left'>State</th>"
            "<th style='padding:8px 12px;text-align:left'>Status</th>"
            "</tr></thead><tbody>" + rows + "</tbody></table>"
        )

    skip_note = ""
    if skipped:
        skip_note = (
            "<p style='color:#888;font-size:12px'>"
            + str(len(skipped))
            + " deal(s) could not be checked (load errors) "
            "and will be retried next run.</p>"
        )

    html = (
        "<html><body style='font-family:sans-serif;padding:20px;color:#1a1a1a'>"
        "<h2 style='color:#0e3f63'>ASAP Pipeline - Availability Check</h2>"
        + summary + all_good + table + skip_note
        + "<p style='margin-top:16px;color:#888;font-size:12px'>"
        + now + " - ASAP Funding Pipeline Automation</p>"
        "</body></html>"
    )
    return subj, html


# Main
def main():
    print("Connecting to Google Sheets...")
    try:
        ws = get_sheet()
    except Exception as e:
        print(f"Failed to connect to Sheets: {e}")
        send_email(
            "ASAP Pipeline - Availability Check ERROR",
            "<p>Could not connect to Google Sheets: " + str(e) + "</p>"
        )
        return

    print("Reading deals...")
    try:
        headers, deals, vs_col = read_deals(ws)
    except Exception as e:
        print(f"Failed to read sheet: {e}")
        send_email(
            "ASAP Pipeline - Availability Check ERROR",
            "<p>Could not read Pipeline_Deals: " + str(e) + "</p>"
        )
        return

    print(f"  {len(deals)} deal(s) with blank ViewedStatus to check")

    if not deals:
        subj, html = build_email(0, [], [])
        send_email(subj, html)
        return

    unavailable, skipped = [], []

    for i, deal in enumerate(deals, 1):
        print(f"  [{i}/{len(deals)}] {deal['address']}")

        # Fast path: WMStatus already shows unavailable from Apps Script sweep
        # No page visit needed - the sweep has already confirmed it
        if deal["wm_status"] in UNAVAILABLE_WMSTATUSES:
            print(f"    -> WMStatus already set: {deal['wm_status']} (no page visit needed)")
            deal["reason"] = deal["wm_status"]
            unavailable.append(deal)
            continue

        # Slow path: check the page via HTTP
        available, status, error = check_page(deal["url"])

        if available is None:
            # Could not load - skip, retry next run
            print(f"    -> Skipped: {error}")
            skipped.append(deal)
        elif not available:
            print(f"    -> No longer available: {status}")
            deal["reason"] = status
            unavailable.append(deal)
        else:
            print(f"    -> Still available")

        # Polite delay between requests
        time.sleep(1.5)

    # Batch update all unavailable deals in one Sheets API call
    if unavailable:
        print(f"  Updating {len(unavailable)} deal(s) in sheet (batch)...")
        try:
            batch_mark_liked_na(ws, unavailable, vs_col)
            print("  Done.")
        except Exception as e:
            print(f"  Batch update failed: {e}")
            # Fall back to individual updates
            for d in unavailable:
                try:
                    ws.update_cell(d["row"], vs_col, "liked_na")
                except Exception as e2:
                    print(f"    Individual update failed for {d['deal_id']}: {e2}")

    subj, html = build_email(len(deals), unavailable, skipped)
    send_email(subj, html)
    print(
        f"\nDone - {len(unavailable)} marked liked_na, "
        f"{len(skipped)} skipped, "
        f"{len(deals) - len(unavailable) - len(skipped)} still available"
    )


if __name__ == "__main__":
    main()
