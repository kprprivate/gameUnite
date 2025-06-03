import React, { useState } from 'react';
import { imageUtils } from '../../utils/imageUtils';

const SafeImage = ({
  src,
  alt,
  type = 'ad',
  size = 'medium',
  className = '',
  fallbackIcon = null,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageUrl = hasError ? imageUtils.defaults[type] : imageUtils.getImageUrl(src, type, size);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}

      <img
        src={imageUrl}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        {...props}
      />

      {hasError && fallbackIcon && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
          {fallbackIcon}
        </div>
      )}
    </div>
  );
};

export default SafeImage;