import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex h-16 items-center justify-between px-6">
        <span className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <span className="text-xl">🍅</span>
          Backlogzy
        </span>
        <nav className="flex items-center gap-3">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <span className="text-6xl">🍅</span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          A productive backlog manager
        </h1>
        <p className="mt-4 max-w-md text-lg text-gray-500">
          Boards for your projects, a weekly planning with pomodoros and habits.
          Simple, fast, keyboard-friendly.
        </p>
        <Link
          to="/signup"
          className="mt-8 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Create your workspace
        </Link>
      </main>
    </div>
  );
}
