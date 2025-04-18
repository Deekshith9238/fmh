import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ServiceCategory, ServiceProviderWithUser } from "@shared/schema";
import ServiceCategoryCard from "@/components/ServiceCategoryCard";
import ServiceProviderCard from "@/components/ServiceProviderCard";
import MainLayout from "@/components/MainLayout";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export default function ServiceCategories() {
  const [location, _] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [priceRange, setPriceRange] = useState<number[]>([0, 100]);
  const [minRating, setMinRating] = useState<number>(0);
  
  // Get category from URL params if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const categoryParam = params.get("category");
    const locationParam = params.get("location");
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    
    if (locationParam) {
      setLocationFilter(locationParam);
    }
  }, [location]);

  // Fetch all service categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch service providers
  const { data: providers, isLoading: providersLoading } = useQuery<ServiceProviderWithUser[]>({
    queryKey: selectedCategory 
      ? [`/api/providers/category/${selectedCategory}`] 
      : ["/api/providers"],
    enabled: true,
  });

  // Filter providers based on filters
  const filteredProviders = providers?.filter(provider => {
    // Filter by location if a location is specified
    if (locationFilter && !provider.user.username.toLowerCase().includes(locationFilter.toLowerCase())) {
      return false;
    }
    
    // Filter by price range
    if (provider.hourlyRate < priceRange[0] || provider.hourlyRate > priceRange[1]) {
      return false;
    }
    
    // Filter by minimum rating
    if (minRating > 0 && (!provider.rating || provider.rating < minRating)) {
      return false;
    }
    
    return true;
  });

  // Get the selected category name
  const selectedCategoryName = categories?.find(
    cat => cat.id.toString() === selectedCategory
  )?.name || "All Services";

  return (
    <MainLayout>
      <div className="bg-neutral-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h1 className="text-3xl font-bold mb-2">{selectedCategory ? selectedCategoryName : "Browse Services"}</h1>
            <p className="text-neutral-600">
              {selectedCategory 
                ? `Find the best ${selectedCategoryName.toLowerCase()} professionals in your area` 
                : "Explore all service categories and find the help you need"}
            </p>
          </div>

          {/* Categories Section */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Service Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {categoriesLoading ? (
                // Loading skeleton
                Array(6).fill(null).map((_, i) => (
                  <div key={i} className="animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-neutral-200 mb-3"></div>
                    <div className="h-4 w-24 bg-neutral-200 rounded"></div>
                  </div>
                ))
              ) : (
                // Display categories
                categories?.map((category) => (
                  <ServiceCategoryCard key={category.id} category={category} />
                ))
              )}
            </div>
          </div>

          {/* Filters and Providers Section */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters Sidebar */}
            <div className="w-full md:w-64 bg-white p-6 rounded-lg shadow-sm h-fit">
              <h3 className="font-semibold mb-4">Filters</h3>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="categoryFilter">Category</Label>
                  <Select 
                    value={selectedCategory || ""} 
                    onValueChange={(value) => setSelectedCategory(value || null)}
                  >
                    <SelectTrigger id="categoryFilter">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="locationFilter">Location</Label>
                  <Input
                    id="locationFilter"
                    placeholder="Enter location"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Price Range ($/hour)</Label>
                  <div className="pt-4 px-2">
                    <Slider
                      value={priceRange}
                      min={0}
                      max={200}
                      step={5}
                      onValueChange={setPriceRange}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="ratingFilter">Minimum Rating</Label>
                  <Select 
                    value={minRating.toString()} 
                    onValueChange={(value) => setMinRating(Number(value))}
                  >
                    <SelectTrigger id="ratingFilter">
                      <SelectValue placeholder="Any Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any Rating</SelectItem>
                      <SelectItem value="3">3+ Stars</SelectItem>
                      <SelectItem value="4">4+ Stars</SelectItem>
                      <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSelectedCategory(null);
                    setLocationFilter("");
                    setPriceRange([0, 100]);
                    setMinRating(0);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
            
            {/* Service Providers */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedCategory ? `${selectedCategoryName} Providers` : "All Service Providers"}
                </h2>
                <div className="text-sm text-neutral-600">
                  {filteredProviders?.length || 0} provider(s) found
                </div>
              </div>
              
              {providersLoading ? (
                // Loading skeleton
                <div className="grid gap-6">
                  {Array(3).fill(null).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-xl p-6">
                      <div className="flex items-start">
                        <div className="w-16 h-16 rounded-full bg-neutral-200 mr-4"></div>
                        <div className="flex-1">
                          <div className="h-5 w-32 bg-neutral-200 rounded mb-2"></div>
                          <div className="h-4 w-24 bg-neutral-200 rounded mb-2"></div>
                          <div className="h-4 w-full bg-neutral-200 rounded"></div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="h-5 w-20 bg-neutral-200 rounded"></div>
                        <div className="h-8 w-24 bg-neutral-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProviders?.length ? (
                // Display providers
                <div className="grid gap-6">
                  {filteredProviders.map((provider) => (
                    <ServiceProviderCard key={provider.id} provider={provider} />
                  ))}
                </div>
              ) : (
                // No providers found
                <div className="bg-white rounded-lg p-8 text-center">
                  <div className="text-neutral-400 mb-2">
                    <i className="fas fa-search text-4xl"></i>
                  </div>
                  <h3 className="text-lg font-medium mb-1">No service providers found</h3>
                  <p className="text-neutral-600 mb-4">
                    Try adjusting your filters or selecting a different category.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedCategory(null);
                      setLocationFilter("");
                      setPriceRange([0, 100]);
                      setMinRating(0);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
