import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import FileUploadModal from "@/components/file-upload-modal";
import { FileType } from "@/interfaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Upload, 
  Search, 
  Code, 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  File as FileIcon
} from "lucide-react";

export default function FilesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const { data: files = [], isLoading } = useQuery<FileType[]>({
    queryKey: ["/api/files"],
  });

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes("javascript") || type.includes("html") || type.includes("css") || type.includes("code")) {
      return <Code size={24} className="text-blue-500" />;
    } else if (type.includes("image") || type.includes("png") || type.includes("jpg")) {
      return <FileImage size={24} className="text-green-500" />;
    } else if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) {
      return <FileSpreadsheet size={24} className="text-yellow-500" />;
    } else if (type.includes("document") || type.includes("doc") || type.includes("text")) {
      return <FileText size={24} className="text-purple-500" />;
    }
    return <FileIcon size={24} className="text-gray-500" />;
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
      day: 'numeric'
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
              <h2 className="text-2xl font-bold text-gray-800">Files</h2>
              
              <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search files..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Loading files...
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-10 text-center">
                <FileIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No files found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? "No files match your search criteria" : "Upload your first file to get started"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center mx-auto"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded By
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="ml-4">
                              <Link href={`/files/${file.id}`} className="text-sm font-medium text-gray-900 hover:text-primary">
                                {file.name}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={file.user.avatarUrl} alt={file.user.name} />
                              <AvatarFallback>{file.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="ml-2">
                              <div className="text-sm text-gray-900">{file.user.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">{file.type}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(file.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
