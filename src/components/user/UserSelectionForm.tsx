import { useState } from "react";
import { Info, RotateCcw, XCircle, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const FormField = ({ label, placeholder, info }: { label: string; placeholder: string; info?: string }) => (
  <div className="flex flex-col gap-1.5">
    <Label className="text-xs text-foreground flex items-center gap-1">
      {label}
      {info && <Info className="h-3 w-3 text-muted-foreground" />}
    </Label>
    <Input
      placeholder={placeholder}
      className="bg-carbon-field border-border text-foreground placeholder:text-muted-foreground h-9"
    />
  </div>
);

const CollapsibleSection = ({ title, defaultOpen = false }: { title: string; defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 hover:bg-carbon-hover transition-colors"
      >
        <span className="text-sm font-medium text-foreground">{title}</span>
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-muted-foreground" />
          <svg
            className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="pb-4 px-4 text-sm text-muted-foreground">
          Additional fields will appear here
        </div>
      )}
    </div>
  );
};

interface UserSelectionFormProps {
  onAddUser?: () => void;
  onRun?: () => void;
}

const UserSelectionForm = ({ onAddUser, onRun }: UserSelectionFormProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-medium text-foreground mb-1">User selection</h2>
              <p className="text-sm text-muted-foreground">
                Show userids that fit all of the following criteria
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Add new user or segment:
              </Label>
              <Input
                placeholder="/ or S"
                className="w-16 bg-carbon-field border-border text-foreground text-center uppercase h-8"
                maxLength={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.currentTarget.value === '/' || e.currentTarget.value.toUpperCase() === 'S')) {
                    onAddUser?.();
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button 
                onClick={() => onAddUser?.()}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-8"
              >
                Add
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <FormField label="Userid" placeholder="user profile key or filter" info="Info about userid" />
            <FormField label="Name" placeholder="name/part of name, no filter" info="Info about name" />
            <FormField label="Owned by" placeholder="group or userid, or filter" info="Info about owner" />
            <FormField label="Default group" placeholder="group or filter" info="Info about default group" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <FormField label="Connect group" placeholder="group or filter" info="Info about connect group" />
            <FormField
              label="Installation data"
              placeholder="data scan, no filter except *"
              info="Info about installation data"
            />
          </div>

          <CollapsibleSection title="Other Fields" />
          <CollapsibleSection title="Attributes" />
          <CollapsibleSection title="Segments" />
        </div>
      </div>

      <div className="border-t border-border p-4 bg-carbon-layer-01 flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary hover:bg-carbon-hover"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset form fields
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary hover:bg-carbon-hover"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Clear input fields
          </Button>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
          type="button"
          onClick={() => onRun?.()}
        >
          Run
        </Button>
      </div>
    </div>
  );
};

export default UserSelectionForm;
