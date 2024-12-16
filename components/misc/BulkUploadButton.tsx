'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface BulkUploadButtonProps {
  onSuccess: () => void;
}

export default function BulkUploadButton({ onSuccess }: BulkUploadButtonProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      toast({
        title: "Error",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const content = await file.text();
      const rows = content.split('\n').map(row => row.trim());
      
      // Validate header
      const header = rows[0].toLowerCase();
      if (header !== 'email,nick,name') {
        throw new Error('Invalid CSV format. Header must be: email,nick,name');
      }

      // Parse data rows
      const teamMembers = rows.slice(1)
        .filter(row => row) // Skip empty rows
        .map(row => {
          const [email, nick, name] = row.split(',').map(field => field.trim());
          if (!email) throw new Error('Email is required for all rows');
          return { email, nick: nick || '', name: name || '' };
        });

      // Upload to Supabase
      const supabase = createClient();

      // Clear existing data
      const { error: deleteError } = await supabase
        .from('TeamMembers')
        .delete()
        .neq('email', ''); // Delete all records

      if (deleteError) throw deleteError;

      // Insert new data
      const { error: insertError } = await supabase
        .from('TeamMembers')
        .insert(teamMembers);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: `Imported ${teamMembers.length} team members successfully.`,
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to import team members.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        ref={fileInputRef}
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        <Upload className="h-4 w-4 mr-2" />
        {loading ? 'Importing...' : 'Bulk Import'}
      </Button>
    </>
  );
} 