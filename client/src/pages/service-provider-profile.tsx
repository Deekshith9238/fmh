import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Star, MessageSquare, Calendar, DollarSign, Award, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Service request schema
const serviceRequestSchema = z.object({
  message: z.string().min(10, "Message must be at least 10 characters").max(500, "Message must not exceed 500 characters"),
});

type ServiceRequestValues = z.infer<typeof serviceRequestSchema>;

export default function ServiceProviderProfile() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  
  // Fetch provider data
  const { data: provider, isLoading } = useQuery<any>({
    queryKey: [`/api/providers/${id}`],
    enabled: !!id,
  });

  // Service request form
  const form = useForm<ServiceRequestValues>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      message: "",
    },
  });

  // Handle missing ID
  useEffect(() => {
    if (!id) {
      navigate("/service-categories");
    }
  }, [id, navigate]);

  // Mutation for creating a service request
  const createRequestMutation = useMutation({
    mutationFn: async (data: ServiceRequestValues) => {
      const requestData = {
        providerId: provider.id,
        message: data.message,
      };
      const res = await apiRequest("POST", "/api/service-requests", requestData);
      return res.json();
    },
    onSuccess: () => {
      setRequestDialogOpen(false);
      form.reset();
      toast({
        title: "Request sent",
        description: "Your service request has been sent to the provider",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle submitting service request
  function onSubmitRequest(values: ServiceRequestValues) {
    createRequestMutation.mutate(values);
  }

  // Render loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Handle provider not found
  if (!provider) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Provider Not Found</h1>
          <p className="text-neutral-600 mb-6">
            The service provider you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/service-categories")}>
            Browse Service Providers
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-neutral-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Provider Info Column */}
            <div className="md:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="relative mb-4">
                      {provider.user.profilePicture ? (
                        <img 
                          src={provider.user.profilePicture} 
                          alt={`${provider.user.firstName} ${provider.user.lastName}`}
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow">
                          {provider.user.firstName[0]}
                          {provider.user.lastName[0]}
                        </div>
                      )}
                      
                      {provider.rating > 0 && (
                        <Badge className="absolute -bottom-2 right-0 bg-yellow-500">
                          <Star className="h-3 w-3 mr-1" />
                          {provider.rating.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                    
                    <h1 className="text-xl font-bold mb-1">
                      {provider.user.firstName} {provider.user.lastName}
                    </h1>
                    
                    <Badge className="bg-primary mb-2">
                      {provider.category.name}
                    </Badge>
                    
                    <p className="text-neutral-600 text-sm">
                      {provider.completedJobs} jobs completed
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-neutral-500 mr-2" />
                      <div>
                        <div className="font-medium">Hourly Rate</div>
                        <div className="text-neutral-600">${provider.hourlyRate}/hour</div>
                      </div>
                    </div>
                    
                    {provider.yearsOfExperience > 0 && (
                      <div className="flex items-center">
                        <Award className="h-5 w-5 text-neutral-500 mr-2" />
                        <div>
                          <div className="font-medium">Experience</div>
                          <div className="text-neutral-600">
                            {provider.yearsOfExperience} year{provider.yearsOfExperience !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {provider.availability && (
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-neutral-500 mr-2" />
                        <div>
                          <div className="font-medium">Availability</div>
                          <div className="text-neutral-600">{provider.availability}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4">
                      {user ? (
                        user.id !== provider.user.id && (
                          <Button 
                            className="w-full"
                            onClick={() => setRequestDialogOpen(true)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Request Service
                          </Button>
                        )
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => navigate("/auth")}
                        >
                          Sign in to request service
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Details Column */}
            <div className="md:col-span-2">
              <Card className="mb-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">About</h2>
                  {provider.bio ? (
                    <p className="text-neutral-700 whitespace-pre-line">
                      {provider.bio}
                    </p>
                  ) : (
                    <p className="text-neutral-500 italic">
                      This provider has not added a bio yet.
                    </p>
                  )}
                </CardContent>
              </Card>
              
              {/* Reviews */}
              <h2 className="text-xl font-bold mb-4">Reviews</h2>
              {provider.reviews && provider.reviews.length > 0 ? (
                <div className="space-y-4">
                  {provider.reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-4">
                            {review.client?.profilePicture ? (
                              <img 
                                src={review.client.profilePicture} 
                                alt="Client" 
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-medium">
                                {review.client?.firstName?.[0] || "U"}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-medium">
                                {review.client?.firstName || "Anonymous"} {review.client?.lastName || ""}
                              </div>
                              <div className="flex items-center text-yellow-500">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                  <Star key={i} className="h-4 w-4 fill-current" />
                                ))}
                                {Array.from({ length: 5 - review.rating }).map((_, i) => (
                                  <Star key={i} className="h-4 w-4 text-neutral-300" />
                                ))}
                              </div>
                            </div>
                            <div className="text-neutral-500 text-xs mb-2">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                            <p className="text-neutral-700">{review.comment}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Star className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">No reviews yet</h3>
                    <p className="text-neutral-600">This provider hasn't received any reviews yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Service Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Service</DialogTitle>
            <DialogDescription>
              Send a message to {provider.user.firstName} about the service you need
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitRequest)} className="space-y-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what you need help with, including details about location, timing, and any specific requirements..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setRequestDialogOpen(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createRequestMutation.isPending}
                >
                  {createRequestMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Request"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
