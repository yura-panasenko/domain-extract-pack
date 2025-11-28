# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Coda Pack that extracts registered domains from email addresses and hostnames using the Public Suffix List (PSL). The Pack provides formulas for accurate domain parsing that handles multi-part TLDs (.co.uk, .com.au, etc.) and complex subdomain structures.

## Key Architecture

**Single File Structure**: The entire Pack is defined in `pack.ts` with no additional modules or complex dependencies.

**Core Dependency**: The `psl` npm package provides Public Suffix List parsing. Due to TypeScript type limitations with this library, we use `as any` type assertions when calling `psl.parse()`.

**Formula Pattern**: Each formula follows a consistent structure:
1. Extract hostname from email (if input contains `@`)
2. Clean up hostname (remove protocol, path, port, etc.)
3. Parse using PSL library
4. Return formatted result

## Development Commands

### Testing Formulas Locally

```bash
# Test main domain extraction formula
npx coda execute pack.ts GetRegisteredDomain "user@subdomain.example.com"

# Test detailed domain parts
npx coda execute pack.ts GetDomainParts "user@billing.example.co.uk"

# Test domain validation
npx coda execute pack.ts IsValidDomain "user@example.com"

# Test batch extraction
npx coda execute pack.ts GetRegisteredDomains '["user@example.com", "admin@test.co.uk"]' true

# Test public suffix extraction
npx coda execute pack.ts GetPublicSuffix "user@example.co.uk"
```

### Building and Deployment

```bash
# Build the Pack
npx coda build pack.ts

# Validate Pack structure
npx coda validate pack.ts

# Upload to Coda (requires authentication with `npx coda register`)
npx coda upload pack.ts
```

### Package Management

```bash
# Install dependencies
npm install

# Update dependencies
npm update

# Add new dependencies
npm install --save <package-name>
```

## Code Guidelines

**Type Handling**: The `psl` library has complex union types that don't play well with TypeScript. All calls to `psl.parse()` are cast to `any`:
```typescript
const parsed = psl.parse(hostname) as any;
```

**Error Handling**: Use `coda.UserVisibleError` for errors that should be shown to users. Domain parsing errors are caught and re-thrown with user-friendly messages.

**Input Normalization**: Always normalize inputs before parsing:
- Extract hostname from emails (take part after last `@`)
- Remove protocols (`https://`, `http://`)
- Remove paths, query strings, and fragments
- Remove ports (`:8080`)
- Convert to lowercase

**Examples**: All formula examples use fictional domains (acmecompany.com, techcorp.co.uk, business.com.au) to avoid referencing real organizations.

## Formula Descriptions

- **GetRegisteredDomain**: Primary formula - extracts the registered domain (eTLD+1)
- **GetDomainParts**: Detailed analysis returning an object with all domain components
- **IsValidDomain**: Boolean validator for domain checking
- **GetRegisteredDomains**: Batch processor for arrays of emails/hostnames
- **GetPublicSuffix**: Extracts just the public suffix (effective TLD)

## Important Notes

- No authentication required - all formulas are public and don't need API keys
- Network domain `publicsuffix.org` is registered but not actively used (PSL data is embedded in the `psl` package)
- The Pack follows Coda's naming conventions: use PascalCase for formula names, avoid prefixes like "Get" where unnecessary
- All formulas accept both email addresses and raw hostnames as input

## Testing New Features

When adding new formulas:
1. Add formula definition to `pack.ts`
2. Test locally with `npx coda execute`
3. Verify TypeScript compiles without errors
4. Add usage examples to README.md
5. Test with edge cases (multi-part TLDs, subdomains, invalid inputs)
