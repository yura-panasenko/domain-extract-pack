# Domain Extraction Coda Pack

A robust Coda Pack that accurately extracts registered domains from email addresses and hostnames using the official [Public Suffix List](https://publicsuffix.org/) (PSL) - the same standard used by Firefox, Chrome, and other major web browsers.

## Why This Pack?

Simple regex-based domain extraction often produces incorrect results:

- `billing@email.acmecompany.com` → incorrectly returns `email.acmecompany.com` instead of `acmecompany.com`
- `support@techcorp.co.uk` → incorrectly returns `co.uk` instead of `techcorp.co.uk`
- `user@mail.business.com.au` → incorrectly returns `com.au` instead of `business.com.au`

This Pack solves these problems by using the Public Suffix List, which correctly handles:

- ✅ Multi-part public suffixes (.co.uk, .com.au, .co.jp)
- ✅ Wildcard rules and exception rules
- ✅ Arbitrary subdomains
- ✅ Browser-grade accuracy
- ✅ Optimized for performance with intelligent caching

## Use Cases

**Data Integration & Matching**
- Match customer records from different systems (CRM, billing, support tickets) using consistent domain identification
- Reconcile vendor and client data across platforms despite different email subdomains
- Deduplicate contact lists by identifying records from the same organization

**Data Analysis & Reporting**
- Group survey responses, form submissions, or web analytics by organization
- Aggregate download statistics or user activity by domain
- Analyze email campaign performance by registering organization

**Search & Discovery**
- Enable domain-based search across document repositories
- Build browsing history organizers grouped by registered domain
- Create smart filters and sorting for email, downloads, or bookmarks

**Security & Compliance**
- Identify which domains are setting cookies in your application
- Validate email domains before processing user registrations
- Audit data access patterns by organization domain

**Content Management**
- Sort and organize resources by source domain
- Highlight the actual organization in URL displays
- Group related websites and subdomains in navigation

## Performance Best Practices

### Optimized Formula for Large Tables (1000+ rows)

For maximum performance, use a hybrid approach that handles simple domains directly and only calls the Pack for complex cases:

```
If(
  thisRow.[Email].Split("@").Last().Split(".").Count() = 2,
  thisRow.[Email].Split("@").Last(),
  GetRegisteredDomain(thisRow.[Email])
)
```

**Performance:** ~10x faster for typical datasets (1000 rows: 9 min → <1 min)

- Simple domains (example.com) → Instant, no Pack call
- Complex domains (example.co.uk, subdomain.example.com) → Pack with full accuracy
- Pack results are cached for even faster refreshes

See [EXAMPLES.md](EXAMPLES.md#performance-optimization-for-large-tables) for detailed explanation.

## Formulas

### GetRegisteredDomain()

Extracts the registered domain (eTLD+1) from an email address or hostname.

**Syntax:**
```
GetRegisteredDomain(emailOrHostname)
```

**Examples:**
```
GetRegisteredDomain("john@billing.acmecompany.com")
→ "acmecompany.com"

GetRegisteredDomain("support@subdomain.techcorp.co.uk")
→ "techcorp.co.uk"

GetRegisteredDomain("user@mail.business.com.au")
→ "business.com.au"
```

### GetDomainParts()

Returns detailed breakdown of a domain's structure.

**Syntax:**
```
GetDomainParts(emailOrHostname)
```

**Returns an object with:**
- `registeredDomain`: The registered domain (eTLD+1)
- `subdomain`: The subdomain portion (if any)
- `publicSuffix`: The public suffix (effective TLD)
- `topLevelDomain`: The top-level domain
- `domainWithoutSuffix`: The domain label without the public suffix
- `isValid`: Whether the domain is valid
- `isICANN`: Whether the public suffix is ICANN-managed

**Example:**
```
GetDomainParts("support@billing.techcorp.com")
→ {
    registeredDomain: "techcorp.com",
    subdomain: "billing",
    publicSuffix: "com",
    ...
  }
```

### IsValidDomain()

Checks if an email or hostname contains a valid registered domain.

**Syntax:**
```
IsValidDomain(emailOrHostname)
```

**Examples:**
```
IsValidDomain("user@acmecompany.com")
→ true

IsValidDomain("invalid..domain")
→ false

IsValidDomain("test@localhost")
→ false
```

### GetRegisteredDomains()

Extracts registered domains from multiple emails at once.

**Syntax:**
```
GetRegisteredDomains(emailsOrHostnames, [uniqueOnly])
```

**Parameters:**
- `emailsOrHostnames`: Array of email addresses or hostnames
- `uniqueOnly`: (Optional) Return only unique domains. Default: true

**Example:**
```
GetRegisteredDomains([
  "user@acmecompany.com",
  "support@mail.acmecompany.com",
  "admin@techcorp.co.uk"
], true)
→ ["acmecompany.com", "techcorp.co.uk"]
```

### GetPublicSuffix()

Extracts just the public suffix (effective TLD) from a hostname or email.

**Syntax:**
```
GetPublicSuffix(emailOrHostname)
```

**Examples:**
```
GetPublicSuffix("user@acmecompany.com")
→ "com"

GetPublicSuffix("support@techcorp.co.uk")
→ "co.uk"

GetPublicSuffix("admin@business.com.au")
→ "com.au"
```

## Installation

This Pack can be installed from the Coda Pack gallery or built locally.

## Development

### Prerequisites

- Node.js and npm installed
- Coda Pack SDK

### Setup

```bash
# Navigate to the project directory
cd "Domain Extract Pack"

# Install dependencies
npm install

# Test formulas locally
npx coda execute pack.ts GetRegisteredDomain "user@example.com"
```

### Testing

Test the Pack formulas locally:

```bash
# Test main formula
npx coda execute pack.ts GetRegisteredDomain "john@billing.acmecompany.com"

# Test with multi-part TLD
npx coda execute pack.ts GetRegisteredDomain "support@techcorp.co.uk"

# Test domain parts
npx coda execute pack.ts GetDomainParts "support@billing.techcorp.com"

# Test validation
npx coda execute pack.ts IsValidDomain "user@acmecompany.com"
```

### Building & Deployment

```bash
# Build the Pack
npx coda build pack.ts

# Upload to Coda (requires authentication)
npx coda upload pack.ts
```

## Technical Details

- **Public Suffix List**: Uses the `tldts` npm package - an optimized implementation of the Mozilla Public Suffix List
- **Performance**: Intelligent caching with 1-hour TTL for fast repeated lookups
- **Standards Compliant**: Follows the same rules used by web browsers for domain parsing
- **No Authentication Required**: All formulas work without any API keys or authentication
- **Efficient**: Lightweight with minimal dependencies and optimized data structures

## About the Public Suffix List

The Public Suffix List is a cross-vendor initiative maintained by Mozilla to provide an accurate list of domain name suffixes. Major users include:

- **Web Browsers**: Firefox, Chrome, Opera, and Internet Explorer use it for cookie security, domain highlighting, and URL parsing
- **Development Tools**: Qt framework, Crawler-Commons, and numerous language libraries
- **Security Standards**: DMARC, CAB Forum requirements, and HTML5 specifications reference the PSL
- **Services**: Let's Encrypt for rate limiting, Cloudflare for account management, and Tranco for security research

Learn more at [publicsuffix.org](https://publicsuffix.org/)

## License & Legal

**MIT License** - see [LICENSE](LICENSE) file for details.

**Key protections:**
- Free to use, modify, and distribute
- No warranty or liability
- Must include copyright notice in copies

**Additional Information:**
- [Terms of Service](TERMS_OF_SERVICE.md) - Usage terms and disclaimers
- [Privacy Policy](PRIVACY_POLICY.md) - Data handling practices (we don't collect any data)

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

For issues or questions:
- **Bug reports**: Open an issue on [GitHub](https://github.com/yura-panasenko/domain-extract-pack/issues)
- **Feature requests**: Submit via GitHub issues
- **Pack usage**: Refer to the Coda Pack documentation

## Disclaimer

This Pack is provided "as is" without warranty of any kind. While we use the authoritative Public Suffix List for accuracy, results should be verified for critical business decisions. See the [LICENSE](LICENSE) file for full legal terms.
