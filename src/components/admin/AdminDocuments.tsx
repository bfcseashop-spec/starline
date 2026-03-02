import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Loader2, Plus, Trash2, Download, Upload, Search, Filter,
  FileCheck, FileSpreadsheet, File, X, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Profile {
  user_id: string;
  full_name: string | null;
}

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  category: string | null;
  user_id: string;
  project_id: string | null;
  created_at: string;
}

interface Project {
  id: string;
  project_name: string;
  user_id: string;
}

const categoryOptions = [
  { value: "sales_agreement", label: "Sales Agreement" },
  { value: "contract", label: "Contract" },
  { value: "receipt", label: "Receipt" },
  { value: "plan", label: "Plan / Blueprint" },
  { value: "general", label: "General" },
];

const categoryIcons: Record<string, typeof FileText> = {
  sales_agreement: FileCheck,
  contract: FileCheck,
  receipt: FileSpreadsheet,
  plan: File,
  general: FileText,
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const AdminDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Form state
  const [formUserId, setFormUserId] = useState("");
  const [formProjectId, setFormProjectId] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [formFile, setFormFile] = useState<File | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [docsRes, profilesRes, projectsRes] = await Promise.all([
      supabase.from("documents").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("customer_projects").select("id, project_name, user_id"),
    ]);
    setDocuments((docsRes.data as Document[]) || []);
    setProfiles((profilesRes.data as Profile[]) || []);
    setProjects((projectsRes.data as Project[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getCustomerName = (userId: string) =>
    profiles.find((p) => p.user_id === userId)?.full_name || userId.slice(0, 8);

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return "—";
    return projects.find((p) => p.id === projectId)?.project_name || "—";
  };

  const handleUpload = async () => {
    if (!formFile || !formUserId) {
      toast.error("Select a customer and file");
      return;
    }
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg", "image/png", "image/webp",
    ];
    if (!allowed.includes(formFile.type)) {
      toast.error("Only PDF, Word, JPEG, PNG files are allowed");
      return;
    }
    if (formFile.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }

    setUploading(true);
    const ext = formFile.name.split(".").pop();
    const path = `${formUserId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("customer-documents")
      .upload(path, formFile);
    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("customer-documents")
      .getPublicUrl(path);

    const { error: insertError } = await supabase.from("documents").insert({
      user_id: formUserId,
      project_id: formProjectId || null,
      file_name: formFile.name,
      file_url: urlData.publicUrl,
      file_type: formFile.type,
      file_size: formFile.size,
      category: formCategory,
    });

    if (insertError) {
      toast.error("Save failed: " + insertError.message);
    } else {
      toast.success("Document uploaded successfully");
      setShowForm(false);
      setFormFile(null);
      setFormUserId("");
      setFormProjectId("");
      setFormCategory("general");
      fetchData();
    }
    setUploading(false);
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.file_name}"?`)) return;
    // Extract path from URL
    const urlParts = doc.file_url.split("/customer-documents/");
    const filePath = urlParts[urlParts.length - 1];
    await supabase.storage.from("customer-documents").remove([filePath]);
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) toast.error("Delete failed");
    else {
      toast.success("Document deleted");
      fetchData();
    }
  };

  const filtered = documents.filter((d) => {
    if (filterCustomer && d.user_id !== filterCustomer) return false;
    if (filterCategory && d.category !== filterCategory) return false;
    if (searchQuery && !d.file_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Unique customers that have documents
  const customerUserIds = [...new Set(documents.map((d) => d.user_id))];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground"
          >
            <option value="">All Customers</option>
            {customerUserIds.map((uid) => (
              <option key={uid} value={uid}>{getCustomerName(uid)}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground"
          >
            <option value="">All Categories</option>
            {categoryOptions.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <Button onClick={() => setShowForm(true)} className="bg-gold-gradient text-accent-foreground hover:opacity-90 gap-2">
            <Plus size={16} /> Add Document
          </Button>
        </div>
      </div>

      {/* Upload form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-foreground">Upload Document</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Customer *</label>
              <select
                value={formUserId}
                onChange={(e) => { setFormUserId(e.target.value); setFormProjectId(""); }}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
              >
                <option value="">Select customer</option>
                {profiles.map((p) => (
                  <option key={p.user_id} value={p.user_id}>{p.full_name || p.user_id.slice(0, 8)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Project</label>
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
              >
                <option value="">No project</option>
                {projects.filter((p) => p.user_id === formUserId).map((p) => (
                  <option key={p.id} value={p.id}>{p.project_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
              >
                {categoryOptions.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">File (PDF, Word, Image) *</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-gold/50 transition-colors bg-muted/50">
                <Upload size={24} className="text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {formFile ? formFile.name : "Click to select file"}
                </span>
                {formFile && <span className="text-xs text-muted-foreground mt-1">{formatSize(formFile.size)}</span>}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || !formFile || !formUserId}
              className="w-full bg-gold-gradient text-accent-foreground hover:opacity-90 gap-2"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </div>
      )}

      {/* Documents table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={48} className="text-muted-foreground mx-auto mb-4" />
          <h2 className="font-heading text-xl font-semibold text-foreground mb-2">No Documents</h2>
          <p className="text-muted-foreground text-sm">Upload sales agreements, contracts, receipts, and more.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">File</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Project</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Size</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => {
                  const Icon = categoryIcons[doc.category || "general"] || FileText;
                  return (
                    <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center shrink-0">
                            <Icon size={18} className="text-gold" />
                          </div>
                          <span className="font-medium text-card-foreground truncate max-w-[200px]">{doc.file_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{getCustomerName(doc.user_id)}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{getProjectName(doc.project_id)}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full capitalize">
                          {categoryOptions.find((c) => c.value === doc.category)?.label || doc.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatSize(doc.file_size)}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{new Date(doc.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-gold transition-colors" title="View">
                            <Eye size={16} />
                          </a>
                          <a href={doc.file_url} download className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-gold transition-colors" title="Download">
                            <Download size={16} />
                          </a>
                          <button onClick={() => handleDelete(doc)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocuments;
