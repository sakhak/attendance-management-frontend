import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../icons";
import { useAuth } from "../contexts/AuthContext";
import { config } from "../utils/Config";
import { request } from "../utils/Request";

type TabKey =
  | "dashboard"
  | "attendance"
  | "reports"
  | "blacklist"
  | "terms"
  | "classes"
  | "teachers"
  | "students"
  | "sessions"
  | "settings";

type NavbarProps = {
  userName?: string;
  userRole?: string;
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
};

type NavItem = {
  key: TabKey;
  label: string;
  link: string;
  group: "core" | "academic";
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    link: "/dashboard",
    group: "core",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12 12 4l9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    key: "attendance",
    label: "Attendance Recording",
    link: "/attendance",
    group: "core",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h8" />
        <path d="M8 12h8" />
        <path d="M8 17h5" />
      </svg>
    ),
  },
  {
    key: "reports",
    label: "Reports & Analytics",
    link: "/reports",
    group: "core",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19h16" />
        <path d="M7 16V8" />
        <path d="M12 16V5" />
        <path d="M17 16v-4" />
      </svg>
    ),
  },
  {
    key: "blacklist",
    label: "Blacklist System",
    link: "/blacklist",
    group: "core",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
    ),
  },
  {
    key: "terms",
    label: "Terms",
    link: "/terms",
    group: "academic",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    key: "classes",
    label: "Classes",
    link: "/classes",
    group: "academic",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8 12 3l9 5-9 5-9-5Z" />
        <path d="M5 10.5V16l7 4 7-4v-5.5" />
      </svg>
    ),
  },
  {
    key: "teachers",
    label: "Teachers",
    link: "/teachers",
    group: "academic",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    key: "students",
    label: "Students",
    link: "/students",
    group: "academic",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "sessions",
    label: "Sessions",
    link: "/sessions",
    group: "academic",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
];

export default function Navbar({
  userName,
  userRole,
  activeTab: activeTabProp,
  onTabChange,
}: NavbarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = React.useState(false);
  const [schoolName, setSchoolName] = React.useState("Class Attendance");
  const [schoolMeta, setSchoolMeta] = React.useState("SETEC Portal v1");

  React.useEffect(() => {
    const loadSchoolSettings = async () => {
      try {
        const response = await request("/settings/school");
        const fetchedSchoolName =
          response?.school_name ||
          response?.name ||
          "Class Attendance";
        const fetchedMeta =
          response?.academic_year ||
          response?.term_semester ||
          "SETEC Portal v1";

        setSchoolName(fetchedSchoolName);
        setSchoolMeta(fetchedMeta);
      } catch (error) {
        console.error("Failed to load school settings for navbar:", error);
      }
    };

    loadSchoolSettings();
  }, []);

  const activeTab = React.useMemo(() => {
    if (activeTabProp) return activeTabProp;
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") return "dashboard";
    if (path.includes("/attendance")) return "attendance";
    if (path.includes("/reports")) return "reports";
    if (path.includes("/blacklist")) return "blacklist";
    if (path.includes("/terms")) return "terms";
    if (path.includes("/classes")) return "classes";
    if (path.includes("/teachers")) return "teachers";
    if (path.includes("/students")) return "students";
    if (path.includes("/sessions")) return "sessions";
    if (path.includes("/settings")) return "settings";
    return "dashboard";
  }, [location.pathname, activeTabProp]);

  const displayRole = getDisplayRole(user?.roles, userRole);
  const displayName =
    user?.name ||
    (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : userName || "User");
  const activeItem = navItems.find((item) => item.key === activeTab);

  const handleLogout = () => {
    setIsLogoutDialogOpen(false);
    logout();
  };

  const sidebarSections = [
    { label: "Overview", items: navItems.filter((item) => item.group === "core") },
    { label: "Management", items: navItems.filter((item) => item.group === "academic") },
  ];

  return (
    <>
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-slate-950/40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {isLogoutDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <LogoutIcon />
            </div>
            <h2 className="text-lg font-semibold text-slate-950">Log out</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              You are about to end the current session on this device.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutDialogOpen(false)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white/95 backdrop-blur transition-transform duration-200",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        ].join(" ")}
      >
        <div className="border-b border-slate-200 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Logo />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">{schoolName}</div>
              <div className="truncate text-[11px] text-slate-500">{schoolMeta}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {sidebarSections.map((section) => (
            <div key={section.label} className="mb-6">
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {section.label}
              </div>
              <nav className="space-y-1.5">
                {section.items.map((item) => (
                  <SidebarButton
                    key={item.key}
                    item={item}
                    active={activeTab === item.key}
                    onClick={() => {
                      onTabChange?.(item.key);
                      setIsSidebarOpen(false);
                    }}
                  />
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={() => setIsLogoutDialogOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <LogoutIcon />
            Logout
          </button>
        </div>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
                onClick={() => setIsSidebarOpen((open) => !open)}
                aria-label="Toggle sidebar"
              >
                <MenuIcon />
              </button>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Control Panel
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-950">
                  {activeItem?.label || "Dashboard"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <HeaderAction label="History" onClick={() => navigate("/dashboard")}>
                <HistoryIcon />
              </HeaderAction>
              <HeaderAction label="Settings" onClick={() => navigate("/settings")}>
                <SettingsIcon />
              </HeaderAction>
              <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-900">{displayName}</div>
                  <div className="text-[11px] text-slate-500">{displayRole}</div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                  {user?.avatar || user?.image ? (
                    <img
                      src={`${config.base_url}/storage/${user.avatar || user.image}`}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon />
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>
    </>
  );
}

function getDisplayRole(
  roles?: Array<string | { name?: string; key?: string; title?: string }>,
  fallbackRole?: string,
) {
  const firstRole = roles?.[0];

  if (typeof firstRole === "string" && firstRole.trim()) {
    return firstRole;
  }

  if (firstRole && typeof firstRole === "object") {
    return firstRole.name || firstRole.key || firstRole.title || fallbackRole || "Role";
  }

  return fallbackRole || "Role";
}

function SidebarButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        navigate(item.link);
      }}
      className={[
        "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition",
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      ].join(" ")}
    >
      <span className={["inline-flex h-9 w-9 items-center justify-center rounded-xl", active ? "bg-white/12" : "bg-slate-100"].join(" ")}>
        {item.icon}
      </span>
      <span className="font-medium">{item.label}</span>
    </button>
  );
}

function HeaderAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
    >
      {children}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.92 4h.08A1.65 1.65 0 0 0 10 2.49V2a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 3.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.08a1.65 1.65 0 0 0 1.51.92H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
