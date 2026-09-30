'use client';
import { useEffect, useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface HistoryRecordSummary {
  id: string;
  productReferenceCode: string;
  productName: string | null;
  batchNo: string | null;
  status: string;
}

export function RecentRecordsClient() {
  const [records, setRecords] = useState<HistoryRecordSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/protected/history?pageSize=5')
      .then(res => res.json())
      .then(data => {
        setRecords(data.data || []);
      })
      .catch(err => console.error("Failed to load recent records", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading recent traceability records...</div>;
  }

  if (records.length === 0) {
    return <div className="p-8 text-center text-sm text-muted-foreground">No recent records generated in this session.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-surface-muted/50">
          <TableRow>
            <TableHead className="w-[180px]">PRC</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs">{r.productReferenceCode}</TableCell>
              <TableCell className="text-sm">{r.productName || '-'}</TableCell>
              <TableCell className="text-sm font-medium">{r.batchNo || '-'}</TableCell>
              <TableCell>
                <Badge variant={r.status === 'GENERATED' ? 'default' : 'secondary'} className="text-[10px] uppercase tracking-wider">
                  {r.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                  <Link href={`/history/${r.id}`}>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
