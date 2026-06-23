import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  fetchUsers,
  setUserGroups,
  type GroupRecord,
  type UserRecord,
} from "@/lib/api";

interface ManageMembersDialogProps {
  open: boolean;
  onClose: () => void;
  group: GroupRecord | null;
}

const isConnected = (user: UserRecord, group: string) =>
  (user.connectGroups ?? []).includes(group);

const isDefaultMember = (user: UserRecord, group: string) =>
  user.defaultGroup === group;

const ManageMembersDialog = ({
  open,
  onClose,
  group,
}: ManageMembersDialogProps) => {
  const queryClient = useQueryClient();
  // Selected = userIds explicitly connected via connectGroups.
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    enabled: open,
  });

  useEffect(() => {
    if (open && group) {
      setSelected(
        new Set(
          users.filter((u) => isConnected(u, group.group)).map((u) => u.id)
        )
      );
    }
  }, [open, group, users]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!group) return;
      const groupName = group.group;
      // Apply only the diffs: connect newly-checked, disconnect unchecked.
      await Promise.all(
        users.map(async (user) => {
          if (isDefaultMember(user, groupName)) return; // implicit, untouched
          const wasConnected = isConnected(user, groupName);
          const nowConnected = selected.has(user.id);
          if (wasConnected === nowConnected) return;
          const next = nowConnected
            ? [...(user.connectGroups ?? []), groupName]
            : (user.connectGroups ?? []).filter((g) => g !== groupName);
          await setUserGroups(user.id, next);
        })
      );
    },
    onSuccess: () => {
      toast.success("Group membership updated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update membership"
      );
    },
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
            Manage Members — {group?.group}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Connect or disconnect users from this group. Users whose default group
          is <span className="font-mono">{group?.group}</span> are members by
          default and cannot be removed here.
        </p>

        <div className="max-h-80 overflow-auto rounded border border-border">
          {isLoading ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Loading users…
            </p>
          ) : users.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No users available.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {users.map((user) => {
                const defaultMember = group
                  ? isDefaultMember(user, group.group)
                  : false;
                return (
                  <li
                    key={user.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-carbon-hover"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={defaultMember || selected.has(user.id)}
                      disabled={defaultMember}
                      onChange={() => toggle(user.id)}
                    />
                    <span className="font-mono text-sm text-foreground">
                      {user.userid}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {user.name}
                    </span>
                    {defaultMember && (
                      <span className="ml-auto text-xs text-primary">
                        default group
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border"
            disabled={saveMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving…" : "Save Members"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageMembersDialog;
