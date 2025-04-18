import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, Clock, X, Briefcase, FileText } from "lucide-react";
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

// Task request schema
const taskRequestSchema = z.object({
  message: z.string().optional(),
});

type TaskRequestValues = z.infer<typeof taskRequestSchema>;

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("available-tasks");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  // Task request form
  const form = useForm<TaskRequestValues>({
    resolver: zodResolver(taskRequestSchema),
    defaultValues: {
      message: "",
    },
  });

  // Fetch provider profile information
  const { data: providerProfile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/user/provider"],
    enabled: !!user,
  });

  // Fetch all available tasks
  const { data: availableTasks, isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  // Fetch service requests related to this provider
  const { data: serviceRequests, isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/service-requests/provider"],
    enabled: !!user && !!providerProfile,
  });

  // Filter tasks that match the provider's category
  const filteredTasks = availableTasks?.filter(
    (task) => 
      task.category.id === providerProfile?.category.id && 
      task.status === "open" &&
      task.client.id !== user?.id
  );

  // Mutation for creating a service request
  const createRequestMutation = useMutation({
    mutationFn: async (data: TaskRequestValues & { taskId: number }) => {
      const requestData = {
        providerId: providerProfile.id,
        taskId: data.taskId,
        message: data.message,
      };
      const res = await apiRequest("POST", "/api/service-requests", requestData);
      return res.json();
    },
    onSuccess: () => {
      setTaskDialogOpen(false);
      setSelectedTask(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/provider"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Request sent",
        description: "Your service request has been sent to the client",
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

  // Mutation for updating service request status
  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/service-requests/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/provider"] });
      toast({
        title: "Request updated",
        description: "The request status has been updated successfully",
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

  // Handle opening task dialog
  const handleOpenTaskDialog = (task: any) => {
    setSelectedTask(task);
    setTaskDialogOpen(true);
  };

  // Handle sending service request
  const onSubmitTaskRequest = (values: TaskRequestValues) => {
    if (!selectedTask) return;
    
    createRequestMutation.mutate({
      ...values,
      taskId: selectedTask.id,
    });
  };

  // Handle updating service request status
  const handleUpdateRequest = (id: number, status: string) => {
    updateRequestMutation.mutate({ id, status });
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500">Open</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-purple-500">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-400">Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-500">Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (profileLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!providerProfile) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Provider Profile Not Found</h1>
          <p className="text-neutral-600 mb-6">
            You don't have a service provider profile yet. Please update your profile to become a service provider.
          </p>
          <Button href="/profile">Update Profile</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-neutral-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Provider Dashboard</h1>
              <p className="text-neutral-600 mt-1">
                Find tasks and manage your service requests
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center gap-2 bg-white p-2 px-4 rounded-lg shadow-sm">
              <Badge className="bg-primary">{providerProfile.category.name}</Badge>
              <div className="text-sm">
                <span className="font-medium">Rate:</span>{" "}
                <span className="text-neutral-600">${providerProfile.hourlyRate}/hr</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Rating:</span>{" "}
                <span className="text-neutral-600">
                  {providerProfile.rating ? (
                    <span className="flex items-center">
                      {providerProfile.rating.toFixed(1)}
                      <i className="fas fa-star text-yellow-500 ml-1"></i>
                    </span>
                  ) : (
                    "New"
                  )}
                </span>
              </div>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="available-tasks" className="flex-1">
                <FileText className="mr-2 h-4 w-4" />
                Available Tasks
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex-1">
                <Briefcase className="mr-2 h-4 w-4" />
                Service Requests
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="available-tasks">
              {tasksLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredTasks && filteredTasks.length > 0 ? (
                <div className="grid gap-6">
                  {filteredTasks.map((task) => (
                    <Card key={task.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{task.title}</h3>
                              {getStatusBadge(task.status)}
                            </div>
                            <p className="text-neutral-600 text-sm mb-4">{task.description}</p>
                            <div className="flex flex-wrap gap-4">
                              <div className="text-sm">
                                <span className="font-medium">Client:</span>{" "}
                                <span className="text-neutral-600">
                                  {task.client.firstName} {task.client.lastName}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Location:</span>{" "}
                                <span className="text-neutral-600">{task.location}</span>
                              </div>
                              {task.budget && (
                                <div className="text-sm">
                                  <span className="font-medium">Budget:</span>{" "}
                                  <span className="text-neutral-600">${task.budget}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <span className="text-xs text-neutral-500">
                              Posted on {new Date(task.createdAt).toLocaleDateString()}
                            </span>
                            <Button onClick={() => handleOpenTaskDialog(task)}>
                              Submit Offer
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-neutral-400 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No available tasks</h3>
                    <p className="text-neutral-600">
                      There are currently no tasks available in your category.
                      Check back later or explore other categories.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="requests">
              {requestsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : serviceRequests && serviceRequests.length > 0 ? (
                <div className="grid gap-6">
                  {serviceRequests.map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                Request to {request.client.firstName} {request.client.lastName}
                              </h3>
                              {getStatusBadge(request.status)}
                            </div>
                            
                            <p className="text-neutral-600 text-sm mb-4">
                              {request.message || "No additional message provided"}
                            </p>
                            
                            {request.taskId && (
                              <div className="p-3 bg-neutral-50 rounded-md mb-4">
                                <div className="text-sm font-medium mb-1">Task Details:</div>
                                <div className="text-sm">
                                  <span className="text-neutral-600">
                                    {request.task?.title || "Task information not available"}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-4">
                              <div className="text-sm">
                                <span className="font-medium">Status:</span>{" "}
                                <span className="text-neutral-600">{request.status}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <span className="text-xs text-neutral-500">
                              Requested on {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                            
                            {request.status === "accepted" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleUpdateRequest(request.id, "in-progress")}
                                disabled={updateRequestMutation.isPending}
                              >
                                <Clock className="mr-1 h-4 w-4" />
                                Start Job
                              </Button>
                            )}
                            
                            {request.status === "in-progress" && (
                              <Button 
                                size="sm"
                                onClick={() => handleUpdateRequest(request.id, "completed")}
                                disabled={updateRequestMutation.isPending}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Mark Completed
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Briefcase className="h-12 w-12 text-neutral-400 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No service requests yet</h3>
                    <p className="text-neutral-600">
                      You haven't submitted any service requests yet. 
                      Browse available tasks and submit offers.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Submit Service Offer</DialogTitle>
            <DialogDescription>
              Send a request to the client for this task. Include any details about how you can help.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="py-2">
              <h3 className="font-semibold">{selectedTask.title}</h3>
              <p className="text-sm text-neutral-600 mt-1 mb-3">{selectedTask.description}</p>
              
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div>
                  <span className="font-medium">Client:</span>{" "}
                  <span className="text-neutral-600">
                    {selectedTask.client.firstName} {selectedTask.client.lastName}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Location:</span>{" "}
                  <span className="text-neutral-600">{selectedTask.location}</span>
                </div>
                <div>
                  <span className="font-medium">Category:</span>{" "}
                  <span className="text-neutral-600">{selectedTask.category.name}</span>
                </div>
                {selectedTask.budget && (
                  <div>
                    <span className="font-medium">Budget:</span>{" "}
                    <span className="text-neutral-600">${selectedTask.budget}</span>
                  </div>
                )}
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitTaskRequest)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Introduce yourself and explain how you can help with this task..."
                            className="min-h-[100px]"
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
                      onClick={() => setTaskDialogOpen(false)}
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
                          Submitting...
                        </>
                      ) : (
                        "Submit Request"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
