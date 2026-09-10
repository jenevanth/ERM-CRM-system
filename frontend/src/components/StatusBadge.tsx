interface Props {
  status: string;
}

const statusMap: Record<string, string> = {
  DRAFT: 'badge-draft',
  CONFIRMED: 'badge-confirmed',
  CANCELLED: 'badge-cancelled',
  ACTIVE: 'badge-active',
  LEAD: 'badge-lead',
  INACTIVE: 'badge-inactive',
};

export default function StatusBadge({ status }: Props) {
  const cls = statusMap[status.toUpperCase()] ?? 'badge-lead';
  return <span className={`badge ${cls}`}>{status}</span>;
}
