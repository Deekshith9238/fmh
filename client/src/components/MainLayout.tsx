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
  const { user, serverUser, logoutMutation } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"login" | "register">("login");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const closeDialog = () => {
    setAuthDialogOpen(false);
  };

  const openAuthDialog = (tab: "login" | "register") => {
    setAuthDefaultTab(tab);
    setAuthDialogOpen(true);
  };

  // Get user initials from serverUser or Firebase user
  const getUserInitials = () => {
    if (serverUser?.firstName && serverUser?.lastName) {
      return `${serverUser.firstName[0]}${serverUser.lastName[0]}`.toUpperCase();
    }
    if (user?.displayName) {
      return user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase();
    }
    return '?';
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
              FindMyHelper
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/service-categories" className="font-medium hover:text-primary transition-colors">
              Services
            </Link>
            {user && (
              <>
                <Link href="/profile" className="font-medium hover:text-primary transition-colors">
                  Profile
                </Link>
                {serverUser?.isAdmin && (
                  <Link href="/admin" className="font-medium hover:text-primary transition-colors text-red-600">
                    Admin
                  </Link>
                )}
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
                    {getUserInitials()}
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="hidden md:block"
                  onClick={() => openAuthDialog("login")}
                >
                  Log in
                </Button>
                <Button
                  className="hidden md:block"
                  onClick={() => openAuthDialog("register")}
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
                      <Link href="/profile" className="font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                        Profile
                      </Link>
                      {serverUser?.isAdmin && (
                        <Link href="/admin" className="font-medium hover:text-primary transition-colors text-red-600" onClick={() => setMobileMenuOpen(false)}>
                          Admin
                        </Link>
                      )}
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
                          openAuthDialog("login");
                          setMobileMenuOpen(false);
                        }}
                      >
                        Log in
                      </Button>
                      <Button 
                        onClick={() => {
                          openAuthDialog("register");
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
          <AuthPage 
            isModal={true} 
            onClose={closeDialog} 
            defaultTab={authDefaultTab}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
