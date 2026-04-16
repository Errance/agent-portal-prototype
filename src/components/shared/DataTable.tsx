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
      <Box overflowX="auto" maxH={maxH} position="relative" zIndex={0}>
        <Table.Root size="sm" variant="line" stickyHeader>
          <Table.Header>
            <Table.Row>
              {columns.map((col, ci) => (
                <Table.ColumnHeader
                  key={col.key}
                  bg="transparent"
                  border={0}
                  borderBottom="1px solid"
                  borderColor="border.100"
                  color="gray.100"
                  fontSize="14px"
                  fontWeight="500"
                  py="12px"
                  px="12px"
                  whiteSpace="nowrap"
                  minW={col.minW}
                  w={col.width}
                  cursor={col.sortable ? 'pointer' : 'default'}
                  onClick={() => col.sortable && handleSort(col.key)}
                  _hover={col.sortable ? { color: 'text.100' } : {}}
                  {...(stickyRight && ci === columns.length - 1 ? {
                    position: 'sticky' as const, right: 0, zIndex: 2,
                    bg: '#F4F5F7',
                    boxShadow: '-4px 0 8px rgba(0,0,0,0.04)',
                  } : {})}
                >
                  <Flex align="center" gap={1}>
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <Text fontSize="12px">{sortAsc ? '↑' : '↓'}</Text>
                    )}
                  </Flex>
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sliced.map((row, ri) => (
              <Table.Row
                key={ri}
                bg="transparent"
                _hover={{ bg: 'bg.300' }}
              >
                {columns.map((col, ci) => (
                  <Table.Cell
                    key={col.key}
                    border={0}
                    borderBottom="1px solid"
                    borderColor="border.100"
                    px="12px"
                    py="12px"
                    fontSize="14px"
                    color="text.100"
                    whiteSpace="nowrap"
                    {...(stickyRight && ci === columns.length - 1 ? {
                      position: 'sticky' as const, right: 0,
                      bg: 'bg.200',
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
        <Flex justify="flex-end" align="center" mt="16px" gap="12px">
          <Text fontSize="14px" color="gray.100">
            {safeP}
          </Text>
          <HStack gap="4px">
            <PageBtn label="‹" disabled={safeP <= 1} onClick={() => setPage(safeP - 1)} />
            <PageBtn label="›" disabled={safeP >= totalPages} onClick={() => setPage(safeP + 1)} />
          </HStack>
          <Text fontSize="14px" color="gray.100">
            {(safeP - 1) * pageSize + 1}–{Math.min(safeP * pageSize, sorted.length)} · 共 {sorted.length} 条
          </Text>
        </Flex>
      )}
    </Box>
  )
}

function PageBtn({ label, disabled, onClick }: {
  label: string; disabled?: boolean; onClick: () => void
}) {
  return (
    <Box
      as="button"
      w="28px"
      h="28px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      fontSize="14px"
      borderRadius="6px"
      bg="bg.200"
      color={disabled ? 'gray.100' : 'text.100'}
      border="1px solid"
      borderColor="border.100"
      opacity={disabled ? 0.4 : 1}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      onClick={disabled ? undefined : onClick}
      _hover={disabled ? {} : { bg: 'bg.100' }}
    >
      {label}
    </Box>
  )
}
