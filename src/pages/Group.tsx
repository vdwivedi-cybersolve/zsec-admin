import { useState } from "react";
import { ChevronRight } from "lucide-react";
import GroupList from "@/components/group/GroupList";
import CreateGroupModal from "@/components/group/CreateGroupModal";
import ManageMembersDialog from "@/components/group/ManageMembersDialog";
import type { GroupRecord } from "@/lib/api";

const Group = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupRecord | null>(null);
  const [membersGroup, setMembersGroup] = useState<GroupRecord | null>(null);

  const handleEditGroup = (group: GroupRecord) => {
    setEditingGroup(group);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingGroup(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-carbon-layer-01 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-primary">RACF</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Group</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <GroupList
          onCreateGroup={() => {
            setEditingGroup(null);
            setShowCreateModal(true);
          }}
          onEditGroup={handleEditGroup}
          onManageMembers={(group) => setMembersGroup(group)}
        />
      </div>

      <CreateGroupModal
        open={showCreateModal}
        onClose={closeModal}
        editingGroup={editingGroup}
        onCreated={closeModal}
        onUpdated={closeModal}
      />

      <ManageMembersDialog
        open={Boolean(membersGroup)}
        group={membersGroup}
        onClose={() => setMembersGroup(null)}
      />
    </div>
  );
};

export default Group;
