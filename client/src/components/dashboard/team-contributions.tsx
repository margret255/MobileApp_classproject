import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { UserContribution } from "@/interfaces";

export default function TeamContributions() {
  const { data: contributions = [], isLoading } = useQuery<UserContribution[]>({
    queryKey: ["/api/contributions"],
  });

  // Colors for different users' contribution bars
  const colors = [
    "bg-primary",
    "bg-secondary",
    "bg-accent",
    "bg-green-500",
    "bg-yellow-500",
  ];

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">Team Contributions</h3>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="text-center text-gray-500">Loading contributions...</div>
        ) : contributions.length === 0 ? (
          <div className="text-center text-gray-500">No contribution data available.</div>
        ) : (
          <div className="mb-6 space-y-4">
            {contributions.map((contribution, index) => (
              <div key={contribution.userId}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={contribution.user.avatarUrl} alt={contribution.user.name} />
                      <AvatarFallback>{contribution.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700">{contribution.user.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{contribution.percentage}%</span>
                </div>
                <div className="w-full rounded-full h-2 bg-gray-200">
                  <div
                    className={`h-2 rounded-full ${colors[index % colors.length]}`}
                    style={{ width: `${contribution.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <Link href="/stats" className="block text-center text-sm text-primary hover:text-blue-700 font-medium">
          View detailed statistics
        </Link>
      </div>
    </div>
  );
}
