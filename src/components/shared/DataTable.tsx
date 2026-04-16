import { useState, useMemo, type ReactNode } from 'react'
import { Box, Flex, Text, Table, HStack } from '@chakra-ui/react'
import EmptyState from './EmptyState'

export interface Column<T> {
  key: string
  label: string | ReactNode
  render: (row: T, index: number) => ReactNode
  sortable?: boolean
  sortKey?: (row: T) => number | string
  width?: string
  minW?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  footer?: ReactNode
  maxH?: string
  stickyRight?: boolean
}

export default function DataTable<T>({
  data, columns, pageSize = 10, footer, maxH, stickyRight,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = useMemo(() => {
    if (!sortKey) return data
    const col = columns.find(c => c.key === sortKey)
    if (!col?.sortKey) return data
    const fn = col.sortKey
    return [...data].sort((a, b) => {
      const va = fn(a); const vb = fn(b)
      if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
  }, [data, sortKey, sortAsc, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safeP = Math.min(page, totalPages)
  const sliced = sorted.slice((safeP - 1) * pageSize, safeP * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  if (data.length === 0) return <EmptyState />

  return (
    <Box>
      <Box
        overflowX="auto"
        maxH={maxH}
        borderRadius="md"
      >
        <Table.Root size="sm" variant="line" stickyHeader>
          <Table.Header>
            <Table.Row>
              {columns.map((col, ci) => (
                <Table.ColumnHeader
                  key={col.key}
                  bg="bg.200"
                  border={0}
                  borderBottom="1px solid"
                  borderColor="border.100"
                  color="gray.100"
                  fontSize="xs"
                  fontWeight="500"
                  py={2.5}
                  px={2.5}
                  whiteSpace="nowrap"
                  minW={col.minW}
                  w={col.width}
                  cursor={col.sortable ? 'pointer' : 'default'}
                  onClick={() => col.sortable && handleSort(col.key)}
                  _hover={col.sortable ? { color: 'text.100' } : {}}
                  {...(stickyRight && ci === columns.length - 1 ? {
                    position: 'sticky' as const, right: 0, zIndex: 2,
                    boxShadow: '-4px 0 8px rgba(0,0,0,0.04)',
                  } : {})}
                >
                  <Flex align="center" gap={1}>
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <Text fontSize="xs">{sortAsc ? '↑' : '↓'}</Text>
                    )}
                  </Flex>
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sliced.map((row, ri) => (
              <Table.Row key={ri} bg={ri % 2 === 0 ? 'transparent' : 'bg.300'} _hover={{ bg: 'bg.400' }}>
                {columns.map((col, ci) => (
                  <Table.Cell
                    key={col.key}
                    border={0}
                    px={2.5}
                    py={3}
                    fontSize="sm"
                    color="text.200"
                    whiteSpace="nowrap"
                    {...(stickyRight && ci === columns.length - 1 ? {
                      position: 'sticky' as const, right: 0,
                      bg: ri % 2 === 0 ? 'bg.200' : 'bg.300',
                      boxShadow: '-4px 0 8px rgba(0,0,0,0.04)',
                    } : {})}
                  >
                    {col.render(row, ri)}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {footer && <Box mt={2} px={2}>{footer}</Box>}

      {sorted.length > pageSize && (
        <Flex justify="flex-end" align="center" mt={3} gap={2}>
          <Text fontSize="xs" color="gray.100">共 {sorted.length} 条</Text>
          <HStack gap={1}>
            <PageBtn label="‹" disabled={safeP <= 1} onClick={() => setPage(safeP - 1)} />
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <PageBtn key={p} label={String(p)} active={p === safeP} onClick={() => setPage(p)} />
            ))}
            {totalPages > 7 && <Text fontSize="xs" color="gray.200">...</Text>}
            <PageBtn label="›" disabled={safeP >= totalPages} onClick={() => setPage(safeP + 1)} />
          </HStack>
          <Text fontSize="xs" color="gray.100">{pageSize} 条/页</Text>
        </Flex>
      )}
    </Box>
  )
}

function PageBtn({ label, active, disabled, onClick }: {
  label: string; active?: boolean; disabled?: boolean; onClick: () => void
}) {
  return (
    <Box
      as="button"
      px={2} py={1}
      fontSize="xs"
      borderRadius="md"
      fontFamily="ISB"
      bg={active ? 'theme' : 'bg.200'}
      color={active ? '#fff' : disabled ? 'gray.200' : 'text.200'}
      border="1px solid"
      borderColor={active ? 'theme' : 'border.100'}
      opacity={disabled ? 0.4 : 1}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      onClick={disabled ? undefined : onClick}
      _hover={disabled ? {} : { bg: active ? 'theme' : 'bg.300' }}
    >
      {label}
    </Box>
  )
}
