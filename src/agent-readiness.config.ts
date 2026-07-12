import type { AgentReadinessConfig } from "@caistech/webmcp-kit";

// PRODUCT_STANDARDS §11 Layer 1 (DISCOVERABLE). Drives /llms.txt, landing JSON-LD, /.well-known/agent.json.
export const agentConfig: AgentReadinessConfig = {
  "name": "Corporate AI Solutions",
  "displayName": "Corporate AI Solutions | The Factory That Builds AI Companies",
  "url": "https://corporate-ai-solutions.vercel.app",
  "description": "Corporate AI Solutions is a one-founder AI studio that has built 35+ live AI platforms on a single shared substrate. The studio is the product and the portfolio is the moat.",
  "applicationCategory": "BusinessApplication",
  "keyPages": [
    {
      "title": "Marketplace",
      "url": "/marketplace"
    },
    {
      "title": "Solutions",
      "url": "/solutions"
    },
    {
      "title": "Engagement",
      "url": "/engagement"
    },
    {
      "title": "Pricing",
      "url": "/pricing"
    },
    {
      "title": "About",
      "url": "/about"
    },
    {
      "title": "Contact",
      "url": "/contact"
    }
  ],
  "provider": {
    "name": "Global Buildtech Australia Pty Ltd",
    "url": "https://corporateaisolutions.com",
    "legalId": "ABN 54 672 395 685"
  },
  "contactEmail": "dennis@corporateaisolutions.com"
};
