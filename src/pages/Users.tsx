import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres')
});

type UserFormData = z.infer<typeof userSchema>;

export default function Users() {
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      return users as User[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const { error } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      setError(error.message);
    }
  });

  const handleDelete = async (user: User) => {
    if (confirm(`Tem certeza que deseja excluir o utilizador ${user.email}?`)) {
      await deleteMutation.mutate(user.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Utilizadores</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Novo Utilizador
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  A carregar...
                </td>
              </tr>
            ) : users?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nenhum utilizador encontrado
                </td>
              </tr>
            ) : (
              users?.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.confirmed_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.confirmed_at ? 'Confirmado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Novo Utilizador</h2>
            <UserForm
              onSubmit={async (data) => {
                try {
                  await createMutation.mutateAsync(data);
                } catch (error) {
                  console.error('Error creating user:', error);
                }
              }}
              onCancel={() => {
                setIsModalOpen(false);
                setError(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function UserForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UserFormData>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          {...register('email')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Senha</label>
        <input
          type="password"
          {...register('password')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? 'A criar...' : 'Criar'}
        </button>
      </div>
    </form>
  );
}