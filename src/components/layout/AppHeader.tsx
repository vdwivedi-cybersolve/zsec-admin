import { Home, Moon, Settings, HelpCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const AppHeader = () => {
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
        <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
