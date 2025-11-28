# Usage Examples

This document provides practical examples of how to use the Domain Extraction Pack formulas in your Coda docs.

## Performance Optimization for Large Tables

⚡ **Best Practice for 1000+ rows:** Use a hybrid approach that handles simple domains with native Coda formulas and only calls the Pack for complex cases.

### Optimized Formula for Table Columns

For maximum performance in large tables, use this formula pattern:

```
If(
  thisRow.[Email].Split("@").Last().Split(".").Count() = 2,
  thisRow.[Email].Split("@").Last(),
  GetRegisteredDomain(thisRow.[Email])
)
```

**Performance impact:**
- ✅ **Simple domains** (example.com, gmail.com) → Instant extraction, no Pack call
- ✅ **Complex domains** (example.co.uk, subdomain.example.com) → Pack with full PSL accuracy
- ✅ **Results:** ~10x faster for typical datasets (1000 rows: 9 min → <1 min)

**How it works:**
1. Counts parts after @ symbol (split by dots)
2. If exactly 2 parts (domain.tld) → Returns directly
3. If 3+ parts → Calls Pack for accurate PSL lookup
4. Pack results are cached, so refreshes are even faster

**When to use this:**
- Tables with 100+ rows
- Mix of simple (.com, .org) and complex domains (.co.uk, .com.au)
- Performance is critical

## Basic Usage

### Extract Domain from Single Email

```
GetRegisteredDomain("john.doe@billing.acmecompany.com")
→ "acmecompany.com"
```

Use this in a formula column to normalize email domains across your data.

## Real-World Scenarios

### Scenario 1: Contact List Deduplication

You have a contacts table with emails from various subdomains of the same organization.

**Formula in "Company" column:**
```
GetRegisteredDomain([Email])
```

**Result:**
| Email | Company |
|-------|---------|
| john@sales.acmecompany.com | acmecompany.com |
| jane@support.acmecompany.com | acmecompany.com |
| bob@mail.acmecompany.com | acmecompany.com |

Now you can group or filter by the actual company domain!

### Scenario 2: Survey Response Analysis

Group survey responses by organization while handling international domains.

**Formula:**
```
GetRegisteredDomain([RespondentEmail])
```

**Handles:**
- UK domains: `user@techcorp.co.uk` → `techcorp.co.uk`
- Australian domains: `admin@business.com.au` → `business.com.au`
- Japanese domains: `contact@example.co.jp` → `example.co.jp`

### Scenario 3: CRM Data Integration

Match customer records from different systems (Salesforce, HubSpot, support tickets) by normalizing domain names.

**In CRM table:**
```
GetRegisteredDomain([Contact Email])
```

**In Support Tickets table:**
```
GetRegisteredDomain([Reporter Email])
```

Now create a lookup formula to link records:
```
[CRM Table].Filter([Company Domain] = thisRow.[Ticket Domain])
```

### Scenario 4: Email Campaign Analysis

Analyze which organizations are engaging with your emails.

**Formula in Campaign Results:**
```
GetRegisteredDomains([RecipientEmails], true)
```

This extracts unique company domains from a list of recipients, perfect for:
- Tracking which organizations opened emails
- Identifying high-engagement companies
- Segmenting by organization size or industry

### Scenario 5: Data Validation

Validate user input before processing registrations or form submissions.

**Formula in validation column:**
```
IsValidDomain([UserEmail])
```

**Use in button:**
```
If(
  IsValidDomain([Email]),
  ProcessRegistration(),
  ShowError("Invalid email domain")
)
```

### Scenario 6: Domain Intelligence

Get detailed information about email domains for advanced analysis.

**Formula:**
```
GetDomainParts("support@billing.techcorp.com")
```

**Returns:**
```
{
  registeredDomain: "techcorp.com",
  subdomain: "billing",
  publicSuffix: "com",
  topLevelDomain: "com",
  domainWithoutSuffix: "techcorp",
  isValid: true,
  isICANN: true
}
```

**Use cases:**
- Separate department emails by subdomain: `[DomainParts].subdomain`
- Filter by TLD for regional analysis: `[DomainParts].publicSuffix`
- Identify the company name: `[DomainParts].domainWithoutSuffix`

### Scenario 7: Batch Processing

Process multiple domains at once from a comma-separated field or array.

**If you have a list of email addresses:**
```
GetRegisteredDomains(
  [EmailList].Split(","),
  true
)
```

**Result:**
Converts `"john@acme.com, jane@mail.acme.com, bob@techcorp.co.uk"`
into `["acme.com", "techcorp.co.uk"]`

## Advanced Patterns

### Pattern 1: Conditional Domain Extraction

Only extract domains for certain types of emails:

```
If(
  [EmailType] = "Business",
  GetRegisteredDomain([Email]),
  ""
)
```

### Pattern 2: Domain-Based Lookup

Find all records from the same organization:

```
[AllContacts].Filter(
  GetRegisteredDomain(Email) =
  GetRegisteredDomain(thisRow.Email)
)
```

### Pattern 3: Multi-System Reconciliation

Match records across different systems:

```
[System1].Filter(
  GetRegisteredDomain([System1Email]) =
  GetRegisteredDomain(thisRow.[System2Email])
).First()
```

### Pattern 4: Domain Frequency Counter

Count how many contacts you have per organization:

```
[Contacts]
  .GroupBy(GetRegisteredDomain([Email]))
  .Count()
```

## Tips & Best Practices

1. **Use in formula columns**: Set up a dedicated "Company Domain" column using `GetRegisteredDomain([Email])` for easy filtering and grouping.

2. **Combine with lookups**: Use extracted domains as keys to join tables from different sources.

3. **Validate before processing**: Always use `IsValidDomain()` before important operations to catch malformed data.

4. **Batch operations**: Use `GetRegisteredDomains()` when you need to process multiple emails at once for better performance.

5. **Cache results**: Store extracted domains in a column rather than recalculating in multiple formulas.

6. **Handle empty values**: Always check if email fields are empty before extracting:
   ```
   If(IsNotBlank([Email]), GetRegisteredDomain([Email]), "")
   ```

## Common Pitfalls

❌ **Don't assume simple string parsing works:**
```
# Wrong - fails on subdomains and multi-part TLDs
[Email].Split("@").Last()
```

✅ **Do use GetRegisteredDomain:**
```
# Correct - handles all edge cases
GetRegisteredDomain([Email])
```

❌ **Don't forget international TLDs:**
Simple regex won't correctly handle .co.uk, .com.au, .co.jp, etc.

✅ **Do rely on the PSL:**
This Pack correctly handles all public suffixes worldwide.

## Need Help?

If you encounter issues or have questions:
1. Check that your input is a valid email or hostname
2. Test with `IsValidDomain()` to verify the input
3. Use `GetDomainParts()` to see detailed parsing information
4. Refer to the README.md for detailed formula documentation
