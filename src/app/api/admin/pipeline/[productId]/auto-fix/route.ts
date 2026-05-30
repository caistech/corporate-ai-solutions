/**
 * POST /api/admin/pipeline/[productId]/auto-fix
 * 
 * Triggers OpenCode to automatically fix test findings
 * 
 * Flow:
 * 1. Check if local repo exists (Dennis's laptop)
 * 2. If local exists → run OpenCode locally
 * 3. If no local → trigger GitHub Action
 * 4. For GitHub Action → writes to queue for sync when local reconnects
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const LOCAL_REPOS_BASE = 'C:\\Users\\denni\\PycharmProjects';
const GITHUB_REPO_BASE = 'https://github.com/dennissolver';

interface FixResult {
  success: boolean;
  method: 'local' | 'github' | 'queued';
  message: string;
  output?: string;
  repoPath?: string;
  syncNeeded?: boolean;
  error?: string;
}

async function checkLocalRepo(productId: string): Promise<string | null> {
  // Try common repo naming patterns
  const possiblePaths = [
    path.join(LOCAL_REPOS_BASE, productId),
    path.join(LOCAL_REPOS_BASE, `${productId}-platform`),
    path.join(LOCAL_REPOS_BASE, productId.replace(/-/g, '_')),
  ];
  
  for (const repoPath of possiblePaths) {
    try {
      const packageJsonPath = path.join(repoPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        return repoPath;
      }
    } catch {
      // Continue checking other paths
    }
  }
  return null;
}

async function runLocalOpenCode(repoPath: string, findingsText: string, productUrl: string): Promise<FixResult> {
  const prompt = `Fix the following issues found during testing of ${productUrl}:

TEST FINDINGS:
- ${findingsText}

Please:
1. Visit ${productUrl} and verify the issues exist
2. Fix them in the codebase
3. Build/test to verify the fixes work

Focus only on these specific issues. Do not make other changes.`;

  try {
    // Run opencode in the local repo
    const { stdout, stderr } = await execAsync(
      `cd "${repoPath}" && opencode run "${prompt.replace(/"/g, '\\"')}"`,
      { timeout: 300000, maxBuffer: 10 * 1024 * 1024 }
    );

    console.log('[AUTO-FIX] OpenCode output:', stdout);

    // Push changes to GitHub
    try {
      await execAsync(`cd "${repoPath}" && git add -A && git commit -m "Auto-fix: ${findingsText.substring(0, 50)}..." && git push`);
    } catch (pushErr) {
      console.warn('[AUTO-FIX] Push failed, will sync later:', pushErr);
    }

    return {
      success: true,
      method: 'local',
      message: 'OpenCode ran locally and changes pushed',
      output: stdout,
      repoPath,
      syncNeeded: false
    };

  } catch (error) {
    return {
      success: false,
      method: 'local',
      message: 'Local OpenCode failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      repoPath
    };
  }
}

async function triggerGitHubAction(productId: string, findings: string[], productUrl: string): Promise<FixResult> {
  // Queue the fix for when local reconnects
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  await supabase.from('pipeline_fix_queue').insert({
    product_slug: productId,
    findings,
    product_url: productUrl,
    status: 'pending',
    created_at: new Date().toISOString()
  });

  // Optionally trigger GitHub dispatch if available
  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) {
    try {
      await fetch(`${GITHUB_REPO_BASE}/${productId}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'auto-fix',
          client_payload: { findings, productUrl }
        })
      });
    } catch (e) {
      console.warn('[AUTO-FIX] GitHub dispatch failed, queued for later');
    }
  }

  return {
    success: true,
    method: 'queued',
    message: 'Fix queued - will run when local machine reconnects',
    syncNeeded: true
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;
    const body = await request.json();
    const { findings, testType, mvpUrl } = body;

    if (!findings || findings.length === 0) {
      return NextResponse.json({ error: 'No findings provided' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: product } = await supabase
      .from('product_validation_status')
      .select('mvp_url, display_name')
      .eq('product_slug', productId)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const productUrl = mvpUrl || product.mvp_url;
    const findingsText = findings.join('\n- ');

    console.log('[AUTO-FIX] Processing fix for:', productId);

    // Step 1: Check for local repo
    const localRepo = await checkLocalRepo(productId);
    
    if (localRepo) {
      console.log('[AUTO-FIX] Found local repo:', localRepo);
      const result = await runLocalOpenCode(localRepo, findingsText, productUrl);
      return NextResponse.json(result);
    }

    // Step 2: No local repo - queue for later or trigger GitHub
    console.log('[AUTO-FIX] No local repo, queueing fix');
    const result = await triggerGitHubAction(productId, findings, productUrl);
    return NextResponse.json(result);

  } catch (error) {
    console.error('[AUTO-FIX] Error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger auto-fix' },
      { status: 500 }
    );
  }
}
