/***** DRIP EMAIL LIBRARY — 12 emails per loan program.
 * {FIRST} merges the contact's first name. Edit any subject (s) or body (b)
 * below and redeploy; the engine underneath needs no changes. *****/
var DRIP_LIBRARY = {
  'DSCR': [
    { s: 'Qualify off the property, not your tax returns', b: 'Hello {FIRST},\n\nQuick thought on growing your rental portfolio: with a DSCR loan, we qualify the PROPERTY, not your personal income. If the rent covers the payment, you\'re in business — no W-2s, no tax returns, no DTI headaches.\n\nReal case: a Sacramento investor with strong rentals but heavy write-offs got declined by two banks on income. We qualified the property itself — $2,400 rent against a $1,950 payment, a 1.23 ratio — and closed in 24 days without a single tax return.\n\nIf you\'ve got a property in mind (or one you already own that could pull cash out), reply with the address and I\'ll run the numbers the same day.' },
    { s: 'The 30-second DSCR math every investor should know', b: 'Hi {FIRST},\n\nHere\'s the whole formula lenders use: monthly rent divided by your full payment (principal, interest, taxes, insurance, HOA). At 1.0 the property pays for itself; above 1.2 you\'re in strong territory — and we have options even below that.\n\nExample with real numbers: $2,500 rent, $2,000 full payment — that’s a 1.25. One client thought his deal was dead at 0.98; we moved him to an interest-only structure and the same property penciled at 1.15.\n\nWant me to run your property\'s ratio? Send the address and rent and I\'ll have it back to you today.' },
    { s: 'Own it in your LLC — keep it off your personal credit', b: 'Hi {FIRST},\n\nOne underrated DSCR perk: you can vest in an LLC. That keeps the mortgage off your personal credit report, which protects your buying power for the next deal (and the one after that).\n\nOne client held four rentals in his personal name before we restructured. When he applied for his own home loan, those mortgages crushed his DTI. His next three purchases went into an LLC with DSCR loans — his personal credit report shows none of them.\n\nIf you\'re planning to scale, let\'s map out the right structure before your next purchase.' },
    { s: 'Short-term rentals count too', b: 'Hi {FIRST},\n\nRunning an Airbnb or thinking about one? We can qualify short-term rentals using projected STR income — not just long-term lease comps. That often makes deals work that a bank would decline.\n\nA recent client’s Scottsdale condo showed $2,100 as a long-term rental — didn’t pencil. Its trailing 12-month Airbnb income averaged $4,300 a month, and underwritten as an STR the same property closed at a 1.6 ratio.\n\nHave a property or market in mind? Reply and I\'ll tell you what the income would need to look like.' },
    { s: 'Cash-out refi: put your equity back to work', b: 'Hi {FIRST},\n\nIf you\'ve owned a rental for a while, you may be sitting on equity that could fund your next down payment. A DSCR cash-out refi turns that into capital without touching your personal income docs.\n\nRecent example: a borrower bought a duplex for $310k in 2021, now worth $455k. We pulled $95k out with a DSCR cash-out refi — the rents still covered the new payment at 1.2 — and that $95k became the down payment on doors five and six.\n\nWant a quick equity check? Send me the address and what you think it\'s worth.' },
    { s: 'No cap on the number of properties', b: 'Hi {FIRST},\n\nConventional loans cut you off at 10 financed properties (most banks in practice: 4-6). DSCR has no cap — it\'s how investors go from 2 doors to 20.\n\nOne client came to us stuck at property #6 — his bank’s overlay capped him. Eighteen months later he’s at 14 doors, every one financed on the property’s own income, none touching his personal DTI.\n\nIf a portfolio is the goal, Happy to sketch the financing path with you. Fifteen minutes is all it takes.' },
    { s: 'The #1 mistake I see on rental purchases', b: 'Hi {FIRST},\n\nThe most expensive mistake I see: investors locking financing AFTER they\'re under contract, under time pressure, taking whatever terms they can get. Getting your numbers dialed in first means you negotiate from strength.\n\nWe watched a borrower last spring accept a rate 1.5 points higher than market because his contract gave him 10 days and he had nothing lined up. On his next purchase he came to us first — same-day numbers, and he negotiated $12k off the price knowing exactly where he stood.\n\nNext property you\'re eyeing, send it over BEFORE you offer — I\'ll pressure-test the numbers free.' },
    { s: 'Rates moved — want a fresh look at your numbers?', b: 'Hi {FIRST},\n\nPricing in the rental-loan world shifts constantly, and a small rate move can change a property\'s whole cash-flow picture. If a deal didn\'t pencil a few months ago, it might now.\n\nA deal we re-ran in March proves the point: at the old rate the property cash-flowed negative $85 a month. Re-priced, it flipped to positive $140 — same house, same rent, $225 a month swing purely on financing.\n\nWant me to re-run anything you shelved? Just reply with the address.' },
    { s: 'What lenders check besides the rent', b: 'Hi {FIRST},\n\nDSCR isn\'t ONLY the ratio — credit score and cash reserves matter too. The good news: minimums are friendlier than most investors expect, and I can usually structure around a soft spot.\n\nRecent file: 660 mid-score, three months of reserves — the borrower assumed he needed 720 and a year of cash. He closed at a slightly higher rate, then refinanced 14 months later once his score recovered. Waiting would have cost him the property.\n\nIf you\'re not sure where you stand, reply and I\'ll walk you through it — no credit pull needed for a first look.' },
    { s: 'Prepay penalties: the fine print that matters', b: 'Hi {FIRST},\n\nMost DSCR loans carry a prepayment penalty — and picking the wrong structure can cost you real money if you sell or refi early. There are 5-year, 3-year, and buy-down options depending on your plan.\n\nOne investor sold a rental eight months into a 5-year prepay structure and wrote a $19k penalty check. His next loan, we matched a 3-year step-down to his actual plan — he exited in year three and paid nothing.\n\nBefore your next loan, tell me your exit plan and I\'ll match the structure to it.' },
    { s: 'A quick client story', b: 'Hi {FIRST},\n\nRecent example: an investor came to us with a rental purchase their bank declined over DTI. We qualified it on the property\'s rent alone and closed inside a month — no tax returns.\n\nIf a bank has ever told you no, that usually just means it was the wrong loan. Happy to look at your scenario.' },
    { s: 'Following up — what\'s next on your board?', b: 'Hi {FIRST},\n\nFollowing up. Whether you\'re actively hunting or planning your next move for later this year, I\'m happy to run numbers, sanity-check a market, or just talk strategy.\n\nLast month a client used this exact check-in to send over a fourplex he’d been circling for weeks. Numbers came back same day — he offered that Friday and got it under contract $15k below list.\n\nWhat\'s the next property on your board?' }
  ],
  'Fix & Flip': [
    { s: 'Speed wins deals — here\'s how fast we can move', b: 'Hello {FIRST},\n\nIn this market, the investor who can close fastest usually wins the deal. While banks take 40+ days, our fix & flip loans can fund in a fraction of that — which lets you make offers that compete with cash.\n\nReal case: our borrower and a bank-financed buyer offered on the same estate sale. His offer was $8k LOWER — the seller took it because we closed in 11 days while the bank needed 45. The margin on that flip was $62k.\n\nGot a property you\'re watching? Send it over and I\'ll tell you exactly how fast we could close.' },
    { s: 'Up to 100% of your rehab budget', b: 'Hi {FIRST},\n\nA lot of flippers don\'t realize the rehab budget can be financed too — up to 100% of renovation costs on the right deal, drawn as work completes. That keeps your cash free for the next opportunity.\n\nExample: $240k purchase, $70k rehab. Instead of writing a $70k check, our borrower brought his down payment and we funded 100% of the rehab in draws. His cash stayed liquid — and he used it to grab a second project mid-build.\n\nWant me to structure a deal with rehab included? Send the purchase price and your budget. Let me know if you have any questions.' },
    { s: 'The ARV rule of thumb that protects your profit', b: 'Hi {FIRST},\n\nBefore you offer, run this: your all-in (purchase + rehab + carrying costs) should sit comfortably below 75% of the after-repair value. That margin is your profit AND your safety net.\n\nNumbers from a deal we passed back to the borrower: $310k all-in against a $395k ARV — 78%, too thin. He renegotiated $22k off the purchase, landed at 72%, and cleared $54k after costs. The rule saved his profit before he ever owned the house.\n\nUnsure on an ARV? Send me the address — I\'ll help you pressure-test it before you commit.' },
    { s: 'Don\'t let carrying costs eat your flip', b: 'Hi {FIRST},\n\nEvery extra month you hold a flip costs you — interest, taxes, insurance, utilities. The best flippers build a realistic timeline BEFORE closing and finance accordingly.\n\nReal math: one client’s “4-month flip” ran seven. Interest, taxes, insurance, and utilities ate about $3,800 a month — $11,400 of profit gone to the calendar. His next project we built a month of cushion into the budget from day one.\n\nIf you want, I\'ll help you map the full carry on your next project so there are no surprises.' },
    { s: 'Your exit strategy decides your loan', b: 'Hi {FIRST},\n\nSelling when it\'s done? A short bridge with no prepay penalty is your friend. Might keep it as a rental? We can line up the refi into a long-term loan before you even finish the rehab.\n\nRecent example: a borrower planned to sell, then the market softened mid-rehab. Because we’d structured his loan with the refi already mapped, he pivoted to a DSCR hold in two weeks instead of fire-selling — the property now cash-flows $310 a month.\n\nTell me your exit plan on the next one and I\'ll match the money to it.' },
    { s: 'First flip? Experience helps, but it isn\'t required', b: 'Hi {FIRST},\n\nYou don\'t need a track record to get funded — first-time flippers qualify, and leverage grows with each completed project. The key is a realistic budget and a property with real margin.\n\nOur last first-timer: zero flips, a realistic $45k budget, and a property bought right at 68% of ARV. Approved. He cleared $38k on the exit — and his second project qualified for better leverage because the first was on record.\n\nIf you\'re working up the nerve on deal #1, reply — I\'ll walk you through the numbers like a partner, not a salesperson.' },
    { s: 'Where flippers lose money (it\'s not the purchase price)', b: 'Hi {FIRST},\n\nMost blown flips die in the rehab budget: underestimated scope, mid-project surprises, contractor delays. A 10-15% contingency line isn\'t pessimism — it\'s professionalism.\n\nWant a second set of eyes on a budget? Send it over. I\'ve seen hundreds and I\'ll flag the soft spots free.' },
    { s: 'Distressed properties banks won\'t touch', b: 'Hi {FIRST},\n\nNo kitchen? Fire damage? Banks won\'t finance non-habitable properties — which is exactly why the best discounts live there. Asset-based lending was built for these.\n\nRecent buy: fire-damaged SFR, listed 40% under comps because no bank would touch it. Our borrower closed in 9 days, spent $85k on the rebuild, and sold for $110k over his all-in.\n\nIf you spot an ugly house with good bones, that\'s our specialty. Send it my way.' },
    { s: 'Draws: how rehab money actually flows', b: 'Hi {FIRST},\n\nQuick education piece: rehab funds release in draws as work completes and gets inspected. Structuring your contractor payments around the draw schedule keeps your out-of-pocket minimal.\n\nHow it worked on a live file: foundation draw released day 12, framing day 31, finishes day 58 — the borrower’s contractor got paid within 48 hours of each inspection, and the borrower never fronted more than his first material deposit.\n\nPlanning a project? I\'ll show you how to line up the schedule before demo day.' },
    { s: 'A recent flip we funded', b: 'Hi {FIRST},\n\nRecent example: an investor grabbed a dated property below market, we funded the purchase plus the full rehab, and they were on the market in under four months.\n\nDeals like that are out there right now. When you find yours, you\'ll want financing that\'s already warmed up — let\'s get you pre-qualified.' },
    { s: 'The market timing question everyone asks', b: 'Hi {FIRST},\n\n"Is now a good time to flip?" The honest answer: good flips work in every market — the margin is made when you BUY. What changes is how carefully you underwrite the exit.\n\nCase in point: a client bought last November when everyone was frozen — $28k under the identical model match down the street — and sold in April into the spring market. The margin was made the day he bought, not the day he sold.\n\nIf you want my read on your local market, reply. Happy to share what we\'re seeing in the deals crossing my desk.' },
    { s: 'Following up — any projects brewing?', b: 'Hi {FIRST},\n\nFollowing up. If you\'ve got a project brewing — or a property you keep driving past — I\'m happy to run the numbers with you, no strings.\n\nLast month this exact nudge surfaced a property one of our flippers had driven past for weeks. He sent the address, the numbers worked at 71% of ARV, and he was under contract nine days later.\n\nWhat\'s on your radar?' }
  ],
  'Fix & Flip + DSCR': [
    { s: 'The BRRRR play: flip money + rental money, one plan', b: 'Hello {FIRST},\n\nThe investors building real wealth right now run the full cycle: buy distressed with short-term money, renovate, rent it, then refinance into a long-term DSCR loan and pull their capital back out for the next one.\n\nReal cycle from last year: $265k distressed purchase, $55k rehab on bridge money, rented at $2,650, refinanced on a $410k appraisal — the borrower pulled his entire down payment back out and bought the next one 60 days later.\n\nWe fund BOTH sides of that play. Want me to map it on a real property?' },
    { s: 'Buy it ugly, keep it forever', b: 'Hi {FIRST},\n\nBest of both worlds: bridge financing gets you the distressed property banks won\'t touch; a DSCR refi at stabilization locks in long-term cash flow. Same property, two loans, one plan.\n\nOne client flipped six houses in two years and kept none. We re-ran his numbers: the two best would have cash-flowed $600 a month combined and gained $90k in equity. He now underwrites every buy both ways — and kept three of his last five.\n\nIf you\'ve been flipping and selling, let\'s talk about which ones you should have kept.' },
    { s: 'Flip or hold? Run both exits before you buy', b: 'Hi {FIRST},\n\nSmart move on any purchase: underwrite it as a flip AND as a rental before you offer. If it pencils both ways, you can\'t lose — you choose the better exit at the finish line.\n\nExample: a borrower’s spreadsheet showed $48k profit selling OR $340 a month holding. The sale barely won on paper — until commissions and taxes took $31k of it. He held, refinanced, and the tenant has paid his mortgage for 19 months since.\n\nSend me your next candidate and I\'ll run both sets of numbers for you.' },
    { s: 'Your rehab decides your refi', b: 'Hi {FIRST},\n\nIf there\'s any chance you\'ll keep the property, renovate for RENTABILITY (durable finishes, bedroom count) not just resale sparkle. It changes the appraisal, the rent, and your DSCR refi.\n\nReal file: a flipper’s luxury vinyl and quartz finishes appraised beautifully — but he’d built a 2-bed layout in a 3-bed rental market. Market rent came in $400 light and the refi ratio missed. One wall in the plan would have changed the whole exit.\n\nPlanning a scope soon? I\'ll flag what moves the refi numbers most.' },
    { s: 'The seasoning question everyone gets wrong', b: 'Hi {FIRST},\n\nHow soon after buying can you cash-out refi? Sooner than most think — with the right program, a stabilized property can refi off its new appraised value without waiting a year.\n\nRecent example: a borrower stabilized his duplex in month four and assumed he had to wait a full year to refi. We used the new appraised value at month six — $470k against his $360k all-in — and his capital was back out hunting before summer.\n\nIf you\'ve got trapped equity in a recent project, reply and I\'ll check your timeline.' },
    { s: 'Rate math: when holding beats selling', b: 'Hi {FIRST},\n\nQuick framework: if your rental\'s cash flow after the refi beats what you\'d net selling (after commissions and taxes), holding usually wins — and you keep the appreciation.\n\nLive numbers from a March file: selling netted $52k after costs; holding cash-flowed $410 a month with $110k of equity retained. He held — and the property has appreciated another $18k since.\n\nOn the fence with a property? Send the numbers, I\'ll help you compare the two exits honestly.' },
    { s: 'One lender relationship, whole deal cycle', b: 'Hi {FIRST},\n\nJuggling one lender for the purchase and hunting another for the refi is where deals stall. Having both lined up under one roof means your bridge loan never matures without an exit ready.\n\nWe picked up a borrower whose bridge loan matured while his refi lender “re-reviewed” for a third month. Default interest was accruing at 4 points over note rate. Both sides under one roof means that gap simply cannot open.\n\nThat gap has burned a lot of investors. Let\'s make sure it never burns you.' },
    { s: 'Scaling: how 1 property becomes 5', b: 'Hi {FIRST},\n\nThe portfolio math: each BRRRR that returns your capital funds the next purchase. Investors running this well add multiple doors a year without new savings.\n\nIf scaling is the goal, I\'ll help you build the financing roadmap — purchase to refi to repeat.' },
    { s: 'A full-cycle client story', b: 'Hi {FIRST},\n\nRecent client: bought a tired duplex with bridge money, renovated both units, rented them, then refinanced into a 30-year DSCR loan and walked away with most of their capital back — now hunting deal #2.\n\nThat playbook is repeatable. Thoughts?' },
    { s: 'The reserve cushion that saves projects', b: 'Hi {FIRST},\n\nWhether flipping or holding, the projects that survive surprises share one thing: a cash cushion beyond the budget. Lenders like reserves; your stress level likes them more.\n\nA client’s water heater, a roof surprise, and one contractor no-show hit the same project. His 12% contingency line absorbed all three — the project finished on budget BECAUSE the budget expected trouble.\n\nBuilding your next deal\'s budget? I\'ll show you what a healthy cushion looks like for your price point.' },
    { s: 'Market check: what\'s working right now', b: 'Hi {FIRST},\n\nWhat we\'re seeing across current deals: solid margins on cosmetic-rehab properties, and rental demand keeping DSCR refis penciling nicely. The full buy-renovate-hold cycle is alive and well.\n\nWant my read on your specific market? Just reply.' },
    { s: 'Checking in on your next move', b: 'Hi {FIRST},\n\nFollowing up — whether your next move is a quick flip, a keeper, or you\'re not sure yet, I\'m glad to run numbers both ways so you can decide with real data.\n\nThis exact check-in caught a client mid-decision last month — flip or hold a triplex. We ran both exits on real numbers in an afternoon; he held, and pulled 85% of his capital back out at the refi.\n\nWhat are you hunting these days?' }
  ],
  'Commercial': [
    { s: 'Financing that follows the property\'s income', b: 'Hello {FIRST},\n\nCommercial deals live and die on the numbers — and so does commercial financing. We underwrite off the property\'s income and value, which means self-employed and portfolio-heavy borrowers aren\'t penalized.\n\nRecent file: a self-employed borrower with three years of aggressive write-offs bought an 8-unit on the building’s own numbers — $9,400 monthly income against $7,100 debt service. His personal tax returns never entered the conversation.\n\nHave a property or listing in mind? Send it over and I\'ll give you a straight read on financing options.' },
    { s: 'Mixed-use and multifamily: the sweet spot', b: 'Hi {FIRST},\n\nSmall-balance commercial — 5+ unit multifamily, mixed-use, small retail — is where a lot of investors level up from houses. The financing is different, but the logic is the same: does the income cover the debt?\n\nOne client’s first commercial buy was a 6-unit over two storefronts — $6,800 a month combined income. The underwriting logic he already knew from houses carried straight over; only the paperwork changed.\n\nIf you\'re eyeing the jump from residential, I\'ll walk you through how the underwriting changes.' },
    { s: 'Speed matters in commercial too', b: 'Hi {FIRST},\n\nBank commercial lending can crawl for months. When a seller wants certainty, a bridge loan closes the deal now and refinances later once the property (or your plans) stabilize.\n\nReal case: a seller gave our borrower 21 days on a mixed-use building after a bank buyer collapsed. We bridged it in 16, the borrower stabilized the vacant unit, and refinanced eight months later at a full point better.\n\nRacing a deadline on anything? That\'s exactly when to call us.' },
    { s: 'Value-add: buy the upside', b: 'Hi {FIRST},\n\nThe classic commercial play: buy under-rented or under-managed property, fix the operations, and the value follows the income up. Bridge financing funds the buy; the improved numbers fund the refi.\n\nExample with numbers: a client bought a tired 10-unit at $780k where units rented $250 under market. Two years of turnovers later the income supported a $1.05M valuation — the operations WERE the deal.\n\nIf you\'ve spotted a tired property with upside, let\'s underwrite the plan together.' },
    { s: 'What lenders look at in a commercial deal', b: 'Hi {FIRST},\n\nThe short list: property income vs. debt (DSCR), your equity in the deal, the rent roll\'s stability, and your plan. Strong deals with a clear story get funded — even when the borrower\'s tax returns are complicated.\n\nOn a recent approval: 1.28 coverage, 30% equity, an 18-month rent roll with one vacancy, and a two-page plan. Complicated personal returns, clean deal story — funded.\n\nWant a pre-flight check on a deal? Send the basics and I\'ll flag any soft spots.' },
    { s: 'Cash-out on commercial equity', b: 'Hi {FIRST},\n\nOwn commercial property with equity in it? A cash-out refinance can fund your next acquisition, renovations, or business needs — often without the bank-level paperwork.\n\nRecent example: a borrower pulled $210k from a stabilized retail strip he’d owned since 2019 and used it as the down payment on the building next door. Same block, doubled footprint, no bank committee.\n\nReply with the property and rough value and I\'ll scope what\'s possible.' },
    { s: 'The rent roll is your best negotiating tool', b: 'Hi {FIRST},\n\nQuick tip: before offering on any income property, stress-test the rent roll — lease terms, below-market units, expiration stacking. It tells you the real value AND gives you negotiating ammunition.\n\nA client last quarter found three leases expiring the same month buried in a rent roll — used it to negotiate $45k off the price. The seller knew exactly why.\n\nWant a second set of eyes on a rent roll? I read these all day. Send it over.' },
    { s: 'Foreclosure bailout and special situations', b: 'Hi {FIRST},\n\nSome of our most valuable work is time-critical: maturing balloons, partnership buyouts, properties stuck between banks. Fast, asset-based capital solves problems traditional lenders can\'t touch.\n\nReal save: a borrower’s balloon matured with his bank “still reviewing.” Default interest was 10 days out. We bridged the payoff in 8 days and he refinanced calmly six months later on his own timeline.\n\nIf you (or someone you know) is in a tight spot on a commercial property, call me directly.' },
    { s: 'A commercial deal we recently structured', b: 'Hi {FIRST},\n\nRecent example: a borrower under contract on a multifamily property with a bank dragging its feet. We bridged the purchase quickly, they stabilized the units, and the long-term refi followed.\n\nCertainty of closing is worth real money in commercial. That\'s what we deliver.' },
    { s: '1031 timelines: don\'t let financing kill the exchange', b: 'Hi {FIRST},\n\nIf you\'re running a 1031 exchange, your identification and closing windows are unforgiving — and slow financing is the #1 killer. Fast bridge capital keeps the exchange alive.\n\nWe closed an exchange leg in 19 days last fall after the buyer’s first lender stalled at day 30 of a 45-day window. The exchange survived by less than a week — pre-staged capital is the whole game.\n\nPlanning an exchange this year? Loop me in early and we\'ll pre-stage the money.' },
    { s: 'Where small-balance commercial is heading', b: 'Hi {FIRST},\n\nWhat we\'re watching: steady demand for well-located multifamily, opportunity in tired retail conversions, and sellers getting more realistic on price. Buyers with ready capital are getting deals.\n\nWant my take on your market segment? Happy to share what\'s crossing my desk.' },
    { s: 'Checking in on your commercial pipeline', b: 'Hi {FIRST},\n\nFollowing up — any commercial properties on your radar, or existing ones worth a refi review? I\'m glad to run numbers or just compare notes on the market.\n\nThis check-in recently prompted a client to send a strip center he’d assumed was “too commercial” for his portfolio. The numbers worked at 1.3 coverage — he owns it now.\n\nWhat\'s cooking?' }
  ],
  'Commercial — Multifamily': [
    { s: 'Multifamily: where the numbers do the qualifying', b: 'Hello {FIRST},\n\n5+ unit properties are underwritten on their income — rent roll, expenses, debt coverage — not your tax returns. Strong buildings get funded even when the borrower\'s personal file is complicated.\n\nRecent file: a 9-unit generating $11,200 a month against $8,300 in debt service — 1.35 coverage. The borrower’s complicated tax situation never slowed it down because the building carried the file.\n\nIf you\'re eyeing a building, send the address and rent roll and I\'ll give you a straight read.' },
    { s: 'The 5-unit line: what changes and why it matters', b: 'Hi {FIRST},\n\nCrossing from 4 units to 5 moves you from residential to commercial lending — different underwriting, different leverage, different paperwork. Investors who understand the line buy better on both sides of it.\n\nReal example: a client under contract on a 5-unit assumed residential rules — then learned at day 20 his bank couldn’t do it. We restructured as small-balance commercial and still hit his closing date.\n\nWant me to walk you through the differences before your next offer?' },
    { s: 'Value-add multifamily: buy the upside', b: 'Hi {FIRST},\n\nThe classic play: under-rented building, tired management, deferred maintenance. Fix the operations and the value follows the income up. Bridge money buys it; the improved rent roll refinances it.\n\nLive numbers: a 12-unit bought at $890k with rents averaging $180 under market. Eighteen months of turnovers pushed income from $10.1k to $12.3k monthly — the refi appraisal came back $1.24M.\n\nSpotted a tired building? Let\'s underwrite the plan together.' },
    { s: 'Reading a rent roll like a lender', b: 'Hi {FIRST},\n\nBefore you offer, stress-test the rent roll: below-market units, lease expirations stacking in the same quarter, concessions hiding in the numbers. It tells you the real value and gives you negotiating ammunition.\n\nA client last spring found four leases expiring within 60 days of each other on a building he liked. He negotiated $38k off and staggered the renewals — the rent roll read completely differently a year later.\n\nWant a second set of eyes on one? Send it over.' },
    { s: 'Your expense ratio is the silent deal-killer', b: 'Hi {FIRST},\n\nSellers love quoting gross rents. Lenders underwrite NET — taxes, insurance, utilities, management, reserves. Knowing the realistic expense ratio for your market keeps you from overpaying.\n\nReal case: a seller’s pro forma showed a 32% expense ratio. Actuals — once we pulled taxes, insurance quotes, and utilities — ran 47%. That 15-point gap was $27k a year of phantom income the buyer almost paid for.\n\nIf you want my read on a building\'s real numbers, reply with the details.' },
    { s: 'Small-balance multifamily: the sweet spot', b: 'Hi {FIRST},\n\n5-30 unit buildings are the sweet spot right now — too big for house hackers, too small for institutions, priced accordingly. Financing for this range is our specialty.\n\nOne client jumped from four SFRs to an 11-unit last year — too small for the institutional buyers he feared competing with, priced at a cap rate his houses could never touch.\n\nWhat size building are you hunting?' },
    { s: 'Cash-out on a stabilized building', b: 'Hi {FIRST},\n\nOwn a stabilized building with equity? A cash-out refinance can fund your next acquisition without selling anything — and without bank-level personal documentation.\n\nRecent example: $240k pulled from a stabilized 8-unit funded the down payment on a second building two blocks away. Same management, doubled income, zero personal income documentation.\n\nReply with the property and rough value and I\'ll scope what\'s possible.' },
    { s: 'Bridge-to-perm: the two-loan plan', b: 'Hi {FIRST},\n\nMost multifamily deals are really two loans: fast bridge money to win and stabilize the building, then permanent financing once the rent roll proves out. Lining both up from day one is how you avoid a maturity crunch.\n\nReal save: a borrower’s bridge matured while his perm lender re-traded terms. Because we’d mapped both loans from day one, the refi was already in underwriting — he never paid a day of default interest.\n\nPlanning an acquisition? Let\'s map the full financing chain.' },
    { s: 'A multifamily deal we structured', b: 'Hi {FIRST},\n\nRecent example: a buyer under contract on a 12-unit with a bank dragging its feet. We bridged the purchase, they turned the units over eighteen months, and the refi came in on the improved income.\n\nCertainty of execution is worth real money in multifamily. That\'s the job.' },
    { s: '1031 into multifamily: mind the clock', b: 'Hi {FIRST},\n\nTrading up from houses into a building via 1031? Your identification and closing windows are unforgiving — slow financing is the exchange-killer.\n\nAn exchange client identified a 14-unit on day 38 of 45. We closed in 22 days — tight, but the capital was pre-staged before he ever identified. That’s the only reason the exchange lived.\n\nIf an exchange is on your horizon this year, loop me in early and we\'ll pre-stage the capital.' },
    { s: 'What we\'re seeing in multifamily right now', b: 'Hi {FIRST},\n\nMarket notes from the deals crossing my desk: sellers getting realistic, buyers with ready capital winning negotiations, and well-located small-balance buildings still penciling.\n\nWant my read on your target market? Just reply.' },
    { s: 'Following up on your multifamily plans', b: 'Hi {FIRST},\n\nFollowing up — any buildings on your radar, or existing ones worth a refi review? Happy to run numbers or compare notes on the market.\n\nThis exact follow-up surfaced a 7-unit one client had watched for months. Rent roll checked out at 1.3 coverage; he closed in five weeks.\n\nWhat\'s next on your board?' }
  ],
  'Commercial — Retail / Mixed-Use': [
    { s: 'Retail and mixed-use: financeable with the right story', b: 'Hello {FIRST},\n\nBanks have pulled back on retail — which is exactly why well-located retail and mixed-use is trading at prices that pencil. Asset-based lenders underwrite the actual tenants and location, not the headlines.\n\nRecent file: a neighborhood strip with a laundromat, a taqueria, and a nail salon — three businesses the internet can’t replace. Banks passed on “retail.” The numbers showed 96% occupancy for six straight years. Funded.\n\nIf you\'re looking at a retail or mixed-use property, send it over for a straight read.' },
    { s: 'Mixed-use: the hybrid that qualifies two ways', b: 'Hi {FIRST},\n\nApartments over storefronts are a favorite for a reason: residential income stabilizes the building while commercial rents drive the upside. The unit mix determines which loan programs apply.\n\nReal example: four apartments over two storefronts — the residential income alone covered 80% of the debt service. When one storefront went vacant for five months, the building never missed a beat.\n\nHave a mixed-use property in mind? I\'ll tell you exactly how lenders will see it.' },
    { s: 'Tenant quality is your interest rate', b: 'Hi {FIRST},\n\nIn retail lending, WHO pays the rent matters as much as how much: lease terms, tenant history, and how essential the business is. Strong tenancy directly improves your financing terms.\n\nOne client’s deal priced a half-point better because his anchor tenant was a 12-year dental practice with eight years left on the lease. Tenant quality showed up directly in his terms.\n\nEvaluating a property? Send the rent roll and I\'ll flag how lenders will read the tenant mix.' },
    { s: 'The vacancy question: underwrite it honestly', b: 'Hi {FIRST},\n\nEvery retail deal needs an honest answer to one question: if the anchor tenant leaves, what then? Re-leasing time, market rents, and reuse potential decide whether a vacancy is a bump or a crisis.\n\nLive case: a buyer stress-tested a building where the anchor was month-to-month. Re-lease time in that corridor ran 9-14 months. He offered $60k less to carry that risk — and got it.\n\nWant help stress-testing a property\'s downside? That conversation is free.' },
    { s: 'NNN leases: what they mean for your loan', b: 'Hi {FIRST},\n\nTriple-net leases shift taxes, insurance, and maintenance to the tenant — cleaner cash flow, and lenders like them. But the lease terms and renewal options drive the value more than the building does.\n\nRecent example: an NNN deal where the lease had a tenant termination option in year three buried on page 41. Reading the lease like a lender saved the buyer from valuing 10 years of income that could vanish in three.\n\nLooking at an NNN deal? I\'ll help you read the lease like a lender.' },
    { s: 'Repositioning tired retail', b: 'Hi {FIRST},\n\nSome of the best current deals are tired retail with a repositioning story — new tenant mix, partial conversion, updated use. Bridge financing funds the plan; the stabilized income refinances it.\n\nReal reposition: a tired video-store building bought at land-plus value, converted to a medical suite and a coffee shop. Income tripled in 20 months; the refi returned nearly all the borrower’s capital.\n\nSeen a property with a better use than its current one? Let\'s underwrite the idea.' },
    { s: 'Owner-occupied: buy your business\'s building', b: 'Hi {FIRST},\n\nIf you run a business and rent your space, owning the building can flip your biggest expense into your best asset. Owner-user commercial financing works differently — often favorably.\n\nOne client paid $4,100 a month renting his shop for nine years — about $440k out the door. He bought his building last year; his payment is $3,700 and he owns the appreciation now.\n\nWant to see what buying your location would look like? Reply and I\'ll run it.' },
    { s: 'Cash-out on commercial equity', b: 'Hi {FIRST},\n\nOwn retail or mixed-use with equity in it? A cash-out refinance can fund your next move — acquisition, renovation, or business capital — without bank-level paperwork.\n\nRecent example: $185k pulled from a paid-down mixed-use property funded a full facade and HVAC renovation — which re-leased the vacant unit at 30% higher rent within two months.\n\nReply with the property and rough value and I\'ll scope the options.' },
    { s: 'A retail deal we recently structured', b: 'Hi {FIRST},\n\nRecent example: a mixed-use buyer whose bank backed out over one vacant storefront. We underwrote the residential income plus the re-lease plan and closed the purchase on schedule.\n\nDeals with a story need a lender who reads past the surface. That\'s us.' },
    { s: 'When speed wins in commercial', b: 'Hi {FIRST},\n\nMotivated commercial sellers reward certainty — a buyer who can close in weeks beats a higher offer that needs bank committee approval. Bridge capital is how you become that buyer.\n\nRemember that next time a seller signals urgency. Thoughts?' },
    { s: 'What we\'re seeing in retail right now', b: 'Hi {FIRST},\n\nMarket notes: neighborhood service retail holding strong, well-located vacancies re-leasing faster than the headlines suggest, and mixed-use in walkable areas commanding premiums.\n\nWant my read on a specific property or corridor? Just reply.' },
    { s: 'Following up on your commercial plans', b: 'Hi {FIRST},\n\nFollowing up — any retail or mixed-use properties on your radar, or existing ones worth a refi look? Happy to run numbers whenever you\'re ready.\n\nThis follow-up recently got a client to send a corner building he’d written off as “retail is dead.” Walkable corridor, service tenants, 1.4 coverage — he’s in escrow now.\n\nWhat\'s cooking?' }
  ],
  'Land & Dev': [
    { s: 'Land deals: financeable, with the right structure', b: 'Hello {FIRST},\n\nBanks mostly won\'t touch raw land — but that doesn\'t mean deals can\'t get funded. Land and development financing is about the plan: entitlements, horizontal work, vertical construction, each stage prices differently.\n\nRecent file: 4 acres the borrower’s bank wouldn’t touch at any price. Structured as A&D with the entitlement plan attached, it funded at 60% — and stepped up to 75% once horizontal work was in.\n\nGot a parcel in your sights? Send it over and I\'ll map the financing stages for you.' },
    { s: 'The three stages of land financing', b: 'Hi {FIRST},\n\nQuick education: raw land (highest risk, priced accordingly), horizontal development (utilities, grading, roads), and vertical construction. Each stage unlocks better leverage and pricing as risk drops.\n\nReal numbers: a client bought raw at $180k, spent $260k on utilities, grading, and roads — and the finished lots appraised at $720k. Each stage unlocked cheaper capital than the one before.\n\nKnowing which stage you\'re buying into changes everything about your capital plan. Want me to walk yours?' },
    { s: 'Entitlements: where land value is really made', b: 'Hi {FIRST},\n\nThe biggest value jump in land isn\'t construction — it\'s entitlement. Taking a parcel from raw to approved plans can multiply value before a shovel hits dirt.\n\nLive example: a parcel bought at $220k went under contract at $610k the month final map approval recorded — no dirt moved. The entitlement WAS the project.\n\nIf you\'re working through entitlements (or buying entitled land), let\'s talk about financing the phase you\'re in.' },
    { s: 'Ground-up construction: what lenders fund', b: 'Hi {FIRST},\n\nOn ground-up projects, construction funds release in draws as stages complete — foundation, framing, and so on. Your budget, timeline, and builder track record drive the terms.\n\nOn a recent build: foundation draw day 14, framing day 40, mechanical day 71 — the builder’s subs were paid within two days of each inspection, and his out-of-pocket never exceeded the first material order.\n\nPlanning a build? I\'ll help you structure the draw schedule before you break ground.' },
    { s: 'Your capital stack decides your profit', b: 'Hi {FIRST},\n\nOn development deals, HOW you capitalize (debt vs. your equity vs. partners) often matters more than the interest rate. The right stack protects your upside and your downside.\n\nReal case: a developer’s deal worked at 65% debt but he capitalized at 80% with expensive gap money. One soft month of sales and his margin was gone. His next project we structured at 70% with a real contingency — boring, and profitable.\n\nWorking on a deal structure? I\'m happy to pressure-test it with you — that conversation is free and usually valuable.' },
    { s: 'Exit strategy: build-to-sell vs. build-to-rent', b: 'Hi {FIRST},\n\nBefore you buy dirt, decide the exit: selling finished product, or holding as rentals? Build-to-rent changes your construction choices AND lines you up for a long-term refi at completion.\n\nRecent example: a builder switched a 6-lot project from build-to-sell to build-to-rent when rates moved mid-construction. Because the DSCR exit was mapped from day one, the pivot took a phone call, not a refinance scramble.\n\nTell me your exit and I\'ll line up the financing chain end to end.' },
    { s: 'The contingency rule for construction budgets', b: 'Hi {FIRST},\n\nConstruction budgets miss — it\'s not if, it\'s how much. Seasoned developers carry a real contingency line and a timeline buffer. Lenders respect it; your project survives because of it.\n\nA client’s 10% contingency absorbed a $34k utility-trench surprise last summer without touching the timeline. The identical project across town — built with zero cushion — stalled for 11 weeks raising rescue capital.\n\nWant a second opinion on a budget? Send it over before you commit.' },
    { s: 'Infill lots: small projects, real returns', b: 'Hi {FIRST},\n\nYou don\'t need 100 acres — single infill lots in established neighborhoods are some of the cleanest development deals going: known comps, existing utilities, proven demand.\n\nReal infill: one lot between two 1990s houses, bought for $95k. Known comps at $520k, utilities at the curb, sold 8 months after groundbreaking for $538k. No master plan, no HOA fights, no phase risk.\n\nIf there\'s an empty lot in a neighborhood you know well, that might be your next project. Let\'s look at it.' },
    { s: 'A development deal we funded', b: 'Hi {FIRST},\n\nRecent example: a builder came to us with an entitled lot and a bank that kept moving the goalposts. We funded the acquisition and construction, draws released on schedule, and the project sold at completion.\n\nExecution certainty is everything in development. That\'s the job.' },
    { s: 'Phase-based pricing: pay for the risk you\'re at', b: 'Hi {FIRST},\n\nOne thing borrowers appreciate: pricing that steps down as your project de-risks — raw land pricing at raw land stage, better terms once horizontal work is in, better again at vertical.\n\nRecent restructure: a borrower was still paying raw-land pricing eight months after his horizontal work completed. Re-papered to reflect the de-risked stage, his rate dropped a point and a half on the spot.\n\nIf your current loan doesn\'t reflect your project\'s progress, it might be time to restructure.' },
    { s: 'What we\'re seeing in land right now', b: 'Hi {FIRST},\n\nMarket notes: builders are hungry for finished lots, entitled land is commanding premiums, and well-located raw parcels are still negotiable. The spread between those stages is the opportunity.\n\nWant my read on a specific parcel or market? Just reply.' },
    { s: 'Checking in on your projects', b: 'Hi {FIRST},\n\nFollowing up — any parcels, entitlement projects, or builds in motion? Whether you need capital now or you\'re planning next year\'s project, I\'m glad to think it through with you.\n\nThis follow-up recently pulled a stalled parcel out of a client’s drawer — entitled two years ago, forgotten. Builders in that submarket are paying premiums for finished lots; it’s under contract now.\n\nWhat\'s on the drawing board?' }
  ],
  'Conventional / Agency': [
    { s: 'What today\'s rates mean for your buying power', b: 'Hello {FIRST},\n\nQuick reminder that rate moves change your buying power more than list prices do — a modest rate shift can swing your monthly payment meaningfully.\n\nReal math from a recent pre-approval: a half-point rate move changed our client’s payment by $210 a month — the difference between shopping at $520k and $480k. Same income, same savings, different house.\n\nIf you\'re even loosely thinking about buying or refinancing this year, it\'s worth a fresh pre-approval so you know your real number. Fifteen minutes and it\'s done.' },
    { s: 'Pre-approval vs. pre-qualification (big difference)', b: 'Hi {FIRST},\n\nA pre-QUALIFICATION is an estimate. A pre-APPROVAL is underwritten strength that sellers take seriously — and in multiple-offer situations, it can be the difference.\n\nLive example: two offers on the same Vacaville listing — ours fully underwritten, the other a 10-minute online pre-qual. Ours won at $6k LESS because the seller’s agent trusted it would actually close.\n\nWant to get fully pre-approved so you\'re ready when the right house shows up? Let\'s knock it out.' },
    { s: 'You may not need 20% down', b: 'Hi {FIRST},\n\nThe 20%-down rule is a myth — conventional loans go as low as 3-5% down for qualified buyers. Yes, PMI applies, but it drops off as equity builds, and waiting years to save 20% often costs more than the PMI ever would.\n\nRecent client: waited three years renting at $2,600 a month to save 20% down. That’s $93k out the door — more than the PMI on a 5%-down loan would have cost him in fifteen years.\n\nWant to see what your down payment options actually look like?' },
    { s: 'Your credit score is a rate dial', b: 'Hi {FIRST},\n\nOn conventional loans, credit tiers directly move your rate — sometimes a 20-point score improvement pays for itself many times over across the loan.\n\nReal file: a 19-point score improvement (one paid-down card, one corrected collection) moved a client a full pricing tier — worth about $31k over the life of her loan. The cleanup took six weeks.\n\nIf you\'re within a few months of buying, reply — I\'ll tell you exactly which credit moves would improve your pricing.' },
    { s: 'The DTI cleanup that unlocks approvals', b: 'Hi {FIRST},\n\nDebt-to-income ratio is the #1 conventional roadblock — and often fixable: paying down a card, closing out a small loan, or restructuring payments can move you from declined to approved.\n\nRecent example: a borrower declined at 47% DTI. We paid off a $310-a-month car loan from savings — dropping him to 43.5% — and the same application approved two weeks later.\n\nIf DTI has ever been your obstacle, send me the picture and I\'ll map the cleanup path.' },
    { s: 'Refinance check: is your current loan still the right one?', b: 'Hi {FIRST},\n\nWorth a periodic look: your rate vs. today\'s market, PMI you might be able to drop, or equity you could put to work. A 10-minute refi review either saves you money or confirms you\'re already in the right spot.\n\nA refi review last month found a client still paying PMI three years after her equity crossed 20%. One appraisal later, $184 a month back in her pocket — she’d simply never been told to ask.\n\nWant me to run yours?' },
    { s: 'House hacking: live in one unit, rent the rest', b: 'Hi {FIRST},\n\nOne of the best wealth-building moves going: buy a 2-4 unit property with an owner-occupied conventional loan (low down payment), live in one unit, and let the rents carry your mortgage.\n\nReal house-hack: a client bought a Fairfield duplex at 5% down, lives in one unit, and the $2,250 rent next door covers 78% of his whole mortgage. His effective housing cost is less than his old studio apartment.\n\nCurious what that looks like in your area? I\'ll run a real example for you.' },
    { s: 'The documents to gather before you shop', b: 'Hi {FIRST},\n\nWant a smooth approval? Have these ready: two years of W-2s/tax returns, recent pay stubs, two months of bank statements, and ID. Buyers who show up organized close faster and negotiate better.\n\nOne organized client sent all four document sets the same afternoon we asked. Pre-approved in 24 hours, offered that weekend, closed in 26 days — the file never waited on paperwork once.\n\nWhen you\'re ready, send those over and I\'ll have your pre-approval moving same-day.' },
    { s: 'Buying with less stress: the timeline', b: 'Hi {FIRST},\n\nThe healthy home-buying timeline: pre-approval first, THEN shop, offer with confidence, and let the 30-45 day escrow run its course with no financing surprises.\n\nRecent contrast: one client shopped first and scrambled for financing under a 3-day deadline — pure stress. The next did pre-approval first and toured knowing her exact ceiling. Same market, opposite experiences.\n\nMost stress comes from doing it backwards. Whenever you\'re ready to start right, I\'m here.' },
    { s: 'A quick client story', b: 'Hi {FIRST},\n\nRecent client: thought they were a year away from buying, mostly due to credit assumptions. A short review later, we had a cleanup plan — they were pre-approved and in contract within a few months.\n\nSometimes \'not ready\' is closer than it feels. Want a no-pressure review?' },
    { s: 'Rate watch: what to actually pay attention to', b: 'Hi {FIRST},\n\nTrying to time rates perfectly is a losing game — but knowing your break-even and being READY to lock when pricing dips is a winning one. That\'s what a standing pre-approval buys you.\n\nA client last quarter set his break-even, kept his standing pre-approval current, and locked the morning pricing dipped — saving roughly $140 a month versus the week before. Ready beat perfect timing.\n\nWant me to set you up so you can strike when it\'s right?' },
    { s: 'Checking in on your plans', b: 'Hi {FIRST},\n\nJust checking in — whether buying, refinancing, or just weighing options, I\'m happy to run real numbers so you can decide with clarity.\n\nThis check-in recently caught a renter 11 months before his lease ended — exactly enough runway to fix two credit items and buy instead of re-signing.\n\nWhat does the next 6-12 months look like for you?' }
  ],
  'FHA': [
    { s: '3.5% down: the FHA head start', b: 'Hello {FIRST},\n\nFHA\'s headline benefit: 3.5% down with credit guidelines more forgiving than conventional. For a lot of buyers, it\'s the fastest realistic path to owning.\n\nReal numbers: on a $400k home, 3.5% down is $14,000 — versus $80,000 at 20%. One recent client closed with $14k plus a family gift covering closing costs; waiting for 20% would have taken him six more years of renting.\n\nWant to see what 3.5% down looks like on homes in your price range? Reply and I\'ll run it for you.' },
    { s: 'FHA credit flexibility, explained honestly', b: 'Hi {FIRST},\n\nFHA works with credit scores conventional loans frown at — and past bumps (collections, older credit events) are often workable with the right documentation.\n\nRecent file: a 612 score with two old collections — declined conventional twice. Documented, explained, and approved FHA; she closed eight weeks after she’d assumed she was years away.\n\nIf your credit history has kept you on the sidelines, let\'s look at where you actually stand. You might be closer than you think.' },
    { s: 'MIP: what FHA insurance really costs (and how to exit it)', b: 'Hi {FIRST},\n\nStraight talk on FHA mortgage insurance: yes, it\'s a cost — and there\'s an exit plan. Many buyers refinance into conventional once equity builds and drop it entirely.\n\nHonest math from a client’s file: his FHA MIP ran about $240 a month. Renting the same house cost $2,700 while his full payment was $2,480 — the “expensive” insurance still beat renting by $460, and he refinanced out of it at 22% equity.\n\nThe smart move is knowing the plan going in. I\'ll map yours whenever you\'re ready.' },
    { s: 'Buy a duplex with 3.5% down', b: 'Hi {FIRST},\n\nFHA allows 2-4 unit properties as long as you live in one unit — meaning you can buy a duplex or triplex with 3.5% down and let your tenants help pay the mortgage.\n\nReal house-hack: a client bought a Sacramento duplex FHA at 3.5% down — $16k total. The other unit rents for $1,900, covering 61% of her entire payment. Her tenants are buying her building for her.\n\nIt\'s the single best \'first investment\' play in lending. Want to see real numbers in your area?' },
    { s: 'The FHA 203(k): buy it AND fix it, one loan', b: 'Hi {FIRST},\n\nFound a house that needs work? The FHA 203(k) rolls the purchase AND renovation into one loan — one closing, one payment, move-in-ready home.\n\nRecent 203(k): purchase at $310k plus a $58k renovation, one loan, one closing. The house appraised at $415k after completion — equity built into the deal before move-in.\n\nIf the good deals in your market all need a little love, this is your tool. Happy to explain how the draws work.' },
    { s: 'Gift funds and down payment help', b: 'Hi {FIRST},\n\nFHA allows your entire down payment to come from gift funds (family) and plays well with many down-payment assistance programs. The cash barrier is often smaller than buyers assume.\n\nReal example: a client’s parents gifted the full $12k down payment — completely allowed — and a CalHFA program covered most of her closing costs. Her own cash to close: under $4,000.\n\nWant me to check what assistance you might qualify for? Just reply.' },
    { s: 'FHA appraisals: what sellers need to know', b: 'Hi {FIRST},\n\nFHA appraisals check basic health-and-safety items — peeling paint, handrails, working systems. Knowing the checklist BEFORE you offer helps you pick houses that will sail through.\n\nOn a recent purchase: peeling exterior paint flagged at appraisal. Because the buyer knew the checklist going in, the seller cured it in a weekend instead of the deal dying in a panic.\n\nWhen you start touring, I\'ll send you the quick checklist so nothing surprises you.' },
    { s: 'The documents that speed up your FHA approval', b: 'Hi {FIRST},\n\nGetting FHA-ready is simple: pay stubs, two years of W-2s, two months of bank statements, ID. With those in hand, pre-approval moves fast.\n\nOne client gathered everything on a Tuesday night; his pre-approval went out Wednesday afternoon. He was writing offers that weekend while another buyer on the same house was still finding her W-2s.\n\nGather those and reply — I\'ll take it from there.' },
    { s: 'A first-time buyer story', b: 'Hi {FIRST},\n\nRecent client: a renter convinced they needed years more savings. FHA\'s 3.5% down plus a modest gift from family, and they closed on their first home within the season.\n\nEither way, we have a path for you. Want to measure your gap?' },
    { s: 'FHA streamline: the easy refi', b: 'Hi {FIRST},\n\nAlready have an FHA loan? The FHA Streamline refinance can lower your rate with minimal documentation — often no appraisal.\n\nRecent streamline: no appraisal, minimal paperwork, 16 days start to finish — and $205 a month off the payment. The client’s only regret was waiting a year to ask.\n\nIf your rate is above today\'s market, this is one of the easiest wins in lending. Reply and I\'ll check your numbers.' },
    { s: 'Rent vs. own: run YOUR numbers', b: 'Hi {FIRST},\n\nThe rent-vs-own math is personal: your rent, your market, your timeline. But every month of rent is 100% gone; a mortgage payment builds equity from day one.\n\nReal side-by-side: $2,650 rent versus a $2,780 all-in payment on the house a client wanted — but $610 of that payment was principal. Owning cost him $130 more in cash and $480 less in reality, every month.\n\nWant your actual side-by-side? Send me your rent and target area, I\'ll build it.' },
    { s: 'Checking in on your homeownership plans', b: 'Hi {FIRST},\n\nJust checking in — whether buying feels close or far off, I\'m glad to look at your numbers and give you an honest read on the path.\n\nThis follow-up recently moved a couple from “maybe next year” to pre-approved in 9 days — the only thing actually missing had been a 20-minute review.\n\nWhere are things at for you?' }
  ],
  'VA': [
    { s: 'Zero down. Yes, really.', b: 'Hello {FIRST},\n\nThe VA loan remains the strongest mortgage in America: zero down payment, no monthly mortgage insurance, and competitive rates — earned through your service.\n\nReal numbers: a veteran client bought a $485k home with $0 down and no PMI. The identical purchase FHA would have needed $17k down plus $310 a month in insurance — his service benefit was worth over $50k in cash and carry.\n\nIf you haven\'t used your benefit (or think you can\'t), reply. Most of what people believe about VA limits is outdated.' },
    { s: 'No PMI — what that saves you monthly', b: 'Hi {FIRST},\n\nUnlike low-down conventional or FHA loans, VA loans carry NO monthly mortgage insurance. On a typical home, that\'s a meaningful monthly saving that goes to your family instead of an insurer.\n\nLive comparison from a recent file: 5% down conventional carried $265 a month in PMI; the VA loan carried none. Over seven years that’s about $22k staying with his family instead of an insurer.\n\nWant to see the side-by-side on a real price point? I\'ll build it for you.' },
    { s: 'Your VA entitlement can be reused (and split)', b: 'Hi {FIRST},\n\nCommon myth: \'I used my VA loan already, so it\'s gone.\' False — entitlement restores when you sell, and in many cases you can have TWO VA loans at once (like when PCSing).\n\nRecent case: a veteran sold his 2019 VA-financed home and assumed the benefit was spent. Entitlement restored at closing — he bought his next home VA again 45 days later, still zero down.\n\nNot sure where your entitlement stands? I can help you check it quickly.' },
    { s: 'The funding fee, explained straight', b: 'Hi {FIRST},\n\nThe VA funding fee is the trade for zero-down/no-PMI — it can be financed into the loan, and it\'s WAIVED entirely for veterans with service-connected disability ratings.\n\nReal file: a client with a 30% disability rating didn’t know his funding fee was waived. That single question saved him $9,800 at closing.\n\nIf you\'re not sure whether you\'re exempt, reply — that answer alone can be worth thousands.' },
    { s: 'VA loans win offers when agents understand them', b: 'Hi {FIRST},\n\nSome sellers hesitate on VA offers out of pure misunderstanding. A well-prepared VA buyer — full pre-approval, educated agent, clean timeline — competes with anyone.\n\nRecent win: our fully-underwritten VA buyer beat two conventional offers on a Vacaville listing. The listing agent later admitted she’d expected “VA headaches” — preparation erased them, and our buyer paid $4k under the highest competing offer.\n\nWhen you\'re ready to shop, I\'ll arm you (and your agent) so your offer reads strong.' },
    { s: 'Buy a multi-unit with your VA benefit', b: 'Hi {FIRST},\n\nLesser-known play: VA loans allow 2-4 unit properties when you occupy one unit — zero down on a duplex where tenants help pay your mortgage.\n\nReal house-hack: a veteran bought a triplex at $0 down, lives in one unit, and collects $3,700 from the other two — covering 92% of the whole payment. He banks his housing allowance.\n\nIt\'s one of the best wealth-building moves available to those who served. Want to see it on paper?' },
    { s: 'The VA IRRRL: the 10-minute refi', b: 'Hi {FIRST},\n\nAlready have a VA loan? The Interest Rate Reduction Refinance (IRRRL) is famously simple — minimal docs, often no appraisal — built to drop your rate with the least friction in the industry.\n\nRecent IRRRL: 12 days, no appraisal, $240 a month saved. The client spent more time deciding than the refinance took.\n\nIf your rate\'s above market, reply and I\'ll check whether an IRRRL makes sense.' },
    { s: 'VA appraisals and the Tidewater process', b: 'Hi {FIRST},\n\nVA appraisals protect YOU — and the \'Tidewater\' process gives a chance to submit comps before a low value is final. Knowing how it works keeps deals alive.\n\nOn a live deal: the appraisal came in $15k light. Tidewater let us submit two better comps before the value finalized — final number landed $11k higher and the purchase survived.\n\nWhen you\'re under contract, I\'ll walk you through it so nothing catches you off guard.' },
    { s: 'A veteran client story', b: 'Hi {FIRST},\n\nRecent client: a veteran renting for years, sure they needed a down payment first. Zero-down VA, seller-paid closing costs negotiated in — they moved in with savings intact.\n\nYour benefit is powerful. Let\'s make sure you\'re getting everything you earned.' },
    { s: 'Certificates of Eligibility: faster than you think', b: 'Hi {FIRST},\n\nThe COE (Certificate of Eligibility) sounds bureaucratic, but we can usually pull it electronically in minutes — it\'s rarely the holdup people expect.\n\nLast month a client’s COE pulled electronically in under five minutes during our first phone call — the step he’d been dreading for a year took less time than his coffee order.\n\nWant me to confirm your eligibility now so it\'s ready when you are? Just say the word.' },
    { s: 'Using VA for your \'forever-ish\' home', b: 'Hi {FIRST},\n\nVA loans have no loan-limit ceiling with full entitlement — meaning your benefit scales to the home your family actually needs, not just a starter.\n\nRecent example: a veteran family of six used full entitlement on a $740k home — zero down, no loan-limit ceiling. The benefit scaled to the house they needed, not a starter they’d outgrow in three years.\n\nIf your household has outgrown your current place, let\'s see what your benefit unlocks today.' },
    { s: 'Following up — and thank you', b: 'Hi {FIRST},\n\nFollowing up — whether buying, refinancing, or just curious about your benefit, I\'m always glad to help you get full value from it.\n\nAnd as always: thank you for your service.' }
  ],
  'Non-QM': [
    { s: 'Self-employed? Your tax returns don\'t tell your story', b: 'Hello {FIRST},\n\nIf you\'re self-employed, your tax returns are optimized to REDUCE income on paper — great for taxes, terrible for mortgage approvals. Non-QM lending fixes that mismatch.\n\nReal file: a contractor showing $61k on his Schedule C after write-offs — but $23k a month in deposits. Bank statements told the true story; he closed on a $520k purchase his tax returns said he couldn’t afford.\n\nBank statement programs qualify you off your actual deposits. Want to see what your real buying power looks like?' },
    { s: 'Bank statement loans: how they work', b: 'Hi {FIRST},\n\nThe mechanics are simple: 12-24 months of bank statements establish your income — no tax returns needed. Business or personal accounts both work, with different calculations.\n\nRecent example: 14 months of business statements, a 50% expense factor, and the qualifying income came out to $14,200 a month — nearly triple what his tax returns showed. Approved where two banks declined.\n\nIf a bank has ever choked on your Schedule C, this is your lane. Reply and I\'ll run your scenario.' },
    { s: 'Asset-based qualifying: let your money do the talking', b: 'Hi {FIRST},\n\nGot significant assets but modest paper income (retirees, investors, business owners)? Asset-depletion programs qualify you off what you HAVE, not what you report.\n\nReal case: a retired client with $1.4M across accounts and $3,100 a month of paper income. Asset depletion qualified him at over $9k a month — he bought the coastal property cash-flow said he couldn’t.\n\nIt\'s one of the most underused programs in lending. Want to see if your balance sheet qualifies you?' },
    { s: '1099 and gig income: fully financeable', b: 'Hi {FIRST},\n\nContractors, realtors, drivers, freelancers — 1099 income has its own qualifying programs now. No more being punished for not having a W-2.\n\nRecent file: a 1099 realtor two years into her career — declined conventional for “income history.” Her 1099s and deposits qualified her directly; she closed on her own condo 5 weeks later.\n\nIf you\'ve been told \'come back with two years of tax returns,\' come talk to me instead.' },
    { s: 'Recent credit event? There\'s a comeback path', b: 'Hi {FIRST},\n\nBankruptcy, foreclosure, or short sale in your past? Non-QM programs have dramatically shorter waiting periods than conventional — sometimes just a year or two out.\n\nReal comeback: a client 26 months out of a foreclosure — conventional wanted seven years. He bought at a modestly higher rate, rebuilt equity and score, and refinanced conventional at year four. Renting until 2029 would have cost him six figures.\n\nEither way, we have a path for you. Reply and I\'ll map your comeback timeline.' },
    { s: 'Interest-only: cash flow flexibility', b: 'Hi {FIRST},\n\nInterest-only options exist across many non-QM programs — useful for investors maximizing cash flow or borrowers with variable income who want a lower required payment.\n\nLive example: an investor took interest-only on a rental, cutting the required payment $610 a month. He banks the difference all year and makes one principal paydown each January — flexibility with a plan, not a gimmick.\n\nIt\'s a tool, not a trick, when used with a plan. Want to see if it fits yours?' },
    { s: 'Foreign nationals and ITIN borrowers welcome', b: 'Hi {FIRST},\n\nNo U.S. credit? Not a citizen? Foreign national and ITIN programs finance U.S. real estate for borrowers banks turn away at the door.\n\nRecent close: a foreign national with no U.S. credit bought a $390k Phoenix rental using an ITIN program — passport, foreign credit references, and 30% down. Every bank had turned him away at hello.\n\nIf that\'s you (or someone in your network), I\'m happy to explain exactly what\'s needed.' },
    { s: 'The pricing question, answered honestly', b: 'Hi {FIRST},\n\nYes, non-QM rates run somewhat higher than conventional — that\'s the trade for flexible qualifying. The real question: does the deal work at the payment? Usually the answer is yes, and refinancing later is always on the table.\n\nHonest numbers from a real file: the non-QM rate ran 1.4 points over conventional — about $340 a month on his loan. The property cash-flowed $520 AFTER that payment. The deal worked; perfect wasn’t available.\n\nLet\'s run YOUR numbers instead of guessing.' },
    { s: 'A self-employed success story', b: 'Hi {FIRST},\n\nRecent client: a business owner with strong revenue but aggressive write-offs — declined by two banks. Twelve months of bank statements later, approved and closed.\n\nThe income was always there; the paperwork just needed the right program. Sound familiar?' },
    { s: 'DSCR: the investor branch of non-QM', b: 'Hi {FIRST},\n\nIf you own (or want) rentals: DSCR loans qualify off the property\'s rent, ignoring your personal income entirely. Combined with bank-statement loans for your own home, self-employed investors are fully covered.\n\nOne self-employed client runs both: bank statements financed his primary home, DSCR financed his three rentals. Neither loan ever looked at a tax return — his whole balance sheet is financeable.\n\nWant the full picture of what you qualify for across both?' },
    { s: 'When to refi FROM non-QM', b: 'Hi {FIRST},\n\nSmart non-QM borrowers treat it as a bridge: qualify flexibly now, then refinance into conventional once tax returns or seasoning catch up. Going in with the exit mapped saves real money.\n\nRecent exit: a borrower’s second full tax year finally showed qualifying income, and we moved him from his bank-statement loan to conventional — 1.2 points lower. Non-QM got him the house; the plan got him the rate.\n\nAlready in a non-QM loan? Let\'s check if your exit window has opened.' },
    { s: 'Checking in on your plans', b: 'Hi {FIRST},\n\nJust checking in — if your income situation has evolved (new business year, new contracts, assets shifted), your financing options probably did too.\n\nThis follow-up caught a client one month after his best business year ever — which changed his qualifying picture completely. He’s under contract on the office building he rents.\n\nWorth a fresh look? Reply and we\'ll run it.' }
  ],
  'Realtor Partners': [
    { s: 'Your buyers\' backup plan (that saves your deals)', b: 'Hello {FIRST},\n\nEvery agent has watched a deal die in financing. Having a broker who covers the FULL spectrum — conventional, FHA, VA, investor DSCR, bridge — means your deals have a Plan B before they need one.\n\nReal save: an agent’s buyer got declined 12 days before closing over self-employment income. We flipped the file to a bank-statement program and closed 6 days late instead of dead — her $14k commission survived.\n\nKeep my number handy for the next tricky file. I answer fast.' },
    { s: 'The listing tool: pre-underwritten buyers', b: 'Hi {FIRST},\n\nWant your offers to stand out? Buyers who come with FULL pre-approval (not a pre-qual letter) win more contracts. I turn those around fast so your clients shop as strong as cash.\n\nLive comparison: two offers on the same listing — our fully-underwritten buyer at $735k beat a $742k offer with an online pre-qual letter. The listing agent said the certainty was worth more than the $7k.\n\nSend me your next buyer and watch the difference in how listing agents respond.' },
    { s: 'Investor clients = repeat commissions', b: 'Hi {FIRST},\n\nInvestor clients buy again and again — and they stick with agents who bring them financing solutions. DSCR and fix & flip loans are how you become their permanent agent.\n\nOne agent sent us a single investor client in 2024. That client has closed five properties since — five commissions from one introduction, because the financing kept working.\n\nGot an investor in your book? Introduce us — I\'ll take good care of them.' },
    { s: 'Saving deals when the buyer is self-employed', b: 'Hi {FIRST},\n\nSelf-employed buyer with great income but ugly tax returns? Don\'t let the deal die — bank statement programs qualify them off deposits, not returns.\n\nRecent save: a business-owner buyer, 11 days from closing, declined over tax returns. Twelve months of bank statements later the same purchase closed — the agent’s escrow never cancelled.\n\nNext time a lender says no to a business owner, call me before you cancel escrow.' },
    { s: 'The \'ugly house\' listing you can now sell', b: 'Hi {FIRST},\n\nListings that need work scare financed buyers — unless their financing covers the renovation. Rehab loans (and FHA 203k) turn your hardest listing into someone\'s project.\n\nReal example: a listing sat 84 days because every financed buyer’s lender balked at the kitchen-less interior. Marketed WITH a renovation-loan solution attached, it went pending in 12 days.\n\nGot a fixer sitting on the market? Let\'s market it WITH the financing solution attached.' },
    { s: 'Open house ammo: co-branded numbers', b: 'Hi {FIRST},\n\nWant real open-house ammunition? I can prep payment scenarios for your listing — real numbers buyers can react to — with your branding on them.\n\nAn agent’s open house last month featured our payment sheet — real numbers at three price points. Two visitors asked financing questions on the spot; one is now her buyer client.\n\nSend me your active listing and I\'ll have a sheet back to you this week.' },
    { s: 'Speed closes: when your buyer needs 2 weeks', b: 'Hi {FIRST},\n\nWhen a seller wants a fast close, bridge financing lets your buyer perform like cash and refinance after. It\'s won more than a few bidding wars.\n\nRecent win: a seller needed 15 days for a job relocation. Our bridge-financed buyer performed like cash and got the house $9k under a slower competing offer.\n\nRemember that option next time speed is the deciding factor. Thoughts?' },
    { s: 'Your past clients are refi opportunities (and touchpoints)', b: 'Hi {FIRST},\n\nEvery past client you send for a refi review is a touchpoint that keeps you top-of-mind — and when they eventually move, you\'re their agent. I\'ll take great care of anyone you send.\n\nOne agent sends every past client an annual refi review through us. Last year that habit produced three refis — and two of those clients listed their homes with her when they moved up.\n\nWant a simple way to offer that? I\'ll draft the outreach for you.' },
    { s: 'A saved-deal story', b: 'Hi {FIRST},\n\nRecent save: an agent\'s buyer got declined 10 days before closing over DTI. We restructured into the right program and closed only a few days late — commission saved, client thrilled, agent got the referral review.\n\nThat\'s the partnership I\'m offering. Test me on your next tough file.' },
    { s: 'First-time buyer seminars: let\'s team up', b: 'Hi {FIRST},\n\nFirst-time buyer events fill your pipeline — and they work best with a lender covering the money questions live. I\'ll co-host, bring materials, and let you own the room.\n\nA recent co-hosted seminar drew 22 first-time buyers. The agent walked out with 9 new contacts and 3 signed buyer agreements — the financing Q&A did the converting for her.\n\nWant to put one on the calendar this quarter?' },
    { s: 'What\'s financing look like this season?', b: 'Hi {FIRST},\n\nQuick market pulse for your buyer conversations: programs remain broad, investor lending is active, and buyers who are FULLY pre-approved are winning. Happy to send you talking points anytime.\n\nWhat are you seeing on your side?' },
    { s: 'Following up — how can I help your pipeline?', b: 'Hi {FIRST},\n\nFollowing up — any files that need a second opinion, buyers who stalled out, or listings that need a financing angle? That\'s exactly the stuff I love to fix.\n\nThis follow-up recently surfaced a stalled file from an agent — buyer had gone quiet after a decline elsewhere. One program change and a phone call later, they’re back in escrow.\n\nWhat\'s on your plate?' }
  ]
};

/***** ASAP PIPELINE — DRIP CAMPAIGNS (server) *******************************
 * Paste as a NEW file "Pipeline_Drip.gs". Depends on: M1 (ss_), M4
 * (Pipeline_senderSig_, _pl_tz_), Code.gs (ASAP_disclaimer_), Pipeline_CRM.gs.
 *
 * 12 pre-built emails per loan program (above). Each contact assigned a
 * Campaign in Contacts gets the next email automatically — default monthly,
 * frequency/sender/on-off adjustable per campaign in "Manage Campaigns".
 * {FIRST} merges the contact's first name; the chosen sender's signature and
 * the standard disclaimer are appended, so it reads like a personal 1-to-1.
 *
 * SETUP (once): run  pipeline_dripInstall  in the editor (daily ~9am sweep).
 *****************************************************************************/

var DRIP_CFG_TAB = 'CRM_CampaignCfg';
var DRIP_SENDER_NAME = { marketing: 'ASAP Funding', joe: 'Joe Paliwala — ASAP Funding', daniel: 'Daniel Kim — ASAP Funding' };

function drip_cfgSheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName(DRIP_CFG_TAB);
  if (!sh) {
    sh = ss.insertSheet(DRIP_CFG_TAB);
    sh.getRange(1, 1, 1, 6).setValues([['Campaign', 'Active', 'FreqDays', 'Sender', 'SendHour', 'SendDays']]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  // self-upgrade older config sheets
  var H = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  ['SendHour', 'SendDays'].forEach(function (n) { if (H.indexOf(n) < 0) { sh.getRange(1, sh.getLastColumn() + 1).setValue(n).setFontWeight('bold'); H.push(n); } });
  // seed a row for every campaign in the library
  var vals = sh.getDataRange().getValues();
  var have = {};
  for (var r = 1; r < vals.length; r++) have[String(vals[r][0])] = 1;
  Object.keys(drip_lib_()).forEach(function (c) { if (!have[c]) sh.appendRow([c, 'Y', 30, 'daniel', 9, 'Mon,Tue,Wed,Thu,Fri']); });
  return sh;
}
function drip_cfg_() {
  var sh = drip_cfgSheet_();
  var vals = sh.getDataRange().getValues(), out = {};
  var H2 = vals[0], iH = H2.indexOf('SendHour'), iD = H2.indexOf('SendDays');
  for (var r = 1; r < vals.length; r++) {
    var hr = iH >= 0 ? parseInt(vals[r][iH], 10) : 9; if (isNaN(hr) || hr < 0 || hr > 23) hr = 9;
    var ds = iD >= 0 ? String(vals[r][iD] || '') : ''; if (!ds.trim()) ds = 'Mon,Tue,Wed,Thu,Fri';
    var dset = {}; ds.split(',').forEach(function (x) { dset[String(x).trim().slice(0, 3)] = 1; });
    var iHid = H2.indexOf('Hidden');
    out[String(vals[r][0])] = {
      hidden: iHid >= 0 && String(vals[r][iHid]).trim().toUpperCase() === 'Y',
      active: String(vals[r][1]).trim().toUpperCase() === 'Y',
      freq: Math.max(1, parseInt(vals[r][2], 10) || 30),
      sender: ['marketing', 'joe', 'daniel'].indexOf(String(vals[r][3]).trim()) >= 0 ? String(vals[r][3]).trim() : 'daniel',
      hour: hr, days: dset, daysStr: ds
    };
  }
  return out;
}
function pipeline_dripConfigList() {
  try {
    var cfg = drip_cfg_();
    var OV = drip_overrides_();
    // contact counts per campaign
    var counts = {};
    try {
      var cs = crm_sheet_().getDataRange().getValues(), CH = cs[0], ci = CH.indexOf('Campaign');
      for (var r = 1; r < cs.length; r++) { var c = String(cs[r][ci] || 'None'); counts[c] = (counts[c] || 0) + 1; }
    } catch (e) {}
    var LIB = drip_lib_();
    var out = Object.keys(LIB).filter(function (c) { return !(cfg[c] && cfg[c].hidden); }).map(function (c) {
      return { campaign: c, active: cfg[c] ? cfg[c].active : true, freq: cfg[c] ? cfg[c].freq : 30,
               sender: cfg[c] ? cfg[c].sender : 'daniel', hour: cfg[c] ? cfg[c].hour : 9,
               days: cfg[c] ? cfg[c].daysStr : 'Mon,Tue,Wed,Thu,Fri',
               emails: LIB[c].length, contacts: counts[c] || 0,
               subjects: LIB[c].map(function (e, i) { var t = drip_template_(c, i, OV); return t ? t.s : e.s; }) };
    });
    return { ok: true, campaigns: out };
  } catch (err) { return { ok: false, error: String(err) }; }
}
function pipeline_dripConfigSave(campaign, active, freq, sender, hour, days) {
  try {
    if (!drip_lib_()[campaign]) return { ok: false, error: 'Unknown campaign.' };
    var sh = drip_cfgSheet_();
    var H = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var vals = sh.getDataRange().getValues();
    var hr = parseInt(hour, 10); if (isNaN(hr) || hr < 0 || hr > 23) hr = 9;
    var OK = { Mon: 1, Tue: 1, Wed: 1, Thu: 1, Fri: 1, Sat: 1, Sun: 1 };
    var ds = String(days || '').split(',').map(function (x) { return String(x).trim().slice(0, 3); }).filter(function (x) { return OK[x]; }).join(',');
    if (!ds) ds = 'Mon,Tue,Wed,Thu,Fri';
    for (var r = 1; r < vals.length; r++) {
      if (String(vals[r][0]) === String(campaign)) {
        sh.getRange(r + 1, 2, 1, 3).setValues([[active ? 'Y' : 'N', Math.max(1, parseInt(freq, 10) || 30),
          ['marketing', 'joe', 'daniel'].indexOf(String(sender)) >= 0 ? String(sender) : 'daniel']]);
        sh.getRange(r + 1, H.indexOf('SendHour') + 1).setValue(hr);
        sh.getRange(r + 1, H.indexOf('SendDays') + 1).setValue(ds);
        return { ok: true };
      }
    }
    return { ok: false, error: 'Campaign row not found.' };
  } catch (err) { return { ok: false, error: String(err) }; }
}

function drip_ensureContactCols_(sh) {
  var H = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  ['DripStep', 'DripLastSent'].forEach(function (n) {
    if (H.indexOf(n) < 0) { sh.getRange(1, sh.getLastColumn() + 1).setValue(n).setFontWeight('bold'); H.push(n); }
  });
}

/* THE DAILY SWEEP — sends each due contact their next campaign email. */
function pipeline_dripSweep() {
  try {
    var cfg = drip_cfg_();
    var sh = crm_sheet_();
    drip_ensureContactCols_(sh);
    var vals = sh.getDataRange().getValues(), H = vals[0];
    function c(n) { return H.indexOf(n); }
    var cNm = c('Name'), cEm = c('Email'), cCa = c('Campaign'), cSt = c('DripStep'), cLs = c('DripLastSent'), cTouch = c('LastTouch');
    var tz = _pl_tz_(), now = new Date(), sent = 0;
    var nowHour = parseInt(Utilities.formatDate(now, tz, 'H'), 10);
    var nowDay = Utilities.formatDate(now, tz, 'EEE');   // Mon, Tue, ...
    for (var r = 1; r < vals.length && sent < 50; r++) {
      var camp = String(vals[r][cCa] || 'None').trim();
      var LIBs = drip_lib_();
      if (camp === 'None' || !LIBs[camp]) continue;
      var conf = cfg[camp]; if (!conf || !conf.active || conf.hidden) continue;
      if (nowHour !== conf.hour) continue;               // send only at the campaign's chosen hour
      if (!conf.days[nowDay]) continue;                  // and only on its chosen weekdays
      var email = String(vals[r][cEm] || '').trim(); if (!email || email.indexOf('@') < 0) continue;
      var step = parseInt(vals[r][cSt], 10) || 0;
      if (step >= LIBs[camp].length) continue;              // sequence finished
      var last = vals[r][cLs];
      var due = false;
      if (!last) due = true;                                        // first email: next sweep after assignment
      else {
        var lastD = (last instanceof Date) ? last : new Date(last);
        due = ((now - lastD) / 86400000) >= conf.freq;
      }
      if (!due) continue;
      var t = drip_template_(camp, step) || LIBs[camp][step];
      var first = String(vals[r][cNm] || '').trim().split(/\s+/)[0] || 'there';
      var body = String(t.b).split('{FIRST}').join(first);
      var sig = Pipeline_senderSig_(conf.sender);
      var disc = ASAP_disclaimer_();
      function esc(x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
      var html = '<div style="font-family:Arial,Helvetica,sans-serif;color:#1a2230;font-size:14px;line-height:1.55;max-width:800px;">' +
        esc(body).replace(/\n/g, '<br>') + '<br><br>' + sig.html +
        '<br><br><p style="font-family:Georgia,\'Times New Roman\',serif;font-size:11px;color:#444;line-height:1.45;text-align:justify;margin:0;"><strong>DISCLAIMER:</strong> ' + disc +
        '</p><p style="font-size:11px;color:#777;margin:8px 0 0;">If you\'d rather not receive these check-ins, just reply and let me know.</p></div>';
      var plain = body + '\n\n' + sig.plain + '\n\nDISCLAIMER: ' + disc + '\n\nIf you\'d rather not receive these check-ins, just reply and let me know.';
      try {
        // The signature references cid:danielphoto — the image must be attached inline or
        // it renders as a broken icon (the bug DK saw). replyTo routes replies correctly.
        var sendOpts = { htmlBody: html, name: DRIP_SENDER_NAME[conf.sender] || 'ASAP Funding', replyTo: sig.replyTo };
        if (html.indexOf('cid:danielphoto') >= 0) {
          try { sendOpts.inlineImages = { danielphoto: Utilities.newBlob(Utilities.base64Decode(DK_PHOTO_B64), 'image/jpeg', 'dk.jpg') }; } catch (eImg) {}
        }
        GmailApp.sendEmail(email, t.s, plain, sendOpts);
        sh.getRange(r + 1, cSt + 1).setValue(step + 1);
        sh.getRange(r + 1, cLs + 1).setValue(now);
        if (cTouch >= 0) sh.getRange(r + 1, cTouch + 1).setValue(now);
        // stamp the send into the contact's conversation log (date, time, campaign, step, subject)
        try {
          var cNl = c('NotesLog');
          if (cNl >= 0) {
            var log = []; try { log = JSON.parse(String(vals[r][cNl] || '[]')); } catch (e2) { log = []; }
            log.unshift({ ts: Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm'), text: '\ud83d\udce7 Drip sent \u2014 ' + camp + ' email #' + (step + 1) + ' of ' + LIBs[camp].length + ': "' + t.s + '"' });
            if (log.length > 200) log = log.slice(0, 200);
            var js2 = JSON.stringify(log); if (js2.length > 45000) { log = log.slice(0, Math.floor(log.length / 2)); js2 = JSON.stringify(log); }
            sh.getRange(r + 1, cNl + 1).setValue(js2);
            vals[r][cNl] = js2;
          }
        } catch (e3) {}
        sent++;
      } catch (e) {}   // failed send: step + last-send stay unchanged, so nothing is skipped
    }
    if (sent) Logger.log('Drip sweep sent ' + sent + ' email(s).');
  } catch (err) { Logger.log('Drip sweep error: ' + err); }
}

/* Install the daily sweep (run once in the editor; ~9am Pacific). */
function pipeline_dripInstall() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'pipeline_dripSweep') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('pipeline_dripSweep').timeBased().everyHours(1).create();
  drip_cfgSheet_();
  Logger.log('Drip sweep installed: hourly (each campaign sends only at its own chosen time + days). Campaigns: ' + Object.keys(drip_lib_()).join(', '));
}

/* Dry run — logs who WOULD get what today. Sends nothing. */
function pipeline_dripPreview() {
  var cfg = drip_cfg_(), sh = crm_sheet_();
  drip_ensureContactCols_(sh);
  var vals = sh.getDataRange().getValues(), H = vals[0];
  function c(n) { return H.indexOf(n); }
  var n = 0;
  for (var r = 1; r < vals.length; r++) {
    var camp = String(vals[r][c('Campaign')] || 'None').trim();
    var LIBp = drip_lib_();
    if (camp === 'None' || !LIBp[camp] || !cfg[camp] || !cfg[camp].active || cfg[camp].hidden) continue;
    var email = String(vals[r][c('Email')] || '').trim(); if (!email) continue;
    var step = parseInt(vals[r][c('DripStep')], 10) || 0;
    if (step >= LIBp[camp].length) continue;
    var last = vals[r][c('DripLastSent')];
    var due = !last || ((new Date() - ((last instanceof Date) ? last : new Date(last))) / 86400000) >= cfg[camp].freq;
    if (due) { Logger.log(String(vals[r][c('Name')]) + ' <' + email + '> -> ' + camp + ' email #' + (step + 1) + ': ' + LIBp[camp][step].s); n++; }
  }
  Logger.log(n + ' email(s) would send on the next sweep.');
}


/* ---------- Editable templates (your edits live in CRM_DripEdits and override
   the built-in library; Reset deletes the override and restores the original) ---------- */
var DRIP_EDITS_TAB = 'CRM_DripEdits';
function drip_editsSheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName(DRIP_EDITS_TAB);
  if (!sh) {
    sh = ss.insertSheet(DRIP_EDITS_TAB);
    sh.getRange(1, 1, 1, 4).setValues([['Campaign', 'Idx', 'Subject', 'Body']]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}
function drip_overrides_() {
  var out = {};
  try {
    var vals = drip_editsSheet_().getDataRange().getValues();
    for (var r = 1; r < vals.length; r++) {
      var k = String(vals[r][0]) + '|' + String(vals[r][1]);
      out[k] = { s: String(vals[r][2] || ''), b: String(vals[r][3] || '') };
    }
  } catch (e) {}
  return out;
}
function drip_template_(camp, idx, ov) {
  var base = (drip_lib_()[camp] || [])[idx];
  if (!base) return null;
  var o = (ov || drip_overrides_())[camp + '|' + idx];
  return o && (o.s || o.b) ? { s: o.s || base.s, b: o.b || base.b, edited: true } : { s: base.s, b: base.b, edited: false };
}
/* Full assembled preview for the campaign email editor: body + the campaign's
 * configured sender signature + disclaimer, with cid images swapped to data URIs
 * so it renders in the browser exactly as the sent email will look. */
function pipeline_dripPreviewEmail(camp, idx, subjOverride, bodyOverride) {
  try {
    var g = pipeline_dripGetEmail(camp, idx);
    if (!g || !g.ok) return g || { ok: false, error: 'Email not found.' };
    var subject = (subjOverride != null && String(subjOverride).trim() !== '') ? String(subjOverride) : g.subject;
    var rawBody = (bodyOverride != null && String(bodyOverride).trim() !== '') ? String(bodyOverride) : g.body;
    var cfg = drip_cfg_(); var conf = cfg[String(camp)] || {};
    var sender = conf.sender || 'daniel';
    var sig = Pipeline_senderSig_(sender), disc = ASAP_disclaimer_();
    function esc(x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    var body = String(rawBody).split('{FIRST}').join('Jonn');
    var html = '<div style="font-family:Arial,Helvetica,sans-serif;color:#1a2230;font-size:14px;line-height:1.55;max-width:800px;">' +
      esc(body).replace(/\n/g, '<br>') + '<br><br>' + sig.html +
      '<br><br><p style="font-family:Georgia,\'Times New Roman\',serif;font-size:11px;color:#444;line-height:1.45;text-align:justify;margin:0;"><strong>DISCLAIMER:</strong> ' + disc +
      '</p><p style="font-size:11px;color:#777;margin:8px 0 0;">If you\'d rather not receive these check-ins, just reply and let me know.</p></div>';
    html = Pipeline_inviteToPreview_(html);   // cid: -> data: URIs for the browser
    return { ok: true, subject: subject, html: html, from: (DRIP_SENDER_NAME[sender] || 'ASAP Funding') };
  } catch (err) { return { ok: false, error: String(err) }; }
}

function pipeline_dripGetEmail(camp, idx) {
  try {
    var t = drip_template_(String(camp), parseInt(idx, 10));
    if (!t) return { ok: false, error: 'Email not found.' };
    return { ok: true, subject: t.s, body: t.b, edited: t.edited };
  } catch (err) { return { ok: false, error: String(err) }; }
}
function pipeline_dripSaveEmail(camp, idx, subject, body) {
  try {
    camp = String(camp); idx = parseInt(idx, 10);
    if (!(drip_lib_()[camp] || [])[idx]) return { ok: false, error: 'Email not found.' };
    var sh = drip_editsSheet_();
    var vals = sh.getDataRange().getValues(), rowIdx = -1;
    for (var r = 1; r < vals.length; r++) { if (String(vals[r][0]) === camp && parseInt(vals[r][1], 10) === idx) { rowIdx = r; break; } }
    var subj = String(subject || '').trim(), bod = String(body || '').trim();
    if (!subj && !bod) {                                   // reset to original
      if (rowIdx > 0) sh.deleteRow(rowIdx + 1);
      var base = drip_lib_()[camp][idx];
      return { ok: true, subject: base.s, body: base.b, edited: false };
    }
    if (rowIdx > 0) sh.getRange(rowIdx + 1, 3, 1, 2).setValues([[subj, bod]]);
    else sh.appendRow([camp, idx, subj, bod]);
    return { ok: true, subject: subj, body: bod, edited: true };
  } catch (err) { return { ok: false, error: String(err) }; }
}


/* ---------- Custom campaigns (created in-app, stored in CRM_DripCustom) ---------- */
var DRIP_CUSTOM_TAB = 'CRM_DripCustom';
var DRIP_LIB_CACHE = null;
function drip_customSheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName(DRIP_CUSTOM_TAB);
  if (!sh) {
    sh = ss.insertSheet(DRIP_CUSTOM_TAB);
    sh.getRange(1, 1, 1, 4).setValues([['Campaign', 'Idx', 'Subject', 'Body']]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}
/* Built-in library + custom campaigns, merged. */
function drip_lib_() {
  if (DRIP_LIB_CACHE) return DRIP_LIB_CACHE;
  var out = {};
  Object.keys(DRIP_LIBRARY).forEach(function (k) { out[k] = DRIP_LIBRARY[k]; });
  try {
    var vals = drip_customSheet_().getDataRange().getValues();
    for (var r = 1; r < vals.length; r++) {
      var cName = String(vals[r][0] || '').trim(); if (!cName) continue;
      var idx = parseInt(vals[r][1], 10); if (isNaN(idx)) continue;
      if (!out[cName]) out[cName] = [];
      out[cName][idx] = { s: String(vals[r][2] || ''), b: String(vals[r][3] || '') };
    }
  } catch (e) {}
  DRIP_LIB_CACHE = out;
  return out;
}
/* Visible campaign names (hidden/deleted ones excluded) — used by the Contacts dropdown too. */
function pipeline_dripCampaignNames_() {
  var cfg = drip_cfg_(), lib = drip_lib_();
  return Object.keys(lib).filter(function (c) { return !(cfg[c] && cfg[c].hidden); });
}

/* Create a new campaign: Gemini writes 12 emails in DK's voice from your description. */
function pipeline_dripCreateCampaign(name, description) {
  try {
    name = String(name || '').trim().slice(0, 60);
    if (!name) return { ok: false, error: 'Give the campaign a name.' };
    if (drip_lib_()[name]) return { ok: false, error: 'A campaign with that name already exists.' };
    var key = PropertiesService.getScriptProperties().getProperty('GEMINI_KEY');
    if (!key) return { ok: false, error: 'No GEMINI_KEY in Script Properties.' };
    var sys = 'You write email drip campaigns for Daniel Kim (DK), Director at ASAP Funding, a real-estate financing brokerage. Voice rules, from his real sent emails: plain English with industry terms (DSCR, LTV, ARV, FICO) used naturally; short sentences; warm but businesslike; NO corporate fluff (never "I hope this finds you well", "Best regards", "do not hesitate"); NO exclamation points; contractions fine; em-dashes for clarifications; closers like "Thoughts?", "Let me know if you have any questions.", "Either way, we have a path for you." Never name any lender \u2014 the company is always just ASAP Funding.';
    var usr = 'Write EXACTLY 12 drip emails for this campaign.\nCampaign name: ' + name + '\nAudience / purpose, in DK\'s words: ' + String(description || '').slice(0, 2000) +
      '\n\nRules for every email: greet with "Hello {FIRST}," on email 1 (cold first touch) and "Hi {FIRST}," on the rest; {FIRST} is a merge tag \u2014 keep it verbatim; 3 short paragraphs: (1) one useful idea, (2) a concrete example with realistic specific numbers showing how ASAP Funding\'s approach made the difference, (3) a reply-based call to action; 90-150 words each; email 12 is a light follow-up/check-in; do NOT include a signature or disclaimer (added automatically).\n\nRespond with ONLY a JSON array of exactly 12 objects: [{"s":"subject","b":"body with \\n\\n between paragraphs"}] \u2014 no markdown, no commentary.';
    var payload = JSON.stringify({
      system_instruction: { parts: [{ text: sys }] },
      contents: [{ parts: [{ text: usr }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.6, maxOutputTokens: 8192 }
    });
    var resp = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' +
      (PropertiesService.getScriptProperties().getProperty('GEMINI_MODEL') || 'gemini-2.5-flash') + ':generateContent',
      { method: 'post', contentType: 'application/json', muteHttpExceptions: true, headers: { 'x-goog-api-key': key }, payload: payload });
    if (resp.getResponseCode() !== 200) return { ok: false, error: 'AI error (' + resp.getResponseCode() + ').' };
    var txt = '';
    try { txt = JSON.parse(resp.getContentText()).candidates[0].content.parts[0].text; } catch (e) { return { ok: false, error: 'AI returned an unreadable response.' }; }
    var arr = null;
    try { arr = JSON.parse(String(txt).replace(/^```json|```$/g, '').trim()); } catch (e) { return { ok: false, error: 'AI response was not valid JSON \u2014 try again.' }; }
    if (!arr || !arr.length || arr.length < 12) return { ok: false, error: 'AI returned ' + (arr ? arr.length : 0) + ' emails instead of 12 \u2014 try again.' };
    var sh = drip_customSheet_();
    for (var i = 0; i < 12; i++) sh.appendRow([name, i, String(arr[i].s || '').slice(0, 200), String(arr[i].b || '').slice(0, 6000)]);
    DRIP_LIB_CACHE = null;
    drip_cfgSheet_();                                  // seeds the config row (active, 30 days, 9am, weekdays)
    return { ok: true, name: name };
  } catch (err) { return { ok: false, error: String(err) }; }
}

/* Delete a campaign: custom = removed entirely; built-in = hidden (recoverable by clearing
   the Hidden cell in CRM_CampaignCfg). Contacts still assigned simply stop receiving sends. */
function pipeline_dripDeleteCampaign(name) {
  try {
    name = String(name || '').trim();
    var isCustom = !DRIP_LIBRARY[name];
    var sh = drip_cfgSheet_();
    var H = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    if (H.indexOf('Hidden') < 0) { sh.getRange(1, sh.getLastColumn() + 1).setValue('Hidden').setFontWeight('bold'); H.push('Hidden'); }
    var vals = sh.getDataRange().getValues();
    for (var r = vals.length - 1; r >= 1; r--) {
      if (String(vals[r][0]) === name) {
        if (isCustom) sh.deleteRow(r + 1);
        else sh.getRange(r + 1, H.indexOf('Hidden') + 1).setValue('Y');
      }
    }
    if (isCustom) {
      var cs = drip_customSheet_(), cv = cs.getDataRange().getValues();
      for (var r2 = cv.length - 1; r2 >= 1; r2--) { if (String(cv[r2][0]) === name) cs.deleteRow(r2 + 1); }
    }
    DRIP_LIB_CACHE = null;
    return { ok: true };
  } catch (err) { return { ok: false, error: String(err) }; }
}