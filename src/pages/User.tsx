import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserSelectionForm from "@/components/user/UserSelectionForm";
import UserList from "@/components/user/UserList";
import CreateUserModal from "@/components/user/CreateUserModal";

type UserTab = "selection" | "management";

const User = () => {
  const [activeTab, setActiveTab] = useState<UserTab>("selection");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const handleRunSearch = () => setActiveTab("management");
  const handleCreateUserClick = () => setShowCreateModal(true);
  const handleCloseModal = () => setShowCreateModal(false);
  const handleUserCreated = () => {
    setActiveTab("management");
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setShowCreateModal(true);
  };

  const handleUserUpdated = () => {
    setEditingUser(null);
    setActiveTab("management");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-carbon-layer-01 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-primary">RACF</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">User</span>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as UserTab)}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="bg-carbon-layer-01 border-b border-border px-4 py-2">
          <TabsList className="grid w-fit grid-cols-2 bg-background/40">
            <TabsTrigger value="selection">User Selection</TabsTrigger>
            <TabsTrigger value="management">User Management</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="selection"
        >
          <UserSelectionForm
            onAddUser={handleCreateUserClick}
            onRun={handleRunSearch}
          />
        </TabsContent>
        <TabsContent
          value="management"
        >
          <UserList onCreateUser={handleCreateUserClick} onEditUser={handleEditUser} />
        </TabsContent>
      </Tabs>

      <CreateUserModal
        open={showCreateModal}
        onClose={() => {
          handleCloseModal();
          setEditingUser(null);
        }}
        onCreated={handleUserCreated}
        editingUser={editingUser}
        onUpdated={handleUserUpdated}
      />
    </div>
  );
};

export default User;
