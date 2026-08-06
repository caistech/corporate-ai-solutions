import type { AgentReadinessConfig } from "@caistech/webmcp-kit";
import { PUBLISHED_PLATFORM_COUNT, SHARED_PACKAGE_COUNT } from "@/lib/constants";

// PRODUCT_STANDARDS §11 Layer 1 (DISCOVERABLE). Drives /llms.txt, landing JSON-LD, /.well-known/agent.json.
export const agentConfig: AgentReadinessConfig = {
  "name": "Corporate AI Solutions",
  "displayName": "Corporate AI Solutions | The Factory That Builds AI Companies",
  "url": "https://corporate-ai-solutions.vercel.app",
  // Counts come from the single source in lib/constants — an agent that reads this repeats the
  // number verbatim, so it must be the same one a visitor can count on /marketplace.
  "description": `Corporate AI Solutions builds AI systems for Australian businesses on a substrate of ${SHARED_PACKAGE_COUNT} published production packages, which is why a working system takes three weeks rather than three months. Entry point is a one-week Opportunity Audit at $2,500 + GST; a three-week Deployment Sprint at $18,000 + GST puts one AI system into the client's own production environment, owned outright. Also publishes ${PUBLISHED_PLATFORM_COUNT} AI platforms that are free to self-host on your own API keys.`,
  "applicationCategory": "BusinessApplication",
  // Ordered by what a visitor (or an agent answering "who can build this for me?") needs first.
  // /engagement and /pricing were removed 2026-08-05 — both now redirect to /services, and
  // advertising a redirect to an agent wastes the one hop it will make.
  "keyPages": [
    {
      "title": "Services — audit, sprint and retainer pricing",
      "url": "/services"
    },
    {
      "title": "Clients — live commercial engagements",
      "url": "/clients"
    },
    {
      "title": "Marketplace",
      "url": "/marketplace"
    },
    {
      "title": "Solutions",
      "url": "/solutions"
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
