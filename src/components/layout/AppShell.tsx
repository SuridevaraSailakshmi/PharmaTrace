'use client';

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, QrCode, Users, Settings, Menu, X, Hexagon, LogOut, History, Database } from "lucide-react";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/login/actions";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  workerOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Generate QR', href: '/worker/qr', icon: QrCode, workerOnly: true },
  { name: 'QR History', href: '/history', icon: History },
  { name: 'Forms', href: '/admin/forms', icon: Database, adminOnly: true },
  { name: 'Users', href: '/admin/users', icon: Users, adminOnly: true },
  { name: 'Settings', href: '/admin/settings', icon: Settings, adminOnly: true },
];

export function Sidebar({ userRole, isOpen, setIsOpen }: { userRole: string, isOpen: boolean, setIsOpen: (v: boolean) => void }) {
  const pathname = usePathname();
  const isAdmin = userRole === 'ADMIN';
  const isWorker = userRole === 'WORKER';
  const visibleItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.workerOnly && !isWorker) return false;
    return true;
  });

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border bg-surface transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-sm",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-5 border-b border-border bg-surface">
          <div className="flex items-center gap-2.5 font-semibold text-lg text-primary tracking-tight">
            <Hexagon className="h-5 w-5" />
            <span>PharmaTrace</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname?.startsWith(item.href) || false;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export function Topbar({ userRole, onMenuClick }: { userRole: string, onMenuClick: () => void }) {
  const isAdmin = userRole === 'ADMIN';

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-surface px-4 sm:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-muted-foreground hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 tracking-wide uppercase">
            {isAdmin ? 'ADMIN' : 'WORKER'}
          </span>
        </div>
        <div className="h-4 w-px bg-border"></div>
        <form action={logout}>
          <button 
            type="submit"
            className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </form>
      </div>
    </header>
  );
}

export function AppShell({ children, userRole }: { children: React.ReactNode, userRole: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar userRole={userRole} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-64 min-w-0">
        <Topbar userRole={userRole} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
