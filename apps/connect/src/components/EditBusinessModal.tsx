'use client';

import { useState, useEffect } from 'react';

interface BusinessDetails {
  name: string;
  industry: string;
  website: string;
  description?: string;
}

interface ConnectionRequest {
  id: string;
  name: string;
  isConnected: boolean;
  icon?: string;
}

type FormDataType = BusinessDetails | {
  connections: ConnectionRequest[];
};

interface EditBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'details' | 'connections';
  businessDetails: BusinessDetails;
  connectionRequests: ConnectionRequest[];
  onSave: (data: FormDataType) => Promise<void>;
}

export default function EditBusinessModal({
  isOpen,
  onClose,
  type,
  businessDetails,
  connectionRequests,
  onSave,
}: EditBusinessModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormDataType>(() => {
    if (type === 'details') {
      return {
        name: businessDetails?.name || '',
        industry: businessDetails?.industry || '',
        website: businessDetails?.website || '',
        description: businessDetails?.description || ''
      };
    }
    return { connections: connectionRequests || [] };
  });

  // Update formData when props change
  useEffect(() => {
    if (type === 'details') {
      setFormData({
        name: businessDetails?.name || '',
        industry: businessDetails?.industry || '',
        website: businessDetails?.website || '',
        description: businessDetails?.description || ''
      });
    } else {
      setFormData({ connections: connectionRequests || [] });
    }
  }, [type, businessDetails, connectionRequests]);

  const isConnectionsForm = (data: FormDataType): data is { connections: ConnectionRequest[] } => {
    return 'connections' in data;
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="heading-2">
            {type === 'details' ? 'Edit Business Details' : 'Edit Connections'}
          </h2>
        </div>

        <div className="p-6">
          {type === 'details' ? (
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Business Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="form-input"
                  value={(formData as BusinessDetails).name}
                  onChange={(e) => setFormData({ ...formData as BusinessDetails, name: e.target.value })}
                  placeholder="Enter business name"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="industry">
                  Industry
                </label>
                <select
                  id="industry"
                  className="form-input"
                  value={(formData as BusinessDetails).industry}
                  onChange={(e) => setFormData({ ...formData as BusinessDetails, industry: e.target.value })}
                >
                  <option value="">Select an industry</option>
                  <option value="Agriculture">Agriculture & Farming</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Banking">Banking & Financial Services</option>
                  <option value="Construction">Construction & Real Estate</option>
                  <option value="Education">Education & Training</option>
                  <option value="Energy">Energy & Utilities</option>
                  <option value="Entertainment">Entertainment & Media</option>
                  <option value="Food">Food & Beverage</option>
                  <option value="Government">Government & Public Sector</option>
                  <option value="Healthcare">Healthcare & Pharmaceuticals</option>
                  <option value="Hospitality">Hospitality & Tourism</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Non-Profit">Non-Profit & NGO</option>
                  <option value="Professional">Professional Services</option>
                  <option value="Retail">Retail & E-commerce</option>
                  <option value="Technology">Technology & Software</option>
                  <option value="Telecommunications">Telecommunications</option>
                  <option value="Transportation">Transportation & Logistics</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="website">
                  Website
                </label>
                <input
                  type="text"
                  id="website"
                  className="form-input"
                  value={(formData as BusinessDetails).website}
                  onChange={(e) => setFormData({ ...formData as BusinessDetails, website: e.target.value })}
                  placeholder="Enter website URL"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  className="form-input"
                  value={(formData as BusinessDetails).description || ''}
                  onChange={(e) => setFormData({ ...formData as BusinessDetails, description: e.target.value })}
                  placeholder="Enter business description"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="space-y-3">
                  {isConnectionsForm(formData) && formData.connections?.map((connection: ConnectionRequest) => (
                    <div key={connection.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {connection.icon && (
                          <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-600">{connection.icon}</span>
                          </div>
                        )}
                        <span className="text-body">{connection.name}</span>
                      </div>
                      <button
                        type="button"
                        className="text-sm text-primary hover:text-primary-hover"
                        onClick={() => {
                          if (isConnectionsForm(formData)) {
                            const updatedConnections = formData.connections.map((c: ConnectionRequest) =>
                              c.id === connection.id ? { ...c, isConnected: !c.isConnected } : c
                            );
                            setFormData({ connections: updatedConnections });
                          }
                        }}
                      >
                        {connection.isConnected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
} 