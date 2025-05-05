import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AuthPage from "@/pages/auth-page";
import Footer from "./Footer";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation, isProvider } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const closeDialog = () => {
    setAuthDialogOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-primary font-bold text-2xl flex items-center">
              <span className="bg-primary text-white p-1 rounded mr-1">
                <i className="fas fa-tasks"></i>
              </span>
              Find My Helper
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/service-categories" className="font-medium hover:text-primary transition-colors">
              Services
            </Link>
            {user && (
              <>
                {isProvider ? (
                  <Link href="/provider-dashboard" className="font-medium hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/client-dashboard" className="font-medium hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                )}
                <Link href="/profile" className="font-medium hover:text-primary transition-colors">
                  Profile
                </Link>
              </>
            )}
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="hidden md:block"
                >
                  Log out
                </Button>
                <Link href="/profile" className="hidden md:flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="hidden md:block"
                  onClick={() => setAuthDialogOpen(true)}
                >
                  Log in
                </Button>
                <Button
                  className="hidden md:block"
                  onClick={() => setAuthDialogOpen(true)}
                >
                  Sign up
                </Button>
              </>
            )}
            
            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                <div className="flex flex-col mt-8 space-y-4">
                  <Link href="/" className="font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Home
                  </Link>
                  <Link href="/service-categories" className="font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Services
                  </Link>
                  
                  {user ? (
                    <>
                      {isProvider ? (
                        <Link href="/provider-dashboard" className="font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                          Dashboard
                        </Link>
                      ) : (
                        <Link href="/client-dashboard" className="font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                          Dashboard
                        </Link>
                      )}
                      <Link href="/profile" className="font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                        Profile
                      </Link>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        Log out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setAuthDialogOpen(true);
                          setMobileMenuOpen(false);
                        }}
                      >
                        Log in
                      </Button>
                      <Button 
                        onClick={() => {
                          setAuthDialogOpen(true);
                          setMobileMenuOpen(false);
                        }}
                      >
                        Sign up
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Dialog */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0">
          <AuthPage isModal={true} onClose={closeDialog} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
