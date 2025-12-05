import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold mb-4">ACE Demo</h1>
      <ul className="space-y-2 text-blue-400 underline">
        <li>
          <Link href="/ace/niigata-demo">
            Niigata Ski Trip – Mock ACE Agent
          </Link>
        </li>
        {/* other demo links */}
      </ul>
      <ul className="space-y-2 text-blue-400 underline">
        <li>
          <Link href="/ace/niigata-demo-v2">
            Niigata Ski Trip – Mock ACE Agent (animated)
          </Link>
        </li>
        {/* other demo links */}
      </ul>
      <ul className="space-y-2 text-blue-400 underline">
        <li>
          <Link href="/ace/niigata-demo-v3">
            Niigata Ski Trip – Mock ACE Agent (v3)
          </Link>
        </li>
        {/* other demo links */}
      </ul>
      <ul className="space-y-2 text-blue-400 underline">
        <li>
          <Link href="/ace/niigata-demo-v4">
            Niigata Ski Trip – Mock ACE Agent (v4)
          </Link>
        </li>
        {/* other demo links */}
      </ul>
    </main>
  );
}
