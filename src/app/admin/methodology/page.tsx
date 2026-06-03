import fs from 'fs'
import path from 'path'
import ReactMarkdown from 'react-markdown'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

async function getMethodologyDoc() {
  const docPath = path.join(
    process.cwd(),
    '..',
    'cais-shared-services',
    'product-factory',
    'PRODUCT_FACTORY_METHODOLOGY.md'
  )
  
  try {
    return fs.readFileSync(docPath, 'utf-8')
  } catch {
    return null
  }
}

export default async function MethodologyPage() {
  const content = await getMethodologyDoc()

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-4">Methodology</h1>
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
            <p className="text-red-200">
              Could not load the methodology document. Please ensure the file exists at:
              <code className="block mt-2 text-sm">cais-shared-services/product-factory/PRODUCT_FACTORY_METHODOLOGY.md</code>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Methodology</h1>
          <p className="text-gray-400">
            Canonical source of truth for the product validation factory
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Source: cais-shared-services/product-factory/PRODUCT_FACTORY_METHODOLOGY.md
          </p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
