import Link from "next/link";

const modules = [
  {
    href: "/pipeline",
    title: "Deal Pipeline",
    description: "Track and manage motivated seller leads through your acquisition funnel.",
  },
  {
    href: "/underwriting",
    title: "Comp & Underwriting",
    description: "Run comparable sales analysis and underwrite deals before making offers.",
  },
  {
    href: "/map",
    title: "Map View",
    description: "Visualize leads and properties geographically across your target markets.",
  },
];

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold text-neutral-900">Welcome to Prophet Homes</h1>
      <p className="mt-2 text-neutral-500 max-w-xl">
        Your brokerage dashboard. Select a module below to get started.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {modules.map(({ href, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group block rounded-lg border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all"
          >
            <h2 className="text-base font-semibold text-neutral-900 group-hover:text-neutral-700">
              {title}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
