import Link from 'next/link';

export default function Footer() {
  return (
    <div className="mt-auto pt-6 px-6 pb-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
      <div className="flex flex-col gap-3">
        <Link
          href="/privacy"
          className="text-xs transition-colors hover:text-white"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Privacy Policy
        </Link>
        <Link
          href="/terms"
          className="text-xs transition-colors hover:text-white"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Terms of Service
        </Link>
      </div>
      <div className="mt-4 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
        © {new Date().getFullYear()} MyCheatCode
      </div>
    </div>
  );
}
