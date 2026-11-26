import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="grid min-h-[50vh] place-items-center text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Page not found</h1>
        <p className="mt-2 text-slate-400">The page you are looking for does not exist.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-lg bg-scarlet-600 px-4 py-2 text-sm font-medium text-white hover:bg-scarlet-500"
        >
          Back to overview
        </Link>
      </div>
    </section>
  );
}
