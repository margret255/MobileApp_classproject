import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import ActivityCard from "@/components/dashboard/activity-card";
import RecentFiles from "@/components/dashboard/recent-files";
import TeamContributions from "@/components/dashboard/team-contributions";
import RecentActivity from "@/components/dashboard/recent-activity";
import FileUploadModal from "@/components/file-upload-modal";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { StatsData } from "@/interfaces";
import { Upload, UserPlus, UploadCloud, MessageSquare, Users, Calendar } from "lucide-react";

// Temporary function to get user data
function useUserData() {
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    fetch("/api/user", {
      credentials: "include"
    })
    .then(res => {
      if (res.status === 401) {
        return null;
      }
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then(userData => {
      setUser(userData);
    })
    .catch(err => {
      console.error("Error fetching user data:", err);
    });
  }, []);
  
  return { user };
}

export default function DashboardPage() {
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { user } = useUserData();
  
  const { data: stats, isLoading: statsLoading } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
  });

  const toggleMobileNav = () => {
    setMobileNavVisible(!mobileNavVisible);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header toggleMobileNav={toggleMobileNav} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 pb-20 md:pb-6">
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                <p className="text-gray-600 mt-1">Welcome back, {user?.fullName || user?.username}</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  New File
                </Button>
                <Button className="flex items-center">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <ActivityCard
                icon={<UploadCloud size={24} />}
                label="Files Uploaded"
                value={statsLoading ? "..." : stats?.uploads ?? 0}
                bgColor="bg-blue-100"
                textColor="text-primary"
              />
              <ActivityCard
                icon={<MessageSquare size={24} />}
                label="Comments"
                value={statsLoading ? "..." : stats?.comments ?? 0}
                bgColor="bg-violet-100"
                textColor="text-secondary"
              />
              <ActivityCard
                icon={<Users size={24} />}
                label="Team Members"
                value={statsLoading ? "..." : stats?.members ?? 0}
                bgColor="bg-pink-100"
                textColor="text-accent"
              />
              <ActivityCard
                icon={<Calendar size={24} />}
                label="Days Active"
                value={statsLoading ? "..." : stats?.daysActive ?? 0}
                bgColor="bg-green-100"
                textColor="text-success"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentFiles />
              </div>
              
              <div>
                <TeamContributions />
                <RecentActivity />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
      
      <FileUploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
