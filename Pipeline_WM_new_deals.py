"""
ASAP Pipeline - WorkingMoni New Deal Importer
Runs twice daily via GitHub Actions.

1. Playwright loads workingmoni.com/investors?availableOnly=true
2. For each new deal URL, Playwright visits the deal page and reads the
   FULLY RENDERED visible text (React-rendered) - this gives us ALL fields
   including DesiredTerm, LienPosition, LoanPurpose, ExitPlan, BorrowerDetails
   which are NOT available via plain HTTP
3. New rows are appended to Pipeline_Deals in Google Sheets by column name
4. Email summary always sent
"""

import asyncio, json, os, re, smtplib
from datetime import date, datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from playwright.async_api import async_playwright
import gspread
from google.oauth2.service_account import Credentials

# Config
LISTING_URL    = "https://workingmoni.com/investors?availableOnly=true"
SPREADSHEET_ID = "1bfbptTehrBLjP7fyLYyAXRDfuExAvaBacofJyJfgGeM"
DEALS_TAB      = "Pipeline_Deals"
GMAIL_ADDRESS  = os.environ["GMAIL_ADDRESS"]
GMAIL_PASS     = os.environ["GMAIL_APP_PASSWORD"]
RECIPIENTS     = [e.strip() for e in os.environ["RECIPIENT_EMAIL"].split(",")]
SCOPES         = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]


# Google Sheets helpers
def get_sheet():
    sa_info = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"])
    creds   = Credentials.from_service_account_info(sa_info, scopes=SCOPES)
    gc      = gspread.authorize(creds)
    return gc.open_by_key(SPREADSHEET_ID).worksheet(DEALS_TAB)


def get_existing_urls(ws) -> set:
    try:
        headers = ws.row_values(1)
        col     = headers.index("SourceURL") + 1
        return {u.strip() for u in ws.col_values(col)[1:] if u.strip()}
    except Exception as e:
        print(f"  Warning reading existing URLs: {e}")
        return set()


def append_deals(ws, deals: list):
    """Write rows aligned to column names - safe against reordering."""
    headers = ws.row_values(1)
    n       = len(headers)
    rows    = []
    for d in deals:
        row = [""] * n
        for key, val in d.items():
            try:
                row[headers.index(key)] = "" if val is None else val
            except ValueError:
                pass
        rows.append(row)
    if rows:
        ws.append_rows(rows, value_input_option="USER_ENTERED")


# Text helpers
def clean(v) -> str:
    s = str(v or "").strip()
    return "" if s.lower() in {"tbd", "n/a", "na", "negotiable", "-", "", "none", "null"} else s


def to_money(s) -> float:
    """'$172,000' or '172000' -> 172000.0, returns 0 on failure."""
    n = re.sub(r"[^0-9.]", "", str(s or ""))
    try:
        v = float(n)
        return v if v > 0 else 0.0
    except ValueError:
        return 0.0


def to_acres(lot: str) -> str:
    """'6921573' sqft -> '158.9' acres. Small numbers kept as-is."""
    m = re.match(r"([\d,]+(?:\.\d+)?)", str(lot or ""))
    if not m:
        return ""
    n = float(m.group(1).replace(",", ""))
    if n <= 0:
        return ""
    return str(round(n / 43560, 2)) if n > 500 else str(round(n, 2))


def deal_id(url: str) -> str:
    return url.rstrip("/").split("/")[-1].split("?")[0]


# Visible-text extraction helpers
# These work on the plain text returned by page.inner_text("body")
# i.e. what a user actually sees on screen after React renders

LABEL_NAMES = {
    "loan type", "appraiser", "ltv", "annual return",
    "investment annual income", "investment monthly income",
    "desired loan term", "lien position", "lot size", "building size",
    "zoning", "zoning / use", "occupancy", "property type", "fico score",
    "loan purpose", "property summary", "exit plan", "borrower introduction",
    "seeking", "next steps", "request loan package", "due diligence",
    "have a deal",
}

def is_label(s: str) -> bool:
    return s.strip().lower() in LABEL_NAMES or bool(re.match(
        r"^(seeking\b|loan\s*type$|appraiser$|ltv$|annual\s*return$|"
        r"investment\s*(annual|monthly)\s*income$|desired\s*loan\s*term$|"
        r"lien\s*position$|lot\s*size|building\s*size|zoning|occupancy$|"
        r"property\s*type$|fico|loan\s*purpose$|property\s*summary$|"
        r"exit\s*plan$|borrower\s*introduction$|next\s*steps|request\s*loan|"
        r"due\s*diligence|have\s*a\s*deal)",
        s.strip(), re.IGNORECASE
    ))


def find_value(lines: list, label_re: str, value_re: str = None) -> str:
    """
    Find the value that follows a label in the visible text lines.
    Handles both same-line ('Label: Value') and next-line ('Label\nValue') formats.
    """
    for i, line in enumerate(lines):
        if not re.search(label_re, line, re.IGNORECASE):
            continue
        # Same line: "Loan Type: Res. 1-4 Units"
        rest = re.sub(label_re, "", line, flags=re.IGNORECASE)
        rest = re.sub(r"^[\s:–\-]+", "", rest).strip()
        if rest and (not value_re or re.search(value_re, rest)):
            return rest
        # Next line(s)
        for j in range(i + 1, min(i + 3, len(lines))):
            v = lines[j].strip()
            if not v:
                continue
            if is_label(v):
                break
            if not value_re or re.search(value_re, v):
                return v
            break
    return ""


def find_section(lines: list, start_re: str) -> str:
    """
    Collect all text between a section header and the next section header.
    Used for LoanPurpose, PropertySummary, ExitPlan, BorrowerDetails.
    """
    out, on = [], False
    for line in lines:
        t = line.strip()
        if not on:
            if re.match(start_re, t, re.IGNORECASE) and len(t) < 60:
                on = True
            continue
        if is_label(t) or re.match(
            r"^(transaction overview|project economics|sponsor profile|"
            r"next steps|request loan|have a deal|due diligence)",
            t, re.IGNORECASE
        ):
            break
        if t:
            out.append(re.sub(r"^[*\u2022\u00b7\-]\s*", "", t))
        if len(out) > 60:
            break
    return " ".join(out).strip()


# Listing page
async def get_available_urls(page) -> list:
    print(f"  Loading listing: {LISTING_URL}")
    await page.goto(LISTING_URL, wait_until="domcontentloaded", timeout=45000)
    await page.wait_for_function(
        "() => document.body.innerText.includes('Seeking')", timeout=30000
    )
    await asyncio.sleep(3)
    for _ in range(6):
        await page.mouse.wheel(0, 2000)
        await asyncio.sleep(0.8)
    await asyncio.sleep(2)

    links = await page.eval_on_selector_all(
        "a[href*='/investors/']", "els => els.map(e => e.href)"
    )
    seen, out = set(), []
    for l in links:
        c = l.split("?")[0].rstrip("/")
        if "/investors/" not in c or c.endswith("/investors"):
            continue
        if c not in seen:
            seen.add(c)
            out.append(c)
    print(f"  Found {len(out)} available deals")
    return out


# Individual deal page - uses Playwright for full render
async def scrape_deal(page, url: str) -> dict:
    """
    Visits the deal page with Playwright so React fully renders.
    Reads page.inner_text('body') which gives us all visible fields
    including DesiredTerm, LienPosition, LoanPurpose, ExitPlan etc.
    """
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        # Wait for the deal content to render
        try:
            await page.wait_for_selector("text=Seeking", timeout=8000)
        except Exception:
            pass  # Some deals may not have "Seeking" text - continue anyway
        await asyncio.sleep(1.5)

        # Page title gives us the street name cleanly
        # Format: "Hayward Ave N | WorkingMoni"
        page_title = await page.title()
        street = ""
        for part in re.split(r"\s*\|\s*", page_title):
            if part.strip() and "workingmoni" not in part.lower():
                street = part.strip()
                break

        # Full visible text - React has rendered everything by now
        body = await page.inner_text("body")
        lines = [l.strip() for l in body.split("\n") if l.strip()]

        # Location: find "City, ST ZIP" pattern in visible text
        city, state, zip_code = "", "", ""
        for line in lines:
            m = re.match(r"^([A-Za-z\s\-\.]+),\s*([A-Z]{2})\s+(\d{5})", line)
            if m:
                city      = m.group(1).strip()
                state     = m.group(2)
                zip_code  = m.group(3)
                break

        # Loan amount: "Seeking 1st TD Loan\n$172,000"
        # The label is the "Seeking..." line, value is the $ amount on next line
        loan_amt_str = find_value(lines, r"^Seeking\s+\d", r"\$")
        loan_amount  = to_money(loan_amt_str) or None

        # Loan type
        loan_type = clean(find_value(lines, r"^Loan\s*Type$"))
        # Strip "Appraiser / Based on ARV / Project Cost" suffixes
        loan_type = re.sub(
            r"\s*(Appraiser|Appraisal|Based\s+on\s+ARV|Project\s+Cost|"
            r"Total\s+Appraisal\s+Value).*$",
            "", loan_type, flags=re.IGNORECASE
        ).strip()

        # Lien position
        lien = clean(find_value(lines, r"^Lien\s*Position$"))
        if not lien:
            m = re.search(r"Seeking\s+(1st|2nd|3rd|1st\s*&\s*2nd)\s+TD", body, re.IGNORECASE)
            if m:
                lien = m.group(1)

        # Market value (Appraiser label) + LTV
        mkt_raw   = find_value(lines, r"^Appraiser$", r"\$")
        mkt_value = to_money(mkt_raw) or None
        ltv_raw   = clean(find_value(lines, r"^LTV$", r"[\d%]"))
        # Store LTV as plain number e.g. "63" for 63% (matches existing format)
        ltv = re.sub(r"%", "", ltv_raw).strip() if ltv_raw else ""

        # Returns / income
        ar_raw        = clean(find_value(lines, r"^Annual\s*Return$"))
        # Store as integer percentage: "13" not "0.13"
        ar_num        = to_money(ar_raw)
        annual_return = str(int(ar_num)) if ar_num and ar_num > 1 else (
                        str(int(ar_num * 100)) if ar_num and ar_num < 1 else ar_raw
                        )
        annual_income = to_money(find_value(lines, r"^Investment\s*Annual\s*Income$", r"[\$\d]")) or None
        monthly_rent  = to_money(find_value(lines, r"^Investment\s*Monthly\s*Income$", r"[\$\d]")) or None

        # Property details
        desired_term  = clean(find_value(lines, r"^Desired\s*Loan\s*Term$"))
        lot_raw       = clean(find_value(lines, r"^Lot\s*Size", r"\d"))
        lot_size      = lot_raw
        lot_acres     = to_acres(lot_raw)
        zoning        = clean(find_value(lines, r"^Zoning(\s*/\s*Use)?$"))
        occupancy     = clean(find_value(lines, r"^Occupancy$"))
        prop_type     = clean(find_value(lines, r"^Property\s*Type$"))
        bldg_size     = clean(find_value(lines, r"^Building\s*Size", r"\d"))

        # FICO: strip "Score " prefix to match existing format
        fico_raw = clean(find_value(lines, r"^FICO\s*Score?$"))
        fico     = re.sub(r"^Score\s+", "", fico_raw, flags=re.IGNORECASE).strip()

        # Long text sections - only available with Playwright full render
        loan_purpose     = clean(find_section(lines, r"^Loan\s*Purpose$"))[:2000]
        prop_summary     = clean(find_section(lines, r"^Property\s*Summary$"))[:2000]
        exit_plan        = clean(find_section(lines, r"^Exit\s*Plan$"))[:1000]
        borrower_details = clean(find_section(lines, r"^Borrower\s*Introduction$"))[:1000]

        # Assembled address
        addr_parts    = [p for p in [street, city, (state + " " + zip_code).strip()] if p]
        assembled_addr = ", ".join(addr_parts)

        d_id = deal_id(url)

        return {
            "DealID":           d_id,
            "SourceURL":        url,
            "City":             city,
            "State":            state,
            "Zip":              zip_code,
            "Street":           street,
            "HouseNum":         "",
            "AssembledAddress": assembled_addr,
            "LoanAmount":       loan_amount or "",
            "LoanType":         loan_type,
            "MarketValue":      mkt_value or "",
            "ValueSource":      "listing",
            "SecondValue":      "",
            "LTV":              ltv,
            "AnnualReturn":     annual_return,
            "AnnualIncome":     annual_income or "",
            "MonthlyRent":      monthly_rent or "",
            "DesiredTerm":      desired_term,
            "LienPosition":     lien,
            "BuildingSize":     bldg_size,
            "LotSize":          lot_size,
            "LotAcres":         lot_acres,
            "ZoningUse":        zoning,
            "Occupancy":        occupancy,
            "PropertyType":     prop_type,
            "FICO":             fico,
            "LoanPurpose":      loan_purpose,
            "PropertySummary":  prop_summary,
            "ExitPlan":         exit_plan,
            "BorrowerDetails":  borrower_details,
            "UploadBy":         "",
            "BorrowerName":     "",
            "BorrowerEmail":    "",
            "Grade":            "",
            "Status":           "",
            "Provenance":       "listing",
            "DateAdded":        date.today().isoformat(),
        }

    except Exception as e:
        print(f"    Error scraping {url}: {e}")
        return None


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


def build_email(added: list, errors: int) -> tuple:
    count = len(added)
    now   = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    err_p = ""
    if errors:
        err_p = ("<p style='color:#c0392b;font-size:12px'>"
                 + str(errors) + " URL(s) failed - will retry next run.</p>")

    if count == 0:
        subj = "ASAP Pipeline - No new deals this run"
        body = ("<p>No new deals found. All available deals are already in your spreadsheet.</p>"
                + err_p)
        return subj, ("<html><body style='font-family:sans-serif;padding:20px'>"
                      "<h2 style='color:#0e3f63'>ASAP Pipeline - Deal Importer</h2>"
                      + body
                      + "<p style='color:#888;font-size:12px'>" + now
                      + " - ASAP Funding Pipeline Automation</p></body></html>")

    subj = ("ASAP Pipeline - " + str(count)
            + " new deal" + ("s" if count != 1 else "") + " added")
    rows = ""
    for d in added:
        d_id     = d.get("DealID", "")
        lamt     = d.get("LoanAmount", "")
        loan_str = ("$" + "{:,.0f}".format(float(lamt))) if lamt else "-"
        addr     = d.get("AssembledAddress") or d.get("Street") or d_id
        id_tag   = ("<br><span style='font-size:10px;color:#aaa'>ID: "
                    + d_id[-8:] + "</span>")
        rows += (
            "<tr><td style='padding:6px 12px'>"
            "<a href='" + d.get("SourceURL", "")
            + "' style='color:#1c75bc;text-decoration:none'>"
            + addr + "</a>" + id_tag + "</td>"
            "<td style='padding:6px 12px'>" + str(d.get("LoanType") or "-") + "</td>"
            "<td style='padding:6px 12px;font-family:monospace'>" + loan_str + "</td>"
            "<td style='padding:6px 12px'>" + str(d.get("State") or "-") + "</td>"
            "</tr>"
        )
    html = (
        "<html><body style='font-family:sans-serif;padding:20px;color:#1a1a1a'>"
        "<h2 style='color:#0e3f63'>ASAP Pipeline - New Deals Added</h2>"
        "<p>" + str(count) + " new deal" + ("s have" if count != 1 else " has")
        + " been added to <b>Pipeline_Deals</b>.</p>"
        "<table style='border-collapse:collapse;width:100%;font-size:14px'>"
        "<thead><tr style='background:#0e3f63;color:#fff'>"
        "<th style='padding:8px 12px;text-align:left'>Address</th>"
        "<th style='padding:8px 12px;text-align:left'>Loan Type</th>"
        "<th style='padding:8px 12px;text-align:left'>Loan Amount</th>"
        "<th style='padding:8px 12px;text-align:left'>State</th>"
        "</tr></thead><tbody>" + rows + "</tbody></table>"
        + err_p
        + "<p style='margin-top:16px;color:#888;font-size:12px'>"
        + now + " - ASAP Funding Pipeline Automation</p>"
        "</body></html>"
    )
    return subj, html


# Main
async def run():
    print("Connecting to Google Sheets...")
    ws = get_sheet()

    existing = get_existing_urls(ws)
    print(f"  {len(existing)} existing deals in sheet")

    added, errors = [], 0

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        )
        page = await context.new_page()

        # Step 1: Get all available deal URLs from listing page
        try:
            all_urls = await get_available_urls(page)
        except Exception as e:
            print(f"Failed to load listing page: {e}")
            await browser.close()
            send_email(
                "ASAP Pipeline - Deal Importer ERROR",
                "<p>Failed to load WorkingMoni listing: " + str(e) + "</p>"
            )
            return

        # Step 2: Filter to new URLs not already in sheet
        new_urls = [u for u in all_urls if u not in existing]
        print(f"  {len(new_urls)} new deal(s) to import")

        # Step 3: Visit each new deal page with Playwright and extract data
        for url in new_urls:
            print(f"  Scraping: {url}")
            data = await scrape_deal(page, url)
            if data:
                added.append(data)
                print(f"    -> {data.get('AssembledAddress') or '(no address)'}")
            else:
                errors += 1
            await asyncio.sleep(1)

        await browser.close()

    # Step 4: Write to Google Sheets
    if added:
        print(f"  Writing {len(added)} row(s) to sheet...")
        append_deals(ws, added)
        print("  Done.")

    # Step 5: Always send email
    subj, html = build_email(added, errors)
    send_email(subj, html)
    print(f"\nDone - {len(added)} added, {errors} errors")


def main():
    asyncio.run(run())


if __name__ == "__main__":
    main()            except ValueError:
                pass
        rows.append(row)
    if rows:
        ws.append_rows(rows, value_input_option="USER_ENTERED")


# ── WorkingMoni listing page (Playwright) ─────────────────────────────────────
async def get_available_urls(page) -> list:
    print(f"  Loading: {LISTING_URL}")
    await page.goto(LISTING_URL, wait_until="domcontentloaded", timeout=45000)
    await page.wait_for_function(
        "() => document.body.innerText.includes('Seeking')", timeout=30000
    )
    await asyncio.sleep(3)
    for _ in range(6):
        await page.mouse.wheel(0, 2000)
        await asyncio.sleep(0.8)
    await asyncio.sleep(2)

    links = await page.eval_on_selector_all(
        "a[href*='/investors/']",
        "els => els.map(e => e.href)"
    )
    seen, out = set(), []
    for l in links:
        clean = l.split("?")[0].rstrip("/")
        if "/investors/" not in clean or clean.endswith("/investors"):
            continue
        if clean not in seen:
            seen.add(clean)
            out.append(clean)
    print(f"  Found {len(out)} available deal URLs")
    return out


# ── Deal page extraction helpers ──────────────────────────────────────────────
HEADERS_HTTP = {
    "User-Agent":      "Mozilla/5.0 (compatible; ASAPFunding-StatusCheck)",
    "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}
MONEY = r"\$?\s*[\d,]+"
TBD   = {"tbd", "n/a", "na", "negotiable", "-", "-", "", "null"}


def clean_val(v: str) -> str:
    v = str(v or "").replace("\\n", "\n").replace('\\"', '"').replace("\\\\", "\\")
    v = re.sub(r"\\u([0-9a-fA-F]{4})", lambda x: chr(int(x.group(1), 16)), v)
    return v.strip()


def wm_jval(html: str, keys: list) -> str:
    """
    Extract first matching JSON value from raw HTML.
    Handles both plain JSON ("key":"val") and Next.js escaped JSON (\"key\":\"val\").
    Mirrors pipeline_wmJval_() in Pipeline_WM_watch.gs exactly.
    """
    for k in keys:
        ke = re.escape(k)
        # 1) Plain JSON: "key":"value"
        m = re.search(rf'"{ke}"\s*:\s*"((?:\\.|[^"\\])*)"', html)
        if m:
            v = clean_val(m.group(1))
            if v.lower() not in TBD:
                return v
        # 2) Escaped JSON (Next.js style): \"key\":\"value\"
        m = re.search(rf'\\"' + ke + r'\\"\s*:\s*\\"((?:[^"\\]|\\\\|\\[^"])*)\\\"', html)
        if m:
            v = clean_val(m.group(1))
            if v.lower() not in TBD:
                return v
        # 3) Numeric (plain or escaped key): "key":12345  or  \"key\":12345
        m = re.search(rf'\\?"{ke}\\?"\s*:\s*(-?\d[\d.]*)', html)
        if m and float(m.group(1)) != 0:
            return m.group(1)
    return ""


def wm_text_lines(html: str) -> list:
    """
    Convert HTML to clean visible text lines.
    Mirrors pipeline_wmText_() in Pipeline_WM_watch.gs.
    """
    h = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.IGNORECASE)
    h = re.sub(r"<style[\s\S]*?</style>",   " ", h,    flags=re.IGNORECASE)
    # Opening <li> becomes newline (matches Apps Script)
    h = re.sub(r"<li[^>]*>", "\n", h, flags=re.IGNORECASE)
    # Closing block tags become newlines
    h = re.sub(r"<(?:br|/p|/div|/li|/h[1-6]|/tr|/section|/article)[^>]*>", "\n", h, flags=re.IGNORECASE)
    h = re.sub(r"<[^>]+>", " ", h)
    for ent, ch in [("&amp;","&"),("&lt;","<"),("&gt;",">"),("&quot;",'"'),("&nbsp;"," ")]:
        h = h.replace(ent, ch)
    lines = []
    for l in h.split("\n"):
        l = re.sub(r"\s+", " ", l).strip()
        if l:
            lines.append(l)
    return lines


def is_label(s: str) -> bool:
    return bool(re.match(
        r"^(seeking\b|loan\s*type$|appraiser$|ltv$|annual\s*return$|"
        r"investment\s*(annual|monthly)\s*income$|desired\s*loan\s*term$|"
        r"lien\s*position$|lot\s*size|building\s*size|zoning|occupancy$|"
        r"property\s*type$|fico|loan\s*purpose$|property\s*summary$|"
        r"exit\s*plan$|borrower\s*introduction$|next\s*steps|request|"
        r"due\s*diligence)",
        s.strip(), re.IGNORECASE
    ))


def wm_label(lines: list, label_re: str, value_re: str = None) -> str:
    for i, line in enumerate(lines):
        if not re.search(label_re, line, re.IGNORECASE):
            continue
        rest = re.sub(label_re, "", line, flags=re.IGNORECASE)
        rest = re.sub(r"^[:\s\u2013\u2014\-]+", "", rest).strip()
        if rest and (not value_re or re.search(value_re, rest)):
            return rest
        for j in range(i + 1, min(i + 3, len(lines))):
            v = lines[j].strip()
            if not v:
                continue
            if is_label(v):
                break
            if not value_re or re.search(value_re, v):
                return v
            break
    return ""


def wm_section(lines: list, start_re: str) -> str:
    out, on = [], False
    for line in lines:
        t = line.strip()
        if not on:
            if re.match(start_re, t, re.IGNORECASE) and len(t) < 60:
                on = True
            continue
        if is_label(t) or re.match(
            r"^(transaction overview|project economics|sponsor profile)", t, re.IGNORECASE
        ):
            break
        if t:
            out.append(re.sub(r"^[•·\-*]\s*", "", t))
        if len(out) > 40:
            break
    return "; ".join(out).strip()


def wm_num(s) -> float:
    n = re.sub(r"[^0-9.]", "", str(s or ""))
    try:
        v = float(n)
        return v if v > 0 else 0.0
    except ValueError:
        return 0.0


def wm_acres(lot: str) -> str:
    m = re.match(r"([\d,]+(?:\.\d+)?)", str(lot or ""))
    if not m:
        return ""
    n = float(m.group(1).replace(",", ""))
    if n <= 0:
        return ""
    return str(round(n / 43560, 2)) if n > 500 else str(n)


def clean_field(v) -> str:
    """Blank out TBD/N/A values; return clean string."""
    s = str(v or "").strip()
    return "" if s.lower() in TBD else s


# ── Individual deal page extraction ──────────────────────────────────────────
def extract_deal_data(url: str) -> dict:
    """
    Fetch a WorkingMoni deal page via plain HTTP (same as UrlFetchApp in Apps Script)
    and extract all Pipeline_Deals fields.
    Returns None on fetch error.
    """
    try:
        resp = requests.get(url, headers=HEADERS_HTTP, timeout=20, allow_redirects=True)
        if resp.status_code >= 400:
            print(f"    HTTP {resp.status_code}")
            return None
    except Exception as e:
        print(f"    Fetch error: {e}")
        return None

    html  = resp.text
    lines = wm_text_lines(html)
    J     = lambda keys: wm_jval(html, keys)

    # ── Street / address ──────────────────────────────────────────────────────
    # WorkingMoni page <title> is usually "Street Name | WorkingMoni"
    street = ""
    title_m = re.search(r"<title[^>]*>([^<]+)</title>", html, re.IGNORECASE)
    if title_m:
        title_txt = title_m.group(1).strip()
        for part in re.split(r"\s*[\|–\-]\s*", title_txt):
            part = part.strip()
            if part and "workingmoni" not in part.lower():
                street = part
                break

    # Fallback: JSON address fields
    if not street or street.lower() == "workingmoni":
        street = (
            J(["streetAddress", "address", "street", "propertyAddress", "dealTitle"])
            or ""
        )

    # Fallback: extract street from loanPurpose "TYPE – Street, City ST"
    if not street or street.lower() == "workingmoni":
        lp_raw = J(["loanPurpose"])
        if lp_raw:
            # "Refinance/Cash-Out – Hayward Ave N, Oakdale, MN" → "Hayward Ave N"
            m = re.search(r"[–\-]\s*(.+?),\s*[A-Z][a-z]", lp_raw)
            if m:
                street = m.group(1).strip()

    # ── Location ─────────────────────────────────────────────────────────────
    city     = clean_field(J(["city"]))
    state    = clean_field(J(["state", "stateCode"]))
    zip_code = clean_field(J(["zip", "zipCode", "postalCode"]))

    # Fallback: parse "City, ST 12345" pattern from visible text lines
    if not city:
        for line in lines:
            m = re.match(r"^([^,\n]+),\s*([A-Z]{2})\s*(\d{5})", line)
            if m:
                city, state, zip_code = m.group(1).strip(), m.group(2), m.group(3)
                break

    # ── Loan amount ───────────────────────────────────────────────────────────
    # Priority: visible "Seeking ... $XXX" text (most reliable)
    # then specific JSON keys (NOT "loanAmount" which maps to total project cost)
    loan_amount_raw = (
        wm_label(lines, r"^seeking\b", MONEY)
        or J(["seekingAmount", "requestedAmount", "requestedLoanAmount", "amountRequested"])
    )
    loan_amount = wm_num(loan_amount_raw) or None

    # ── Loan type ─────────────────────────────────────────────────────────────
    loan_type = (
        J(["loanType", "dealType"])
        or wm_label(lines, r"^loan\s*type$")
    )
    # Strip "Appraiser / Based on ARV / Project Cost" suffix added by WorkingMoni
    loan_type = re.sub(
        r"\s+(Appraiser|Appraisal|Based\s+on\s+ARV|Project\s+Cost|"
        r"Total\s+Appraisal\s+Value).*$",
        "", loan_type, flags=re.IGNORECASE
    ).strip()

    # ── Lien position ─────────────────────────────────────────────────────────
    lien_position = (
        J(["lienPosition", "lien"])
        or wm_label(lines, r"^lien\s*position$")
    )
    if not lien_position:
        m = re.search(r"Seeking\s+(1st|2nd|3rd|1st\s*&\s*2nd)\s+TD", html, re.IGNORECASE)
        if m:
            lien_position = m.group(1)

    # ── Property value + LTV ─────────────────────────────────────────────────
    market_value_raw = (
        J(["appraisedValue", "appraisal", "appraiserValue", "marketValue",
           "estimatedValue", "propertyValue", "asIsValue"])
        or wm_label(lines, r"^appraiser$", MONEY)
    )
    market_value = wm_num(market_value_raw) or None

    ltv_raw = (
        J(["ltv", "loanToValue"])
        or wm_label(lines, r"^ltv$", r"%|\d")
    )
    # Store LTV as raw percentage number (e.g. 75 for 75%) matching existing data format
    ltv = clean_field(ltv_raw)

    # ── Returns / income ──────────────────────────────────────────────────────
    annual_return_raw = (
        J(["annualReturn"])
        or wm_label(lines, r"^annual\s*return$")
    )
    # Existing data stores annual return as integer percentage (e.g. 13 for 13%)
    # Convert decimal (0.13) → integer (13) if needed
    ar_num = wm_num(annual_return_raw)
    if ar_num and ar_num < 1:
        ar_num = round(ar_num * 100, 1)
    annual_return = ar_num or clean_field(annual_return_raw) or None

    annual_income_raw = (
        J(["investmentAnnualIncome", "annualIncome"])
        or wm_label(lines, r"^investment\s*annual\s*income$", MONEY)
    )
    annual_income = wm_num(annual_income_raw) or None

    monthly_rent_raw = (
        J(["investmentMonthlyIncome", "monthlyIncome", "monthlyRent"])
        or wm_label(lines, r"^investment\s*monthly\s*income$", MONEY)
    )
    monthly_rent = wm_num(monthly_rent_raw) or None

    # ── Property details ──────────────────────────────────────────────────────
    desired_term  = clean_field(
        J(["desiredLoanTerm", "desiredTerm", "loanTerm", "termLength"])
        or wm_label(lines, r"^desired\s*loan\s*term$")
    )
    lot_size      = clean_field(
        J(["lotSize", "lotSizeSqFt", "lotSizeAcres"])
        or wm_label(lines, r"^lot\s*size(\s*ac\s*/?sq\.?ft\.?)?\s*$", r"\d")
    )
    zoning_use    = clean_field(
        J(["zoningUse", "zoning"])
        or wm_label(lines, r"^zoning(\s*/\s*use)?\s*$")
    )
    occupancy     = clean_field(
        J(["occupancy"])
        or wm_label(lines, r"^occupancy$")
    )
    property_type = clean_field(
        J(["propertyType"])
        or wm_label(lines, r"^property\s*type$")
    )
    building_size = clean_field(
        J(["buildingSize", "buildingSqFt", "squareFeet"])
        or wm_label(lines, r"^building\s*size(\s*\(sq\s*ft\))?\s*$", r"\d")
    )

    # ── FICO ─────────────────────────────────────────────────────────────────
    fico_raw = (
        J(["ficoScore", "fico", "creditScore"])
        or wm_label(lines, r"^fico", r"\d{3}")
    )
    # Strip "Score " prefix - existing data stores just "700–719" not "Score 700–719"
    fico = re.sub(r"^score\s+", "", str(fico_raw or "").strip(), flags=re.IGNORECASE)
    fico = clean_field(fico)

    # ── Long text fields ──────────────────────────────────────────────────────
    loan_purpose     = clean_field(
        J(["loanPurpose"]) or wm_section(lines, r"^loan\s*purpose$")
    )
    prop_summary     = clean_field(
        J(["propertySummary"]) or wm_section(lines, r"^property\s*summary$")
    )
    exit_plan        = clean_field(
        J(["exitPlan", "exitStrategy"]) or wm_section(lines, r"^exit\s*plan$")
    )
    borrower_details = clean_field(
        J(["borrowerIntroduction", "borrowerDetails", "sponsorIntroduction"])
        or wm_section(lines, r"^borrower\s*introduction$")
    )

    # ── Assemble address ──────────────────────────────────────────────────────
    deal_id       = url.rstrip("/").split("/")[-1].split("?")[0]
    street_clean  = clean_field(street) if street.lower() != "workingmoni" else ""
    city_clean    = clean_field(city)
    state_clean   = clean_field(state)
    zip_clean     = clean_field(zip_code)
    addr_parts    = [p for p in [street_clean, city_clean,
                                  f"{state_clean} {zip_clean}".strip()] if p]
    assembled_addr = ", ".join(addr_parts)

    return {
        "DealID":           deal_id,
        "SourceURL":        url,
        "City":             city_clean,
        "State":            state_clean,
        "Zip":              zip_clean,
        "Street":           street_clean,
        "HouseNum":         "",
        "AssembledAddress": assembled_addr,
        "LoanAmount":       loan_amount or "",
        "LoanType":         clean_field(loan_type),
        "MarketValue":      market_value or "",
        "ValueSource":      "listing",
        "SecondValue":      "",
        "LTV":              ltv,
        "AnnualReturn":     annual_return or "",
        "AnnualIncome":     annual_income or "",
        "MonthlyRent":      monthly_rent or "",
        "DesiredTerm":      desired_term,
        "LienPosition":     clean_field(lien_position),
        "BuildingSize":     building_size,
        "LotSize":          lot_size,
        "LotAcres":         wm_acres(lot_size),
        "ZoningUse":        zoning_use,
        "Occupancy":        occupancy,
        "PropertyType":     property_type,
        "FICO":             fico,
        "LoanPurpose":      loan_purpose[:2000] if loan_purpose else "",
        "PropertySummary":  prop_summary[:2000] if prop_summary else "",
        "ExitPlan":         exit_plan[:1000] if exit_plan else "",
        "BorrowerDetails":  borrower_details[:1000] if borrower_details else "",
        "UploadBy":         "",
        "BorrowerName":     "",
        "BorrowerEmail":    "",
        "Grade":            "",
        "Status":           "",
        "Provenance":       "listing",
        "DateAdded":        date.today().isoformat(),
    }


# ── Email ─────────────────────────────────────────────────────────────────────
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


def build_email(added: list, errors: int) -> tuple:
    count = len(added)
    now   = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    err_p = ("<p style='color:#c0392b;font-size:12px'>" + str(errors) +
             " URL(s) failed to extract - will retry next run.</p>") if errors else ""

    if count == 0:
        subject  = "ASAP Pipeline - No new deals this run"
        body_html = ("<p>No new deals found on WorkingMoni. "
                     "All available deals are already in your spreadsheet.</p>" + err_p)
        return subject, ("<html><body style='font-family:sans-serif;padding:20px'>"
                         "<h2 style='color:#0e3f63'>ASAP Pipeline - Deal Importer</h2>"
                         + body_html +
                         "<p style='color:#888;font-size:12px'>" + now +
                         " · ASAP Funding Pipeline Automation</p></body></html>")

    subject = "ASAP Pipeline - " + str(count) + " new deal" + ("s" if count != 1 else "") + " added"
    rows = ""
    for d in added:
        deal_id  = d.get("DealID", "")
        loan_amt = d.get("LoanAmount", "")
        loan_str = ("$" + f"{float(loan_amt):,.0f}") if loan_amt else "-"
        addr     = d.get("AssembledAddress") or d.get("Street") or deal_id
        id_tag   = "<br><span style='font-size:10px;color:#aaa'>ID: " + deal_id[-8:] + "</span>"
        rows += (
            "<tr><td style='padding:6px 12px'>"
            "<a href='" + d.get("SourceURL", "") + "' style='color:#1c75bc;text-decoration:none'>"
            + addr + "</a>" + id_tag + "</td>"
            "<td style='padding:6px 12px'>" + str(d.get("LoanType") or "-") + "</td>"
            "<td style='padding:6px 12px;font-family:monospace'>" + loan_str + "</td>"
            "<td style='padding:6px 12px'>" + str(d.get("State") or "-") + "</td></tr>"
        )
    html = (
        "<html><body style='font-family:sans-serif;padding:20px;color:#1a1a1a'>"
        "<h2 style='color:#0e3f63'>ASAP Pipeline - New Deals Added to Spreadsheet</h2>"
        "<p>" + str(count) + " new deal" + ("s have" if count != 1 else " has") +
        " been added to <b>Pipeline_Deals</b>. "
        "Deals at the same address are separate properties - click to view each.</p>"
        "<table style='border-collapse:collapse;width:100%;font-size:14px'>"
        "<thead><tr style='background:#0e3f63;color:#fff'>"
        "<th style='padding:8px 12px;text-align:left'>Address</th>"
        "<th style='padding:8px 12px;text-align:left'>Loan Type</th>"
        "<th style='padding:8px 12px;text-align:left'>Loan Amount</th>"
        "<th style='padding:8px 12px;text-align:left'>State</th>"
        "</tr></thead><tbody>" + rows + "</tbody></table>"
        + err_p +
        "<p style='margin-top:16px;color:#888;font-size:12px'>" + now +
        " · ASAP Funding Pipeline Automation</p></body></html>"
    )
    return subject, html


# ── Main ──────────────────────────────────────────────────────────────────────
async def run():
    print("Connecting to Google Sheets...")
    ws = get_sheet()

    existing = get_existing_urls(ws)
    print(f"  {len(existing)} existing deals in sheet")

    added, errors = [], 0

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 Chrome/124 Safari/537.36"
            )
        )
        page = await context.new_page()

        try:
            all_urls = await get_available_urls(page)
        except Exception as e:
            print(f"Failed to load listing page: {e}")
            await browser.close()
            send_email(
                "ASAP Pipeline - New Deal Importer ERROR",
                "<p>Failed to load WorkingMoni listing: " + str(e) + "</p>"
            )
            return

        await browser.close()

    new_urls = [u for u in all_urls if u not in existing]
    print(f"  {len(new_urls)} new deal(s) to import")

    for url in new_urls:
        print(f"  Extracting: {url}")
        data = extract_deal_data(url)
        if data:
            added.append(data)
            print(f"    {data.get('AssembledAddress') or '(no address)'}")
        else:
            errors += 1

    if added:
        print(f"  Writing {len(added)} row(s) to {DEALS_TAB}...")
        append_deals(ws, added)

    subject, html = build_email(added, errors)
    send_email(subject, html)
    print(f"\nDone - {len(added)} added, {errors} errors")


def main():
    asyncio.run(run())


if __name__ == "__main__":
    main()
