'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from '@/utils/supabase/client';
import { addClient, updateClient, getClient } from '@/utils/supabase/queries';
import { Client } from '@/utils/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';

export default function AddClientForm({ clientId }: { clientId: string | null}) {
  const [formData, setFormData] = useState<Client | {}>({
    name: '',
    client_code: '',
    address: '',
    postal_code: '',
    country_code_iso_2: '',
    is_active: true,
    is_deleted: false,
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { currentTenant } = useTenant();

  useEffect(() => {
    const fetchClient = async () => {
      if (!currentTenant) {
        return;
      }

      if (clientId) {
        const supabase: SupabaseClient = createClient();
        const client = await getClient(supabase, clientId);
        if (client && client.tenant_id === currentTenant.id) {
          setFormData(client);
        } else {
          toast({
            title: "Error",
            description: "Client not found or belongs to different tenant.",
            variant: "destructive",
          });
          router.push('/clients');
        }
      }
    };

    fetchClient();
  }, [clientId, currentTenant]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentTenant) {
      setError('No tenant selected. Please select a tenant from account settings.');
      return;
    }

    if (!(formData as Client).name || !(formData as Client).client_code || !(formData as Client).country_code_iso_2) {
      setError('Please fill in all required fields.');
      return;
    }

    if ((formData as Client).client_code.length > 8) {
      setError('Client Code must be 8 characters or less.');
      return;
    }

    if ((formData as Client).country_code_iso_2.length !== 2) {
      setError('Country Code must be exactly 2 characters.');
      return;
    }

    try {
      const supabase = createClient();
      let data;

      const clientData = {
        ...formData,
        tenant_id: currentTenant.id
      };

      if (clientId) {
        data = await updateClient(supabase, { id: clientId, ...clientData });
      } else {
        const { id, ...newClientData } = clientData as Client;
        data = await addClient(supabase, newClientData);
      }

      router.push('/clients');
    } catch (error: any) {
      setError(error.message || 'Failed to add/update client.');
      console.error('Error adding/updating client:', error);
    }
  };

  if (!currentTenant) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold">No Tenant Selected</h2>
          <p className="text-muted-foreground">Please select a tenant from your account settings.</p>
          <Button 
            className="mt-4"
            onClick={() => router.push('/account')}
          >
            Go to Account Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <main className="flex-1 p-8">
        <Card>
          <CardHeader>
            <CardTitle>{clientId ? 'Edit Client' : 'Add New Client'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={(formData as Client).name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client_code">Client Code * (max 8 characters)</Label>
                  <Input
                    id="client_code"
                    name="client_code"
                    value={(formData as Client).client_code}
                    onChange={handleInputChange}
                    required
                    maxLength={8}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={(formData as Client).address}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal Code (max 8 characters)</Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    value={(formData as Client).postal_code}
                    onChange={handleInputChange}
                    maxLength={8}
                  />
                </div>
                <div>
                  <Label htmlFor="country_code_iso_2">Country Code (ISO-2) *</Label>
                  <Input
                    id="country_code_iso_2"
                    name="country_code_iso_2"
                    value={(formData as Client).country_code_iso_2}
                    onChange={handleInputChange}
                    required
                    maxLength={2}
                  />
                </div>
                <div>
                  <CustomCheckbox
                    id="is_active"
                    label="Active"
                    checked={(formData as Client).is_active}
                    onChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_active: checked }))
                    }
                  />
                </div>
                {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => router.push('/clients')}>Cancel</Button>
                  <Button type="submit">Submit</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}