import React from 'react';
import { Modal, Button } from '@mantine/core';

/**
 * ProductDetailModal
 *
 * A simple modal component used in the BrewLite web app to display detailed
 * information about a product (drink). It receives the product data via props
 * and a boolean `opened` flag to control visibility. The `onClose` callback is
 * called when the user dismisses the modal.
 *
 * Props:
 *   - opened: boolean – whether the modal is visible
 *   - onClose: () => void – handler to close the modal
 *   - product: {
 *       id: string;
 *       name: string;
 *       description?: string;
 *       price: number;
 *       size?: string;
 *       toppings?: string[];
 *     }
 */
interface ProductDetailModalProps {
  opened: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    size?: string;
    toppings?: string[];
  };
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  opened,
  onClose,
  product,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title={product.name} size="lg">
      <p>{product.description ?? 'No description provided.'}</p>
      <p>
        <strong>Price:</strong> ${product.price.toFixed(2)}
      </p>
      {product.size && (
        <p>
          <strong>Size:</strong> {product.size}
        </p>
      )}
      {product.toppings && product.toppings.length > 0 && (
        <div>
          <strong>Toppings:</strong>
          <ul>
            {product.toppings.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
      <Button onClick={onClose} fullWidth mt="md">
        Close
      </Button>
    </Modal>
  );
};
