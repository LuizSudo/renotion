"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import {
  ChevronDown,
  Search,
  Inbox,
  CalendarDays,
  Calendar,
  FileText,
  Bell,
  Folder,
  User,
  Tag,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  UserCog,
} from "lucide-react";

const mainNav = [
  { href: "/", label: "Entrada", icon: Inbox },
  { href: "/hoje", label: "Hoje", icon: CalendarDays },
  { href: "/calendario", label: "Calendário", icon: Calendar },
  { href: "/notas", label: "Notas", icon: FileText },
  { href: "/lembretes", label: "Lembretes", icon: Bell },
];

const spaceNav = [
  { href: "/projetos", label: "Projetos", icon: Folder },
  { href: "/pessoal", label: "Pessoal", icon: User },
  { href: "/arquivo", label: "Arquivo", icon: Tag },
];

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const { theme, setTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const themeIcons = {
    light: <Sun size={16} />,
    dark: <Moon size={16} />,
    system: <Monitor size={16} />,
  };

  const themeLabels = {
    light: "Claro",
    dark: "Escuro",
    system: "Sistema",
  };

  const handleThemeChange = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    setTheme(themes[(currentIndex + 1) % themes.length]);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden mobile-sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          flex h-screen w-[220px] shrink-0 flex-col border-r border-border bg-sidebar/60 text-[13px] 
          lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-200 ease-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        role="navigation"
        aria-label="Navegação principal"
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex items-center justify-end p-2">
          <button
            onClick={() => setIsMobileOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Profile Section with Dropdown */}
        <div className="relative px-3 py-3 border-b border-border">
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent/50 w-full text-left transition-colors"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
              aria-label="Menu do usuário"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {getInitials(user?.name)}
              </span>
              <span className="truncate font-medium text-foreground">{user?.name || "Usuário"}</span>
              <ChevronDown size={14} className={`shrink-0 text-muted-foreground transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-card py-1 shadow-lg z-20 animate-slide-down">
                  <Link
                    href="/configuracoes"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <UserCog size={16} />
                    Configurações
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent text-left"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-muted-foreground">
            <Search size={14} />
            <span>Quick Pesquisar</span>
          </div>
        </div>

        <nav className="mt-1 flex flex-col gap-0.5 px-2" aria-label="Navegação principal">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors
                  ${active
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }
                `}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 px-4 text-[11px] font-medium tracking-wide text-muted-foreground">ESPAÇOS DE TRABALHO</div>
        <nav className="mt-1 flex flex-col gap-0.5 px-2" aria-label="Espaços de trabalho">
          {spaceNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors
                  ${active
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }
                `}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-0.5 border-t border-border px-2 py-3">
          <button
            onClick={handleThemeChange}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground w-full text-left"
            aria-label={`Tema atual: ${themeLabels[theme]}. Clique para alternar.`}
          >
            {themeIcons[theme]}
            <span>Tema: {themeLabels[theme]}</span>
          </button>
          <Link
            href="/ajuda"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <HelpCircle size={15} strokeWidth={1.8} aria-hidden="true" />
            <span>Ajuda e Suporte</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="lg:hidden fixed bottom-4 right-4 z-50 rounded-full bg-primary p-3 shadow-lg text-primary-foreground hover:bg-primary/90 transition-colors"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={isMobileOpen}
        >
          <Menu size={24} />
        </button>
      </aside>
    </>
  );
}

type Theme = "light" | "dark" | "system";