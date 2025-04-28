import React from 'react';
import { GamePad2 } from 'lucide-react';
import Button from './Button';

const EmptyState = ({ 
  icon: Icon = GamePad2,
  title = 'Nada encontrado',
  description = 'Não encontramos nenhum resultado para sua busca.',
  actionText,
  onAction,
  children 
}) => {
  return (
    <div className="text-center py-12">
      <div className="mb-6">
        <Icon className="w-16 h-16 text-gray-300 mx-auto" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction}>
          {actionText}
        </Button>
      )}
      {children}
    </div>
  );
};

export default EmptyState;