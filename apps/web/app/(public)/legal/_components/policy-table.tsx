import { cn } from '@/shared/lib/cn';

interface PolicyTableProps {
  headers: string[];
  rows: string[][];
}

export function PolicyTable({ headers, rows }: PolicyTableProps) {
  return (
    <div className="overflow-hidden rounded-8 border border-neutral-50">
      <table className="w-full table-fixed border-collapse text-left break-keep">
        <thead>
          <tr className="bg-neutral-20">
            {headers.map((header, index) => (
              <th
                key={header}
                className={cn(
                  'px-2 py-2 text-semibold-12 text-neutral-800',
                  index > 0 && 'border-l border-neutral-50'
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-neutral-50">
              {row.map((cell, index) => (
                <td
                  key={cell}
                  className={cn(
                    'px-2 py-2 align-top text-medium-12',
                    index > 0 && 'border-l border-neutral-50'
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
