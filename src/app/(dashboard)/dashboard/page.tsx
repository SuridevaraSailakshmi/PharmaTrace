
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthorizationService } from '@/lib/auth/AuthorizationService';
import { QrCode, ArrowRight, Activity, Clock } from 'lucide-react';
import Link from 'next/link';
import { RecentRecordsClient } from '@/components/dashboard/recent-records-client';

export default async function DashboardPage() {
  const user = await AuthorizationService.getCurrentUser();
  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Operational Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user.fullName || user.email}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Primary Action Card - Worker Only */}
        {user.roleId === 'WORKER' && (
          <Card className="md:col-span-2 border-primary/20 shadow-sm bg-primary/5">
            <CardContent className="p-8 flex flex-col justify-center items-start h-full space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Generate Traceability Record</h2>
                <p className="text-muted-foreground max-w-lg">
                  Create a new cryptographically secure QR payload and generate globally unique Product Reference Codes and SSCCs for pharmaceutical batches.
                </p>
              </div>
              <Link href="/worker/qr">
                <Button size="lg" className="px-8 shadow-sm group">
                  <QrCode className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Initialize Generation
                  <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Status/Context Card */}
        <Card className={`shadow-sm ${user.roleId === 'ADMIN' ? 'md:col-span-3' : ''}`}>
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Session Context
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Operator</span>
              <span className="font-medium text-foreground">{user.email}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Clearance</span>
              <span className="font-medium text-foreground">{user.roleId}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Status</span>
              <span className="inline-flex items-center gap-1.5 text-success font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                Active & Authorized
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Recent Activity
          </h3>
          <Button asChild variant="outline" size="sm">
            <Link href="/history">View Full History</Link>
          </Button>
        </div>
        <Card className="shadow-sm">
          <CardContent className="p-0">
             <RecentRecordsClient />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ShieldCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
