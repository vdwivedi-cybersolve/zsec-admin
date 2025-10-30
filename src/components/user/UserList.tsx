import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { deleteUser, fetchUsers, type UserRecord } from "@/lib/api";

interface UserListProps {
  onCreateUser: () => void;
  onEditUser?: (user: UserRecord) => void;
}

const UserList = ({ onCreateUser, onEditUser }: UserListProps) => {
  const queryClient = useQueryClient();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  useEffect(() => {
    setSelectedUsers((prev) =>
      prev.filter((id) => users.some((user) => user.id === id))
    );
  }, [users]);

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => deleteUser(id)));
    },
    onSuccess: (_data, ids) => {
      toast.success(
        ids.length === 1
          ? "User deleted successfully"
          : `${ids.length} users deleted successfully`
      );
      setSelectedUsers([]);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (mutationError: unknown) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to delete users";
      toast.error(message);
    },
  });

  const toggleUser = (id: string) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border p-4 bg-carbon-layer-01">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">User Management</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => onCreateUser()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={selectedUsers.length === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:pointer-events-none"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign to Group
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={selectedUsers.length !== 1}
              className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:pointer-events-none"
              onClick={() => {
                if (selectedUsers.length === 1 && onEditUser) {
                  const user = users.find(u => u.id === selectedUsers[0]);
                  if (user) onEditUser(user);
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                selectedUsers.length === 0 || deleteMutation.isPending
              }
              className="border-border text-destructive hover:text-destructive"
              onClick={() => deleteMutation.mutate(selectedUsers)}
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
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(users.map(u => u.id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead className="text-foreground">User ID</TableHead>
              <TableHead className="text-foreground">Name</TableHead>
              <TableHead className="text-foreground">Default Group</TableHead>
              <TableHead className="text-foreground">Owner</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="w-24 text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="text-center text-destructive">
                  {(error instanceof Error && error.message) || "Failed to load users."}
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No users found. Create a user to get started.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: UserRecord) => (
                <TableRow
                  key={user.id}
                  className="border-border hover:bg-carbon-hover cursor-pointer"
                  onDoubleClick={() => onEditUser?.(user)}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm text-foreground">{user.userid}</TableCell>
                  <TableCell className="text-foreground">{user.name}</TableCell>
                  <TableCell className="text-foreground">{user.defaultGroup}</TableCell>
                  <TableCell className="text-foreground">{user.owner}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditUser?.(user);
                        }}
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

export default UserList;
