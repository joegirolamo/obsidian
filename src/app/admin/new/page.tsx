'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createBusiness } from '@/app/actions/business';

interface BusinessForm {
  name: string;
  industry: string;
  website: string;
  description?: string;
}

export default function NewWorkspacePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BusinessForm>({
    name: '',
    industry: '',
    website: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createBusiness({
        adminId: session.user.id,
        ...formData,
      });

      if (result.success && result.business) {
        router.push('/admin/business-profile');
      } else {
        setError(result.error || 'Failed to create workspace');
      }
    } catch (error) {
      console.error('Error creating business:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-1">Create New Workspace</h1>
        <p className="text-body mt-2">
          Set up a new workspace for your business
        </p>
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="card-body space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name" className="form-label">Business Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter business name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="industry" className="form-label">Industry</label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Select an industry</option>
                <option value="Technology">Technology</option>
                <option value="Retail">Retail</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="website" className="form-label">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="form-input"
                placeholder="https://example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input"
                rows={4}
                placeholder="Enter a brief description of your business"
              />
            </div>
          </div>

          <div className="card-footer flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 