import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { assignGroupToUsers, fetchGroups } from "@/lib/api";

interface AssignGroupDialogProps {
  open: boolean;
  onClose: () => void;
  userIds: string[];
}

const AssignGroupDialog = ({
  open,
  onClose,
  userIds,
}: AssignGroupDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState("");

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
    enabled: open,
  });

  useEffect(() => {
    if (open) setSelectedGroup("");
  }, [open]);

  const assignMutation = useMutation({
    mutationFn: () => assignGroupToUsers(selectedGroup, userIds),
    onSuccess: () => {
      toast.success(
        userIds.length === 1
          ? `User connected to ${selectedGroup}`
          : `${userIds.length} users connected to ${selectedGroup}`
      );
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign group"
      );
    },
  });

  const handleAssign = () => {
    if (!selectedGroup) {
      toast.error("Please select a group");
      return;
    }
    assignMutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Assign to Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect{" "}
            {userIds.length === 1
              ? "the selected user"
              : `${userIds.length} selected users`}{" "}
            to a RACF group.
          </p>
          <div className="space-y-2">
            <Label htmlFor="assign-group" className="text-foreground">
              Group
            </Label>
            <select
              id="assign-group"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              disabled={isLoading}
              className="w-full h-10 rounded-md bg-carbon-field border border-border text-foreground px-3 text-sm"
            >
              <option value="">
                {isLoading ? "Loading groups…" : "Select a group"}
              </option>
              {groups.map((group) => (
                <option key={group.id} value={group.group}>
                  {group.group}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border"
            disabled={assignMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={assignMutation.isPending || !selectedGroup}
          >
            {assignMutation.isPending ? "Assigning…" : "Assign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignGroupDialog;
