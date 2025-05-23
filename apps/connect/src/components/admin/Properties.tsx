'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface PropertiesProps {
  properties: string[];
  onAdd: (property: string) => void;
  onRemove: (index: number) => void;
}

export default function Properties({ properties, onAdd, onRemove }: PropertiesProps) {
  const [newProperty, setNewProperty] = useState('');

  const handleAdd = () => {
    if (newProperty.trim()) {
      onAdd(newProperty.trim());
      setNewProperty('');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h2 className="heading-2">Properties</h2>
        </div>
        <p className="text-gray-600 text-sm mt-1">
          Add all primary pages – these are what will be assessed during automated audits
        </p>
      </div>
      <div className="card-body">
        <div className="space-y-4">
          {/* Add Property Form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newProperty}
              onChange={(e) => setNewProperty(e.target.value)}
              placeholder="Enter property URL"
              className="form-input flex-1"
            />
            <button
              onClick={handleAdd}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Properties List */}
          <div className="space-y-2">
            {properties.map((property, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <a
                  href={property}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {property}
                </a>
                <button
                  onClick={() => onRemove(index)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 