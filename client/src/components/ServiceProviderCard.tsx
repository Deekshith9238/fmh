import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServiceProviderWithUser } from "@shared/schema";

interface ServiceProviderCardProps {
  provider: ServiceProviderWithUser;
}

export default function ServiceProviderCard({ provider }: ServiceProviderCardProps) {
  const { user, category, hourlyRate, rating, bio } = provider;
  const fullName = `${user.firstName} ${user.lastName}`;
  
  // Use default avatar if no profile picture is available
  const avatarSrc = user.profilePicture || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`;
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start">
          <img 
            src={avatarSrc} 
            alt={`${fullName} profile picture`} 
            className="w-16 h-16 rounded-full mr-4 object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{fullName}</h3>
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <Badge variant="outline" className="bg-primary-light text-primary font-medium rounded-full">
                {category.name}
              </Badge>
              <div className="flex items-center text-yellow-500 text-sm">
                <i className="fas fa-star"></i>
                <span className="ml-1 text-neutral-800 font-medium">
                  {rating ? rating.toFixed(1) : "New"}
                </span>
                <span className="ml-1 text-neutral-500">
                  ({provider.completedJobs})
                </span>
              </div>
            </div>
            <p className="text-neutral-600 text-sm line-clamp-2">
              {bio || `Professional ${category.name.toLowerCase()} service provider.`}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="text-neutral-600 text-sm">Starting at</span>
            <span className="text-lg font-semibold ml-1">${hourlyRate}/hr</span>
          </div>
          <Link href={`/provider/${provider.id}`}>
            <Button size="sm">
              View Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
