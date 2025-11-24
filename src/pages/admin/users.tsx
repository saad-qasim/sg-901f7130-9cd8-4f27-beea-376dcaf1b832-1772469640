import { useState, useEffect } from "react";
import { userService, ProfileWithEmail, CreateUserData } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import HomeButton from "@/components/HomeButton";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PermissionKey = 
  | "can_create_invoices"
  | "can_delete_invoices"
  | "can_edit_invoices"
  | "can_add_brand"
  | "can_add_product"
  | "can_view_stats";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ProfileWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileWithEmail | null>(null);
  const [userToDelete, setUserToDelete] = useState<ProfileWithEmail | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    role: "",
    can_create_invoices: false,
    can_delete_invoices: false,
    can_edit_invoices: false,
    can_add_brand: false,
    can_add_product: false,
    can_view_stats: false,
  });

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "viewer",
    can_create_invoices: false,
    can_delete_invoices: false,
    can_edit_invoices: false,
    can_add_brand: false,
    can_add_product: false,
    can_view_stats: false,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllProfiles();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      setErrorMessage("فشل تحميل المستخدمين. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: ProfileWithEmail) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || "",
      phone: user.phone || "",
      role: user.role || "viewer",
      can_create_invoices: user.can_create_invoices ?? false,
      can_delete_invoices: user.can_delete_invoices ?? false,
      can_edit_invoices: user.can_edit_invoices ?? false,
      can_add_brand: user.can_add_brand ?? false,
      can_add_product: user.can_add_product ?? false,
      can_view_stats: user.can_view_stats ?? false,
    });
    setShowEditDialog(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleEditSave = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      await userService.updateProfile(selectedUser.id, editForm);
      setSuccessMessage("تم تحديث بيانات الموظف بنجاح");
      setShowEditDialog(false);
      await loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      setErrorMessage("حدث خطأ أثناء تحديث بيانات الموظف");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateClick = () => {
    setCreateForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "viewer",
      // القيم الافتراضية للصلاحيات عند إضافة موظف جديد
      can_create_invoices: true,
      can_edit_invoices: true,
      can_delete_invoices: false,
      can_add_brand: false,
      can_add_product: false,
      can_view_stats: false,
    });
    setShowCreateDialog(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleCreateSave = async () => {
    if (!createForm.name.trim() || !createForm.email.trim()) {
      setErrorMessage("الرجاء إدخال الاسم والبريد الإلكتروني");
      return;
    }

    if (!createForm.password.trim() || !createForm.confirmPassword.trim()) {
      setErrorMessage("الرجاء إدخال كلمة المرور وتأكيدها");
      return;
    }

    if (createForm.password !== createForm.confirmPassword) {
      setErrorMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    if (createForm.password.length < 6) {
      setErrorMessage("يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل");
      return;
    }

    try {
      setSaving(true);
      
      // تحديد الصلاحيات الافتراضية بناءً على الدور
      const isAdmin = createForm.role === 'admin';
      
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: createForm.email,
          password: createForm.password,
          userData: {
            name: createForm.name,
            phone: createForm.phone,
            role: createForm.role,
            // إذا كان admin، السماح بكل الصلاحيات
            // وإلا، استخدام الصلاحيات الافتراضية المحدودة
            can_create_invoices: isAdmin ? true : true,
            can_edit_invoices: isAdmin ? true : true,
            can_delete_invoices: isAdmin ? true : false,
            can_add_brand: isAdmin ? true : false,
            can_add_product: isAdmin ? true : false,
            can_view_stats: isAdmin ? true : false,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل إنشاء الموظف");
      }

      setSuccessMessage("تم إنشاء الموظف بنجاح.");
      setShowCreateDialog(false);
      await loadUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      setErrorMessage(error.message || "حدث خطأ أثناء إنشاء الموظف");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (user: ProfileWithEmail) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      await userService.deleteUser(userToDelete.id);
      setSuccessMessage(`تم حذف الموظف "${userToDelete.name}" بنجاح`);
      setShowDeleteDialog(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      setErrorMessage(error.message || "حدث خطأ أثناء حذف الموظف");
      setShowDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  const updateEditPermission = (permission: PermissionKey, value: boolean) => {
    setEditForm({ ...editForm, [permission]: value });
  };

  const updateCreatePermission = (permission: PermissionKey, value: boolean) => {
    setCreateForm({ ...createForm, [permission]: value });
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center gap-3 mb-4">
          <HomeButton />
          <BackButton />
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">إدارة المستخدمين</h1>
          <Button onClick={handleCreateClick} className="gap-2">
            <Plus size={16} />
            إضافة موظف جديد
          </Button>
        </div>

        {successMessage && (
          <Alert className="mb-4 border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert className="mb-4 border-red-500 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <p>جاري التحميل...</p>
        ) : users.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            لا يوجد موظفين حتى الآن
          </p>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead className="text-center">إنشاء فواتير</TableHead>
                  <TableHead className="text-center">حذف فواتير</TableHead>
                  <TableHead className="text-center">تعديل فواتير</TableHead>
                  <TableHead className="text-center">إضافة علامة</TableHead>
                  <TableHead className="text-center">إضافة منتج</TableHead>
                  <TableHead className="text-center">عرض إحصائيات</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || "—"}</TableCell>
                    <TableCell>{user.email || "—"}</TableCell>
                    <TableCell>{user.phone || "—"}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {user.role || "viewer"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.can_create_invoices ? (
                        <CheckCircle2 size={16} className="inline text-green-600" />
                      ) : (
                        <XCircle size={16} className="inline text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.can_delete_invoices ? (
                        <CheckCircle2 size={16} className="inline text-green-600" />
                      ) : (
                        <XCircle size={16} className="inline text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.can_edit_invoices ? (
                        <CheckCircle2 size={16} className="inline text-green-600" />
                      ) : (
                        <XCircle size={16} className="inline text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.can_add_brand ? (
                        <CheckCircle2 size={16} className="inline text-green-600" />
                      ) : (
                        <XCircle size={16} className="inline text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.can_add_product ? (
                        <CheckCircle2 size={16} className="inline text-green-600" />
                      ) : (
                        <XCircle size={16} className="inline text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.can_view_stats ? (
                        <CheckCircle2 size={16} className="inline text-green-600" />
                      ) : (
                        <XCircle size={16} className="inline text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditClick(user)}
                          title="تعديل الموظف"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteClick(user)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="حذف الموظف"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تعديل بيانات الموظف</DialogTitle>
              <DialogDescription>
                قم بتحديث معلومات الموظف والصلاحيات
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">الاسم</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="اسم الموظف"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">رقم الهاتف</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="رقم الهاتف"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">الدور</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">مدير</SelectItem>
                    <SelectItem value="cashier">كاشير</SelectItem>
                    <SelectItem value="viewer">مشاهد</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold">الصلاحيات</h3>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="edit-can_create_invoices"
                    checked={editForm.can_create_invoices}
                    onCheckedChange={(checked) => 
                      updateEditPermission("can_create_invoices", checked as boolean)
                    }
                  />
                  <Label htmlFor="edit-can_create_invoices" className="cursor-pointer">
                    إنشاء فواتير
                  </Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="edit-can_delete_invoices"
                    checked={editForm.can_delete_invoices}
                    onCheckedChange={(checked) => 
                      updateEditPermission("can_delete_invoices", checked as boolean)
                    }
                  />
                  <Label htmlFor="edit-can_delete_invoices" className="cursor-pointer">
                    حذف فواتير
                  </Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="edit-can_edit_invoices"
                    checked={editForm.can_edit_invoices}
                    onCheckedChange={(checked) => 
                      updateEditPermission("can_edit_invoices", checked as boolean)
                    }
                  />
                  <Label htmlFor="edit-can_edit_invoices" className="cursor-pointer">
                    تعديل فواتير
                  </Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="edit-can_add_brand"
                    checked={editForm.can_add_brand}
                    onCheckedChange={(checked) => 
                      updateEditPermission("can_add_brand", checked as boolean)
                    }
                  />
                  <Label htmlFor="edit-can_add_brand" className="cursor-pointer">
                    إضافة علامة تجارية
                  </Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="edit-can_add_product"
                    checked={editForm.can_add_product}
                    onCheckedChange={(checked) => 
                      updateEditPermission("can_add_product", checked as boolean)
                    }
                  />
                  <Label htmlFor="edit-can_add_product" className="cursor-pointer">
                    إضافة منتج
                  </Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="edit-can_view_stats"
                    checked={editForm.can_view_stats}
                    onCheckedChange={(checked) => 
                      updateEditPermission("can_view_stats", checked as boolean)
                    }
                  />
                  <Label htmlFor="edit-can_view_stats" className="cursor-pointer">
                    عرض الإحصائيات
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={saving}
              >
                إلغاء
              </Button>
              <Button onClick={handleEditSave} disabled={saving}>
                {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة موظف جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات الموظف الجديد وحدد الصلاحيات
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">الاسم *</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="اسم الموظف"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-email">البريد الإلكتروني *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="email@example.com"
                  disabled={saving}
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-password">كلمة المرور *</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                  disabled={saving}
                  dir="ltr"
                  minLength={6}
                />
                <p className="text-xs text-gray-500">يجب أن تحتوي على 6 أحرف على الأقل</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-confirm-password">تأكيد كلمة المرور *</Label>
                <Input
                  id="create-confirm-password"
                  type="password"
                  value={createForm.confirmPassword}
                  onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  disabled={saving}
                  dir="ltr"
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-phone">رقم الهاتف</Label>
                <Input
                  id="create-phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="رقم الهاتف"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-role">الدور</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) => setCreateForm({ ...createForm, role: value })}
                  disabled={saving}
                >
                  <SelectTrigger id="create-role">
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">مدير</SelectItem>
                    <SelectItem value="cashier">كاشير</SelectItem>
                    <SelectItem value="viewer">مشاهد</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold">الصلاحيات</h3>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="create-can_create_invoices"
                    checked={createForm.can_create_invoices}
                    onCheckedChange={(checked) => 
                      updateCreatePermission("can_create_invoices", checked as boolean)
                    }
                    disabled={saving}
                  />
                  <Label htmlFor="create-can_create_invoices" className="cursor-pointer">
                    إنشاء فواتير
                  </Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="create-can_delete_invoices"
                    checked={createForm.can_delete_invoices}
                    onCheckedChange={(checked) => 
                      updateCreatePermission("can_delete_invoices", checked as boolean)
                    }
                    disabled={saving}
                  />
                  <Label htmlFor="create-can_delete_invoices" className="cursor-pointer">
                    حذف فواتير
                  </Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="create-can_edit_invoices"
                    checked={createForm.can_edit_invoices}
                    onCheckedChange={(checked) => 
                      updateCreatePermission("can_edit_invoices", checked as boolean)
                    }
                    disabled={saving}
                  />
                  <Label htmlFor="create-can_edit_invoices" className="cursor-pointer">
                    تعديل فواتير
                  </Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="create-can_add_brand"
                    checked={createForm.can_add_brand}
                    onCheckedChange={(checked) => 
                      updateCreatePermission("can_add_brand", checked as boolean)
                    }
                    disabled={saving}
                  />
                  <Label htmlFor="create-can_add_brand" className="cursor-pointer">
                    إضافة علامة تجارية
                  </Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="create-can_add_product"
                    checked={createForm.can_add_product}
                    onCheckedChange={(checked) => 
                      updateCreatePermission("can_add_product", checked as boolean)
                    }
                    disabled={saving}
                  />
                  <Label htmlFor="create-can_add_product" className="cursor-pointer">
                    إضافة منتج
                  </Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="create-can_view_stats"
                    checked={createForm.can_view_stats}
                    onCheckedChange={(checked) => 
                      updateCreatePermission("can_view_stats", checked as boolean)
                    }
                    disabled={saving}
                  />
                  <Label htmlFor="create-can_view_stats" className="cursor-pointer">
                    عرض الإحصائيات
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={saving}
              >
                إلغاء
              </Button>
              <Button onClick={handleCreateSave} disabled={saving}>
                {saving ? "جاري الإنشاء..." : "إنشاء موظف"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle dir="rtl">تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription dir="rtl">
                هل أنت متأكد من حذف هذا الموظف؟ سيتم حذف حسابه وجميع بياناته بشكل دائم.
                <br />
                <br />
                <span className="font-semibold">الموظف: {userToDelete?.name}</span>
                <br />
                <span className="text-sm text-muted-foreground">{userToDelete?.email}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleting ? "جاري الحذف..." : "حذف"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
