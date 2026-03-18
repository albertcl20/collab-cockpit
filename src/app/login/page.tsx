import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next || "/";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f4ef] px-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Protected app</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Collab Cockpit</h1>
          <p className="text-sm leading-6 text-slate-600">
            Tiny front door, no nonsense. Enter the shared password to continue.
          </p>
        </div>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
