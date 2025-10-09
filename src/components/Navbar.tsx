import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Home, User, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { signOut, getAuthState } from "@/lib/auth";

export const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { user } = await getAuthState();
      setUser(user);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
      navigate("/");
    }
  };

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FitTrackr</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Link>
            <Button
              variant="ghost"
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full justify-start"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};
