import { useState, useMemo, type ReactNode } from 'react'
import { Box, Flex, Text, Table, HStack } from '@chakra-ui/react'
import EmptyState from './EmptyState'
import TableSkeleton from './TableSkeleton'
import ErrorState from './ErrorState'

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

export interface DataTableError {
  message: string
  retry?: () => void
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  footer?: ReactNode
  maxH?: string
  stickyRight?: boolean
  /** 必填：稳定行 key，接入真实 API / 排序 / 分页时避免 React 复用错行。 */
  getRowKey: (row: T, index: number) => string
  isLoading?: boolean
  error?: DataTableError | null
  emptyText?: string
}

export default function DataTable<T>({
  data, columns, pageSize = 10, footer, maxH, stickyRight,
  getRowKey, isLoading, error, emptyText,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = useMemo(() => {
    if (!sortKey) return data
    const col = columns.find(c => c.key === sortKey)
    if (!col?.sortKey) return data
    const fn = col.sortKey
    // 审计 M6：NaN/undefined 归一化 + 二级 key (原始 index) 保证稳定排序
    const indexed = data.map((row, i) => ({ row, i }))
    indexed.sort((a, b) => {
      const va = fn(a.row); const vb = fn(b.row)
      let cmp: number
      if (typeof va === 'number' && typeof vb === 'number') {
        const na = Number.isFinite(va) ? va : -Infinity
        const nb = Number.isFinite(vb) ? vb : -Infinity
        cmp = na - nb
      } else {
        cmp = String(va ?? '').localeCompare(String(vb ?? ''))
      }
      if (cmp !== 0) return sortAsc ? cmp : -cmp
      // 稳定排序：cmp===0 时保持原序
      return a.i - b.i
    })
    return indexed.map(x => x.row)
  }, [data, sortKey, sortAsc, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safeP = Math.min(page, totalPages)
  const sliced = sorted.slice((safeP - 1) * pageSize, safeP * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  if (error) return <ErrorState message={error.message} onRetry={error.retry} />
  if (isLoading) return <TableSkeleton rows={pageSize} cols={columns.length} />
  if (data.length === 0) return <EmptyState text={emptyText} />

  return (
    <Box>
      <Box overflowX="auto" maxH={maxH} position="relative" zIndex={0}>
        <Table.Root size="sm" variant="line" stickyHeader>
          <Table.Header>
            <Table.Row>
              {columns.map((col, ci) => {
                const isStickyRight = stickyRight && ci === columns.length - 1
                return (
                <Table.ColumnHeader
                  key={col.key}
                  bg={isStickyRight ? 'bg.200' : 'rgba(0,0,0,0.02)'}
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
                  tabIndex={col.sortable ? 0 : undefined}
                  role={col.sortable ? 'button' : undefined}
                  aria-sort={
                    col.sortable
                      ? (sortKey === col.key ? (sortAsc ? 'ascending' : 'descending') : 'none')
                      : undefined
                  }
                  onClick={() => col.sortable && handleSort(col.key)}
                  onKeyDown={col.sortable ? (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSort(col.key)
                    }
                  } : undefined}
                  _hover={col.sortable ? { color: 'text.100', bg: 'rgba(0,0,0,0.04)' } : {}}
                  _focusVisible={col.sortable ? { outline: '2px solid', outlineColor: 'theme', outlineOffset: '-2px' } : {}}
                  transition="all 0.2s"
                  {...(isStickyRight ? {
                    position: 'sticky' as const, right: 0, zIndex: 2,
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
              )})}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sliced.map((row, ri) => (
              <Table.Row
                key={getRowKey(row, ri)}
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
                      _groupHover: { bg: 'bg.100' },
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
            <PageBtn label="‹" ariaLabel="上一页" disabled={safeP <= 1} onClick={() => setPage(safeP - 1)} />
            <PageBtn label="›" ariaLabel="下一页" disabled={safeP >= totalPages} onClick={() => setPage(safeP + 1)} />
          </HStack>
          <Text fontSize="13px" color="gray.200">
            {(safeP - 1) * pageSize + 1}–{Math.min(safeP * pageSize, sorted.length)} / {sorted.length}
          </Text>
        </Flex>
      )}
    </Box>
  )
}

function PageBtn({ label, disabled, onClick, ariaLabel }: {
  label: string; disabled?: boolean; onClick: () => void; ariaLabel: string
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
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      transition="all 0.2s"
      _hover={disabled ? {} : { bg: 'bg.100', borderColor: 'border.200' }}
    >
      {label}
    </Box>
  )
}
