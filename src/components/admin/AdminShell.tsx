"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  Clock,
  Film,
  Images,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBodyLock, useEscape, useFocusTrap } from "@/components/ui/overlays";
import { api, useApi } from "@/lib/api";
import { useRouter } from "next/navigation";

const NAV = [
  {
    group: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    group: "Operations",
    items: [
      { href: "/admin/bookings", label: "Bookings", icon: BarChart3 },
      { href: "/admin/clients", label: "Clients", icon: Users },
    ],
  },
  {
    group: "Catalogue",
    items: [
      { href: "/admin/services", label: "Services", icon: Sparkles },
      { href: "/admin/packages", label: "Packages", icon: Package },
      { href: "/admin/extras", label: "Extras", icon: Layers },
    ],
  },
  {
    group: "Content",
    items: [
      { href: "/admin/portfolio", label: "Portfolio", icon: Images },
      { href: "/admin/films", label: "Films", icon: Film },
      { href: "/admin/gallery", label: "Client Gallery", icon: Images },
      { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
    ],
  },
  {
    group: "Studio",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

const LABELS: Record<string, string> = Object.fromEntries(
  NAV.flatMap((g) => g.items.map((i) => [i.href, i.label])),
);

const OWNER_ONLY = new Set([
  "/admin/services",
  "/admin/packages",
  "/admin/extras",
  "/admin/portfolio",
  "/admin/films",
  "/admin/gallery",
  "/admin/testimonials",
  "/admin/settings",
]);

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "TEAM";
}

interface NotificationItem {
  id: string;
  eventType: string;
  title: string;
  message: string;
  category: string;
  entityType: string | null;
  entityId: string | null;
  link: string | null;
  roleScope: string;
  read: boolean;
  readAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface NotificationsApiResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

function formatNotificationDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const parts = dateStr.slice(0, 10).split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    if (!isNaN(year) && !isNaN(month) && !isNaN(day) && months[month]) {
      return `${day} ${months[month]} ${year}`;
    }
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, loading: sessionLoading } =
    useApi<{ user: SessionUser | null }>("/api/admin/auth/session");

  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifData, refetch: refetchNotifs } = useApi<NotificationsApiResponse>(
    session?.user ? "/api/admin/notifications" : null,
    [session?.user?.id],
  );

  const user = session?.user ?? null;
  const notifications = notifData?.notifications ?? [];
  const unreadCount = notifData?.unreadCount ?? 0;

  const handleNotificationClick = useCallback(
    async (item: NotificationItem) => {
      if (!item.read) {
        try {
          await api.post("/api/admin/notifications/mark-read", { id: item.id });
          refetchNotifs();
        } catch (e) {
          console.warn("Failed to mark notification as read", e);
        }
      }
      setNotifOpen(false);
      if (item.link) {
        router.push(item.link);
      }
    },
    [refetchNotifs, router, setNotifOpen],
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      await api.post("/api/admin/notifications/mark-read", { all: true });
      refetchNotifs();
    } catch (e) {
      console.warn("Failed to mark all notifications as read", e);
    }
  }, [refetchNotifs]);

  useBodyLock(drawer || notifOpen);
  useEscape(drawer && !notifOpen, () => setDrawer(false));
  useEscape(notifOpen, () => setNotifOpen(false));
  const trapRef = useFocusTrap<HTMLDivElement>(drawer);
  const notifTrapRef = useFocusTrap<HTMLDivElement>(notifOpen);
  const closeDrawer = useCallback(() => setDrawer(false), [setDrawer]);
  const closeNotif = useCallback(() => setNotifOpen(false), [setNotifOpen]);

  useEffect(() => {
    if (!sessionLoading && !user) router.replace("/admin/login");
  }, [sessionLoading, user, router]);

  useEffect(() => {
    if (user?.role === "TEAM" && OWNER_ONLY.has(pathname)) router.replace("/admin/dashboard");
  }, [user, pathname, router]);

  const title = LABELS[pathname] ?? "Admin";

  const sidebar = (mobile = false) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-5">
        <Link href="/" className="flex items-baseline gap-2 overflow-hidden">
          <span className="display text-[17px] text-bone">DREAM</span>
          {(!collapsed || mobile) && (
            <span className="whitespace-nowrap font-mono text-[8.5px] uppercase tracking-[0.26em] text-accent">
              Studio CMS
            </span>
          )}
        </Link>
        {mobile ? (
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-bone xl:inline-flex"
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden className="h-4 w-4" />
            ) : (
              <PanelLeftClose aria-hidden className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-2.5 pb-4">
        {NAV.map((group) => (
          <div key={group.group} className="mb-5">
            {(!collapsed || mobile) && (
              <p className="px-2.5 pb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted/60">
                {group.group}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items
                .filter((item) => user?.role === "OWNER" || !OWNER_ONLY.has(item.href))
                .map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeDrawer}
                      aria-current={active ? "page" : undefined}
                      title={collapsed && !mobile ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-[13px] transition-colors duration-200",
                        active ? "text-bone" : "text-muted hover:bg-white/[0.04] hover:text-bone",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="admin-nav-active"
                          className="absolute inset-0 rounded-[10px] border border-accent/30 bg-accent/[0.10]"
                          transition={{ type: "spring", stiffness: 420, damping: 38 }}
                        />
                      )}
                      <item.icon
                        aria-hidden
                        className={cn(
                          "relative z-10 h-4 w-4 shrink-0",
                          active ? "text-accent" : "",
                        )}
                      />
                      {(!collapsed || mobile) && (
                        <span className="relative z-10 truncate">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/8 p-3">
        <button
          type="button"
          onClick={async () => {
            await api.post("/api/admin/auth/logout");
            router.replace("/admin/login");
          }}
          className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left text-[13px] text-muted transition-colors hover:bg-white/[0.04] hover:text-bone"
        >
          <LogOut aria-hidden className="h-4 w-4 shrink-0" />
          {(!collapsed || mobile) && "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(60%_40%_at_80%_-10%,rgba(201,162,39,.07),transparent_60%)]"
      />
      {/* desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-white/8 bg-ink-2/70 backdrop-blur-xl transition-[width] duration-400 lg:block",
          collapsed ? "w-[74px]" : "w-[248px]",
        )}
      >
        {sidebar()}
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div
            className="fixed inset-0 z-[80] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={closeDrawer} />
            <motion.div
              ref={trapRef}
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
              tabIndex={-1}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="glass-strong absolute inset-y-0 left-0 w-[264px]"
            >
              {sidebar(true)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* notifications modal */}
      <AnimatePresence>
        {notifOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeNotif}
              className="fixed inset-0 bg-ink/80 backdrop-blur-sm"
            />
            <motion.div
              ref={notifTrapRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="notifications-modal-title"
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 flex max-h-[85vh] w-full max-w-[480px] flex-col rounded-[22px] border border-white/10 bg-[#0e0e13]/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2
                      id="notifications-modal-title"
                      className="display text-[26px] font-normal tracking-tight text-bone sm:text-[28px]"
                    >
                      Notifications
                    </h2>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[10px] font-medium text-accent">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted/80">
                    Studio activity and booking updates.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="rounded-lg px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.12em] text-accent transition-colors hover:bg-accent/10 hover:text-accent-soft focus-visible:outline-accent"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeNotif}
                    aria-label="Close notifications"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted/70 transition-colors hover:bg-white/[0.06] hover:text-bone focus-visible:outline-accent"
                  >
                    <X aria-hidden className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex-1 space-y-3 overflow-y-auto pr-1">
                {notifications.map((item) => {
                  const isPendingBooking = item.eventType === "BOOKING_CREATED";
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleNotificationClick(item);
                        }
                      }}
                      className={cn(
                        "group block cursor-pointer rounded-[16px] border p-4 text-left transition-colors focus-visible:outline-accent",
                        item.read
                          ? "border-white/10 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                          : "border-accent/30 bg-accent/[0.04] hover:border-accent/50 hover:bg-accent/[0.06]",
                      )}
                    >
                      {isPendingBooking ? (
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {!item.read && (
                                <span
                                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                                  aria-label="Unread"
                                />
                              )}
                              <span className="text-[14.5px] font-medium text-bone">
                                {item.title}
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/[0.08] px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
                              <Clock aria-hidden className="h-3 w-3" />
                              PENDING
                            </span>
                          </div>
                          <p className="mt-1.5 text-[12.5px] text-muted">
                            {item.message}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[14px] leading-snug text-bone/90">
                              <span className="font-medium text-bone">{item.title}</span>{" "}
                              <span className="text-bone/80">{item.message}</span>
                            </p>
                            {!item.read && (
                              <span
                                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                                aria-label="Unread"
                              />
                            )}
                          </div>
                          <p className="mt-1.5 text-[12.5px] text-muted">
                            {formatNotificationDate(item.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {notifications.length === 0 && (
                  <div className="rounded-[16px] border border-white/10 bg-white/[0.02] p-8 text-center">
                    <p className="text-[14px] text-bone/80">No notifications yet</p>
                    <p className="mt-1.5 text-[12px] text-muted">
                      Pending booking requests and studio updates will appear here.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "relative transition-[padding] duration-400",
          collapsed ? "lg:pl-[74px]" : "lg:pl-[248px]",
        )}
      >
        {/* topbar */}
        <header className="sticky top-0 z-30 border-b border-white/8 bg-ink/70 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Open navigation"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted lg:hidden"
            >
              <Menu aria-hidden className="h-4 w-4" />
            </button>

            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
              <ol className="flex items-center gap-1.5 text-[11.5px] text-muted">
                <li>
                  <Link href="/admin/dashboard" className="hover:text-bone">
                    Studio
                  </Link>
                </li>
                <ChevronRight aria-hidden className="h-3 w-3 shrink-0 opacity-50" />
                <li aria-current="page" className="truncate text-bone">
                  {title}
                </li>
              </ol>
              <h1 className="display mt-0.5 truncate text-[20px] text-bone sm:text-[23px]">
                {title}
              </h1>
            </nav>

            <label className="relative hidden md:block">
              <span className="sr-only">Search the studio</span>
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                placeholder="Search bookings, clients…"
                className="h-9 w-56 rounded-full border border-white/10 bg-white/[0.03] pl-9 pr-3 text-[12.5px] text-bone placeholder:text-white/25 transition-all focus:w-64 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
              aria-expanded={notifOpen}
              aria-haspopup="dialog"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted transition-colors hover:text-bone focus-visible:outline-accent"
            >
              <Bell aria-hidden className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
              )}
            </button>

            <div className="flex items-center gap-2.5 rounded-full border border-white/10 py-1 pl-1 pr-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 font-mono text-[11px] text-accent">
                {(user?.name ?? "··")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="hidden text-[12px] text-bone sm:block">
                {user?.name ?? "Signing in…"}
              </span>
              {user && (
                <span className="hidden rounded-full border border-white/12 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted md:inline">
                  {user.role}
                </span>
              )}
            </div>
          </div>
        </header>

        <main id="main" className="relative px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
