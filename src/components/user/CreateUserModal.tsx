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
  createUser,
  updateUser,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UserRecord,
} from "@/lib/api";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (user: UserRecord) => void;
  editingUser?: UserRecord | null;
  onUpdated?: (user: UserRecord) => void;
}

const INITIAL_FORM_DATA = {
  userid: "",
  name: "",
  defaultGroup: "",
  password: "",
  passwordConfirm: "",
  passwordPhrase: "",
  passwordPhraseConfirm: "",
  authOption: "1" as "1" | "2" | "3" | "4",
  expiration: "",
};

const CreateUserModal = ({
  open,
  onClose,
  onCreated,
  editingUser,
  onUpdated,
}: CreateUserModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const createUserMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: (newUser) => {
      toast.success("User saved", {
        description: `${newUser.userid} stored locally`,
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setFormData(INITIAL_FORM_DATA);
      onCreated?.(newUser);
      onClose();
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create user");
      }
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: (updated) => {
      toast.success("User updated", {
        description: `${updated.userid} updated`,
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setFormData(INITIAL_FORM_DATA);
      onUpdated?.(updated);
      onClose();
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update user");
      }
    },
  });

  useEffect(() => {
    if (!open) {
      setFormData(INITIAL_FORM_DATA);
      createUserMutation.reset();
      updateUserMutation.reset();
    }
  }, [open]);

  // Populate form fields when opening in edit mode, or when the editing user changes while open
  useEffect(() => {
    if (open && editingUser) {
      setFormData({
        userid: editingUser.userid || "",
        name: editingUser.name || "",
        defaultGroup: editingUser.defaultGroup || "",
        password: "",
        passwordConfirm: "",
        passwordPhrase: "",
        passwordPhraseConfirm: "",
        authOption: editingUser.authOption || "1",
        expiration: editingUser.expiration || "",
      });
    }
  }, [open, editingUser]);

  const handleSubmit = () => {
    if (!formData.userid || !formData.name || !formData.defaultGroup) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate authentication based on option
    if (formData.authOption !== "4") {
      if (
        (formData.authOption === "1" || formData.authOption === "3") &&
        formData.password
      ) {
        if (formData.password !== formData.passwordConfirm) {
          toast.error("Passwords do not match");
          return;
        }
        if (formData.password.toUpperCase() === formData.userid.toUpperCase()) {
          toast.error("Password cannot equal the user ID");
          return;
        }
        if (
          formData.password.toUpperCase() ===
          formData.defaultGroup.toUpperCase()
        ) {
          toast.error("Password cannot equal the default group");
          return;
        }
      }

      if (
        (formData.authOption === "2" || formData.authOption === "3") &&
        formData.passwordPhrase
      ) {
        if (formData.passwordPhrase !== formData.passwordPhraseConfirm) {
          toast.error("Password phrases do not match");
          return;
        }
      }
    }

    if (editingUser) {
      const payload: UpdateUserPayload = {
        userid: formData.userid.toUpperCase(),
        name: formData.name.trim(),
        defaultGroup: formData.defaultGroup.toUpperCase(),
        authOption: formData.authOption,
        ...(formData.expiration ? { expiration: formData.expiration } : {}),
      };
      updateUserMutation.mutate({ id: editingUser.id, payload });
      return;
    }

    const payload: CreateUserPayload = {
      userid: formData.userid.toUpperCase(),
      name: formData.name.trim(),
      defaultGroup: formData.defaultGroup.toUpperCase(),
      authOption: formData.authOption,
      expiration: formData.expiration || undefined,
    };

    createUserMutation.mutate(payload);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {editingUser ? "Edit User" : "Add User"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-muted">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="attributes">Attributes</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userid" className="text-foreground">
                  User ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="userid"
                  placeholder="e.g., JDOE"
                  value={formData.userid}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      userid: e.target.value.toUpperCase(),
                    })
                  }
                  className="bg-carbon-field border-border text-foreground"
                  maxLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">
                  Full Name / Description{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., John Doe - Contractor"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-carbon-field border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultGroup" className="text-foreground">
                  Default Group <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="defaultGroup"
                  placeholder="e.g., STAFF"
                  value={formData.defaultGroup}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultGroup: e.target.value.toUpperCase(),
                    })
                  }
                  className="bg-carbon-field border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration" className="text-foreground">
                  Expiration Date (Optional)
                </Label>
                <Input
                  id="expiration"
                  type="date"
                  value={formData.expiration}
                  onChange={(e) =>
                    setFormData({ ...formData, expiration: e.target.value })
                  }
                  className="bg-carbon-field border-border text-foreground"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attributes" className="mt-4">
            <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded">
              Additional user attributes and flags will be configured here.
            </div>
          </TabsContent>

          <TabsContent value="groups" className="mt-4">
            <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded">
              Add user to additional groups beyond the default group.
            </div>
          </TabsContent>

          <TabsContent value="password" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Authentication Option</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="authOption"
                      value="1"
                      checked={formData.authOption === "1"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          authOption: e.target.value as "1" | "2" | "3" | "4",
                        })
                      }
                      className="text-primary"
                    />
                    <span className="text-foreground">
                      Option 1: Password only
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="authOption"
                      value="2"
                      checked={formData.authOption === "2"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          authOption: e.target.value as "1" | "2" | "3" | "4",
                        })
                      }
                      className="text-primary"
                    />
                    <span className="text-foreground">
                      Option 2: Password phrase only
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="authOption"
                      value="3"
                      checked={formData.authOption === "3"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          authOption: e.target.value as "1" | "2" | "3" | "4",
                        })
                      }
                      className="text-primary"
                    />
                    <span className="text-foreground">
                      Option 3: Both password and phrase
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="authOption"
                      value="4"
                      checked={formData.authOption === "4"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          authOption: e.target.value as "1" | "2" | "3" | "4",
                        })
                      }
                      className="text-primary"
                    />
                    <span className="text-foreground">
                      Option 4: Create as PROTECTED (no password)
                    </span>
                  </label>
                </div>
              </div>

              {(formData.authOption === "1" || formData.authOption === "3") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">
                      Initial Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter initial password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="bg-carbon-field border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="passwordConfirm"
                      className="text-foreground"
                    >
                      Confirm Password
                    </Label>
                    <Input
                      id="passwordConfirm"
                      type="password"
                      placeholder="Re-enter password"
                      value={formData.passwordConfirm}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passwordConfirm: e.target.value,
                        })
                      }
                      className="bg-carbon-field border-border text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Password cannot equal user ID or default group
                    </p>
                  </div>
                </>
              )}

              {(formData.authOption === "2" || formData.authOption === "3") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="passwordPhrase" className="text-foreground">
                      Password Phrase
                    </Label>
                    <Input
                      id="passwordPhrase"
                      type="password"
                      placeholder="Enter password phrase"
                      value={formData.passwordPhrase}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passwordPhrase: e.target.value,
                        })
                      }
                      className="bg-carbon-field border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="passwordPhraseConfirm"
                      className="text-foreground"
                    >
                      Confirm Password Phrase
                    </Label>
                    <Input
                      id="passwordPhraseConfirm"
                      type="password"
                      placeholder="Re-enter password phrase"
                      value={formData.passwordPhraseConfirm}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passwordPhraseConfirm: e.target.value,
                        })
                      }
                      className="bg-carbon-field border-border text-foreground"
                    />
                  </div>
                </>
              )}

              {formData.authOption !== "4" && (
                <p className="text-xs text-muted-foreground">
                  Leave empty to require user to set password on first login
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="review" className="mt-4">
            <div className="space-y-3 p-4 bg-muted/50 rounded">
              <h3 className="font-medium text-foreground">
                RACF Command Preview:
              </h3>
              <pre className="text-xs bg-background p-3 rounded border border-border text-foreground overflow-x-auto">
                {`ADDUSER ${formData.userid || "<USERID>"} DFLTGRP(${
                  formData.defaultGroup || "<GROUP>"
                }) 
  NAME('${formData.name || "<NAME>"}')${
                  formData.authOption === "4"
                    ? " PROTECTED"
                    : formData.password &&
                      (formData.authOption === "1" ||
                        formData.authOption === "3")
                    ? ` PASSWORD(${formData.password})`
                    : ""
                }${
                  formData.passwordPhrase &&
                  (formData.authOption === "2" || formData.authOption === "3")
                    ? ` PHRASE('${formData.passwordPhrase}')`
                    : ""
                }${
                  formData.expiration
                    ? ` EXPDATE(${formData.expiration.replace(/-/g, "")})`
                    : ""
                }`}
              </pre>
              <p className="text-xs text-muted-foreground">
                Review the command that will be executed. Click Create to
                submit.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border"
            disabled={
              createUserMutation.isPending || updateUserMutation.isPending
            }
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={
              createUserMutation.isPending || updateUserMutation.isPending
            }
          >
            {createUserMutation.isPending
              ? "Creating..."
              : updateUserMutation.isPending
              ? "Saving..."
              : editingUser
              ? "Save Changes"
              : "Create User"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;
