import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@/interfaces";
import { Menu, ChevronDown, Bus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HeaderProps = {
  toggleMobileNav: () => void;
};

export default function Header({ toggleMobileNav }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow">
      <div className="mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Bus className="text-primary mr-2" size={24} />
            <h1 className="text-xl font-bold text-gray-800">GroupHub</h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {projects.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center text-gray-700 bg-gray-100 px-3 py-2 rounded-md hover:bg-gray-200">
                  <span>{currentProject?.name || "Select Project"}</span>
                  <ChevronDown className="ml-1 text-sm" size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {projects.map((project) => (
                    <DropdownMenuItem 
                      key={project.id}
                      onClick={() => setCurrentProjectId(project.id)}
                    >
                      {project.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                  <AvatarFallback>{user?.fullName?.charAt(0) || user?.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="ml-2 text-gray-700">{user?.fullName || user?.username}</span>
                <ChevronDown className="ml-1 text-sm text-gray-500" size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <button 
            onClick={toggleMobileNav}
            className="md:hidden text-gray-700"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}
