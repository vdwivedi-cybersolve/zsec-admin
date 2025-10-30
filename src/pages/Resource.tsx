import { ChevronRight } from "lucide-react";

const Resource = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-carbon-layer-01 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-primary">RACF</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Resource</span>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-foreground mb-2">Resource Management</h2>
          <p className="text-muted-foreground">Resource management interface coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default Resource;
