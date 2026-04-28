import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Paperclip, Upload, X, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FileAttachments({ attachments = [], onChange, disabled }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return { name: file.name, url: file_url };
        })
      );
      onChange([...attachments, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded`);
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = (idx) => {
    onChange(attachments.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Paperclip className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Attachments</span>
        <label className={`ml-auto cursor-pointer ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <input type="file" multiple className="hidden" onChange={handleFileChange} disabled={disabled || uploading} />
          <Button type="button" variant="outline" size="sm" className="gap-1.5 pointer-events-none" asChild>
            <span>
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload
            </span>
          </Button>
        </label>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((file, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border text-sm">
              <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate text-xs">{file.name}</span>
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {!disabled && (
                <button onClick={() => handleRemove(i)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}