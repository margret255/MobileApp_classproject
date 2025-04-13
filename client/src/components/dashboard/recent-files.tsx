import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileType } from "@/interfaces";
import { useQuery } from "@tanstack/react-query";
import { Code, FileText } from "lucide-react";

export default function RecentFiles() {
  const { data: files = [], isLoading } = useQuery<FileType[]>({
    queryKey: ["/api/files/recent"],
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.toLowerCase().includes("javascript") || 
        fileType.toLowerCase().includes("html") || 
        fileType.toLowerCase().includes("css")) {
      return <Code className="text-blue-500" size={24} />;
    }
    return <FileText className="text-blue-500" size={24} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const fileDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - fileDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return fileDate.toLocaleDateString();
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Recent Files</h3>
          <Link href="/files" className="text-sm text-primary hover:text-blue-700">
            View all
          </Link>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading recent files...</div>
        ) : files.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No files uploaded yet.</div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <Link href={`/files/${file.id}`}>
                      <h4 className="text-base font-medium text-gray-900 hover:text-primary">
                        {file.name}
                      </h4>
                    </Link>
                    <span className="text-sm text-gray-500">{formatDate(file.createdAt)}</span>
                  </div>
                  <div className="mt-1 flex items-center">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={file.user.avatarUrl} alt={file.user.name} />
                      <AvatarFallback>{file.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="ml-1.5 text-sm text-gray-500">{file.user.name}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-sm text-gray-500">{file.type}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-sm text-gray-500">{formatFileSize(file.size)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
