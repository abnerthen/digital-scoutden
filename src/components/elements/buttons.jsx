import React from 'react';

export const closeButton = ({ onClick }) => (
  <button 
    onClick={ onClick } 
    style={{ 
      background: "none", 
      border: "none", 
      fontSize: 22, 
      cursor: "pointer", 
      color: "#888" 
    }}>✕</button>
);