import React from 'react';
import { GeneratedDocumentData } from '../types';

interface DocumentViewerProps {
  data: GeneratedDocumentData;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ data }) => {
  const getIcon = () => {
    switch (data.type) {
      case 'INVOICE': return '💰';
      case 'PRESCRIPTION': return '💊';
      case 'ADMISSION_FORM': return '📋';
      default: return '📄';
    }
  };

  const getColor = () => {
    switch (data.type) {
      case 'INVOICE': return 'border-emerald-500 bg-emerald-50';
      case 'PRESCRIPTION': return 'border-blue-500 bg-blue-50';
      case 'ADMISSION_FORM': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className={`mt-4 mb-2 p-6 rounded-lg border-l-4 shadow-sm font-mono text-sm ${getColor()} max-w-md`}>
      <div className="flex justify-between items-start border-b border-gray-200 pb-3 mb-3">
        <div>
          <span className="text-2xl mr-2">{getIcon()}</span>
          <span className="font-bold uppercase tracking-wider text-gray-700">{data.type}</span>
        </div>
        <div className="text-xs text-gray-500 text-right">
          <div>HOSPITAL MHO SYSTEM</div>
          <div>ID: {Math.floor(Math.random() * 100000)}</div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-4">{data.title}</h3>

      <div className="space-y-2 mb-6">
        {Object.entries(data.content).map(([key, value]) => (
          <div key={key} className="flex justify-between border-b border-gray-200/50 pb-1">
            <span className="font-semibold text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
            <span className="text-gray-900">{value}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 italic mt-4 pt-2 border-t border-gray-200">
        <strong>COMPLIANCE NOTE:</strong> {data.footer}
      </div>
    </div>
  );
};
