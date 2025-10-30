import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  Users, 
  UsersRound, 
  Database, 
  Shield, 
  CheckCircle, 
  Settings, 
  FileKey,
  ChevronDown,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "User", path: "/user", icon: Users },
  { title: "Group", path: "/group", icon: UsersRound },
  { title: "Dataset", path: "/dataset", icon: Database },
  { title: "Resource", path: "/resource", icon: Shield },
  { title: "Access Check", path: "/access-check", icon: CheckCircle },
];

const bottomItems = [
  { title: "Settings", path: "/settings", icon: Settings },
  { title: "Certificates", path: "/certificates", icon: FileKey },
];

const AppSidebar = () => {
  const [racfExpanded, setRacfExpanded] = useState(true);

  return (
    <aside className="w-48 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-sidebar-border">
        <button
          onClick={() => setRacfExpanded(!racfExpanded)}
          className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors text-sm font-medium w-full"
        >
          <span>RACF</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              racfExpanded && "transform rotate-180"
            )}
          />
        </button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-sidebar-foreground hover:bg-sidebar-accent">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {racfExpanded && (
        <nav className="flex-1 py-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground font-medium border-l-2 border-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
      )}

      <div className="border-t border-sidebar-border">
        {bottomItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )
            }
          >
            <button
              onClick={() => {}}
              className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors text-sm w-full"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
              <ChevronDown className="h-4 w-4 ml-auto" />
            </button>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default AppSidebar;
