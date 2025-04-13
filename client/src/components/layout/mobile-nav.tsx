import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FolderOpen, 
  MessageSquare, 
  Users, 
  BarChart 
} from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/files", label: "Files", icon: <FolderOpen size={20} /> },
    { href: "/comments", label: "Comments", icon: <MessageSquare size={20} /> },
    { href: "/team", label: "Team", icon: <Users size={20} /> },
    { href: "/stats", label: "Stats", icon: <BarChart size={20} /> },
  ];

  return (
    <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-30">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = 
            item.href === "/" 
              ? location === "/"
              : location.startsWith(item.href);
              
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center",
                isActive ? "text-primary" : "text-gray-500"
              )}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
