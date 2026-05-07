import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { backend } from "@/lib/backendClient";
import { FileText, Loader2, Download, File, FileCheck, FileSpreadsheet } from "lucide-react";

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  category: string;
  created_at: string;
}

const categoryIcons: Record<string, typeof FileText> = {
  contract: FileCheck,
  agreement: FileSpreadsheet,
  receipt: File,
  plan: FileText,
  general: FileText,
};

const CustomerDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);
    const { data, error: err } = await backend
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setDocuments((data as Document[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  if (error) {
    return (
      <div className="text-center py-20">
        <FileText size={48} className="text-destructive mx-auto mb-4" />
        <h2 className="font-heading text-xl font-semibold text-foreground mb-2">Could not load documents</h2>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
        <button onClick={() => fetchDocuments()} className="text-sm font-medium text-primary hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-20">
        <FileText size={48} className="text-muted-foreground mx-auto mb-4" />
        <h2 className="font-heading text-xl font-semibold text-foreground mb-2">No Documents</h2>
        <p className="text-muted-foreground text-sm">Your contracts, agreements, and receipts will appear here.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Documents</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => {
          const Icon = categoryIcons[doc.category] || FileText;
          return (
            <div key={doc.id} className="bg-card rounded-xl border border-border p-5 flex items-start gap-4 hover:border-gold/40 transition-colors">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <Icon size={20} className="text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-card-foreground truncate">{doc.file_name}</h4>
                <p className="text-xs text-muted-foreground capitalize">{doc.category} • {new Date(doc.created_at).toLocaleDateString()}</p>
              </div>
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-gold hover:opacity-70 transition-opacity shrink-0">
                <Download size={18} />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerDocuments;
