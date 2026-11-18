import { OrderReceiptView } from '@/components/orders/OrderReceiptView';

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  return <OrderReceiptView orderId={params.id} />;
}
