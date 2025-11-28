import * as coda from "@codahq/packs-sdk";
import { parse } from "tldts";

export const pack = coda.newPack();

// Pack metadata
pack.addNetworkDomain("publicsuffix.org");

// Helper function to extract and normalize hostname
function extractHostname(emailOrHostname: string): string {
  let hostname = emailOrHostname.trim();

  // Extract hostname from email if @ symbol is present
  if (hostname.includes("@")) {
    const parts = hostname.split("@");
    hostname = parts[parts.length - 1];
  }

  // Remove protocol if present
  hostname = hostname.replace(/^https?:\/\//, "");

  // Remove path, query string, or fragment if present
  hostname = hostname.split("/")[0].split("?")[0].split("#")[0];

  // Remove port if present
  hostname = hostname.split(":")[0];

  // Convert to lowercase for consistency
  return hostname.toLowerCase().trim();
}

// Main formula: Extract registered domain from email or hostname
pack.addFormula({
  name: "GetRegisteredDomain",
  description: "Extracts the registered domain (eTLD+1) from an email address or hostname using the Public Suffix List. " +
    "This accurately handles multi-part domains (like .co.uk), subdomains, and special cases.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "emailOrHostname",
      description: "An email address or hostname to extract the registered domain from.",
    }),
  ],
  resultType: coda.ValueType.String,
  examples: [
    { params: ["john@billing.acmecompany.com"], result: "acmecompany.com" },
    { params: ["support@subdomain.techcorp.co.uk"], result: "techcorp.co.uk" },
    { params: ["user@mail.business.com.au"], result: "business.com.au" },
    { params: ["admin@shop.example.com"], result: "example.com" },
  ],
  cacheTtlSecs: 3600, // Cache results for 1 hour
  execute: async function ([emailOrHostname]) {
    if (!emailOrHostname) {
      throw new coda.UserVisibleError("Email or hostname is required");
    }

    const hostname = extractHostname(emailOrHostname);

    if (!hostname) {
      throw new coda.UserVisibleError("Could not extract valid hostname from input");
    }

    // Use tldts to parse the domain (much faster than psl)
    const parsed = parse(hostname);

    if (!parsed.isIcann && !parsed.isPrivate) {
      throw new coda.UserVisibleError(`Invalid domain: ${hostname}`);
    }

    // Return the registered domain (domain property includes eTLD+1)
    if (!parsed.domain) {
      throw new coda.UserVisibleError(`Could not determine registered domain for: ${hostname}`);
    }

    return parsed.domain;
  },
});

// Helper formula: Get domain parts breakdown
pack.addFormula({
  name: "GetDomainParts",
  description: "Returns detailed information about a domain's structure, including the registered domain, " +
    "subdomain, public suffix, and TLD. Useful for detailed domain analysis.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "emailOrHostname",
      description: "An email address or hostname to analyze.",
    }),
  ],
  resultType: coda.ValueType.Object,
  schema: coda.makeObjectSchema({
    properties: {
      input: { type: coda.ValueType.String, description: "The original input value" },
      hostname: { type: coda.ValueType.String, description: "The extracted hostname" },
      registeredDomain: { type: coda.ValueType.String, description: "The registered domain (eTLD+1)" },
      subdomain: { type: coda.ValueType.String, description: "The subdomain portion (if any)" },
      publicSuffix: { type: coda.ValueType.String, description: "The public suffix (effective TLD)" },
      topLevelDomain: { type: coda.ValueType.String, description: "The top-level domain" },
      domainWithoutSuffix: { type: coda.ValueType.String, description: "The domain label without the public suffix" },
      isValid: { type: coda.ValueType.Boolean, description: "Whether the domain is valid" },
      isICANN: { type: coda.ValueType.Boolean, description: "Whether the public suffix is ICANN-managed" },
    },
    displayProperty: "registeredDomain",
  }),
  examples: [
    {
      params: ["support@billing.techcorp.com"],
      result: {
        input: "support@billing.techcorp.com",
        hostname: "billing.techcorp.com",
        registeredDomain: "techcorp.com",
        subdomain: "billing",
        publicSuffix: "com",
        topLevelDomain: "com",
        domainWithoutSuffix: "techcorp",
        isValid: true,
        isICANN: true,
      },
    },
  ],
  cacheTtlSecs: 3600, // Cache results for 1 hour
  execute: async function ([emailOrHostname]) {
    if (!emailOrHostname) {
      throw new coda.UserVisibleError("Email or hostname is required");
    }

    const input = emailOrHostname.trim();
    const hostname = extractHostname(emailOrHostname);

    if (!hostname) {
      throw new coda.UserVisibleError("Could not extract valid hostname from input");
    }

    // Use tldts to parse the domain
    const parsed = parse(hostname);

    return {
      input: input,
      hostname: hostname,
      registeredDomain: parsed.domain || "",
      subdomain: parsed.subdomain || "",
      publicSuffix: parsed.publicSuffix || "",
      topLevelDomain: parsed.publicSuffix?.split(".").pop() || "",
      domainWithoutSuffix: parsed.domainWithoutSuffix || "",
      isValid: parsed.isIcann || parsed.isPrivate,
      isICANN: parsed.isIcann || false,
    };
  },
});

// Helper formula: Check if domain is valid
pack.addFormula({
  name: "IsValidDomain",
  description: "Checks whether a hostname or email address contains a valid, registered domain according to the Public Suffix List.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "emailOrHostname",
      description: "An email address or hostname to validate.",
    }),
  ],
  resultType: coda.ValueType.Boolean,
  examples: [
    { params: ["user@acmecompany.com"], result: true },
    { params: ["invalid..domain"], result: false },
    { params: ["test@localhost"], result: false },
  ],
  cacheTtlSecs: 3600, // Cache results for 1 hour
  execute: async function ([emailOrHostname]) {
    if (!emailOrHostname) {
      return false;
    }

    try {
      const hostname = extractHostname(emailOrHostname);

      if (!hostname) {
        return false;
      }

      // Use tldts to parse the domain
      const parsed = parse(hostname);

      // A valid domain should have a domain property and be either ICANN or private
      return (parsed.isIcann || parsed.isPrivate) && !!parsed.domain;
    } catch (error) {
      return false;
    }
  },
});

// Batch formula: Extract domains from a list of emails
pack.addFormula({
  name: "GetRegisteredDomains",
  description: "Extracts registered domains from multiple email addresses or hostnames at once. " +
    "Returns an array of unique domains.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.StringArray,
      name: "emailsOrHostnames",
      description: "An array of email addresses or hostnames.",
    }),
    coda.makeParameter({
      type: coda.ParameterType.Boolean,
      name: "uniqueOnly",
      description: "If true, returns only unique domains (default: true).",
      optional: true,
    }),
  ],
  resultType: coda.ValueType.Array,
  items: coda.makeSchema({ type: coda.ValueType.String }),
  examples: [
    {
      params: [["user@acmecompany.com", "support@mail.acmecompany.com", "admin@techcorp.co.uk"], true],
      result: ["acmecompany.com", "techcorp.co.uk"],
    },
  ],
  cacheTtlSecs: 3600, // Cache results for 1 hour
  execute: async function ([emailsOrHostnames, uniqueOnly = true]) {
    if (!emailsOrHostnames || emailsOrHostnames.length === 0) {
      return [];
    }

    const domains: string[] = [];

    for (const item of emailsOrHostnames) {
      if (!item) continue;

      try {
        const hostname = extractHostname(item);

        if (!hostname) continue;

        // Use tldts to parse the domain
        const parsed = parse(hostname);

        if ((parsed.isIcann || parsed.isPrivate) && parsed.domain) {
          domains.push(parsed.domain);
        }
      } catch (error) {
        // Skip invalid entries
        continue;
      }
    }

    // Return unique domains if requested
    if (uniqueOnly) {
      return Array.from(new Set(domains));
    }

    return domains;
  },
});

// Helper formula: Get public suffix (effective TLD)
pack.addFormula({
  name: "GetPublicSuffix",
  description: "Extracts just the public suffix (effective TLD) from a hostname or email. " +
    "Examples: 'com', 'co.uk', 'com.au'",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "emailOrHostname",
      description: "An email address or hostname.",
    }),
  ],
  resultType: coda.ValueType.String,
  examples: [
    { params: ["user@acmecompany.com"], result: "com" },
    { params: ["support@techcorp.co.uk"], result: "co.uk" },
    { params: ["admin@business.com.au"], result: "com.au" },
  ],
  cacheTtlSecs: 3600, // Cache results for 1 hour
  execute: async function ([emailOrHostname]) {
    if (!emailOrHostname) {
      throw new coda.UserVisibleError("Email or hostname is required");
    }

    const hostname = extractHostname(emailOrHostname);

    if (!hostname) {
      throw new coda.UserVisibleError("Could not extract valid hostname from input");
    }

    // Use tldts to parse the domain
    const parsed = parse(hostname);

    if (!parsed.isIcann && !parsed.isPrivate) {
      throw new coda.UserVisibleError(`Invalid domain: ${hostname}`);
    }

    if (!parsed.publicSuffix) {
      throw new coda.UserVisibleError(`Could not determine public suffix for: ${hostname}`);
    }

    return parsed.publicSuffix;
  },
});
