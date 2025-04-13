import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Comment } from "@/interfaces";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare } from "lucide-react";

export default function CommentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/comments"],
  });

  const filteredComments = comments.filter(comment => 
    comment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-screen">
      <Header toggleMobileNav={() => {}} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 pb-20 md:pb-6">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Comments</h2>
              
              <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search comments..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Loading comments...
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-10 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No comments found</h3>
                <p className="text-gray-500">
                  {searchQuery ? "No comments match your search criteria" : "No comments have been made yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredComments.map((comment) => (
                  <div key={comment.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
                        <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                          <div>
                            <span className="font-medium text-gray-900">{comment.user.name}</span>
                            <span className="text-gray-500 text-sm ml-2">commented on</span>
                            <Link 
                              href={`/files/${comment.fileId}`}
                              className="ml-1 font-medium text-primary hover:underline"
                            >
                              {comment.fileName}
                            </Link>
                          </div>
                          <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                        </div>
                        
                        <p className="text-gray-700">{comment.text}</p>
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
    </div>
  );
}
