import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Trash2,
  X,
  ShieldCheck,
  Users,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { userApi } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import type { User } from "../../types";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-teal-100 text-teal-800",
  editor: "bg-sky-100 text-sky-800",
  viewer: "bg-amber-100 text-amber-800",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface AddAdminForm {
  name: string;
  email: string;
  password: string;
  role: "admin" | "editor" | "viewer";
}

const DEFAULT_FORM: AddAdminForm = {
  name: "",
  email: "",
  password: "",
  role: "editor",
};

export function AdminsPage() {
  const { user: currentUser } = useAuth();
  const { addToast: showToast } = useToast();

  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AddAdminForm>(DEFAULT_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userApi.getAll();
      setAdmins(res.data ?? []);
    } catch {
      showToast("Failed to load admins.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }
    setFormLoading(true);
    try {
      const res = await userApi.create(form);
      if (res.data) {
        setAdmins((prev) => [...prev, res.data as User]);
      }
      showToast(`Admin "${form.name}" created.`, "success");
      setShowModal(false);
      setForm(DEFAULT_FORM);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create admin.";
      showToast(msg, "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await userApi.delete(deleteTarget.id);
      setAdmins((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      showToast(`Admin "${deleteTarget.name}" removed.`, "success");
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete admin.";
      showToast(msg, "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sky-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
              style={{
                background: "linear-gradient(135deg, #0369a1, #0d9488)",
              }}
            >
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-sky-900">Admins</h1>
              <p className="text-sky-500 text-sm">
                {loading
                  ? "Loading…"
                  : `${admins.length} account${admins.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAdmins}
              disabled={loading}
              className="p-2 rounded-lg text-sky-500 hover:bg-sky-100 transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #0369a1, #0d9488)",
              }}
            >
              <UserPlus className="w-4 h-4" />
              Add Admin
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-8 h-8 border-4 border-sky-200 border-t-teal-500 rounded-full animate-spin" />
            </div>
          ) : admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-sky-400">
              <Users className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">No admins found.</p>
            </div>
          ) : (
            <ul className="divide-y divide-sky-50">
              {admins.map((admin) => {
                const isSelf = admin.id === currentUser?.id;
                return (
                  <li
                    key={admin.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-sky-50/60 transition"
                  >
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow"
                      style={{
                        background: "linear-gradient(135deg, #0369a1, #0d9488)",
                      }}
                    >
                      {initials(admin.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sky-900 truncate">
                          {admin.name}
                        </span>
                        {isSelf && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">
                            You
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                            ROLE_COLORS[admin.role] ??
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3 inline -mt-0.5 mr-0.5" />
                          {ROLE_LABELS[admin.role] ?? admin.role}
                        </span>
                      </div>
                      <p className="text-sky-500 text-sm truncate">
                        {admin.email}
                      </p>
                    </div>

                    {/* Date */}
                    <span className="hidden sm:block text-xs text-sky-400 flex-shrink-0">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </span>

                    {/* Delete */}
                    <button
                      disabled={isSelf}
                      onClick={() => setDeleteTarget(admin)}
                      title={
                        isSelf
                          ? "Cannot delete your own account"
                          : "Remove admin"
                      }
                      className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-20 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Add Admin Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{
                background: "linear-gradient(135deg, #0c4a6e, #0d9488)",
              }}
            >
              <div className="flex items-center gap-2 text-white">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Add New Admin</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-sky-800 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  placeholder="John Doe"
                  className="w-full px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-sky-900 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sky-800 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-sky-900 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sky-800 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-2 pr-10 rounded-lg border border-sky-200 bg-sky-50 text-sky-900 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-400 hover:text-sky-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-sky-800 mb-1">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.value as AddAdminForm["role"],
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-sky-900 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
                >
                  <option value="admin">Admin — Full access</option>
                  <option value="editor">Editor — Manage content</option>
                  <option value="viewer">Viewer — Read only</option>
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setForm(DEFAULT_FORM);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-sky-200 text-sky-700 text-sm font-medium hover:bg-sky-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #0369a1, #0d9488)",
                  }}
                >
                  {formLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create Admin
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sky-900">Remove Admin</h3>
                <p className="text-sm text-sky-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <p className="text-sm text-sky-700">
              Are you sure you want to remove{" "}
              <span className="font-semibold">{deleteTarget.name}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-sky-200 text-sky-700 text-sm font-medium hover:bg-sky-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-60"
              >
                {deleteLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
