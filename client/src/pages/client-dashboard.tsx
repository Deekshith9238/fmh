import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, ServiceRequest } from "@shared/schema";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, FileText, CheckCircle, Clock, X, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import CreateTaskForm from "@/components/CreateTaskForm";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ClientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("tasks");
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

  // Fetch client tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks/client"],
    enabled: !!user,
  });

  // Fetch client service requests
  const { data: serviceRequests, isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/service-requests/client"],
    enabled: !!user,
  });

  // Mutation for updating request status
  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/service-requests/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests/client"] });
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

  const handleCloseDialog = () => {
    setCreateTaskDialogOpen(false);
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

  return (
    <MainLayout>
      <div className="bg-neutral-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Client Dashboard</h1>
              <p className="text-neutral-600 mt-1">
                Manage your tasks and service requests
              </p>
            </div>
            
            <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0" onClick={() => setCreateTaskDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Create a New Task</DialogTitle>
                </DialogHeader>
                <CreateTaskForm onSuccess={handleCloseDialog} />
              </DialogContent>
            </Dialog>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="tasks" className="flex-1">
                <FileText className="mr-2 h-4 w-4" />
                My Tasks
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex-1">
                <Clock className="mr-2 h-4 w-4" />
                Service Requests
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks">
              {tasksLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : tasks && tasks.length > 0 ? (
                <div className="grid gap-6">
                  {tasks.map((task) => (
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
                                <span className="font-medium">Category:</span>{" "}
                                <span className="text-neutral-600">{task.category.name}</span>
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
                          
                          <div className="flex md:flex-col gap-2 justify-end">
                            <span className="text-xs text-neutral-500">
                              Posted on {new Date(task.createdAt).toLocaleDateString()}
                            </span>
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
                    <h3 className="text-xl font-medium mb-2">No tasks yet</h3>
                    <p className="text-neutral-600 mb-6">Create your first task to find service providers</p>
                    <Button 
                      onClick={() => setCreateTaskDialogOpen(true)} 
                      className="px-6"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Task
                    </Button>
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
                                Service Request from{" "}
                                {request.provider.user.firstName} {request.provider.user.lastName}
                              </h3>
                              {getStatusBadge(request.status)}
                            </div>
                            
                            <p className="text-neutral-600 text-sm mb-4">{request.message || "No additional message provided"}</p>
                            
                            <div className="flex flex-wrap gap-4">
                              <div className="text-sm">
                                <span className="font-medium">Service:</span>{" "}
                                <span className="text-neutral-600">{request.provider.category.name}</span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Rate:</span>{" "}
                                <span className="text-neutral-600">${request.provider.hourlyRate}/hr</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <div className="text-xs text-neutral-500 mb-2">
                              Requested on {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                            
                            {request.status === "pending" && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => handleUpdateRequest(request.id, "accepted")}
                                  disabled={updateRequestMutation.isPending}
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  Accept
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleUpdateRequest(request.id, "rejected")}
                                  disabled={updateRequestMutation.isPending}
                                >
                                  <X className="mr-1 h-4 w-4" />
                                  Decline
                                </Button>
                              </div>
                            )}
                            
                            {request.status === "accepted" && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleUpdateRequest(request.id, "completed")}
                                  disabled={updateRequestMutation.isPending}
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  Mark Completed
                                </Button>
                              </div>
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
                    <Clock className="h-12 w-12 text-neutral-400 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No service requests yet</h3>
                    <p className="text-neutral-600">
                      Service requests will appear here when providers respond to your tasks
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
