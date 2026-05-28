'use client';

/**
 * Product Research Voice Agent Component
 * 
 * Integrates @caistech/elevenlabs-convai for conversational product research refinement
 * Allows the team to:
 * - Share market research findings and get intelligent feedback
 * - Discuss user feedback in a conversational way
 * - Brainstorm feature ideas and pivots
 * - Refine product promise/positioning
 * - Log observations and insights
 * 
 * Uses the canonical voice agent from elevenlabs-convai with product-specific context.
 * Conversation history is stored in Supabase for later review and analysis.
 */

import React, { useState } from 'react';

interface ProductResearchVoiceProps {
  productId: string;
  productName: string;
  agentId?: string; // Pre-provisioned agent ID for this product
}

/**
 * TODO: Once @caistech/elevenlabs-convai is installed in this project:
 * 
 * 1. Import the React widget:
 *    import { VoiceWidget } from '@caistech/elevenlabs-convai/react';
 * 
 * 2. Add this component to ProductDetailView sidebar
 * 
 * 3. The widget handles:
 *    - Live voice input/output via ElevenLabs ConvAI
 *    - Persistent conversation memory
 *    - Tool callbacks for saving research notes
 *    - Session management (authenticated or anonymous)
 * 
 * 4. Set up webhook routes:
 *    - POST /api/convai/webhook/post-call (save completed conversations)
 *    - POST /api/convai/webhook/save-message (optional, per-message tracking)
 * 
 * 5. Provision the agent at app startup via provisionVoiceAgent()
 *    with systemPrompt customized for product research:
 *    
 *    "You are the research assistant for {productName}. Help the team process market
 *     findings, user feedback, and strategic observations. Ask clarifying questions,
 *     identify patterns, suggest validations. Keep discussion grounded in evidence."
 * 
 * 6. Configure tools for the agent:
 *    - save-research-note: persist findings to product notes
 *    - recall-past-research: retrieve previous research from this product
 *    - search-user-feedback: find relevant user feedback already captured
 */

export default function ProductResearchVoice({ productId, productName, agentId }: ProductResearchVoiceProps) {
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  if (showPlaceholder) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Conversation</h3>
        
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Voice agent for continuous product research refinement (coming soon).
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900">Will enable:</p>
            <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
              <li>Conversational research processing</li>
              <li>Brainstorming feature ideas</li>
              <li>Refining product positioning</li>
              <li>Persistent conversation memory</li>
              <li>Export research transcripts</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded p-3 text-xs text-gray-600">
            <p className="font-medium mb-2">Implementation:</p>
            <p>Uses <code className="bg-gray-200 px-1 rounded">@caistech/elevenlabs-convai</code> React widget</p>
          </div>
        </div>
      </div>
    );
  }

  // Once @caistech/elevenlabs-convai is installed, replace placeholder with:
  // 
  // return (
  //   <div className="bg-white rounded-lg shadow p-6">
  //     <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Conversation</h3>
  //     <VoiceWidget
  //       agentId={agentId}
  //       sessionContext={{
  //         productId,
  //         productName,
  //         contextType: 'product-research',
  //       }}
  //     />
  //   </div>
  // );

  return null;
}
