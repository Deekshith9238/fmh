import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { useQuery } from "@tanstack/react-query";
import { Loader2, User, BriefcaseBusiness } from "lucide-react";
import ImageUpload from "./ImageUpload";

// Schema for additional details after Google signup
const googleSignupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
  isServiceProvider: z.boolean(),
  // Provider-specific fields
  categoryId: z.string().optional(),
  hourlyRate: z.string().optional(),
  bio: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  availability: z.string().optional(),
});

type GoogleSignupFormValues = z.infer<typeof googleSignupSchema>;

interface GoogleSignupDetailsProps {
  googleUser: any;
  onSubmit: (data: GoogleSignupFormValues, profileImage: File | null, idImage: File | null) => void;
  isLoading?: boolean;
}

export default function GoogleSignupDetails({ googleUser, onSubmit, isLoading = false }: GoogleSignupDetailsProps) {
  const [accountType, setAccountType] = useState<string>("client");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [idImage, setIdImage] = useState<File | null>(null);
  
  // Fetch service categories for provider signup
  const { data: categories = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/categories"],
    enabled: accountType === "provider",
  });

  const form = useForm<GoogleSignupFormValues>({
    resolver: zodResolver(googleSignupSchema),
    defaultValues: {
      username: googleUser.email?.split('@')[0] || "",
      firstName: googleUser.displayName?.split(' ')[0] || "",
      lastName: googleUser.displayName?.split(' ').slice(1).join(' ') || "",
      phoneNumber: "",
      isServiceProvider: false,
      categoryId: "",
      hourlyRate: "",
      bio: "",
      yearsOfExperience: "",
      availability: "",
    },
  });

  const handleAccountTypeChange = (value: string) => {
    setAccountType(value);
    form.setValue("isServiceProvider", value === "provider");
  };

  const handleSubmit = (values: GoogleSignupFormValues) => {
    onSubmit(values, profileImage, idImage);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
        <p className="text-muted-foreground">
          Please provide some additional information to complete your account setup
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Account Type Selection */}
          <div>
            <Label className="text-base font-medium">Account Type</Label>
            <RadioGroup
              value={accountType}
              onValueChange={handleAccountTypeChange}
              className="grid grid-cols-2 gap-4 mt-2"
            >
              <Label
                htmlFor="client"
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:border-primary ${
                  accountType === "client" ? "border-primary" : "border-neutral-200"
                }`}
              >
                <RadioGroupItem value="client" id="client" className="sr-only" />
                <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mb-2">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <span className="font-medium">I need services</span>
                <p className="text-sm text-neutral-500 mt-1">Hire skilled professionals</p>
              </Label>
              <Label
                htmlFor="provider"
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:border-primary ${
                  accountType === "provider" ? "border-primary" : "border-neutral-200"
                }`}
              >
                <RadioGroupItem value="provider" id="provider" className="sr-only" />
                <div className="w-12 h-12 rounded-full bg-secondary-light flex items-center justify-center mb-2">
                  <BriefcaseBusiness className="h-6 w-6 text-secondary" />
                </div>
                <span className="font-medium">I provide services</span>
                <p className="text-sm text-neutral-500 mt-1">Offer skills & earn money</p>
              </Label>
            </RadioGroup>
          </div>

          {/* Profile Picture Upload */}
          <ImageUpload
            label="Profile Picture"
            description="Upload a clear photo of yourself for your profile"
            onImageUpload={(file, url) => setProfileImage(file)}
            currentImageUrl={googleUser.photoURL}
            required={true}
          />

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
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
              control={form.control}
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
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
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

          {/* Provider-specific fields */}
          {accountType === "provider" && (
            <div className="space-y-6 border-t pt-6">
              <h3 className="text-lg font-medium">Service Provider Details</h3>

              {/* ID Verification Upload */}
              <ImageUpload
                label="ID Verification"
                description="Upload a clear photo of your government-issued ID for verification"
                onImageUpload={(file, url) => setIdImage(file)}
                accept="image/*"
                maxSize={10}
                required={true}
              />

              <FormField
                control={form.control}
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
                          <SelectValue placeholder="Select your main service" />
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
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="25"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Your Services</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your experience, skills, and the services you offer..."
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="yearsOfExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="5"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Weekdays, 9AM-5PM"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Complete Registration"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
} 