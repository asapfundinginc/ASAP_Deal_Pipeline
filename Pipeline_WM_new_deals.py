"""
ASAP Pipeline — WorkingMoni New Deal Importer
Runs twice daily via GitHub Actions.

1. Playwright scrapes workingmoni.com/investors?availableOnly=true → all available deal URLs
2. requests fetches each new deal page → extracts all fields (same logic as Pipeline_WM_watch.gs)
3. gspread appends properly formatted rows to Pipeline_Deals in Google Sheets
4. Email summary sent to support@ and daniel@

Rows are written to match DEAL_HEADERS column order exactly, with extra
columns (DateAdded, WMStatus, etc.) filled in by column name lookup so
no existing columns are disturbed.
"""

import asyncio, json, os, re, smtplib, requests
from datetime import date, datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from playwright.async_api import async_playwright
import gspread
from google.oauth2.service_account import Credentials

# ── Config ────────────────────────────────────────────────────────────────────
LISTING_URL     = "https://workingmoni.com/investors?availableOnly=true"
SPREADSHEET_ID  = "1bfbptTehrBLjP7fyLYyAXRDfuExAvaBacofJyJfgGeM"
DEALS_TAB       = "Pipeline_Deals"
GMAIL_ADDRESS   = os.environ["GMAIL_ADDRESS"]
GMAIL_PASS      = os.environ["GMAIL_APP_PASSWORD"]
RECIPIENTS      = [e.strip() for e in os.environ["RECIPIENT_EMAIL"].split(",")]

SCOPES = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]

UNAVAILABLE_STATUSES = {
    "On Hold - Investor Selected", "Funded", "Sold",
    "No longer available", "Withdrawn", "Expired", "Cancelled", "Closed"
}


# ── Google Sheets helpers ─────────────────────────────────────────────────────
def get_sheet():
    sa_info = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"])
    creds   = Credentials.from_service_account_info(sa_info, scopes=SCOPES)
    gc      = gspread.authorize(creds)
    return gc.open_by_key(SPREADSHEET_ID).worksheet(DEALS_TAB)


def get_existing_urls(ws) -> set:
    """Return set of all SourceURLs already in the sheet."""
    try:
        col_headers = ws.row_values(1)
        url_col = col_headers.index("SourceURL") + 1   # 1-based
        urls = ws.col_values(url_col)[1:]               # skip header
        return {u.strip() for u in urls if u.strip()}
    except Exception as e:
        print(f"  Warning — could not read existing URLs: {e}")
        return set()


def append_deals(ws, deals: list):
    """
    Append deal rows to Pipeline_Deals.
    Reads the header row to find each column by name so extra/reordered
    columns in the live sheet never cause misalignment.
    """
    col_headers = ws.row_values(1)
    n_cols      = len(col_headers)
    rows_to_add = []

    for d in deals:
        row = [""] * n_cols
        for key, val in d.items():
            try:
                idx = col_headers.index(key)
                row[idx] = val if val is not None else ""
            except ValueError:
                pass   # column not in sheet — skip silently
        rows_to_add.append(row)

    if rows_to_add:
        ws.append_rows(rows_to_add, value_input_option="USER_ENTERED")


# ── WorkingMoni listing page ──────────────────────────────────────────────────
async def get_available_urls(page) -> list:
    """
    Playwright: render the availableOnly listing page,
    scroll to load lazy cards, return all /investors/{hex} URLs.
    """
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


# ── Individual deal page extraction (mirrors pipeline_wmExtractDetails_) ──────
HEADERS_HTTP = {"User-Agent": "Mozilla/5.0 (compatible; ASAPFunding-DealImport)"}


def wm_jval(html: str, keys: list) -> str:
    """Extract first matching JSON value from Next.js embedded data."""
    for k in keys:
        k_esc = re.escape(k)
        # Plain JSON: "key":"value"
        m = re.search(rf'"{k_esc}"\s*:\s*"((?:\\.|[^"\\])*)"', html)
        if m and m.group(1).strip() not in ("", "null", "TBD", "N/A"):
            v = m.group(1)
            v = v.replace("\\n", "\n").replace('\\"', '"').replace("\\\\", "\\")
            v = re.sub(r"\\u([0-9a-fA-F]{4})", lambda x: chr(int(x.group(1), 16)), v)
            return v.strip()
        # Numeric: "key":12345
        m = re.search(rf'\\?"{k_esc}\\?"\s*:\s*(-?\d[\d.]*)', html)
        if m and float(m.group(1)) != 0:
            return m.group(1)
    return ""


def wm_num(s: str) -> float | None:
    n = re.sub(r"[^0-9.]", "", str(s or ""))
    try:
        v = float(n)
        return v if v > 0 else None
    except ValueError:
        return None


def wm_acres(lot: str) -> str:
    m = re.match(r"([\d,]+(?:\.\d+)?)", str(lot or ""))
    if not m:
        return ""
    n = float(m.group(1).replace(",", ""))
    if n <= 0:
        return ""
    return str(round(n / 43560, 2)) if n > 500 else str(n)


def wm_text_lines(html: str) -> list:
    h = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.IGNORECASE)
    h = re.sub(r"<style[\s\S]*?</style>",  " ", h, flags=re.IGNORECASE)
    h = re.sub(r"<(?:br|/p|/div|/li|/h[1-6]|/tr|/section)[^>]*>", "\n", h, flags=re.IGNORECASE)
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
        r"lien\s*position$|lot\s*size|zoning|occupancy$|property\s*type$|"
        r"fico|loan\s*purpose$|property\s*summary$|exit\s*plan$|"
        r"borrower\s*introduction$|next\s*steps|request|due\s*diligence|"
        r"building\s*size)",
        s.strip(), re.IGNORECASE
    ))


def wm_label(lines: list, label_re, value_re=None) -> str:
    for i, line in enumerate(lines):
        if not re.search(label_re, line, re.IGNORECASE):
            continue
        rest = re.sub(label_re, "", line, flags=re.IGNORECASE).strip().lstrip(": –—-").strip()
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
        if is_label(t) or re.match(r"^(transaction overview|project economics|sponsor profile)", t, re.IGNORECASE):
            break
        if t:
            out.append(re.sub(r"^[•·\-*]\s*", "", t))
        if len(out) > 40:
            break
    return "; ".join(out).strip()


def extract_deal_data(url: str) -> dict | None:
    """
    Fetch a single WorkingMoni deal page via plain HTTP (same as UrlFetchApp
    in Pipeline_WM_watch.gs) and extract all deal fields.
    Returns a dict keyed by Pipeline_Deals column names, or None on error.
    """
    try:
        resp = requests.get(url, headers=HEADERS_HTTP, timeout=20, allow_redirects=True)
        if resp.status_code >= 400:
            print(f"    HTTP {resp.status_code}")
            return None
        html  = resp.text
        lines = wm_text_lines(html)
        J     = lambda keys: wm_jval(html, keys)
        MONEY = r"\$?\s*[\d,]+"

        # ── Fields ──────────────────────────────────────────────────────────
        loan_amount_raw = (
            J(["loanAmount","seekingAmount","requestedAmount","requestedLoanAmount","amountRequested"])
            or wm_label(lines, r"^seeking\b.*loan$", MONEY)
            or wm_label(lines, r"^seeking\b", MONEY)
        )
        loan_type = (
            J(["loanType","dealType"])
            or wm_label(lines, r"^loan\s*type$")
        )
        market_value_raw = (
            J(["appraisedValue","appraisal","appraiserValue","marketValue","estimatedValue","propertyValue","asIsValue"])
            or wm_label(lines, r"^appraiser$", MONEY)
        )
        ltv_raw = (
            J(["ltv","loanToValue"])
            or wm_label(lines, r"^ltv$", r"%|\d")
        )
        annual_return_raw = (
            J(["annualReturn"])
            or wm_label(lines, r"^annual\s*return$")
        )
        annual_income_raw = (
            J(["investmentAnnualIncome","annualIncome"])
            or wm_label(lines, r"^investment\s*annual\s*income$")
        )
        monthly_rent_raw = (
            J(["investmentMonthlyIncome","monthlyIncome","monthlyRent"])
            or wm_label(lines, r"^investment\s*monthly\s*income$")
        )
        desired_term = (
            J(["desiredLoanTerm","desiredTerm","loanTerm","termLength"])
            or wm_label(lines, r"^desired\s*loan\s*term$")
        )
        lien_position = (
            J(["lienPosition","lien"])
            or wm_label(lines, r"^lien\s*position$")
        )
        if not lien_position:
            m = re.search(r"Seeking\s+(1st|2nd|3rd|1st\s*&\s*2nd)\s+TD", html, re.IGNORECASE)
            if m:
                lien_position = m.group(1)
        lot_size = (
            J(["lotSize","lotSizeSqFt","lotSizeAcres"])
            or wm_label(lines, r"^lot\s*size(\s*ac\s*/?sq\.?ft\.?)?\s*$", r"\d")
        )
        zoning_use = (
            J(["zoningUse","zoning"])
            or wm_label(lines, r"^zoning(\s*/\s*use)?\s*$")
        )
        occupancy = (
            J(["occupancy"])
            or wm_label(lines, r"^occupancy$")
        )
        property_type = (
            J(["propertyType"])
            or wm_label(lines, r"^property\s*type$")
        )
        fico = (
            J(["ficoScore","fico","creditScore"])
            or wm_label(lines, r"^fico", r"\d{3}")
        )
        building_size = J(["buildingSize","buildingSqFt","squareFeet"])
        loan_purpose  = J(["loanPurpose"]) or wm_section(lines, r"^loan\s*purpose$")
        prop_summary  = J(["propertySummary"]) or wm_section(lines, r"^property\s*summary$")
        exit_plan     = J(["exitPlan","exitStrategy"]) or wm_section(lines, r"^exit\s*plan$")
        borrower_details = (
            J(["borrowerIntroduction","borrowerDetails","sponsorIntroduction"])
            or wm_section(lines, r"^borrower\s*introduction$")
        )

        # Normalize money fields
        loan_amount   = wm_num(loan_amount_raw)
        market_value  = wm_num(market_value_raw)
        annual_return = wm_num(annual_return_raw) if annual_return_raw and "%" not in annual_return_raw else None
        annual_income = wm_num(annual_income_raw)
        monthly_rent  = wm_num(monthly_rent_raw)

        # Location from subtitle / JSON
        city = J(["city"]) or ""
        state = J(["state","stateCode"]) or ""
        zip_code = J(["zip","zipCode","postalCode"]) or ""
        if not city:
            for line in lines:
                m = re.match(r"([^,\n]+),\s*([A-Z]{2})\s*(\d{5})", line)
                if m:
                    city, state, zip_code = m.group(1).strip(), m.group(2), m.group(3)
                    break

        # Title (street) from h1 / JSON
        street = J(["title","name","dealName","listingTitle"]) or ""
        if not street:
            m = re.search(r"<h1[^>]*>([^<]+)</h1>", html, re.IGNORECASE)
            if m:
                street = m.group(1).strip()

        # Assemble address
        assembled = ", ".join(filter(None, [
            street if street.lower() != city.lower() else None,
            city, f"{state} {zip_code}".strip()
        ]))

        deal_id = url.rstrip("/").split("/")[-1].split("?")[0]

        TBD = {"tbd", "n/a", "negotiable", "—", "-", ""}
        def clean(v):
            return "" if str(v or "").strip().lower() in TBD else str(v or "").strip()

        return {
            "DealID":           deal_id,
            "SourceURL":        url,
            "City":             clean(city),
            "State":            clean(state),
            "Zip":              clean(zip_code),
            "Street":           clean(street),
            "HouseNum":         "",
            "AssembledAddress": clean(assembled),
            "LoanAmount":       loan_amount or "",
            "LoanType":         clean(loan_type),
            "MarketValue":      market_value or "",
            "ValueSource":      "listing",
            "SecondValue":      "",
            "LTV":              clean(ltv_raw),
            "AnnualReturn":     annual_return or clean(annual_return_raw),
            "AnnualIncome":     annual_income or "",
            "MonthlyRent":      monthly_rent or "",
            "DesiredTerm":      clean(desired_term),
            "LienPosition":     clean(lien_position),
            "BuildingSize":     clean(building_size),
            "LotSize":          clean(lot_size),
            "LotAcres":         wm_acres(lot_size),
            "ZoningUse":        clean(zoning_use),
            "Occupancy":        clean(occupancy),
            "PropertyType":     clean(property_type),
            "FICO":             clean(fico),
            "LoanPurpose":      clean(loan_purpose)[:2000],
            "PropertySummary":  clean(prop_summary)[:2000],
            "ExitPlan":         clean(exit_plan)[:1000],
            "BorrowerDetails":  clean(borrower_details)[:1000],
            "UploadBy":         "",
            "BorrowerName":     "",
            "BorrowerEmail":    "",
            "Grade":            "",
            "Status":           "",
            "Provenance":       "listing",
            "DateAdded":        date.today().isoformat(),
        }

    except Exception as e:
        print(f"    Error extracting {url}: {e}")
        return None


# ── Email ─────────────────────────────────────────────────────────────────────
def send_email(subject: str, html: str):
    msg            = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = GMAIL_ADDRESS
    msg["To"]      = ", ".join(RECIPIENTS)
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
        s.login(GMAIL_ADDRESS, GMAIL_PASS)
        s.sendmail(GMAIL_ADDRESS, RECIPIENTS, msg.as_string())
    print(f"  Email sent: {subject}")


def build_email_html(added: list, errors: int) -> tuple:
    count   = len(added)
    now     = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    if count == 0:
        subject = "ASAP Pipeline — No new deals this run"
        body    = (f"<p>No new deals were found on WorkingMoni this run. "
                   f"All available deals are already in your spreadsheet.</p>"
                   f"{'<p style=\"color:#c0392b\">'+str(errors)+' URL(s) failed to extract data.</p>' if errors else ''}")
        return subject, f"""<html><body style='font-family:sans-serif;padding:20px'>
            <h2 style='color:#0e3f63'>ASAP Pipeline — Deal Importer</h2>{body}
            <p style='color:#888;font-size:12px'>{now} · ASAP Funding Pipeline Automation</p>
            </body></html>"""

    subject = f"ASAP Pipeline — {count} new deal{'s' if count != 1 else ''} added"
    rows = ""
    for d in added:
        deal_id  = d.get("DealID","")
        loan_str = f"${d['LoanAmount']:,.0f}" if d.get("LoanAmount") else "—"
        addr     = d.get("AssembledAddress") or d.get("Street") or deal_id
        id_tag   = f"<br><span style='font-size:10px;color:#aaa'>ID: {deal_id[-8:]}</span>"
        rows += (
            f"<tr><td style='padding:6px 12px'>"
            f"<a href='{d.get('SourceURL','')}' style='color:#1c75bc;text-decoration:none'>"
            f"{addr}</a>{id_tag}</td>"
            f"<td style='padding:6px 12px'>{d.get('LoanType','—')}</td>"
            f"<td style='padding:6px 12px;font-family:monospace'>{loan_str}</td>"
            f"<td style='padding:6px 12px'>{d.get('State','—')}</td></tr>"
        )

    html = f"""<html><body style='font-family:sans-serif;padding:20px;color:#1a1a1a'>
    <h2 style='color:#0e3f63'>ASAP Pipeline — New Deals Added to Spreadsheet</h2>
    <p>{count} new deal{'s have' if count != 1 else ' has'} been added to <b>Pipeline_Deals</b>.
    Each address link opens the WorkingMoni listing. Deals at the same street are separate properties.</p>
    <table style='border-collapse:collapse;width:100%;font-size:14px'>
      <thead><tr style='background:#0e3f63;color:#fff'>
        <th style='padding:8px 12px;text-align:left'>Address</th>
        <th style='padding:8px 12px;text-align:left'>Loan Type</th>
        <th style='padding:8px 12px;text-align:left'>Loan Amount</th>
        <th style='padding:8px 12px;text-align:left'>State</th>
      </tr></thead><tbody>{rows}</tbody>
    </table>
    {'<p style="color:#c0392b;font-size:12px">'+str(errors)+' URL(s) failed to extract — will retry next run.</p>' if errors else ''}
    <p style='margin-top:16px;color:#888;font-size:12px'>{now} · ASAP Funding Pipeline Automation</p>
    </body></html>"""
    return subject, html


# ── Main ──────────────────────────────────────────────────────────────────────
async def run():
    # 1. Connect to sheet
    print("Connecting to Google Sheets...")
    ws = get_sheet()

    # 2. Get existing SourceURLs (deduplication)
    existing = get_existing_urls(ws)
    print(f"  {len(existing)} existing deals in sheet")

    added, errors = [], 0

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"
        )
        page = await context.new_page()

        # 3. Get all available deal URLs from listing page
        try:
            all_urls = await get_available_urls(page)
        except Exception as e:
            print(f"Failed to load listing page: {e}")
            await browser.close()
            send_email("ASAP Pipeline — New Deal Importer ERROR",
                       f"<p>Failed to load WorkingMoni listing: {e}</p>")
            return

        await browser.close()

    # 4. Filter to genuinely new URLs
    new_urls = [u for u in all_urls if u not in existing]
    print(f"  {len(new_urls)} new deal(s) to import")

    # 5. Extract data from each new deal page (plain HTTP — no Playwright needed)
    for url in new_urls:
        print(f"  Extracting: {url}")
        data = extract_deal_data(url)
        if data:
            added.append(data)
            print(f"    {data.get('AssembledAddress','(no address)')}")
        else:
            errors += 1

    # 6. Write to sheet
    if added:
        print(f"  Writing {len(added)} row(s) to {DEALS_TAB}...")
        append_deals(ws, added)
        print("  Done.")

    # 7. Always send email
    subject, html = build_email_html(added, errors)
    send_email(subject, html)
    print(f"\nDone — {len(added)} added, {errors} errors")


def main():
    asyncio.run(run())


if __name__ == "__main__":
    main()
