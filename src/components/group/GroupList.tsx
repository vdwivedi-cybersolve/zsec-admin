import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  deleteGroup,
  fetchGroups,
  fetchUsers,
  type GroupRecord,
} from "@/lib/api";

interface GroupListProps {
  onCreateGroup: () => void;
  onEditGroup?: (group: GroupRecord) => void;
  onManageMembers?: (group: GroupRecord) => void;
}

const GroupList = ({
  onCreateGroup,
  onEditGroup,
  onManageMembers,
}: GroupListProps) => {
  const queryClient = useQueryClient();
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const {
    data: groups = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
  });

  // Used only to display a per-group member count.
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const memberCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const user of users) {
      const groupsForUser = new Set<string>([
        user.defaultGroup,
        ...(user.connectGroups ?? []),
      ]);
      for (const g of groupsForUser) {
        counts.set(g, (counts.get(g) ?? 0) + 1);
      }
    }
    return counts;
  }, [users]);

  useEffect(() => {
    setSelectedGroups((prev) =>
      prev.filter((id) => groups.some((group) => group.id === id))
    );
  }, [groups]);

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await deleteGroup(id);
    },
    onSuccess: (_data, ids) => {
      toast.success(
        ids.length === 1
          ? "Group deleted successfully"
          : `${ids.length} groups deleted successfully`
      );
      setSelectedGroups([]);
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (mutationError: unknown) => {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to delete groups"
      );
    },
  });

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border p-4 bg-carbon-layer-01">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">
            Group Management
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={() => onCreateGroup()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Group
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={selectedGroups.length !== 1}
              className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:pointer-events-none"
              onClick={() => {
                const group = groups.find((g) => g.id === selectedGroups[0]);
                if (group) onManageMembers?.(group);
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Members
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={selectedGroups.length !== 1}
              className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:pointer-events-none"
              onClick={() => {
                const group = groups.find((g) => g.id === selectedGroups[0]);
                if (group) onEditGroup?.(group);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedGroups.length === 0 || deleteMutation.isPending}
              className="border-border text-destructive hover:text-destructive"
              onClick={() => deleteMutation.mutate(selectedGroups)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  checked={
                    groups.length > 0 &&
                    selectedGroups.length === groups.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedGroups(groups.map((g) => g.id));
                    } else {
                      setSelectedGroups([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead className="text-foreground">Group</TableHead>
              <TableHead className="text-foreground">Owner</TableHead>
              <TableHead className="text-foreground">Superior Group</TableHead>
              <TableHead className="text-foreground">Members</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="w-24 text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  Loading groups...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow className="border-border">
                <TableCell colSpan={7} className="text-center text-destructive">
                  {(error instanceof Error && error.message) ||
                    "Failed to load groups."}
                </TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No groups found. Create a group to get started.
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group: GroupRecord) => (
                <TableRow
                  key={group.id}
                  className="border-border hover:bg-carbon-hover cursor-pointer"
                  onDoubleClick={() => onEditGroup?.(group)}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={selectedGroups.includes(group.id)}
                      onChange={() => toggleGroup(group.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm text-foreground">
                    {group.group}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {group.owner}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {group.superiorGroup}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {memberCounts.get(group.group) ?? 0}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                      {group.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onManageMembers?.(group);
                        }}
                        title="Manage members"
                      >
                        <Users className="h-4 w-4 text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditGroup?.(group);
                        }}
                        title="Edit group"
                      >
                        <Edit className="h-4 w-4 text-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GroupList;
