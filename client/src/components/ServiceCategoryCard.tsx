import { Link } from "wouter";
import { ServiceCategory } from "@shared/schema";
import { 
  Trash2, 
  Hammer, 
  Scissors, 
  BookOpen, 
  PawPrint, 
  HelpCircle
} from "lucide-react";

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

  // Render the icon based on the icon name from the database
  const renderIcon = () => {
    switch (category.icon) {
      case "Trash2":
        return <Trash2 className="h-7 w-7" />;
      case "Hammer":
        return <Hammer className="h-7 w-7" />;
      case "Scissors":
        return <Scissors className="h-7 w-7" />;
      case "BookOpen":
        return <BookOpen className="h-7 w-7" />;
      case "Paw":
        return <PawPrint className="h-7 w-7" />;
      default:
        return <HelpCircle className="h-7 w-7" />;
    }
  };

  return (
    <Link href={`/service-categories?category=${category.id}`}>
      <div className="service-category-icon flex flex-col items-center p-4 rounded-xl hover:shadow-md cursor-pointer transition-all">
        <div className={`w-16 h-16 rounded-full ${getIconColor()} flex items-center justify-center mb-3`}>
          {renderIcon()}
        </div>
        <span className="font-medium text-center">{category.name}</span>
      </div>
    </Link>
  );
}
