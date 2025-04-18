import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { ServiceCategory, ServiceProviderWithUser } from "@shared/schema";
import ServiceCategoryCard from "@/components/ServiceCategoryCard";
import ServiceProviderCard from "@/components/ServiceProviderCard";
import HowItWorksSection from "@/components/HowItWorksSection";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AuthPage from "@/pages/auth-page";
import { Loader2, MapPin, ArrowRight, Star, StarHalf } from "lucide-react";

export default function HomePage() {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  // Fetch service categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch top service providers
  const { data: providers, isLoading: providersLoading } = useQuery<ServiceProviderWithUser[]>({
    queryKey: ["/api/providers"],
  });

  // Handle search
  const handleSearch = () => {
    if (searchCategory) {
      setLocation(`/service-categories?category=${searchCategory}&location=${encodeURIComponent(searchLocation)}`);
    }
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-blue-700 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Local services, delivered on demand</h1>
            <p className="text-xl opacity-90 mb-8">Find skilled professionals near you for any job, big or small.</p>
            
            {/* Search form */}
            <div className="bg-white rounded-lg p-4 shadow-lg max-w-2xl">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <label htmlFor="service" className="block text-neutral-700 text-sm font-medium mb-1">What service do you need?</label>
                  <Select onValueChange={setSearchCategory}>
                    <SelectTrigger className="w-full h-[46px]">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesLoading ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        <>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label htmlFor="location" className="block text-neutral-700 text-sm font-medium mb-1">Where?</label>
                  <div className="relative">
                    <Input 
                      type="text" 
                      id="location" 
                      placeholder="Enter your address" 
                      className="w-full h-[46px]"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                    <div className="absolute right-3 top-3 text-neutral-500">
                      <MapPin size={16} />
                    </div>
                  </div>
                </div>
                <div className="self-end">
                  <Button 
                    onClick={handleSearch}
                    className="bg-secondary hover:bg-secondary-dark text-white font-medium h-[46px]"
                    disabled={!searchCategory}
                  >
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Hero background pattern */}
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-10 pointer-events-none">
          <div className="absolute transform -rotate-45 right-0 top-0 h-full w-full">
            <div className="grid grid-cols-6 gap-5 h-full w-full">
              {/* Background pattern elements */}
              {Array(30).fill(null).map((_, i) => (
                <div key={i} className="border border-white rounded-full"></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">Popular service categories</h2>
          <p className="text-neutral-600 text-center mb-12 max-w-2xl mx-auto">Browse through the most requested services in your area</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
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
          
          <div className="text-center">
            <Link href="/service-categories" className="text-primary font-medium inline-flex items-center">
              View all services
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Top Providers Section */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Top service providers</h2>
          <p className="text-neutral-600 mb-8">Highly rated professionals ready to help</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providersLoading ? (
              // Loading skeleton
              Array(3).fill(null).map((_, i) => (
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
              ))
            ) : (
              // Display providers or a message if none
              providers?.length ? (
                providers.slice(0, 3).map((provider) => (
                  <ServiceProviderCard key={provider.id} provider={provider} />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-neutral-500">No service providers available yet.</p>
                </div>
              )
            )}
          </div>
          
          <div className="text-center mt-10">
            <Link href="/service-categories">
              <Button variant="outline" className="px-6">
                View all service providers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <HowItWorksSection />

      {/* Join as Provider CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Earn money doing what you love</h2>
            <p className="text-xl opacity-90 mb-8">Join our community of service providers and connect with clients in your area.</p>
            {user ? (
              user.isServiceProvider ? (
                <Link href="/provider-dashboard">
                  <Button variant="secondary" className="px-8 py-4 h-auto bg-white text-primary hover:bg-neutral-100">
                    Go to your dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/profile">
                  <Button variant="secondary" className="px-8 py-4 h-auto bg-white text-primary hover:bg-neutral-100">
                    Become a service provider
                  </Button>
                </Link>
              )
            ) : (
              <>
                <Button
                  variant="secondary"
                  className="px-8 py-4 h-auto bg-white text-primary hover:bg-neutral-100"
                  onClick={() => setAuthDialogOpen(true)}
                >
                  Become a service provider
                </Button>
                
                <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                  <DialogContent className="sm:max-w-[425px] p-0">
                    <AuthPage 
                      isModal={true} 
                      onClose={() => setAuthDialogOpen(false)} 
                      defaultToProvider={true}
                    />
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">What people are saying</h2>
          <p className="text-neutral-600 text-center mb-12 max-w-2xl mx-auto">Hear from our satisfied clients and service providers</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
              <div className="flex items-center text-yellow-500 mb-4">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
              <p className="text-neutral-700 mb-4">"Found an excellent handyman through TaskHire. He arrived on time, fixed my leaky faucet quickly, and charged a fair price. Will definitely use the service again!"</p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-neutral-200 mr-3 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb" alt="Client" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-medium">Rebecca Taylor</h4>
                  <p className="text-neutral-500 text-sm">Homeowner</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
              <div className="flex items-center text-yellow-500 mb-4">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
              <p className="text-neutral-700 mb-4">"As a service provider, TaskHire has been a game-changer for my business. I've connected with dozens of new clients and grown my customer base significantly."</p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-neutral-200 mr-3 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e" alt="Provider" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-medium">Marcus Johnson</h4>
                  <p className="text-neutral-500 text-sm">Professional Cleaner</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
              <div className="flex items-center text-yellow-500 mb-4">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star-half-alt"></i>
              </div>
              <p className="text-neutral-700 mb-4">"I needed help moving some furniture on short notice. Within an hour of posting my task, I had three offers from providers. The moving help I booked was excellent!"</p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-neutral-200 mr-3 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e" alt="Client" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-medium">Sophia Martinez</h4>
                  <p className="text-neutral-500 text-sm">Student</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
