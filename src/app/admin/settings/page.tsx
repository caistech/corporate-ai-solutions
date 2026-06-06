import type { Metadata } from 'next'
import { createClient } from '@/lib/pipeline/supabase-server'
import { ChangePasswordForm } from '@/components/admin/ChangePasswordForm'
import { AdminSignOut } from '@/components/admin/AdminSignOut'
import { DeploymentBypassToggle } from '@/components/admin/DeploymentBypassToggle'

export const metadata: Metadata = {
  title: 'Settings',
}

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-accent">Settings</p>
        <h1 className="mb-3 text-2xl font-bold sm:text-3xl">Your account settings</h1>
        <p className="max-w-xl text-base text-gray-light">
          Manage the operator account that runs the pipeline cockpit. Change your password or sign
          out of every device here. This is the account that gates access to all outreach and API
          spend, so keep its credentials current.
        </p>
      </header>

      <div className="space-y-6">
        {/* Account */}
        <section className="rounded-lg border border-gray-border bg-gray-dark/40 p-5">
          <h2 className="mb-1 text-sm font-medium uppercase tracking-wider text-accent">Account</h2>
          <p className="mb-4 text-sm text-gray-light/70">The operator currently signed in.</p>
          <dl className="text-base">
            <dt className="text-sm uppercase tracking-wider text-gray-light/70">Email</dt>
            <dd className="mt-1 break-all text-white">{user?.email ?? 'Not signed in'}</dd>
          </dl>
        </section>

        {/* Password */}
        <section className="rounded-lg border border-gray-border bg-gray-dark/40 p-5">
          <h2 className="mb-1 text-sm font-medium uppercase tracking-wider text-accent">Password</h2>
          <p className="mb-4 text-sm text-gray-light/70">
            Set a new password. You will stay signed in on this device after the change.
          </p>
          <ChangePasswordForm />
        </section>

        {/* Sign out everywhere */}
        <section className="rounded-lg border border-gray-border bg-gray-dark/40 p-5">
          <h2 className="mb-1 text-sm font-medium uppercase tracking-wider text-accent">
            Sign out everywhere
          </h2>
          <p className="mb-4 text-sm text-gray-light/70">
            Revoke every active session across all devices and return to the login page. Use this if
            you suspect a session is open somewhere it should not be.
          </p>
          <AdminSignOut scope="global" variant="button" label="Sign out everywhere" />
        </section>

        {/* Deployment protection bypass (for headless testers) */}
        <section className="rounded-lg border border-gray-border bg-gray-dark/40 p-5">
          <h2 className="mb-1 text-sm font-medium uppercase tracking-wider text-accent">
            Deployment Protection Bypass
          </h2>
          <p className="mb-4 text-sm text-gray-light/70">
            Generates a Vercel automation-bypass secret so headless testers (naive-tester, the
            browse daemon) can reach SSO-protected preview deployments via the{' '}
            <code>x-vercel-protection-bypass</code> header. Enable it to unblock automated QA, copy
            the secret into the tester machine&rsquo;s <code>.env.local</code>, then revoke it when
            the run is done. The secret only bypasses preview viewing — it is not a deploy or admin
            credential.
          </p>
          <DeploymentBypassToggle />
        </section>

        {/* Deferred note */}
        <p className="text-sm text-gray-light/60">
          Profile and notification preferences are deferred — this is a single-operator internal
          tool, so there is no per-user profile table to manage.
        </p>
      </div>
    </div>
  )
}
