import { Link } from "wouter";
import { ServiceCategory } from "@shared/schema";
import * as LucideIcons from "lucide-react";

interface ServiceCategoryCardProps {
  category: ServiceCategory;
}

export default function ServiceCategoryCard({ category }: ServiceCategoryCardProps) {
  const getIconColor = () => {
    switch (category.name) {
      case "Home Cleaning":
        return "text-primary bg-primary/10";
      case "Handyman":
        return "text-orange-500 bg-orange-100";
      case "Lawn Care":
        return "text-emerald-600 bg-emerald-100";
      case "Tutoring":
        return "text-blue-600 bg-blue-100";
      case "Pet Care":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  // Function to render the appropriate Lucide icon
  const Icon = () => {
    const iconName = category.icon as keyof typeof LucideIcons;
    
    // Default icon if the one specified doesn't exist
    if (!iconName || !(iconName in LucideIcons)) {
      return <LucideIcons.HelpCircle className="h-7 w-7" />;
    }
    
    const IconComponent = LucideIcons[iconName];
    return <IconComponent className="h-7 w-7" />;
  };

  return (
    <Link href={`/service-categories?category=${category.id}`}>
      <div className="service-category-icon flex flex-col items-center p-4 rounded-xl hover:shadow-md cursor-pointer transition-all">
        <div className={`w-16 h-16 rounded-full ${getIconColor()} flex items-center justify-center mb-3`}>
          <Icon />
        </div>
        <span className="font-medium text-center">{category.name}</span>
      </div>
    </Link>
  );
}
