import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { UserType } from "@/interfaces";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Search, UserPlus, Mail, FileText, MessageSquare } from "lucide-react";

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const { toast } = useToast();
  
  const { data: users = [], isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/invites", { email });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${inviteEmail}`,
      });
      setInviteEmail("");
      setIsInviteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInvite = () => {
    if (!inviteEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address to invite",
        variant: "destructive",
      });
      return;
    }
    
    inviteMutation.mutate(inviteEmail);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header toggleMobileNav={() => {}} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 pb-20 md:pb-6">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Team Members</h2>
              
              <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search team members..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Button
                  onClick={() => setIsInviteDialogOpen(true)}
                  className="flex items-center"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Loading team members...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-10 text-center">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No team members found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? "No members match your search criteria" : "Invite team members to collaborate on your project"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setIsInviteDialogOpen(true)}
                    className="flex items-center mx-auto"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                        <p className="text-gray-500 flex items-center mt-1">
                          <Mail className="h-4 w-4 mr-1" />
                          {user.email}
                        </p>
                        
                        <div className="mt-4 space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-1 text-blue-500" />
                                Files
                              </div>
                              <span>{user.stats.files}</span>
                            </div>
                            <Progress value={user.stats.filesPercentage} className="h-1.5" />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <div className="flex items-center">
                                <MessageSquare className="h-4 w-4 mr-1 text-violet-500" />
                                Comments
                              </div>
                              <span>{user.stats.comments}</span>
                            </div>
                            <Progress value={user.stats.commentsPercentage} className="h-1.5 bg-gray-200">
                              <div className="h-full bg-violet-500 transition-all" style={{ width: `${user.stats.commentsPercentage}%` }} />
                            </Progress>
                          </div>
                        </div>
                        
                        <div className="text-right mt-3">
                          <span className="text-sm font-medium text-primary">
                            {user.stats.contributionPercentage}% of total contribution
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      
      <MobileNav />
      
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsInviteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleInvite}
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
