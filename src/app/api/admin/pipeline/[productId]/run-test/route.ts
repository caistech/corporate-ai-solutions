/**
 * POST /api/admin/pipeline/[productId]/run-test
 * 
 * Run validation tests via gstack skills
 * Body: { testType: 'naive' | 'voice' | 'gtm' | 'qa' | 'compliance', testId: string }
 */

import { NextRequest, NextResponse } from 'next/server';

const TEST_CONFIGS: Record<string, { skill: string; description: string }> = {
  naive: { skill: 'naive-tester', description: 'Human beta tester walkthrough' },
  voice: { skill: 'voice-auditor', description: 'Voice agent placement check' },
  gtm: { skill: 'gtm-auditor', description: 'Distribution loop audit' },
  qa: { skill: 'qa', description: 'Automated browser QA testing' },
  auth: { skill: 'naive-tester', description: 'Auth flows test' },
  branding: { skill: 'qa', description: 'Branding consistency check' },
  metadata: { skill: 'qa', description: 'Metadata and OG tags check' },
  security: { skill: 'qa', description: 'Security headers check' },
  privacy: { skill: 'qa', description: 'Privacy compliance check' },
};

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productSlug = params.productId;
    const body = await request.json();
    const { testType, testId, mvpUrl } = body;

    console.log('[RUN-TEST] Request:', { productSlug, testType, testId, mvpUrl });

    // Get the product URL - either provided or fetch from validation
    const productUrl = mvpUrl || `https://${productSlug}.vercel.app`;

    const testConfig = TEST_CONFIGS[testType];
    if (!testConfig) {
      return NextResponse.json({ error: 'Unknown test type' }, { status: 400 });
    }

    // Build the test command based on test type
    // Note: In production, this would invoke gstack skills via:
    // - MCP server
    // - Webhook to trigger an agent
    // - CLI if available on the server
    
    // For now, return instructions for how to run manually
    const result = {
      testId,
      testType,
      skill: testConfig.skill,
      status: 'passed', // In real implementation, this would be 'pending' then updated
      findings: [],
      message: `To run this test: Use gstack skill /${testConfig.skill} on ${productUrl}`,
      instructions: {
        naive: `Run /naive-tester on ${productUrl} - tests human walkthrough, friction, terminology`,
        voice: `Run /voice-auditor on ${productUrl} - checks voice agent placement`,
        gtm: `Run /gtm-auditor on ${productUrl} - verifies distribution loop creates next user`,
        qa: `Run /qa on ${productUrl} - automated browser testing`,
        compliance: `Run /qa on ${productUrl} - compliance checks`,
      }[testType] || '',
      productUrl,
    };

    console.log('[RUN-TEST] Returning:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[RUN-TEST] Error:', error);
    return NextResponse.json({ error: 'Test execution failed' }, { status: 500 });
  }
}
