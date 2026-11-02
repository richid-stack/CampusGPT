import { Link } from 'wouter';
import { PageHeader } from '../components/layout/PageHeader';

export default function NotFound() {
  return (
    <div className="flex h-full flex-col bg-background">
      <PageHeader />
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-[15px] font-medium text-foreground">This page does not exist.</p>
        <Link href="/" className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">
          Go to the home screen
        </Link>
      </div>
    </div>
  );
}
