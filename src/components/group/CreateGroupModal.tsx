import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  createGroup,
  updateGroup,
  type CreateGroupPayload,
  type GroupRecord,
  type UpdateGroupPayload,
} from "@/lib/api";

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (group: GroupRecord) => void;
  editingGroup?: GroupRecord | null;
  onUpdated?: (group: GroupRecord) => void;
}

const INITIAL_FORM_DATA = {
  group: "",
  owner: "",
  superiorGroup: "",
  installationData: "",
  status: "Active" as "Active" | "Inactive",
};

const CreateGroupModal = ({
  open,
  onClose,
  onCreated,
  editingGroup,
  onUpdated,
}: CreateGroupModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const createGroupMutation = useMutation({
    mutationFn: (payload: CreateGroupPayload) => createGroup(payload),
    onSuccess: (newGroup) => {
      toast.success("Group saved", {
        description: `${newGroup.group} stored`,
      });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setFormData(INITIAL_FORM_DATA);
      onCreated?.(newGroup);
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create group"
      );
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGroupPayload }) =>
      updateGroup(id, payload),
    onSuccess: (updated) => {
      toast.success("Group updated", { description: `${updated.group} updated` });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setFormData(INITIAL_FORM_DATA);
      onUpdated?.(updated);
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update group"
      );
    },
  });

  useEffect(() => {
    if (!open) {
      setFormData(INITIAL_FORM_DATA);
      createGroupMutation.reset();
      updateGroupMutation.reset();
    }
  }, [open]);

  useEffect(() => {
    if (open && editingGroup) {
      setFormData({
        group: editingGroup.group || "",
        owner: editingGroup.owner || "",
        superiorGroup: editingGroup.superiorGroup || "",
        installationData: editingGroup.installationData || "",
        status: editingGroup.status || "Active",
      });
    }
  }, [open, editingGroup]);

  const handleSubmit = () => {
    if (!formData.group.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (editingGroup) {
      const payload: UpdateGroupPayload = {
        group: formData.group.toUpperCase(),
        owner: formData.owner.toUpperCase(),
        superiorGroup: formData.superiorGroup.toUpperCase(),
        installationData: formData.installationData.trim() || null,
        status: formData.status,
      };
      updateGroupMutation.mutate({ id: editingGroup.id, payload });
      return;
    }

    const payload: CreateGroupPayload = {
      group: formData.group.toUpperCase(),
      owner: formData.owner.toUpperCase() || undefined,
      superiorGroup: formData.superiorGroup.toUpperCase() || undefined,
      installationData: formData.installationData.trim() || undefined,
      status: formData.status,
    };
    createGroupMutation.mutate(payload);
  };

  const isPending =
    createGroupMutation.isPending || updateGroupMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {editingGroup ? "Edit Group" : "Add Group"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="group" className="text-foreground">
                  Group Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="group"
                  placeholder="e.g., FINANCE"
                  value={formData.group}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      group: e.target.value.toUpperCase(),
                    })
                  }
                  className="bg-carbon-field border-border text-foreground"
                  maxLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner" className="text-foreground">
                  Owner
                </Label>
                <Input
                  id="owner"
                  placeholder="e.g., ADMIN01"
                  value={formData.owner}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      owner: e.target.value.toUpperCase(),
                    })
                  }
                  className="bg-carbon-field border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="superiorGroup" className="text-foreground">
                  Superior Group
                </Label>
                <Input
                  id="superiorGroup"
                  placeholder="e.g., SYS1"
                  value={formData.superiorGroup}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      superiorGroup: e.target.value.toUpperCase(),
                    })
                  }
                  className="bg-carbon-field border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-foreground">
                  Status
                </Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "Active" | "Inactive",
                    })
                  }
                  className="w-full h-10 rounded-md bg-carbon-field border border-border text-foreground px-3 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="installationData" className="text-foreground">
                  Installation Data (Optional)
                </Label>
                <Input
                  id="installationData"
                  placeholder="Free-form description"
                  value={formData.installationData}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      installationData: e.target.value,
                    })
                  }
                  className="bg-carbon-field border-border text-foreground"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="review" className="mt-4">
            <div className="space-y-3 p-4 bg-muted/50 rounded">
              <h3 className="font-medium text-foreground">
                RACF Command Preview:
              </h3>
              <pre className="text-xs bg-background p-3 rounded border border-border text-foreground overflow-x-auto">
                {`${editingGroup ? "ALTGROUP" : "ADDGROUP"} ${
                  formData.group || "<GROUP>"
                } SUPGROUP(${formData.superiorGroup || "SYS1"}) OWNER(${
                  formData.owner || "IBMUSER"
                })${
                  formData.installationData
                    ? ` DATA('${formData.installationData}')`
                    : ""
                }`}
              </pre>
              <p className="text-xs text-muted-foreground">
                Review the command that will be executed. Click{" "}
                {editingGroup ? "Save Changes" : "Create Group"} to submit.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isPending}
          >
            {createGroupMutation.isPending
              ? "Creating..."
              : updateGroupMutation.isPending
              ? "Saving..."
              : editingGroup
              ? "Save Changes"
              : "Create Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;
