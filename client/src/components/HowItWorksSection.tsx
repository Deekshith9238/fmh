import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AuthPage from "@/pages/auth-page";

export default function HowItWorksSection() {
  const { user } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  return (
    <section id="how-it-works" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">How Find My Helper works</h2>
        <p className="text-neutral-600 text-center mb-16 max-w-2xl mx-auto">Get the help you need in just a few simple steps</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-6">
              <span className="text-primary text-2xl font-bold">1</span>
            </div>
            <h3 className="font-semibold text-xl mb-3">Describe your task</h3>
            <p className="text-neutral-600">Tell us what you need help with, your location, and when you need it done.</p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-6">
              <span className="text-primary text-2xl font-bold">2</span>
            </div>
            <h3 className="font-semibold text-xl mb-3">Choose a service provider</h3>
            <p className="text-neutral-600">Browse profiles, compare reviews and prices, and select the perfect match for your task.</p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-6">
              <span className="text-primary text-2xl font-bold">3</span>
            </div>
            <h3 className="font-semibold text-xl mb-3">Get it done</h3>
            <p className="text-neutral-600">Your provider completes the task to your satisfaction, and you pay securely through our platform.</p>
          </div>
        </div>
        
        <div className="text-center mt-12">
          {user ? (
            <Button className="px-6 py-6 h-auto text-lg">
              Post a task now
            </Button>
          ) : (
            <>
              <Button 
                className="px-6 py-6 h-auto text-lg"
                onClick={() => setAuthDialogOpen(true)}
              >
                Get started now
              </Button>
              
              <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                <DialogContent className="sm:max-w-[425px] p-0">
                  <AuthPage 
                    isModal={true} 
                    onClose={() => setAuthDialogOpen(false)} 
                  />
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
