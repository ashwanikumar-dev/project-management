import { useClerk, useUser } from "@clerk/react";
import { LogOut, Plus } from "lucide-react";

export default function NoWorkspace() {
  const { signOut, openCreateOrganization } = useClerk();
  const { user } = useUser();

  const email = user?.primaryEmailAddress?.emailAddress;
  const avatar =
    user?.firstName?.[0] ?? email?.[0]?.toUpperCase() ?? "U";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-zinc-200 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80">
        {/* Header */}
        <header className="flex items-center gap-4 border-b border-zinc-200 px-10 py-8 dark:border-zinc-800">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-500 to-violet-600 shadow-xl shadow-blue-600/20">
            <span className="text-2xl font-extrabold text-white">V</span>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  VIORA
                </h1>
                <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Smart Project Management Platform
                </p>
              </div>

              <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-500 ring-1 ring-blue-500/20 dark:text-blue-400">
                Workspace Required
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="grid gap-16 p-10 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
              No Workspace Found
            </h2>

            <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              This account isn't currently part of any workspace. Create a
              workspace to start managing projects or sign out to switch
              accounts.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-800/20 p-6">
            <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white">
              Create Your First Workspace
            </h3>

            <p className="mt-3 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              Invite your team, organize projects and start collaborating.
            </p>

            <button
              onClick={() => openCreateOrganization()}
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-medium text-white shadow-xl shadow-blue-600/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={18} />
              Create Workspace
            </button>
          </div>
        </section>

        {/* Account */}
        <section className="border-t border-zinc-200 p-8 dark:border-zinc-800">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Account
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              You're currently signed in with this account.
            </p>
          </div>

          <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Signed in as
          </p>

          <div className="mt-3 flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-bold text-blue-600">
              {avatar}
            </span>

            <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {email}
            </span>
          </div>

          <button
            onClick={() => signOut()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 font-medium text-red-500 transition hover:bg-red-500/10"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </section>
      </div>
    </main>
  );
}