import ReactMarkdown from 'react-markdown'
import { METHODOLOGY_DOC } from '@/content/methodology-doc'

// The doc is bundled at build time (scripts/gen-methodology-doc.mjs) — NOT read from the
// filesystem at runtime, because the canonical source lives in the sibling cais-shared-services
// repo which is not present in the Vercel deployment. Reading it at runtime errored in prod.

export default function MethodologyPage() {
  const content = METHODOLOGY_DOC?.trim()

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Methodology</h1>
          <p className="text-gray-400">
            The canonical product-validation factory methodology — what each pipeline stage
            and gate means, so every card is judged the same way. Reference it before making a
            go / no-go call.
          </p>
        </div>

        {content ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4">
            <p className="text-amber-200">
              The methodology document hasn’t been bundled for this deployment yet. Run{' '}
              <code className="text-sm">npm run gen:methodology</code> and redeploy.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
