---
name: Public card listing privacy
description: Shopper card responses must expose marketplace metadata without delivery credentials or personal billing details.
---

Public card listings must return only marketplace fields such as BIN, brand, country, base, price, and validation rate. Raw card numbers, CVVs, expiry values, pasted delivery content, and personal location/contact fields belong only in privileged operational views.

**Why:** The marketplace UI does not need sensitive fulfillment data, and sending it to every shopper increases the impact of an authenticated browser compromise.

**How to apply:** Keep the public `/api/cards` projection sanitized when adding filters or new display fields; preserve richer data only for explicitly authorized admin/worker workflows.