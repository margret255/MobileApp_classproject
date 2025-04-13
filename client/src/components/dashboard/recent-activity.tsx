import { useQuery } from "@tanstack/react-query";
import { Activity } from "@/interfaces";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

export default function RecentActivity() {
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const formatActivityDate = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - activityDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return activityDate.toLocaleDateString();
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="px-6 py-4 text-center text-gray-500">Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="px-6 py-4 text-center text-gray-500">No recent activity.</div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="px-6 py-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.user.avatarUrl} alt={activity.user.name} />
                    <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium text-gray-900">{activity.user.name}</span>{' '}
                    {activity.type === 'upload' && (
                      <>
                        uploaded{' '}
                        <Link href={`/files/${activity.fileId}`} className="font-medium text-gray-900 hover:text-primary">
                          {activity.fileName}
                        </Link>
                      </>
                    )}
                    {activity.type === 'comment' && (
                      <>
                        commented on{' '}
                        <Link href={`/files/${activity.fileId}`} className="font-medium text-gray-900 hover:text-primary">
                          {activity.fileName}
                        </Link>
                      </>
                    )}
                    {activity.type === 'update' && (
                      <>
                        updated{' '}
                        <Link href={`/files/${activity.fileId}`} className="font-medium text-gray-900 hover:text-primary">
                          {activity.fileName}
                        </Link>
                      </>
                    )}
                    {activity.type === 'join' && 'joined the project'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatActivityDate(activity.timestamp)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
