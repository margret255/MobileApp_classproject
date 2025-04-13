import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { FileType, Comment, FileVersion } from "@/interfaces";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  MessageSquare,
  History,
  Code,
  FileText,
  FileImage,
  FileSpreadsheet,
  File as FileIcon,
  Calendar,
  ArrowLeft
} from "lucide-react";

export default function FileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  
  const { data: file, isLoading } = useQuery<FileType>({
    queryKey: ["/api/files", id],
  });
  
  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ["/api/files", id, "comments"],
  });
  
  const { data: versions = [], isLoading: versionsLoading } = useQuery<FileVersion[]>({
    queryKey: ["/api/files", id, "versions"],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      const res = await apiRequest("POST", `/api/files/${id}/comments`, { text: commentText });
      return res.json();
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/files", id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/files/${id}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file?.name || `file-${id}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading this file",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes("javascript") || type.includes("html") || type.includes("css") || type.includes("code")) {
      return <Code size={48} className="text-blue-500" />;
    } else if (type.includes("image") || type.includes("png") || type.includes("jpg")) {
      return <FileImage size={48} className="text-green-500" />;
    } else if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) {
      return <FileSpreadsheet size={48} className="text-yellow-500" />;
    } else if (type.includes("document") || type.includes("doc") || type.includes("text")) {
      return <FileText size={48} className="text-purple-500" />;
    }
    return <FileIcon size={48} className="text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading file details...</div>;
  }

  if (!file) {
    return (
      <div className="flex justify-center items-center flex-col min-h-screen">
        <p className="text-2xl font-bold mb-4">File not found</p>
        <Link href="/files">
          <Button variant="outline">Go back to files</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header toggleMobileNav={() => {}} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 pb-20 md:pb-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Link href="/files">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft size={18} />
                </Button>
              </Link>
              <h2 className="text-2xl font-bold text-gray-800">File Details</h2>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  {getFileIcon(file.type)}
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{file.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                      <span>{file.type}</span>
                      <span>•</span>
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(file.createdAt)}
                      </span>
                    </div>
                    {file.description && (
                      <p className="mt-2 text-gray-700">{file.description}</p>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleDownload}
                    className="flex items-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="comments" className="p-6">
                <TabsList>
                  <TabsTrigger value="comments" className="flex items-center gap-1">
                    <MessageSquare size={16} />
                    Comments
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-1">
                    <History size={16} />
                    Version History
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="comments" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="Add a comment..." 
                      value={comment} 
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-20"
                    />
                    <div className="flex justify-end">
                      <Button 
                        disabled={!comment.trim() || addCommentMutation.isPending}
                        onClick={() => addCommentMutation.mutate(comment)}
                      >
                        {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {commentsLoading ? (
                      <div className="text-center py-4 text-gray-500">Loading comments...</div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No comments yet. Be the first to comment!</div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-3">
                              <Avatar>
                                <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
                                <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{comment.user.name}</span>
                                  <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                                </div>
                                <p className="mt-1 text-gray-700">{comment.text}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="history" className="space-y-4 mt-4">
                  {versionsLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading version history...</div>
                  ) : versions.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No version history available.</div>
                  ) : (
                    <div className="space-y-3">
                      {versions.map((version, index) => (
                        <div key={version.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-3">
                              <Avatar>
                                <AvatarImage src={version.user.avatarUrl} alt={version.user.name} />
                                <AvatarFallback>{version.user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">
                                    {index === 0 ? "Current Version" : `Version ${versions.length - index}`}
                                  </span>
                                  <span className="text-xs text-gray-500">{formatDate(version.createdAt)}</span>
                                </div>
                                <p className="mt-1 text-gray-700">
                                  {version.user.name} {version.action} {index === 0 ? "the current version" : "this version"}
                                </p>
                                {version.notes && (
                                  <p className="mt-1 text-gray-600 text-sm">{version.notes}</p>
                                )}
                              </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleDownload()}>
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
