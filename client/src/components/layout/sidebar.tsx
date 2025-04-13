import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FolderOpen, 
  MessageSquare, 
  Users, 
  BarChart, 
  Settings,
  Download
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { href: "/files", label: "Files", icon: <FolderOpen size={20} /> },
  { href: "/comments", label: "Comments", icon: <MessageSquare size={20} /> },
  { href: "/team", label: "Team", icon: <Users size={20} /> },
  { href: "/stats", label: "Stats", icon: <BarChart size={20} /> },
  { href: "/settings", label: "Settings", icon: <Settings size={20} /> },
];

export default function Sidebar() {
  const [location] = useLocation();

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/project/download');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project-files.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading project:', error);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 pt-5 pb-4">
      <div className="flex flex-col h-full px-3">
        <nav className="flex-1 space-y-1">
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
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md group",
                  isActive
                    ? "bg-blue-50 text-primary"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span className={cn(
                  "mr-3", 
                  isActive 
                    ? "text-primary" 
                    : "text-gray-400 group-hover:text-gray-500"
                )}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="pt-4 pb-3 border-t border-gray-200">
          <button 
            onClick={handleDownload}
            className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            <Download className="mr-3 text-gray-400" size={20} />
            Download Project
          </button>
        </div>
      </div>
    </aside>
  );
}
