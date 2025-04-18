import { Link } from "wouter";
import { ServiceCategory } from "@shared/schema";

interface ServiceCategoryCardProps {
  category: ServiceCategory;
}

export default function ServiceCategoryCard({ category }: ServiceCategoryCardProps) {
  const getIconColor = () => {
    switch (category.name) {
      case "Home Cleaning":
        return "text-primary bg-primary-light";
      case "Handyman":
        return "text-orange-500 bg-orange-100";
      case "Moving Help":
        return "text-green-600 bg-green-100";
      case "Tech Support":
        return "text-purple-600 bg-purple-100";
      case "Painting":
        return "text-red-600 bg-red-100";
      case "Lawn Care":
        return "text-emerald-600 bg-emerald-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  const getIconClass = () => {
    switch (category.icon) {
      case "broom":
        return "fas fa-broom";
      case "tools":
        return "fas fa-tools";
      case "truck":
        return "fas fa-truck";
      case "laptop-code":
        return "fas fa-laptop-code";
      case "paint-roller":
        return "fas fa-paint-roller";
      case "leaf":
        return "fas fa-leaf";
      default:
        return "fas fa-question";
    }
  };

  return (
    <Link href={`/service-categories?category=${category.id}`}>
      <div className="service-category-icon flex flex-col items-center p-4 rounded-xl hover:shadow-md cursor-pointer transition-all">
        <div className={`w-16 h-16 rounded-full ${getIconColor()} flex items-center justify-center mb-3`}>
          <i className={`${getIconClass()} text-2xl`}></i>
        </div>
        <span className="font-medium text-center">{category.name}</span>
      </div>
    </Link>
  );
}
