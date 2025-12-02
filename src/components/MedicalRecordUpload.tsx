import { useState } from "react";
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MedicalRecordUploadProps {
  onUploadComplete: (fileUrls: string[]) => void;
  existingRecords?: string[];
}

export const MedicalRecordUpload = ({ onUploadComplete, existingRecords = [] }: MedicalRecordUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(existingRecords);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload files",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          toast({
            title: "Invalid file type",
            description: "Please upload PDF or image files only",
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('medical-records')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('medical-records')
          .getPublicUrl(fileName);

        uploadedUrls.push(fileName);
      }

      const newFiles = [...uploadedFiles, ...uploadedUrls];
      setUploadedFiles(newFiles);
      onUploadComplete(newFiles);

      toast({
        title: "Success",
        description: `${uploadedUrls.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeFile = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from('medical-records')
        .remove([fileName]);

      if (error) throw error;

      const newFiles = uploadedFiles.filter(f => f !== fileName);
      setUploadedFiles(newFiles);
      onUploadComplete(newFiles);

      toast({
        title: "Removed",
        description: "Medical record removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove file",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext === 'pdf' ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Medical Records (Optional)
        </label>
        <p className="text-sm text-muted-foreground mb-3">
          Upload medical records, prescriptions, or health reports (PDF or images)
        </p>
        
        <Card className="border-dashed border-2 border-border hover:border-primary transition-colors">
          <label className="flex flex-col items-center justify-center p-6 cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            )}
            <span className="text-sm text-muted-foreground text-center">
              {uploading ? "Uploading..." : "Click to upload or drag and drop"}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              PDF, JPG, PNG up to 10MB
            </span>
          </label>
        </Card>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Uploaded Files</label>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <Card key={file} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getFileIcon(file)}
                  <span className="text-sm truncate max-w-[200px]">
                    {file.split('/').pop()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(file)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
