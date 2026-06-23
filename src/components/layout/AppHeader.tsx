import { Home, Moon, Settings, HelpCircle, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";

const AppHeader = () => {
  const { loginId, signOut } = useAuth();

  return (
    <header className="h-12 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <span className="text-sidebar-foreground font-medium text-sm">IBM Security zSecure</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent">
          <Home className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent">
          <Moon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent">
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent">
          <HelpCircle className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <User className="h-4 w-4" />
              {loginId && <span className="text-xs font-medium">{loginId}</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuLabel className="text-foreground">
              {loginId ? `Signed in as ${loginId}` : "Account"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-foreground cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;
