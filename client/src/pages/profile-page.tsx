import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Settings, BriefcaseBusiness, Bell } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Profile update schema
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  profilePicture: z.string().optional(),
});

// Provider profile schema
const providerProfileSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  hourlyRate: z.string().min(1, "Hourly rate is required"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  yearsOfExperience: z.string().optional(),
  availability: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type ProviderProfileFormValues = z.infer<typeof providerProfileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  
  // Fetch user profile
  const { data: userProfile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/user"],
    enabled: !!user,
  });
  
  // Fetch provider profile if user is a service provider
  const { data: providerProfile, isLoading: providerLoading } = useQuery<any>({
    queryKey: ["/api/user/provider"],
    enabled: !!user && user.isServiceProvider,
  });
  
  // Fetch service categories for provider profile
  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      profilePicture: "",
    },
  });
  
  // Provider profile form
  const providerForm = useForm<ProviderProfileFormValues>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: {
      categoryId: "",
      hourlyRate: "",
      bio: "",
      yearsOfExperience: "",
      availability: "",
    },
  });

  // Set form values when profiles are loaded
  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        email: userProfile.email || "",
        phoneNumber: userProfile.phoneNumber || "",
        profilePicture: userProfile.profilePicture || "",
      });
    }
  }, [userProfile, profileForm]);
  
  useEffect(() => {
    if (providerProfile) {
      providerForm.reset({
        categoryId: providerProfile.categoryId?.toString() || "",
        hourlyRate: providerProfile.hourlyRate?.toString() || "",
        bio: providerProfile.bio || "",
        yearsOfExperience: providerProfile.yearsOfExperience?.toString() || "",
        availability: providerProfile.availability || "",
      });
    }
  }, [providerProfile, providerForm]);

  // Mutation for updating user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PUT", "/api/user", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for creating/updating provider profile
  const updateProviderProfileMutation = useMutation({
    mutationFn: async (data: ProviderProfileFormValues) => {
      const providerData = {
        ...data,
        categoryId: parseInt(data.categoryId),
        hourlyRate: parseFloat(data.hourlyRate),
        yearsOfExperience: data.yearsOfExperience ? parseInt(data.yearsOfExperience) : undefined,
      };
      
      const endpoint = providerProfile 
        ? `/api/providers/${providerProfile.id}` 
        : "/api/providers";
      
      const method = providerProfile ? "PUT" : "POST";
      
      const res = await apiRequest(method, endpoint, providerData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/provider"] });
      toast({
        title: "Provider profile updated",
        description: "Your service provider profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle profile form submission
  function onSubmitProfile(values: ProfileFormValues) {
    updateProfileMutation.mutate(values);
  }

  // Handle provider profile form submission
  function onSubmitProviderProfile(values: ProviderProfileFormValues) {
    updateProviderProfileMutation.mutate(values);
  }

  if (profileLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!userProfile) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-neutral-600 mb-6">
            Please log in to view and edit your profile.
          </p>
          <Button asChild>
            <a href="/auth">Log In</a>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-neutral-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full md:w-64">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="mb-4">
                      {userProfile.profilePicture ? (
                        <img 
                          src={userProfile.profilePicture} 
                          alt={`${userProfile.firstName} ${userProfile.lastName}`}
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow">
                          {userProfile.firstName[0]}
                          {userProfile.lastName[0]}
                        </div>
                      )}
                    </div>
                    
                    <h1 className="text-xl font-bold mb-1">
                      {userProfile.firstName} {userProfile.lastName}
                    </h1>
                    
                    <p className="text-neutral-600 text-sm">
                      {userProfile.email}
                    </p>
                  </div>
                  
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    orientation="vertical"
                    className="w-full"
                  >
                    <TabsList className="flex flex-col w-full h-auto bg-transparent space-y-1">
                      <TabsTrigger
                        value="general"
                        className="w-full justify-start px-3 py-2"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile Info
                      </TabsTrigger>
                      <TabsTrigger
                        value="provider"
                        className="w-full justify-start px-3 py-2"
                      >
                        <BriefcaseBusiness className="h-4 w-4 mr-2" />
                        Provider Settings
                      </TabsTrigger>
                      <TabsTrigger
                        value="account"
                        className="w-full justify-start px-3 py-2"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Account Settings
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
            
            {/* Main content */}
            <div className="flex-1">
              <TabsContent value="general" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="profilePicture"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Profile Picture URL (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="provider" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Provider Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {providerLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Form {...providerForm}>
                        <form onSubmit={providerForm.handleSubmit(onSubmitProviderProfile)} className="space-y-6">
                          <FormField
                            control={providerForm.control}
                            name="categoryId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Service Category</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select your main service category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories?.map((category) => (
                                      <SelectItem 
                                        key={category.id} 
                                        value={category.id.toString()}
                                      >
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={providerForm.control}
                            name="hourlyRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hourly Rate ($)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={providerForm.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>About Your Services</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe your experience, skills, and the services you offer..."
                                    className="min-h-[150px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={providerForm.control}
                              name="yearsOfExperience"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Years of Experience</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number"
                                      min="0"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={providerForm.control}
                              name="availability"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Availability</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Weekdays 9AM-5PM"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <Button 
                            type="submit"
                            disabled={updateProviderProfileMutation.isPending}
                          >
                            {updateProviderProfileMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save Provider Settings"
                            )}
                          </Button>
                        </form>
                      </Form>
                    )}
                    
                    {!userProfile.isServiceProvider && (
                      <div className="bg-neutral-50 p-4 rounded-lg mt-4">
                        <h3 className="font-medium mb-2">Become a Service Provider</h3>
                        <p className="text-neutral-600 text-sm mb-4">
                          Complete the form above to set up your service provider profile and start offering your services to clients.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="account" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-1">Change Password</h3>
                        <p className="text-neutral-600 text-sm mb-4">
                          Update your password to keep your account secure
                        </p>
                        <Button variant="outline">Change Password</Button>
                      </div>
                      
                      <div className="border-t pt-4 mt-6">
                        <h3 className="font-medium text-red-600 mb-1">Danger Zone</h3>
                        <p className="text-neutral-600 text-sm mb-4">
                          Delete your account and all associated data
                        </p>
                        <Button variant="destructive">Delete Account</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
