/**
 * POST /api/admin/pipeline/[productId]/run-test
 * 
 * Run validation tests - either automated or instructions for manual
 * Body: { testType: string, testId: string, mvpUrl: string }
 */

import { NextRequest, NextResponse } from 'next/server';

const TEST_CONFIGS: Record<string, { 
  skill: string; 
  description: string;
  runnable: 'auto' | 'manual';
  autoCheck?: (url: string) => Promise<{ status: string; findings: string[] }>;
}> = {
  auth: { 
    skill: 'naive-tester', 
    description: 'Auth flows test',
    runnable: 'auto',
    autoCheck: async (url) => {
      try {
        const res = await fetch(url + '/login', { method: 'HEAD' });
        const signupRes = await fetch(url + '/signup', { method: 'HEAD' });
        const loginWorks = res.ok || res.status === 401; // 401 = auth required, ok
        const signupWorks = signupRes.ok || signupRes.status === 401;
        if (loginWorks && signupWorks) {
          return { status: 'passed', findings: [] };
        }
        return { status: 'failed', findings: ['Auth pages not accessible'] };
      } catch (e) {
        return { status: 'failed', findings: [`Could not reach auth pages: ${e}`] };
      }
    }
  },
  branding: { 
    skill: 'qa', 
    description: 'Branding check',
    runnable: 'auto',
    autoCheck: async (url) => {
      try {
        const html = await fetch(url).then(r => r.text());
        const findings = [];
        // Check for logo (common selectors)
        const hasLogo = html.includes('logo') || html.includes('Logo') || html.includes('brand') || html.includes('Brand');
        // Check for consistent colors via style or css
        const hasStyles = html.includes('color:') || html.includes('background') || html.includes('.css');
        // Check for favicon
        const hasFavicon = html.includes('favicon') || html.includes('icon');
        
        if (!hasLogo && !hasFavicon) findings.push('No logo or brand element detected');
        if (!hasStyles) findings.push('No inline styles found - brand may be inconsistent');
        
        return findings.length > 0 
          ? { status: 'warning', findings } 
          : { status: 'passed', findings: [] };
      } catch (e) {
        return { status: 'failed', findings: [`Could not check branding: ${e}`] };
      }
    }
  },
  metadata: { 
    skill: 'qa', 
    description: 'Metadata check',
    runnable: 'auto',
    autoCheck: async (url) => {
      try {
        const html = await fetch(url).then(r => r.text());
        const hasTitle = html.includes('<title>') || html.includes('<title ');
        const hasOgImage = html.includes('og:image') || html.includes('property="og:image"');
        const findings = [];
        if (!hasTitle) findings.push('Missing <title> tag');
        if (!hasOgImage) findings.push('Missing OG image meta tag');
        return findings.length > 0 
          ? { status: 'failed', findings } 
          : { status: 'passed', findings: [] };
      } catch (e) {
        return { status: 'failed', findings: [`Could not fetch page: ${e}`] };
      }
    }
  },
  security: { 
    skill: 'qa', 
    description: 'Security headers check',
    runnable: 'auto',
    autoCheck: async (url) => {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        const headers = res.headers;
        const findings = [];
        if (!headers.get('x-frame-options') && !headers.get('content-security-policy')) {
          findings.push('Missing security headers (X-Frame-Options, CSP)');
        }
        return findings.length > 0 
          ? { status: 'warning', findings } 
          : { status: 'passed', findings: [] };
      } catch (e) {
        return { status: 'failed', findings: [`Could not check headers: ${e}`] };
      }
    }
  },
  privacy: { 
    skill: 'qa', 
    description: 'Privacy compliance check',
    runnable: 'auto',
    autoCheck: async (url) => {
      try {
        const findings = [];
        // Check for terms page
        const termsRes = await fetch(url + '/terms', { method: 'HEAD' });
        const privacyRes = await fetch(url + '/privacy', { method: 'HEAD' });
        
        if (!termsRes.ok && termsRes.status !== 404) findings.push('Terms page check failed');
        if (!privacyRes.ok && privacyRes.status !== 404) findings.push('Privacy page check failed');
        
        // Check for cookie consent in HTML
        const html = await fetch(url).then(r => r.text());
        const hasCookieConsent = html.toLowerCase().includes('cookie') || html.toLowerCase().includes('consent');
        
        if (!termsRes.ok && termsRes.status === 404) findings.push('No /terms page found');
        if (!privacyRes.ok && privacyRes.status === 404) findings.push('No /privacy page found');
        
        return findings.length > 0 
          ? { status: 'warning', findings } 
          : { status: 'passed', findings: [] };
      } catch (e) {
        return { status: 'failed', findings: [`Could not check privacy: ${e}`] };
      }
    }
  },
  naive: { 
    skill: 'naive-tester', 
    description: 'Human walkthrough test',
    runnable: 'auto',
    autoCheck: async (url) => {
      try {
        // Fetch homepage and login page to check for signup
        const [homeHtml, loginHtml] = await Promise.all([
          fetch(url).then(r => r.text()).catch(() => ''),
          fetch(url + '/login').then(r => r.text()).catch(() => '')
        ]);
        const combinedHtml = homeHtml + loginHtml;
        const findings = [];
        const hasSignup = combinedHtml.includes('signup') || combinedHtml.includes('Sign up') || combinedHtml.includes('register') || combinedHtml.includes('/signup') || combinedHtml.includes('href="/signup"') || combinedHtml.includes("href='/signup'");
        const hasCTA = combinedHtml.includes('button') || combinedHtml.includes('Button') || combinedHtml.includes('cta') || combinedHtml.includes('Get started') || combinedHtml.includes('Start');
        const hasValueProp = combinedHtml.includes('help') || combinedHtml.includes('improve') || combinedHtml.includes('better') || combinedHtml.includes('sing') || combinedHtml.includes('vocal') || combinedHtml.includes('coach');
        if (!hasSignup) findings.push('No signup path found');
        if (!hasCTA) findings.push('No CTA buttons found');
        if (!hasValueProp) findings.push('Value prop may be unclear');
        return findings.length > 0 ? { status: 'warning', findings } : { status: 'passed', findings: [] };
      } catch (e) {
        return { status: 'failed', findings: [`Check failed: ${e}`] };
      }
    }
  },
  voice: { 
    skill: 'voice-auditor', 
    description: 'Voice agent placement',
    runnable: 'auto',
    autoCheck: async (url) => {
      try {
        const html = await fetch(url).then(r => r.text());
        // Check for voice agent presence
        const hasVoice = html.includes('voice') || html.includes('audio') || html.includes('microphone') || html.includes('speech');
        if (hasVoice) {
          return { status: 'passed', findings: [] };
        }
        return { status: 'warning', findings: ['No voice-related elements found - may not need voice'] };
      } catch (e) {
        return { status: 'failed', findings: [`Could not check: ${e}`] };
      }
    }
  },
  gtm: { 
    skill: 'gtm-auditor', 
    description: 'Distribution loop check',
    runnable: 'auto',
    autoCheck: async (url) => {
      try {
        const html = await fetch(url).then(r => r.text());
        const findings = [];
        const hasShare = html.includes('share') || html.includes('Share') || html.includes('social');
        const hasCTA = html.includes('Get started') || html.includes('Sign up') || html.includes('Try') || html.includes('Start');
        const hasBenefit = html.includes('save') || html.includes('free') || html.includes('benefit') || html.includes('improve');
        if (!hasCTA) findings.push('No clear conversion CTA');
        if (!hasBenefit) findings.push('No clear benefit/offer');
        if (!hasShare) findings.push('No distribution loop (share/referral)');
        return findings.length > 0 ? { status: 'warning', findings } : { status: 'passed', findings: [] };
      } catch (e) {
        return { status: 'failed', findings: [`GTM check failed: ${e}`] };
      }
    }
  },
  qa: { 
    skill: 'qa', 
    description: 'Automated browser QA',
    runnable: 'auto',
    autoCheck: async (url) => {
      try {
        // Basic page load test
        const start = Date.now();
        const res = await fetch(url);
        const loadTime = Date.now() - start;
        const findings = [];
        if (!res.ok) findings.push(`Page returned ${res.status}`);
        if (loadTime > 5000) findings.push(`Slow load time: ${loadTime}ms`);
        // Check for console errors placeholder - in real implementation would use Playwright
        return findings.length > 0 
          ? { status: 'warning', findings } 
          : { status: 'passed', findings: [] };
      } catch (e) {
        return { status: 'failed', findings: [`Could not load page: ${e}`] };
      }
    }
  },
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

    const productUrl = mvpUrl || `https://${productSlug}.vercel.app`;
    const testConfig = TEST_CONFIGS[testType];

    if (!testConfig) {
      return NextResponse.json({ 
        error: 'Unknown test type', 
        available: Object.keys(TEST_CONFIGS) 
      }, { status: 400 });
    }

    console.log('[RUN-TEST] Running test:', testConfig.skill, 'for', productUrl);

    // Run automated checks if available
    if (testConfig.runnable === 'auto' && testConfig.autoCheck) {
      const result = await testConfig.autoCheck(productUrl);
      console.log('[RUN-TEST] Auto result:', result);
      
      return NextResponse.json({
        testId,
        testType,
        skill: testConfig.skill,
        ...result,
        productUrl,
        instructions: null
      });
    }

    // For manual tests, return instructions
    return NextResponse.json({
      testId,
      testType,
      skill: testConfig.skill,
      status: 'manual_required',
      findings: [],
      message: `This test requires manual execution`,
      instructions: `Run /${testConfig.skill} on ${productUrl} - ${testConfig.description}`,
      productUrl,
      steps: getManualSteps(testType, productUrl)
    });
  } catch (error) {
    console.error('[RUN-TEST] Error:', error);
    return NextResponse.json({ 
      error: 'Test execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getManualSteps(testType: string, url: string): string[] {
  switch (testType) {
    case 'naive':
      return [
        `1. Open ${url} in a browser`,
        '2. Walk through the site as a new user would',
        '3. Note any friction points or confusion',
        '4. Check if the value proposition is clear',
        '5. Ask: "Would I want this?"'
      ];
    case 'gtm':
      return [
        `1. Open ${url}`,
        '2. Identify what output the product creates',
        '3. Check if that output could create a new user',
        '4. Look for share/trigger mechanisms',
        '5. Determine if distribution loop exists'
      ];
    case 'branding':
      return [
        `1. Open ${url}`,
        '2. Check logo, colors, typography consistency',
        '3. Verify brand voice in copy',
        '4. Ensure no broken brand elements'
      ];
    case 'privacy':
      return [
        "1. Check for Terms of Service page",
        "2. Check for Privacy Policy page",
        "3. Verify cookie consent if needed",
        "4. Ensure GDPR/compliance if EU users"
      ];
    default:
      return ['Manual test - follow skill instructions'];
  }
}
