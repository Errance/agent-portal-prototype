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
  align?: 'left' | 'center' | 'right'
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
                  bg="rgba(0,0,0,0.02)"
                  border={0}
                  borderBottom="1px solid"
                  borderColor="border.100"
                  color="gray.200"
                  fontSize="12px"
                  fontWeight="500"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                  py="12px"
                  px="16px"
                  whiteSpace="nowrap"
                  minW={col.minW}
                  w={col.width}
                  textAlign={col.align || 'left'}
                  cursor={col.sortable ? 'pointer' : 'default'}
                  onClick={() => col.sortable && handleSort(col.key)}
                  _hover={col.sortable ? { color: 'text.100', bg: 'rgba(0,0,0,0.04)' } : {}}
                  transition="all 0.2s"
                  {...(stickyRight && ci === columns.length - 1 ? {
                    position: 'sticky' as const, right: 0, zIndex: 2,
                    bg: 'bg.200',
                    boxShadow: '-8px 0 16px rgba(0,0,0,0.04)',
                  } : {})}
                >
                  <Flex align="center" gap={2} justify={col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start'}>
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <Text fontSize="12px" color="theme">{sortAsc ? '↑' : '↓'}</Text>
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
                transition="background 0.2s"
                _hover={{ bg: 'rgba(0,0,0,0.02)' }}
              >
                {columns.map((col, ci) => (
                  <Table.Cell
                    key={col.key}
                    border={0}
                    borderBottom="1px solid"
                    borderColor="border.100"
                    px="16px"
                    py="16px"
                    fontSize="14px"
                    color="text.100"
                    whiteSpace="nowrap"
                    textAlign={col.align || 'left'}
                    {...(stickyRight && ci === columns.length - 1 ? {
                      position: 'sticky' as const, right: 0,
                      bg: 'bg.200',
                      boxShadow: '-8px 0 16px rgba(0,0,0,0.04)',
                      _groupHover: { bg: 'bg.100' } // Fallback for hover state if supported
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

      {footer && <Box mt={4} px={4}>{footer}</Box>}

      {sorted.length > pageSize && (
        <Flex justify="flex-end" align="center" mt="24px" gap="16px">
          <Text fontSize="13px" color="gray.200">
            {safeP} / {totalPages}
          </Text>
          <HStack gap="8px">
            <PageBtn label="‹" disabled={safeP <= 1} onClick={() => setPage(safeP - 1)} />
            <PageBtn label="›" disabled={safeP >= totalPages} onClick={() => setPage(safeP + 1)} />
          </HStack>
          <Text fontSize="13px" color="gray.200">
            {(safeP - 1) * pageSize + 1}–{Math.min(safeP * pageSize, sorted.length)} / {sorted.length}
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
      w="32px"
      h="32px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      fontSize="16px"
      borderRadius="4px"
      bg="transparent"
      color={disabled ? 'gray.200' : 'text.100'}
      border="1px solid"
      borderColor={disabled ? 'transparent' : 'border.100'}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      onClick={disabled ? undefined : onClick}
      transition="all 0.2s"
      _hover={disabled ? {} : { bg: 'bg.100', borderColor: 'border.200' }}
    >
      {label}
    </Box>
  )
}
