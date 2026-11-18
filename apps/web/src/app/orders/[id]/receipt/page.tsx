import { OrderReceiptView } from '@/components/orders/OrderReceiptView';

interface OrderReceiptPageProps {
  params: {
    id: string;
  };
}

export default function OrderReceiptPage({ params }: OrderReceiptPageProps) {
  return <OrderReceiptView orderId={params.id} />;
}
