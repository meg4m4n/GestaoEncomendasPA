import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, Search, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Destination = {
  id: string;
  name: string;
  address: string;
  country: string;
  email: string;
  phone: string;
};

export default function Destinations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const queryClient = useQueryClient();

  const { data: destinations, isLoading } = useQuery({
    queryKey: ['destinations', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .ilike('name', `%${searchTerm}%`);

      if (error) throw error;
      return data as Destination[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('destinations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
    }
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this destination? This action cannot be undone.')) {
      await deleteMutation.mutate(id);
    }
  };

  const handleEdit = (destination: Destination) => {
    setSelectedDestination(destination);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Destinations</h1>
        <button
          onClick={() => {
            setSelectedDestination(null);
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Destination
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search destinations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {destinations?.map((destination) => (
          <div key={destination.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{destination.name}</h3>
                    <p className="text-sm text-gray-500">{destination.country}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(destination)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(destination.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p className="flex items-center">
                  <span className="font-medium mr-2">Address:</span>
                  {destination.address}
                </p>
                <p className="flex items-center">
                  <span className="font-medium mr-2">Email:</span>
                  {destination.email}
                </p>
                <p className="flex items-center">
                  <span className="font-medium mr-2">Phone:</span>
                  {destination.phone}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <DestinationModal
          destination={selectedDestination}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDestination(null);
          }}
          onSave={async (data) => {
            if (selectedDestination) {
              await supabase
                .from('destinations')
                .update(data)
                .eq('id', selectedDestination.id);
            } else {
              await supabase.from('destinations').insert(data);
            }
            queryClient.invalidateQueries({ queryKey: ['destinations'] });
            setIsModalOpen(false);
            setSelectedDestination(null);
          }}
        />
      )}
    </div>
  );
}

function DestinationModal({
  destination,
  onClose,
  onSave,
}: {
  destination: Destination | null;
  onClose: () => void;
  onSave: (data: Omit<Destination, 'id'>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: destination?.name || '',
    address: destination?.address || '',
    country: destination?.country || '',
    email: destination?.email || '',
    phone: destination?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-medium mb-4">
          {destination ? 'Edit Destination' : 'Add Destination'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              {destination ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}