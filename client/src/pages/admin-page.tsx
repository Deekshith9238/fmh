import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Check, X, Eye, Clock, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PendingProvider {
  id: number;
  userId: number;
  categoryId: number;
  bio: string;
  hourlyRate: number;
  yearsOfExperience: number;
  availability: string;
  idVerificationImage: string;
  isVerified: boolean;
  approvalStatus: string;
  adminNotes: string;
  submittedAt: string;
  reviewedAt: string;
  reviewedBy: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture: string;
    username: string;
  };
  category: {
    id: number;
    name: string;
    description: string;
  };
}

export default function AdminPage() {
  const { toast } = useToast();
  const { serverUser, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<PendingProvider | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);

  // Check if user has admin privileges
  const isAdmin = serverUser?.isAdmin === true;

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Show access denied message for non-admin users
  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="bg-neutral-50 min-h-screen py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-neutral-600 mb-6">
                You don't have permission to access the admin dashboard.
              </p>
              <Button asChild>
                <a href="/">Return to Home</a>
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Fetch pending providers (only if admin)
  const { data: pendingProviders = [], isLoading, error } = useQuery<PendingProvider[]>({
    queryKey: ["/api/admin/pending-providers"],
    enabled: isAdmin, // Only fetch if user is admin
  });

  // Show error message if admin API call fails
  if (error) {
    return (
      <MainLayout>
        <div className="bg-neutral-50 min-h-screen py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Admin Access Error</h1>
              <p className="text-neutral-600 mb-6">
                Unable to load admin dashboard. Please try again later.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Approve provider mutation
  const approveMutation = useMutation({
    mutationFn: async ({ providerId, notes }: { providerId: number; notes?: string }) => {
      const response = await fetch(`/api/admin/providers/${providerId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminNotes: notes }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to approve provider");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-providers"] });
      toast({
        title: "Provider approved",
        description: "The service provider has been approved successfully",
      });
      setIsApprovalDialogOpen(false);
      setSelectedProvider(null);
      setAdminNotes("");
    },
    onError: (error) => {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject provider mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ providerId, notes }: { providerId: number; notes: string }) => {
      const response = await fetch(`/api/admin/providers/${providerId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminNotes: notes }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to reject provider");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-providers"] });
      toast({
        title: "Provider rejected",
        description: "The service provider has been rejected",
      });
      setIsRejectionDialogOpen(false);
      setSelectedProvider(null);
      setAdminNotes("");
    },
    onError: (error) => {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (provider: PendingProvider) => {
    setSelectedProvider(provider);
    setIsApprovalDialogOpen(true);
  };

  const handleReject = (provider: PendingProvider) => {
    setSelectedProvider(provider);
    setIsRejectionDialogOpen(true);
  };

  const confirmApprove = () => {
    if (selectedProvider) {
      approveMutation.mutate({
        providerId: selectedProvider.id,
        notes: adminNotes,
      });
    }
  };

  const confirmReject = () => {
    if (selectedProvider && adminNotes.trim()) {
      rejectMutation.mutate({
        providerId: selectedProvider.id,
        notes: adminNotes,
      });
    } else {
      toast({
        title: "Notes required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-neutral-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-neutral-600">
              Manage service provider approvals and platform administration
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Service Provider Approvals
                <Badge variant="secondary">{pendingProviders.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingProviders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-600">No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProviders.map((provider) => (
                    <Card key={provider.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-lg font-bold">
                            {provider.user.profilePicture ? (
                              <img
                                src={provider.user.profilePicture}
                                alt={`${provider.user.firstName} ${provider.user.lastName}`}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            ) : (
                              `${provider.user.firstName[0]}${provider.user.lastName[0]}`
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {provider.user.firstName} {provider.user.lastName}
                            </h3>
                            <p className="text-neutral-600">{provider.user.email}</p>
                            <p className="text-sm text-neutral-500">@{provider.user.username}</p>
                            
                            <div className="mt-2 space-y-1">
                              <p><strong>Category:</strong> {provider.category.name}</p>
                              <p><strong>Hourly Rate:</strong> ${provider.hourlyRate}/hr</p>
                              <p><strong>Experience:</strong> {provider.yearsOfExperience} years</p>
                              <p><strong>Availability:</strong> {provider.availability}</p>
                            </div>
                            
                            {provider.bio && (
                              <div className="mt-2">
                                <p className="text-sm"><strong>Bio:</strong></p>
                                <p className="text-sm text-neutral-600">{provider.bio}</p>
                              </div>
                            )}
                            
                            <div className="mt-2">
                              <p className="text-sm text-neutral-500">
                                Submitted: {new Date(provider.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {provider.idVerificationImage && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View ID
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>ID Verification Document</DialogTitle>
                                  <DialogDescription>
                                    Review the uploaded identification document
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-center">
                                  <img
                                    src={provider.idVerificationImage}
                                    alt="ID Verification"
                                    className="max-w-full max-h-96 object-contain rounded"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          <Button
                            onClick={() => handleApprove(provider)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          
                          <Button
                            onClick={() => handleReject(provider)}
                            variant="destructive"
                            size="sm"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Service Provider</DialogTitle>
            <DialogDescription>
              Approve {selectedProvider?.user.firstName} {selectedProvider?.user.lastName} as a service provider.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Admin Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes about this approval..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Service Provider</DialogTitle>
            <DialogDescription>
              Reject {selectedProvider?.user.firstName} {selectedProvider?.user.lastName} as a service provider.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for Rejection *</label>
              <Textarea
                placeholder="Please provide a reason for rejection..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              disabled={rejectMutation.isPending || !adminNotes.trim()}
              variant="destructive"
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
} 