import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="font-mono text-accent text-sm mb-4">404</div>
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-gray-light mb-8">
          Looks like this page doesn&apos;t exist. Maybe the platform hasn&apos;t been built yet?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/">Back to Home</Button>
          <Button href="/services" variant="orange">
            Got a Problem? Let&apos;s Build It
          </Button>
        </div>
      </div>
    </div>
  )
}
